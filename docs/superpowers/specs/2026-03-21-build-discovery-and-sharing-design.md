# Build Discovery & Sharing — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Scope:** 4 features — Build Forking, Build Search & Filtering, Global Search (Cmd+K), Build Sharing

---

## 1. Build Forking ("Use as Template")

### Summary

Users can copy mod slots from any build into the editor as a starting point. No database record is created until the user explicitly saves. No fork attribution — the new build is fully independent.

### Flow

1. User views any build (own or others') at `/builds/[slug]`
2. Clicks "Use as Template" button in the build banner area (next to social actions)
3. Redirects to `/create?category={cat}&item={itemSlug}&fork={buildSlug}`
4. Create page fetches the source build by slug (must be PUBLIC or UNLISTED; if PRIVATE, show "Build not available" message and link back to browse)
5. Extracts mod configuration from the source build's `buildData`:
   - **Copied:** `normalSlots`, `auraSlot`, `exilusSlot`, `hasReactor`, `formaCount`
   - **NOT copied:** `arcaneSlots`, `shardSlots`, `itemUniqueName`, `itemName`, `itemCategory`, `itemImageName`, `buildName`, `baseCapacity`, `currentCapacity`, `createdAt`, `updatedAt`
6. Passes stripped-down build data to `BuildContainer` as `importedBuild`
7. User customizes and saves when ready — creates a fully independent build

### UI

- **Button:** `Copy` icon (lucide) + "Use as Template" label
- **Placement:** Build banner, next to social actions
- **Visibility:** Everyone, including the build owner (for duplicating)

### Implementation

- New `fork` search param on `/create` page — takes a build slug
- Server-side: `getBuildBySlug(forkSlug)` → extract mod fields only → pass to editor
- No Prisma schema changes needed
- No changes to server actions
- **Note:** The existing `forkedFromId`/`forkedFrom`/`forks` schema fields and `forkBuildAction` stub are left in place for a potential future "true fork with attribution" feature. This "Use as Template" feature is intentionally separate — it's a convenience copy, not a tracked fork.

---

## 2. Build Search & Filtering

### Summary

Full-text search and advanced filters on the `/builds/` page. PostgreSQL `tsvector` with GIN index for fast, ranked search across build name, item name, and description.

### Search Backend

- Add `searchVector` column (`tsvector`) to `builds` table via raw SQL migration
- Declare as `searchVector Unsupported("tsvector")?` in `schema.prisma` so Prisma doesn't manage it
- GIN index on the vector
- Vector weights: build name (A, from `builds.name`), item name (B, via JOIN to `items.name`), build description (C, from `builds.description`)
- PostgreSQL trigger on `builds` INSERT/UPDATE that rebuilds the vector by JOINing to the `items` table:
  ```sql
  CREATE OR REPLACE FUNCTION builds_search_vector_update() RETURNS trigger AS $$
  BEGIN
    NEW."searchVector" := (
      setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce((SELECT name FROM items WHERE id = NEW."itemId"), '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C')
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- Also add `hasGuide Boolean @default(false)` denormalized column to `Build` (matching existing `hasShards` pattern), updated on guide create/update/delete
- All search queries use `prisma.$queryRaw` since Prisma doesn't support `tsvector` natively

### Query Function

New `searchBuilds()` in `src/lib/db/builds.ts`:
- Accepts: `query`, `category`, `sortBy`, `author`, `hasGuide`, `hasShards`, `page`, `limit`
- Uses `plainto_tsquery` for the text search
- Combines with existing `WHERE` clauses for filters
- Falls back to `getPublicBuilds()` when no search query provided

### URL Parameters

| Param | Example | Description |
|-------|---------|-------------|
| `q` | `?q=saryn` | Full-text search query |
| `category` | `?category=warframes` | Category filter (existing) |
| `sort` | `?sort=newest` | Sort order (existing) |
| `author` | `?author=tenno42` | Filter by username |
| `hasGuide` | `?hasGuide=true` | Only builds with guide content |
| `hasShards` | `?hasShards=true` | Only builds with archon shards |
| `page` | `?page=2` | Pagination (existing) |

### UI Changes to `/builds/page.tsx`

- Search input bar above category tabs
- Collapsible "Filters" section below tabs:
  - Author text input
  - "Has Guide" toggle
  - "Has Shards" toggle
- All URL-param driven (stays a server component)
- Filter state preserved across pagination — all existing `<Link>` components for pagination, category tabs, and sort tabs must be updated to carry through new params (`q`, `author`, `hasGuide`, `hasShards`)

### shadcn Components Used

- `Input` (search bar) — already installed
- `Button` (filter toggles, clear) — already installed
- `Badge` (active filter indicators) — already installed

---

## 3. Global Search (Cmd+K Palette)

### Summary

A command palette accessible via header search icon or `Ctrl+K`/`Cmd+K`. Searches both items and builds, returns quick results grouped by type.

### Component

- New `src/components/search-command.tsx` — `"use client"` component
- Uses existing shadcn `Command` inside `Dialog` (both already installed)
- Debounced input (300ms), minimum 2 characters to trigger

### API Route

- New `src/app/api/search/route.ts` — GET endpoint (public, no auth required)
- Query param: `?q=query` (min 2 chars, max 100 chars, sanitized before query)
- Rate limited using existing `src/lib/rate-limit.ts`
- Returns two groups:
  - **Items:** searched by name (`ILIKE`) from `items` table, limit 5
  - **Builds:** searched via `searchVector` from Feature 2, limit 5
- Response shape:
  ```typescript
  {
    items: { uniqueName: string; name: string; imageName: string | null; browseCategory: string }[];
    builds: { slug: string; name: string; itemName: string; author: string; voteCount: number }[];
  }
  ```

### UI Behavior

- Two `CommandGroup`s: "Items" and "Builds"
- Items navigate to `/browse/{category}/{slug}`
- Builds navigate to `/builds/{slug}`
- Initial state (no query): show nothing (empty command list)
- Empty state (query with no results): "No results found" in `CommandEmpty`
- Loading state: `Spinner` in the command list
- Keyboard navigation from cmdk

### Header Integration

- Extract `SearchButton` as a client component (keeps `Header` as server component)
- `SearchButton` renders the search icon button + `CommandDialog`
- Registers `Ctrl+K` / `Cmd+K` keyboard shortcut via `useEffect`

### shadcn Components Used

- `Command` + `Dialog` — already installed
- `Spinner` — already installed

---

## 4. Build Sharing

### Summary

Share dropdown on build pages with "Copy Link" and native Web Share API support.

### Component

- New `src/components/build/share-button.tsx` — `"use client"` component
- Placed in build banner next to social actions and "Use as Template" button

### UI

- `DropdownMenu` triggered by a `Share` icon button
- Menu items:
  - **Copy Link** — copies `window.location.href` to clipboard, shows `toast("Link copied!")` via sonner
  - **Share...** — uses `navigator.share({ title, url })`. Only rendered when `navigator.share` is available.

### shadcn Components Needed (not yet installed)

- `dropdown-menu` — add via `bunx --bun shadcn@latest add dropdown-menu -y`
- `sonner` — add via `bunx --bun shadcn@latest add sonner -y`

### Sonner Integration

- Add `<Toaster />` from sonner to root layout (`src/app/layout.tsx`)
- Import `toast` from `sonner` in share-button component

---

## Implementation Notes

### shadcn Rules to Follow

- Icons in buttons: use `data-icon` attribute, no sizing classes
- `CommandItem`s must be inside `CommandGroup`
- Toast via `toast()` from `sonner`, not custom
- Use `gap-*` not `space-*` for layouts
- Use `size-*` for equal width/height dimensions
- Use `cn()` for conditional classes

### Dependencies

- Feature 3 (Global Search) depends on Feature 2 (Build Search) for the `searchVector` query
- Features 1 (Forking) and 4 (Sharing) are independent
- All features can share the same PR or be split into separate ones

### No Schema Changes Required For

- Feature 1 (Forking) — uses existing `getBuildBySlug`
- Feature 4 (Sharing) — purely client-side

### Schema Migration Required For

- Feature 2 (Build Search) — `searchVector` column (`Unsupported("tsvector")?`) + GIN index + trigger + `hasGuide` denormalized column
- Feature 3 (Global Search) — reuses Feature 2's search infrastructure
