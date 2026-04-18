import { useNavigate } from "@tanstack/react-router"
import { LogIn, LogOut } from "lucide-react"

import { Link } from "@/components/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { ROUTES } from "@/lib/constants"

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  if (isPending) {
    return <div className="bg-muted size-8 animate-pulse rounded-full" />
  }

  if (!session) {
    return (
      <Button
        size="sm"
        variant="ghost"
        render={<Link href={ROUTES.signIn} />}
        nativeButton={false}
      >
        <LogIn className="size-4" />
        Sign in
      </Button>
    )
  }

  const user = session.user
  const name = user.name ?? user.email ?? "Account"
  const initial = name.charAt(0).toUpperCase()

  async function onSignOut() {
    await authClient.signOut()
    navigate({ to: ROUTES.home })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open user menu"
            className="relative"
          />
        }
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span className="bg-muted text-foreground flex size-7 items-center justify-center rounded-full text-sm font-medium">
            {initial}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-sm font-medium">{name}</span>
          {user.email ? (
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
