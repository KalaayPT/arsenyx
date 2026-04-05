import { getServerSession } from "@/lib/auth"
import { ok, err, type Result } from "@/lib/result"

/**
 * Require an authenticated session. Returns the user ID on success,
 * or a standard error Result on failure.
 *
 * Usage in server actions:
 * ```ts
 * const auth = await requireAuth("save a build")
 * if (!auth.success) return auth
 * const userId = auth.data
 * ```
 */
export async function requireAuth(action: string): Promise<Result<string>> {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return err(`You must be signed in to ${action}`)
  }
  return ok(session.user.id)
}
