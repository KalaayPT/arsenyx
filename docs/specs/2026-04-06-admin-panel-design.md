# Admin Panel Design Spec

## Overview

A single `/admin` page with four tabs: **Users**, **Content**, **Stats**, **Dev Tools**. Admin-only access (gated on `isAdmin` flag). No middleware needed since this is the only admin route.

## Schema Changes

Add one field to the User model:

```prisma
model User {
  // ... existing fields ...
  isBanned Boolean @default(false)
}
```

When `isBanned` is true:
- `requireAuth()` checks the flag and returns an error, blocking all server actions
- Better Auth session validation rejects banned users (via custom plugin or session hook)

## Page Structure

**Route:** `src/app/admin/page.tsx`

Server Component. Auth guard at the top:
```typescript
const session = await getServerSession()
if (!session?.user?.isAdmin) notFound()
```

Tab state managed via URL search param (`?tab=users`) so refreshing preserves position. Uses existing shadcn Tabs component. Each tab panel is a separate Server Component.

## Tab 1: Users

### View
Searchable, sortable table of all users. Columns:
- Avatar (image)
- Name / username
- Email
- Role badges (verified, community leader, moderator, admin)
- Join date
- Build count
- Banned status

Search filters by name, username, or email. Server-side search using `ILIKE` or the existing search infrastructure.

### Actions (per user)
- **Toggle role flags**: Independent toggles for isVerified, isCommunityLeader, isModerator, isAdmin
- **Ban user**: Sets `isBanned = true`, invalidates all sessions for that user
- **Unban user**: Sets `isBanned = false`
- **Delete user** (nuclear option): Requires confirmation dialog. Anonymizes profile (name -> "Deleted User", clears email/image/bio/username). Cascading deletes for all builds, votes, favorites. Irreversible.

### Server Actions
- `adminUpdateUserRoleAction(userId, flags)` - update any combination of role flags
- `adminBanUserAction(userId)` - set isBanned, delete all sessions
- `adminUnbanUserAction(userId)` - clear isBanned
- `adminDeleteUserAction(userId)` - anonymize + cascade delete (self-deletion prevented)

All actions gated on `isAdmin`.

## Tab 2: Content

### View
Searchable, sortable table of all builds. Columns:
- Title
- Author (links to user)
- Category (Warframe, Primary, Secondary, Melee, etc.)
- Votes count
- Favorites count
- Created date

Search by title or author. Sortable by date, votes.

### Actions
- **Delete build**: Confirmation dialog. Cascades to votes, favorites, build guides, build links.

### Server Actions
- `adminDeleteBuildAction(buildId)` - delete build with all relations

No "edit" or "hide" functionality. Direct delete only.

## Tab 3: Stats

Simple overview dashboard with server-rendered data:

- **Total users** (count)
- **Total builds** (count, with breakdown by category via `itemCategory`)
- **Builds created today / this week / this month** (date-range counts)
- **Most popular builds** (top 10 by `voteCount`)
- **Most active users** (top 10 by build count)
- **Recent signups** (last 10 users by `createdAt`)

All data fetched server-side. No charting libraries. Clean tables and stat cards.

### Server Queries
- `getAdminStats()` - aggregate counts
- `getTopBuilds(limit)` - ordered by voteCount
- `getTopUsers(limit)` - ordered by build count
- `getRecentUsers(limit)` - ordered by createdAt

## Tab 4: Dev Tools

- **Warframe Data Sync**: Shows last sync timestamp. In development, a button triggers `bun run update-data` via child process. In production (Vercel), this button is hidden since data sync requires a redeploy. Display-only: shows which @wfcd/items version is installed and when the data files were last generated.
- **Cache Info**: Display LRU cache stats (number of items, size).
- **Database Info**: Connection pool status, row counts per table (users, builds, build_votes, build_favorites, build_guides, build_links, organizations).
- **Environment Info**: `NODE_ENV`, Next.js version, Prisma version, database provider. Never expose secrets.

### Server Actions
- `adminTriggerDataSyncAction()` - runs data sync
- `adminGetDbStatsAction()` - returns row counts and connection info

## Component Structure

```
src/app/admin/
  page.tsx              # Main admin page with auth guard + tab routing

src/components/admin/
  admin-users-tab.tsx    # Users table + actions
  admin-content-tab.tsx  # Builds table + delete
  admin-stats-tab.tsx    # Stats dashboard
  admin-dev-tools-tab.tsx # Dev tools panel
  admin-user-actions.tsx  # Role toggles, ban, delete UI (client component)
  admin-delete-dialog.tsx # Reusable confirmation dialog for destructive actions

src/app/actions/admin.ts  # All admin server actions
src/lib/db/admin.ts       # Admin-specific database queries
```

## Security

- All server actions check `isAdmin` via `getServerSession()` before any operation
- Self-deletion prevented (can't delete your own account)
- Self-demotion prevented (can't remove your own admin flag)
- Destructive actions (delete user, delete build) require confirmation dialogs
- No secrets exposed in dev tools (env vars filtered)

## Data Flow

1. Admin navigates to `/admin`
2. Server component checks `isAdmin`, renders 404 if not
3. Active tab determined from `?tab=` search param (defaults to "users")
4. Each tab component fetches its own data server-side
5. Actions trigger server actions -> database mutations -> `revalidatePath("/admin")`
6. Ban enforcement: `requireAuth()` in auth-helpers checks `isBanned` flag on every action
