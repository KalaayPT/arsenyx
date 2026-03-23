# Data Architecture Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the dual JSON/DB architecture for game data. Single source: static JSON for game data, Postgres for user data only.

**Architecture:** Remove `Item`, `Mod`, `Arcane`, `WfcdSyncLog` tables from Postgres. Replace `Build.itemId` FK with denormalized string fields (`itemUniqueName`, `itemCategory`, `itemName`, `itemImageName`). Add `getItemByUniqueName()` to the in-memory data layer. Fix all Prisma queries that JOIN on the `item` relation. Replace DB-based item search with in-memory search. Create `scripts/setup-search.sql` for search trigger/index setup.

**Tech Stack:** Next.js 16, Prisma, PostgreSQL, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-23-data-architecture-consolidation-design.md`

---

### Task 1: Add `getItemByUniqueName()` to in-memory data layer

The build creation flow needs to validate items against in-memory data. Currently there's `getFullItem(category, uniqueName)` but no category-free lookup.

**Files:**
- Modify: `src/lib/warframe/items.ts:303-318`

- [ ] **Step 1: Add `getItemByUniqueName` export**

Add after `getCategoryCounts()` (line 297), before `getFullItem()`:

```typescript
/**
 * Get an item by its WFCD unique name (category-agnostic)
 * Used for build creation validation and denormalization
 */
export function getItemByUniqueName(
  uniqueName: string,
): BrowseableItem | null {
  return uniqueNameLookup.get(uniqueName) ?? null
}
```

- [ ] **Step 2: Verify it works**

Run: `bun dev` and confirm no build errors. This is a pure addition — nothing depends on it yet.

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/items.ts
git commit -m "feat: add getItemByUniqueName for category-agnostic item lookup"
```

---

### Task 2: Update Prisma schema + delete dead DB code

Remove game data tables, replace `Build.itemId` FK with denormalized string fields, AND delete the dead DB files in the same task. This must happen atomically — after `prisma generate` removes the `Item`/`Mod`/`Arcane` types, any file importing them will fail to compile. The barrel file `src/lib/db/index.ts` re-exports from `./items` and `./mods`, so it must be cleaned up in the same step.

**Files:**
- Modify: `prisma/schema.prisma`
- Delete: `src/lib/db/items.ts`
- Delete: `src/lib/db/mods.ts`
- Delete: `scripts/sync-wfcd-to-db.ts`
- Modify: `src/lib/db/index.ts`
- Modify: `package.json`

- [ ] **Step 1: Delete game data models from schema**

Remove these entire model blocks from `prisma/schema.prisma`:
- `Item` model (lines 105-137)
- `Mod` model (lines 139-166)
- `Arcane` model (lines 168-187)
- `WfcdSyncLog` model (lines 191-203)
- The `// WARFRAME DATA (synced from WFCD)` section header comment (lines 101-103)

- [ ] **Step 2: Replace Build item reference**

In the `Build` model, replace:

```prisma
  // Item reference
  itemId String
  item   Item   @relation(fields: [itemId], references: [id])
```

With:

```prisma
  // Item reference (denormalized from in-memory WFCD data)
  itemUniqueName String  // WFCD unique name, e.g. "/Lotus/Powersuits/Wraith/Wraith"
  itemCategory   String  // Browse category, e.g. "warframes"
  itemName       String  // Display name for search and rendering
  itemImageName  String? // Image filename for rendering
```

- [ ] **Step 3: Update Build indexes**

Replace:

```prisma
  @@index([itemId])
```

With:

```prisma
  @@index([itemUniqueName])
```

Replace:

```prisma
  @@index([itemId, visibility, voteCount]) // Popular builds for an item
```

With:

```prisma
  @@index([itemUniqueName, visibility, voteCount]) // Popular builds for an item
```

- [ ] **Step 4: Delete dead DB files**

```bash
rm src/lib/db/items.ts src/lib/db/mods.ts scripts/sync-wfcd-to-db.ts
```

- [ ] **Step 5: Clean up barrel exports in `src/lib/db/index.ts`**

Remove the dead re-exports. Delete the `USE_DATABASE` comment header. The file should become:

