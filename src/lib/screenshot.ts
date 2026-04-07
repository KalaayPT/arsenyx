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
  const { chromium: playwright } = await import("playwright-core")

  let browser
  if (process.env.NODE_ENV === "production") {
    // Serverless: use @sparticuz/chromium binary
    const chromium = await import("@sparticuz/chromium")
    browser = await playwright.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    })
  } else {
    // Local dev: use installed Chrome/Chromium
    const executablePath =
      process.env.CHROME_PATH ??
      "C:/Users/Nick/AppData/Local/imput/Helium/Application/chrome.exe"
    browser = await playwright.launch({
      executablePath,
      headless: true,
    })
  }

  try {
    const page = await browser.newPage({
      viewport: { width: 1500, height: 1100 },
      deviceScaleFactor: 2,
      colorScheme: "dark",
    })

    await page.goto(options.url, { waitUntil: "networkidle" })

    // Wait for the screenshot target element
    const target = await page.waitForSelector("[data-screenshot-target]", {
      timeout: 10000,
    })

    if (!target) {
      throw new Error("Screenshot target element not found")
    }

    // Wait for client-side hydration and stat calculation
    await page.waitForTimeout(2000)

    // Inject background color overrides
    const color = `#${options.bgColor}`
    await page.evaluate((bgColor: string) => {
      // Slightly lighter shade for small UI elements
      const r = parseInt(bgColor.slice(1, 3), 16)
      const g = parseInt(bgColor.slice(3, 5), 16)
      const b = parseInt(bgColor.slice(5, 7), 16)
      const lift = 4
      const liftedColor = `rgb(${Math.min(255, r + lift)}, ${Math.min(255, g + lift)}, ${Math.min(255, b + lift)})`

      // Flatten everything to bg color
      const root = document.documentElement
      root.style.setProperty("--background", bgColor)
      root.style.setProperty("--card", bgColor)
      root.style.setProperty("--muted", bgColor)
      root.style.setProperty("--border", "transparent")
      document.body.style.backgroundColor = bgColor

      // Now lift specific small elements
      const target = document.querySelector("[data-screenshot-target]")
      if (!target) return

      // Flatten big panel containers
      target.querySelectorAll(":scope > .bg-card").forEach((el) => {
        ;(el as HTMLElement).style.backgroundColor = bgColor
        ;(el as HTMLElement).style.borderColor = "transparent"
      })

      // Lift: empty mod slots + aura/exilus (dashed border cards)
      target.querySelectorAll(".border-dashed").forEach((el) => {
        ;(el as HTMLElement).style.backgroundColor = liftedColor
      })

      // Lift: ability icon buttons
      target.querySelectorAll("[data-slot='tooltip-trigger'].bg-muted").forEach((el) => {
        ;(el as HTMLElement).style.backgroundColor = liftedColor
      })

      // Lift: shard slots (use bg-muted/30, so we need inline override)
      target.querySelectorAll(".border-dashed.size-10").forEach((el) => {
        ;(el as HTMLElement).style.backgroundColor = liftedColor
      })
    }, color)

    // Screenshot just the target element
    const png = await target.screenshot({ type: "png" })

    return Buffer.from(png)
  } finally {
    await browser.close()
  }
}
