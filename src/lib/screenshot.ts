import "server-only"

export interface ScreenshotOptions {
  /** Full URL of the build page to screenshot */
  url: string
  /** Hex background color without '#' (e.g. "111111") */
  bgColor: string
}

/**
 * Take a screenshot of the build mod grid element.
 *
 * Launches headless Chromium, navigates to the build page,
 * injects custom background CSS, and screenshots the
 * [data-screenshot-target] element.
 *
 * Returns a PNG buffer.
 */
export async function screenshotBuild(
  options: ScreenshotOptions,
): Promise<Buffer> {
  // Dynamic imports to avoid bundling issues
  const chromium = await import("@sparticuz/chromium")
  const { chromium: playwright } = await import("playwright-core")

  const browser = await playwright.launch({
    args: chromium.default.args,
    executablePath: await chromium.default.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage({
      viewport: { width: 1500, height: 1100 },
      deviceScaleFactor: 2,
    })

    await page.goto(options.url, { waitUntil: "networkidle" })

    // Wait for the screenshot target element
    const target = await page.waitForSelector("[data-screenshot-target]", {
      timeout: 10000,
    })

    if (!target) {
      throw new Error("Screenshot target element not found")
    }

    // Inject background color overrides
    const color = `#${options.bgColor}`
    await page.evaluate((bgColor: string) => {
      const root = document.documentElement
      root.style.setProperty("--background", bgColor)
      root.style.setProperty("--card", bgColor)
      root.style.setProperty("--muted", bgColor)
      root.style.setProperty("--border", "transparent")
      document.body.style.backgroundColor = bgColor

      const isInsideModCard = (el: Element) =>
        el.closest(
          '[class*="h-\\[80px\\]"], [class*="h-\\[90px\\]"], [class*="h-\\[100px\\]"]',
        )

      document
        .querySelectorAll(
          '.bg-card, [class*="bg-card\\/"], [class*="bg-background"]',
        )
        .forEach((el) => {
          if (isInsideModCard(el)) return
          ;(el as HTMLElement).style.backgroundColor = bgColor
          ;(el as HTMLElement).style.borderColor = "transparent"
        })

      document
        .querySelectorAll('[class*="border-b"]')
        .forEach((el) => {
          ;(el as HTMLElement).style.borderBottomColor = "transparent"
        })
    }, color)

    // Screenshot just the target element
    const png = await target.screenshot({ type: "png" })

    return Buffer.from(png)
  } finally {
    await browser.close()
  }
}