```typescript
export { prisma } from "../db"

// Build operations
export {
  createBuild,
  getBuildBySlug,
  getBuildById,
  updateBuild,
  deleteBuild,
  getUserBuilds,
  getPublicBuildsForItem,
  getPublicBuilds,
  incrementBuildViewCount,
  generateSlug,
  getUserBuildsForPartnerSelector,
} from "./builds"

export type {
  CreateBuildInput,
  UpdateBuildInput,
  BuildWithUser,
  BuildListItem,
  GetBuildsOptions,
} from "./builds"

// Vote operations
export {
  toggleBuildVote,
  hasUserVotedForBuild,
  getUserVotesForBuilds,
} from "./votes"

export type { ToggleVoteResult } from "./votes"

// Favorite operations
export {
  toggleBuildFavorite,
  hasUserFavoritedBuild,
  getUserFavoriteBuilds,
  getUserFavoritesForBuilds,
} from "./favorites"

export type {
  ToggleFavoriteResult,
  FavoriteBuildWithDetails,
} from "./favorites"

// User operations
export {
  getUserByUsername,
  getUserById,
  getUserStats,
  getPublicBuildCountForUser,
  getUserForSettings,
  updateUserBio,
  isUsernameTaken,
} from "./users"

export type { UserProfile, UserProfileFull, UserStats } from "./users"
```

- [ ] **Step 6: Remove `db:sync` script from package.json**

Remove this line from `package.json` scripts:

```json
    "db:sync": "bun run scripts/sync-wfcd-to-db.ts",
```

- [ ] **Step 7: Push schema and reset database**

Run:

```bash
bun run db:push --force-reset
```

Expected: Schema pushed successfully. All data wiped (acceptable in dev).

- [ ] **Step 8: Verify Prisma client generates**

Run:

```bash
bunx prisma generate
```

Expected: No errors. `@prisma/client` regenerated without `Item`, `Mod`, `Arcane`, `WfcdSyncLog` types.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: remove game data tables, denormalize item fields on Build, delete dead DB code"
```

---

### Task 3: Create search setup SQL script

The GIN index and searchVector trigger were previously created by `sync-wfcd-to-db.ts`. They need a new home.

**Files:**
- Create: `scripts/setup-search.sql`

- [ ] **Step 1: Write the setup script**

```sql
-- Setup full-text search for builds
-- Run after: bun run db:push --force-reset
-- Usage: psql $DATABASE_URL -f scripts/setup-search.sql

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_builds_search_vector
  ON builds USING GIN("searchVector");

