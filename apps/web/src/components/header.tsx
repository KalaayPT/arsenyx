import { Link } from "@/components/link"
import { Button } from "@/components/ui/button"
import { SITE_CONFIG, NAV_ITEMS, ROUTES } from "@/lib/constants"

// Slice 1: search, theme toggle, and user menu deferred to later slices.
export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-6">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight md:text-xl">
              {SITE_CONFIG.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                render={<Link href={item.href} />}
                nativeButton={false}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