-- Trigger function to auto-update searchVector on insert/update
CREATE OR REPLACE FUNCTION builds_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := (
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."itemName", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if it exists (may reference old columns)
DROP TRIGGER IF EXISTS builds_search_vector_trigger ON builds;

-- Create trigger
CREATE TRIGGER builds_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description, "itemName"
  ON builds
  FOR EACH ROW
  EXECUTE FUNCTION builds_search_vector_update();

-- Backfill searchVector for any existing builds
UPDATE builds SET name = name WHERE true;
```

- [ ] **Step 2: Run the setup script**

Run:

```bash
psql $DATABASE_URL -f scripts/setup-search.sql
```

Expected: All statements execute without error.

- [ ] **Step 3: Commit**

```bash
git add scripts/setup-search.sql
git commit -m "feat: add standalone search setup SQL script"
```

---

### Task 4: Update build DB layer — types, queries, and creation

This is the largest task. Update `builds.ts` to remove all `item` relation references and use denormalized fields instead.

**Strategy:** The `item` relation is currently included in Prisma queries and returned as a nested object (`build.item.name`, `build.item.imageName`, etc.). After removing the `Item` table, these fields are flat on the `Build` row. To avoid changing 15+ downstream components, we construct a shim `item` object from the flat fields in the DB layer's mapping functions.

**Files:**
- Modify: `src/lib/db/builds.ts`
- Modify: `src/lib/warframe/items.ts`

- [ ] **Step 1: Add `getItemMetadata` to items.ts**

`getItemByUniqueName` (from Task 1) returns a `BrowseableItem`, but build creation needs the browse category too. The `categorizeItem` function is module-private in `items.ts`, so add a helper in the same file that returns the exact fields we need for denormalization.

Add to `src/lib/warframe/items.ts` after `getItemByUniqueName`:

```typescript
/**
 * Get denormalized item metadata for storing on builds
 * Returns the fields needed for Build records without an Item FK
 */
export function getItemMetadata(uniqueName: string): {
  uniqueName: string
  name: string
  imageName: string | null
  browseCategory: string
} | null {
  const item = uniqueNameLookup.get(uniqueName)
  if (!item) return null

  const categories = categorizeItem(item)
  if (categories.length === 0) return null

  return {
    uniqueName: item.uniqueName,
    name: item.name,
    imageName: (item as { imageName?: string }).imageName ?? null,
    browseCategory: categories[0],
  }
}
```

- [ ] **Step 2: Update `BuildWithUser` type**

In `src/lib/db/builds.ts`, replace the `item` property in `BuildWithUser` (lines 65-71):

```typescript
  item: {
    id: string
    uniqueName: string
    name: string
    imageName: string | null
    browseCategory: string
  }
```

With (same shape, but `id` removed since there's no DB id anymore):

```typescript
  item: {
    uniqueName: string
    name: string
    imageName: string | null
    browseCategory: string
  }
```

Do the same for the `partnerBuilds` nested `item` (lines 83-87) — remove `id` if present. Check if `id` is used downstream; if not in the type, it's safe.

- [ ] **Step 3: Update `BuildListItem` type**

Same change — remove `id` from the `item` nested type (lines 117-121):

```typescript
  item: {
    name: string
    imageName: string | null
    browseCategory: string
  }
```

This type stays the same (it already doesn't have `id`). No change needed here.

- [ ] **Step 4: Update `buildInclude` constant**

Replace the `item` include (lines 194-202):

```typescript
  item: {
    select: {
      id: true,
      uniqueName: true,
      name: true,
      imageName: true,
      browseCategory: true,
    },
  },
```

Remove it entirely. The item data is now flat fields on Build itself.

Also update the `partnerBuilds` select (lines 218-224) — remove the `item` include:

```typescript
  partnerBuilds: {
    select: {
      id: true,
      slug: true,
      name: true,
      visibility: true,
      userId: true,
      buildData: true,
      itemUniqueName: true,
      itemName: true,
      itemImageName: true,
      itemCategory: true,
    },
  },
```

- [ ] **Step 5: Update `buildListSelect` constant**

Replace the `item` select (lines 245-251):

```typescript
  item: {
    select: {
      name: true,
      imageName: true,
      browseCategory: true,
    },
  },
```

With direct field selects:

```typescript
  itemUniqueName: true,
  itemName: true,
  itemImageName: true,
  itemCategory: true,
```

- [ ] **Step 6: Update `mapBuildResult` to construct `item` shim**

The `mapBuildResult` function maps raw Prisma results to `BuildWithUser`. Update it to construct the `item` object from flat fields, so downstream components don't need to change.

Update the function signature's input type (lines 254-272) — replace:

```typescript
      item: { name: string; imageName: string | null; browseCategory: string }
```

In the partner builds type with:

```typescript
      itemUniqueName: string
      itemName: string
      itemImageName: string | null
      itemCategory: string
```

Update the body to construct the shim. The return should include:

```typescript
  return {
    ...build,
    item: {
      uniqueName: build.itemUniqueName as string,
      name: build.itemName as string,
      imageName: (build.itemImageName as string | null) ?? null,
      browseCategory: build.itemCategory as string,
    },
    buildData: safeParseOrCast(
      BuildStateSchema,
      build.buildData,
      `build ${build.id} buildData`,
    ),
    buildGuide: build.buildGuide,
    partnerBuilds: filteredPartners.map((pb) => ({
      id: pb.id,
      slug: pb.slug,
      name: pb.name,
      item: {
        uniqueName: pb.itemUniqueName,
        name: pb.itemName,
        imageName: pb.itemImageName,
        browseCategory: pb.itemCategory,
      },
      buildData: safeParseOrCast(
        BuildStateSchema,
        pb.buildData,
        `partner build ${pb.id} buildData`,
      ),
    })),
  } as BuildWithUser
```

- [ ] **Step 7: Update `createBuild`**

Replace the item DB lookup (lines 314-324):

```typescript
  const [item, slug] = await Promise.all([
    prisma.item.findUnique({
      where: { uniqueName: input.itemUniqueName },
      select: { id: true },
    }),
    generateUniqueSlug(),
  ])

  if (!item) {
    throw new Error(`Item not found: ${input.itemUniqueName}`)
  }
```

With:

```typescript
  const itemMeta = getItemMetadata(input.itemUniqueName)
  if (!itemMeta) {
    throw new Error(`Item not found: ${input.itemUniqueName}`)
  }

  const slug = await generateUniqueSlug()
```

Then in the `prisma.build.create` data (line 347), replace `itemId: item.id` with:

```typescript
      itemUniqueName: itemMeta.uniqueName,
      itemCategory: itemMeta.browseCategory,
      itemName: itemMeta.name,
      itemImageName: itemMeta.imageName,
```

- [ ] **Step 8: Update `getPublicBuildsForItem`**

Replace the item DB lookup (lines 482-494):

```typescript
    const item = await prisma.item.findUnique({
      where: { uniqueName: itemUniqueName },
      select: { id: true },
    })

    if (!item) {
      return { builds: [], total: 0 }
    }

    const where = {
      itemId: item.id,
      visibility: "PUBLIC" as const,
    }
```

With:

```typescript
    const where = {
      itemUniqueName,
      visibility: "PUBLIC" as const,
    }
```

No item validation needed — if no builds match, you get an empty result.

- [ ] **Step 9: Update category filter in `getUserBuilds` and `getPublicBuilds`**

In `getUserBuilds` (lines 438-442), replace:

```typescript
    ...(options.category && {
      item: {
        browseCategory: options.category,
      },
    }),
```

With:

```typescript
    ...(options.category && {
      itemCategory: options.category,
    }),
```

In `getPublicBuilds` (lines 534-538), same replacement:

```typescript
    ...(category && {
      item: {
        browseCategory: category,
      },
    }),
```

→

```typescript
    ...(category && {
      itemCategory: category,
    }),
```

- [ ] **Step 10: Update `getUserBuildsForPartnerSelector`**

Replace the `item` select in the query (lines 713-718):

```typescript
      item: {
        select: {
          name: true,
          imageName: true,
          browseCategory: true,
        },
      },
```

With:

```typescript
      itemName: true,
      itemImageName: true,
      itemCategory: true,
```

Update the return mapping (lines 724-732) to construct the `item` shim:

```typescript
  return builds.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    item: {
      name: b.itemName,
      imageName: b.itemImageName,
      browseCategory: b.itemCategory,
    },
    buildData: {
      formaCount: (b.buildData as { formaCount?: number })?.formaCount ?? 0,
    },
  }))
```

- [ ] **Step 11: Update the `BuildListItem` mapping**

The `buildListSelect` no longer returns an `item` nested object. Wherever `BuildListItem` results are returned, the flat fields need to be shimmed into the `item` shape.

Add a helper function after `mapBuildResult`:

```typescript
function mapBuildListItem(
  build: Record<string, unknown>,
): BuildListItem {
  return {
    ...build,
    item: {
      name: build.itemName as string,
      imageName: (build.itemImageName as string | null) ?? null,
      browseCategory: build.itemCategory as string,
    },
  } as BuildListItem
}
```

Then in every function that returns `BuildListItem[]`, map the results:

- `getUserBuilds` (line 467): `return { builds: builds.map(mapBuildListItem), total }`
- `getPublicBuildsForItem` (line 507): same
- `getPublicBuilds` (line 564): same
- `searchBuildsWithFilters` (line 815): same

- [ ] **Step 12: Verify it compiles**

Run:

```bash
bun dev
```

Expected: No TypeScript errors. The app should start. Favorites page won't fully work until Task 5 is completed.

- [ ] **Step 13: Commit**

```bash
git add src/lib/db/builds.ts src/lib/warframe/items.ts
git commit -m "refactor: remove item FK from builds, use denormalized fields with in-memory validation"
```

---

### Task 5: Update favorites DB layer

**Files:**
- Modify: `src/lib/db/favorites.ts`

- [ ] **Step 1: Update `FavoriteBuildWithDetails` type**

Replace the `item` property (lines 38-44):

```typescript
  item: {
    id: string
    uniqueName: string
    name: string
    imageName: string | null
    browseCategory: string
  }
```

With (remove `id`):

```typescript
  item: {
    uniqueName: string
    name: string
    imageName: string | null
    browseCategory: string
  }
```

- [ ] **Step 2: Update `getUserFavoriteBuilds` query**

Replace the `item` include in the Prisma query (lines 141-149):

```typescript
            item: {
              select: {
                id: true,
                uniqueName: true,
                name: true,
                imageName: true,
                browseCategory: true,
              },
            },
```

The query uses `include: { build: { include: { user, item } } }`. After removing the `Item` relation, switch the inner `include` to `select` so we can pick individual fields including the new denormalized ones. Replace the full query with:

```typescript
    prisma.buildFavorite.findMany({
      where: { userId },
      include: {
        build: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            buildData: true,
            voteCount: true,
            favoriteCount: true,
            viewCount: true,
            createdAt: true,
            itemUniqueName: true,
            itemName: true,
            itemImageName: true,
            itemCategory: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    })
```

- [ ] **Step 3: Update the result mapping**

Update the `favorites.map()` (lines 161-177) to construct the `item` shim from flat fields:

```typescript
  const builds: FavoriteBuildWithDetails[] = favorites.map((f) => ({
    id: f.build.id,
    slug: f.build.slug,
    name: f.build.name,
    description: f.build.description,
    buildData: safeParseOrCast(
      BuildStateSchema,
      f.build.buildData,
      `favorite build ${f.build.id} buildData`,
    ),
    voteCount: f.build.voteCount,
    favoriteCount: f.build.favoriteCount,
    viewCount: f.build.viewCount,
    createdAt: f.build.createdAt,
    user: f.build.user,
    item: {
      uniqueName: f.build.itemUniqueName,
      name: f.build.itemName,
      imageName: f.build.itemImageName,
      browseCategory: f.build.itemCategory,
    },
  }))
```

- [ ] **Step 4: Verify it compiles**

Run: `bun dev`

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/favorites.ts
git commit -m "refactor: update favorites queries to use denormalized item fields"
```

---

### Task 6: Update search API route

**Files:**
- Modify: `src/app/api/search/route.ts`

- [ ] **Step 1: Replace item search with in-memory approach**

Replace the imports (line 3):

```typescript
import { searchItemsFromDb, prisma } from "@/lib/db/index"
```

With:

```typescript
import { prisma } from "@/lib/db"
import { getItemsByCategory, getCategoryCounts } from "@/lib/warframe/items"
import { BROWSE_CATEGORIES } from "@/lib/warframe/categories"
import type { BrowseItem } from "@/lib/warframe/types"
```

- [ ] **Step 2: Replace the item search query**

Replace the `searchItemsFromDb(q, undefined, 5)` call (line 24) with an in-memory search:

```typescript
    // Items: in-memory search across all categories
    function searchItems(query: string, limit: number): BrowseItem[] {
      const lowerQ = query.toLowerCase()
      const results: BrowseItem[] = []
      for (const cat of BROWSE_CATEGORIES) {
        if (results.length >= limit) break
        for (const item of getItemsByCategory(cat.id)) {
          if (results.length >= limit) break
          if (item.name.toLowerCase().includes(lowerQ)) {
            results.push(item)
          }
        }
      }
      return results
    }
```

- [ ] **Step 3: Update the build search query**

Replace the raw SQL (lines 26-48) to use `b."itemName"` instead of `JOIN items`:

```typescript
    prisma.$queryRaw<
      {
        slug: string
        name: string
        itemName: string
        author: string
        voteCount: number
      }[]
    >`
      SELECT
        b.slug,
        b.name,
        b."itemName",
        COALESCE(u.username, u.name, 'Anonymous') AS author,
        b."voteCount"
      FROM builds b
      JOIN users u ON u.id = b."userId"
      WHERE b."searchVector" @@ plainto_tsquery('english', ${q})
        AND b.visibility = 'PUBLIC'
      ORDER BY ts_rank(b."searchVector", plainto_tsquery('english', ${q})) DESC
      LIMIT 5
    `,
```

- [ ] **Step 4: Update the response mapping**

Replace the items response mapping (lines 52-57):

```typescript
    items: items.map((item) => ({
      uniqueName: item.uniqueName,
      name: item.name,
      imageName: item.imageName,
      browseCategory: item.category,
    })),
```

With:

```typescript
    items: searchItems(q, 5).map((item) => ({
      uniqueName: item.uniqueName,
      name: item.name,
      imageName: item.imageName,
      browseCategory: item.category,
    })),
```

And update the parallel Promise.all to only contain the build search (since items are synchronous now).

- [ ] **Step 5: Verify search works**

Run: `bun dev`, navigate to the app, use the search (Cmd+K).

Expected: Item search returns results. Build search returns results (if builds exist in DB).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/search/route.ts
git commit -m "refactor: replace DB item search with in-memory, remove items JOIN from build search"
```

---

### Task 7: Update documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md**

In the **Environment Variables** section, remove:

```
USE_DATABASE=true  # Toggle DB mode vs static JSON
```

In the **Database Workflow** section, update to reflect the new reality:

Replace the database workflow section with:

```markdown
## Database Workflow

- **Development phase** — no migrations. Use `bun run db:push` to sync schema directly. Reset with `bun run db:push --force-reset` if needed.
- **After a reset** — run `psql $DATABASE_URL -f scripts/setup-search.sql` to recreate the full-text search trigger and GIN index.
- **Game data** lives in static JSON files (`src/data/warframe/`), loaded into in-memory Maps at server start. NOT in the database.
- **User data** (builds, guides, votes, favorites) lives in PostgreSQL.
- **Schema changes that drop/rename columns or add required fields** require a database reset. Always tell the user when a reset is needed before proceeding.
```

In the **Gotchas** section, remove the bullet about `USE_DATABASE` env var.

In the **Commands** section, remove `bun run db:sync`:

```
# Database
bun run db:push          # Push schema to database
bun run db:migrate       # Run migrations
bun run db:studio        # Open Prisma Studio
```

Add:

```
# After DB reset
psql $DATABASE_URL -f scripts/setup-search.sql  # Setup search trigger + GIN index
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for consolidated data architecture"
```

---

### Task 8: Add GitHub Actions workflow for automated data updates

**Files:**
- Create: `.github/workflows/update-warframe-data.yml`

- [ ] **Step 1: Create the workflow file**

```bash
mkdir -p .github/workflows
```

```yaml
name: Update Warframe Data

on:
  schedule:
    - cron: "0 2 * * 0" # Sunday 02:00 UTC
  workflow_dispatch: {} # Manual trigger

jobs:
  update-data:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - run: bun update @wfcd/items

      - run: bun run sync-data

      - name: Check for changes
        id: diff
        run: |
          if git diff --quiet src/data/warframe/ package.json bun.lock; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Create PR
        if: steps.diff.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v7
        with:
          branch: auto/update-warframe-data
          title: "chore: update @wfcd/items game data"
          body: |
            Automated weekly update of Warframe game data from `@wfcd/items`.

            Review the JSON diffs in `src/data/warframe/` before merging.
          commit-message: "chore: update @wfcd/items game data"
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/update-warframe-data.yml
git commit -m "ci: add weekly automated warframe data update workflow"
```

---

### Task 9: Smoke test the full flow

- [ ] **Step 1: Reset and verify**

```bash
bun run db:push --force-reset
psql $DATABASE_URL -f scripts/setup-search.sql
```

- [ ] **Step 2: Start dev server**

```bash
bun dev
```

- [ ] **Step 3: Test browse pages**

Navigate to `http://localhost:3000/browse/warframes`. Items should load from in-memory data.

- [ ] **Step 4: Test build creation**

Create a build via the UI. Should save successfully with denormalized item fields.

- [ ] **Step 5: Test search**

Use Cmd+K search. Items should appear from in-memory search. Builds should appear via tsvector search.

- [ ] **Step 6: Test favorites** (if auth is set up)

Favorite a build. The favorites page should display correctly with item names/images.

- [ ] **Step 7: Final commit**

If any fixes were needed during smoke testing, commit them:

```bash
git add -A
git commit -m "fix: smoke test fixes for data architecture consolidation"
```
