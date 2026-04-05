# Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate code duplication, fix memory leaks, improve type safety, and reduce complexity across the Arsenyx codebase.

**Architecture:** Pure refactoring — no new features, no behavior changes. Every task produces identical runtime behavior. Changes are organized bottom-up: shared utilities first, then consumers, then cleanup.

**Tech Stack:** TypeScript, Next.js 16 (App Router), React 19, Prisma, Bun test runner

---

## File Structure

New files:
- `src/lib/warframe/arcanes.ts` — `getArcanesForCategory()` helper
- `src/lib/warframe/__tests__/arcanes.test.ts` — tests for the above
- `src/lib/db/social-toggle.ts` — generic toggle + batch query helpers
- `src/lib/auth-helpers.ts` — `requireAuth()` helper
- `src/lib/__tests__/auth-helpers.test.ts` — tests for the above
- `src/lib/lru-cache.ts` — simple bounded LRU cache

Modified files:
- `src/app/create/page.tsx` — replace 3x arcane logic with helper call
- `src/app/builds/[slug]/page.tsx` — replace arcane logic with helper call
- `src/lib/db/votes.ts` — delegate to generic toggle
- `src/lib/db/favorites.ts` — delegate to generic toggle
- `src/app/actions/social.ts` — use `requireAuth()`
- `src/app/actions/builds.ts` — use `requireAuth()`
- `src/app/actions/profile.ts` — use `requireAuth()`
- `src/app/actions/organizations.ts` — use `requireAuth()`
- `src/lib/image/render.ts` — replace unbounded Maps with LRU
- `src/lib/db/builds.ts` — trim partner builds select

---

## Task 1: Extract `getArcanesForCategory()` helper

**Files:**
- Create: `src/lib/warframe/arcanes.ts`
- Create: `src/lib/warframe/__tests__/arcanes.test.ts`
- Modify: `src/app/create/page.tsx:85-96, 141-152, 211-223`
- Modify: `src/app/builds/[slug]/page.tsx:126-140`

- [ ] **Step 1: Write the test file**

```typescript
// src/lib/warframe/__tests__/arcanes.test.ts
import { describe, it, expect } from "bun:test"

import { getArcanesForCategory } from "../arcanes"

describe("getArcanesForCategory", () => {
  it("returns warframe arcanes for 'warframes'", () => {
    const result = getArcanesForCategory("warframes")
    expect(result.length).toBeGreaterThan(0)
    // Warframe arcanes should include things like Arcane Energize
    expect(result.some((a) => a.name.includes("Arcane"))).toBe(true)
  })

  it("returns warframe arcanes for 'necramechs'", () => {
    const result = getArcanesForCategory("necramechs")
    expect(result).toEqual(getArcanesForCategory("warframes"))
  })

  it("returns primary + secondary arcanes for 'archwing'", () => {
    const result = getArcanesForCategory("archwing")
    expect(result.length).toBeGreaterThan(0)
  })

  it("returns primary arcanes for 'primary'", () => {
    const result = getArcanesForCategory("primary")
    expect(result.length).toBeGreaterThan(0)
  })

  it("returns secondary arcanes for 'secondary'", () => {
    const result = getArcanesForCategory("secondary")
    expect(result.length).toBeGreaterThan(0)
  })

  it("returns melee arcanes for 'melee'", () => {
    const result = getArcanesForCategory("melee")
    expect(result.length).toBeGreaterThan(0)
  })

  it("returns empty array for categories without arcanes", () => {
    const result = getArcanesForCategory("companions")
    expect(result).toEqual([])
  })

  it("returns empty array for 'companion-weapons'", () => {
    const result = getArcanesForCategory("companion-weapons")
    expect(result).toEqual([])
  })

  it("returns empty array for 'exalted-weapons'", () => {
    const result = getArcanesForCategory("exalted-weapons")
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/warframe/__tests__/arcanes.test.ts`
Expected: FAIL — `getArcanesForCategory` not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/warframe/arcanes.ts
import type { BrowseCategory } from "./types"
import type { Arcane } from "./types"
import { getArcanesForSlot } from "./mods"

/**
 * Get compatible arcanes for a browse category.
 * Centralizes the category-to-arcane-slot mapping used by create and build pages.
 */
export function getArcanesForCategory(category: BrowseCategory): Arcane[] {
  switch (category) {
    case "warframes":
    case "necramechs":
      return getArcanesForSlot("warframe")
    case "archwing":
      return [
        ...getArcanesForSlot("primary"),
        ...getArcanesForSlot("secondary"),
      ]
    case "primary":
      return getArcanesForSlot("primary")
    case "secondary":
      return getArcanesForSlot("secondary")
    case "melee":
      return getArcanesForSlot("melee")
    default:
      return []
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/warframe/__tests__/arcanes.test.ts`
Expected: PASS

- [ ] **Step 5: Replace all 3 copies in `src/app/create/page.tsx`**

Replace each of the three identical if/else blocks (lines ~85-96, ~141-152, ~211-223) with:
```typescript
const compatibleArcanes = getArcanesForCategory(category)
```

Add import at top:
```typescript
import { getArcanesForCategory } from "@/lib/warframe/arcanes"
```

Remove the now-unused `getArcanesForSlot` import if it's no longer used directly.

- [ ] **Step 6: Replace the logic in `src/app/builds/[slug]/page.tsx`**

Replace lines ~126-140 with:
```typescript
const compatibleArcanes = getArcanesForCategory(category)
```

Add the same import. Remove unused `getArcanesForSlot` import.

- [ ] **Step 7: Run build to verify no regressions**

Run: `bun build`
Expected: Build succeeds with no type errors

- [ ] **Step 8: Commit**

```bash
git add src/lib/warframe/arcanes.ts src/lib/warframe/__tests__/arcanes.test.ts src/app/create/page.tsx src/app/builds/[slug]/page.tsx
git commit -m "refactor: extract getArcanesForCategory to eliminate 4x duplication"
```

---

## Task 2: Add bounded LRU cache, fix memory leaks in image render

**Files:**
- Create: `src/lib/lru-cache.ts`
- Modify: `src/lib/image/render.ts:20, 83`

- [ ] **Step 1: Write the LRU cache**

```typescript
// src/lib/lru-cache.ts

/**
 * Simple bounded LRU cache. Evicts least-recently-used entries when capacity is exceeded.
 * Drop-in replacement for Map where unbounded growth is a concern.
 */
export class LRUCache<K, V> {
  private map = new Map<K, V>()
  private readonly max: number

  constructor(max: number) {
    this.max = max
  }

  get(key: K): V | undefined {
    const value = this.map.get(key)
    if (value === undefined) return undefined
    // Move to end (most recently used)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.max) {
      // Evict oldest (first key)
      const oldest = this.map.keys().next().value!
      this.map.delete(oldest)
    }
    this.map.set(key, value)
  }

  get size(): number {
    return this.map.size
  }
}
```

- [ ] **Step 2: Replace unbounded caches in `src/lib/image/render.ts`**

At the top, add import:
```typescript
import { LRUCache } from "@/lib/lru-cache"
```

Replace line 20:
```typescript
// Before:
const imageDataUriCache = new Map<string, string>()
// After:
const imageDataUriCache = new LRUCache<string, string>(200)
```

Replace line 83:
```typescript
// Before:
const tintCache = new Map<string, string>()
// After:
const tintCache = new LRUCache<string, string>(100)
```

- [ ] **Step 3: Run build to verify**

Run: `bun build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/lib/lru-cache.ts src/lib/image/render.ts
git commit -m "fix: cap image caches with LRU to prevent unbounded memory growth"
```

---

## Task 3: Extract `requireAuth()` helper

**Files:**
- Create: `src/lib/auth-helpers.ts`
- Create: `src/lib/__tests__/auth-helpers.test.ts`
- Modify: `src/app/actions/builds.ts`
- Modify: `src/app/actions/social.ts`
- Modify: `src/app/actions/profile.ts`
- Modify: `src/app/actions/organizations.ts`

- [ ] **Step 1: Write the test file**

```typescript
// src/lib/__tests__/auth-helpers.test.ts
import { describe, it, expect, mock } from "bun:test"

import { requireAuth } from "../auth-helpers"

// Mock getServerSession
mock.module("@/lib/auth", () => ({
  getServerSession: mock(() => Promise.resolve(null)),
}))

describe("requireAuth", () => {
  it("returns error result when session is null", async () => {
    const { getServerSession } = await import("@/lib/auth")
    ;(getServerSession as ReturnType<typeof mock>).mockResolvedValueOnce(null)

    const result = await requireAuth("vote")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe("You must be signed in to vote")
    }
  })

  it("returns error result when session has no user", async () => {
    const { getServerSession } = await import("@/lib/auth")
    ;(getServerSession as ReturnType<typeof mock>).mockResolvedValueOnce({ user: null })

    const result = await requireAuth("vote")
    expect(result.success).toBe(false)
  })

  it("returns user ID when session is valid", async () => {
    const { getServerSession } = await import("@/lib/auth")
    ;(getServerSession as ReturnType<typeof mock>).mockResolvedValueOnce({
      user: { id: "user-123" },
    })

    const result = await requireAuth("vote")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe("user-123")
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/__tests__/auth-helpers.test.ts`
Expected: FAIL — `requireAuth` not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/auth-helpers.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/__tests__/auth-helpers.test.ts`
Expected: PASS

- [ ] **Step 5: Update `src/app/actions/builds.ts`**

Add import:
```typescript
import { requireAuth } from "@/lib/auth-helpers"
```

Replace each auth check pattern. For example in `saveBuildAction` (lines ~57-61), replace:
```typescript
const session = await getServerSession()
if (!session?.user?.id) {
  return err("You must be signed in to save a build")
}
// ... later uses session.user.id
```
with:
```typescript
const auth = await requireAuth("save a build")
if (!auth.success) return auth
const userId = auth.data
```

Apply the same pattern to `deleteBuildAction`, `updateBuildGuideAction`, `getUserBuildsForPartnerSelectorAction`, and any others in the file. Replace `session.user.id` references with `userId`.

Remove the now-unused `getServerSession` import if no other code in the file uses it.

- [ ] **Step 6: Update `src/app/actions/social.ts`**

Same pattern. Replace auth checks in `toggleVoteAction` (line ~45-49), `toggleFavoriteAction` (line ~77-81), and `getSocialStatusAction` (line ~112-116).

Note: `getSocialStatusAction` returns `{ hasVoted: false, hasFavorited: false }` on no-auth instead of an error — this is different behavior. For that function, keep the session check as-is or handle it separately.

- [ ] **Step 7: Update `src/app/actions/profile.ts`**

Same pattern for `updateProfileAction` (line ~43-46) and `getSettingsDataAction` (line ~150-153).

- [ ] **Step 8: Update `src/app/actions/organizations.ts`**

Same pattern for all 8 action functions that start with `getServerSession()` + auth check.

- [ ] **Step 9: Run build**

Run: `bun build`
Expected: Build succeeds

- [ ] **Step 10: Commit**

```bash
git add src/lib/auth-helpers.ts src/lib/__tests__/auth-helpers.test.ts src/app/actions/builds.ts src/app/actions/social.ts src/app/actions/profile.ts src/app/actions/organizations.ts
git commit -m "refactor: extract requireAuth() to eliminate ~20 duplicated auth checks"
```

---

## Task 4: Consolidate vote/favorite DB toggle operations

**Files:**
- Create: `src/lib/db/social-toggle.ts`
- Modify: `src/lib/db/votes.ts:32-68, 92-107`
- Modify: `src/lib/db/favorites.ts:59-95, 197-212`

- [ ] **Step 1: Write the generic toggle helper**

```typescript
// src/lib/db/social-toggle.ts
import { prisma } from "@/lib/db"

type ToggleTable = "buildVote" | "buildFavorite"
type CountField = "voteCount" | "favoriteCount"

interface ToggleResult {
  active: boolean
  count: number
}

/**
 * Generic toggle for user-build social actions (vote, favorite).
 * Checks for existing record, creates or deletes it, and updates the denormalized count.
 */
export async function toggleBuildSocialAction(
  userId: string,
  buildId: string,
  table: ToggleTable,
  countField: CountField,
): Promise<ToggleResult> {
  const model = prisma[table] as any
  const compositeKey = { userId_buildId: { userId, buildId } }

  const existing = await model.findUnique({ where: compositeKey })

  if (existing) {
    const [, build] = await prisma.$transaction([
      model.delete({ where: { id: existing.id } }),
      prisma.build.update({
        where: { id: buildId },
        data: { [countField]: { decrement: 1 } },
        select: { [countField]: true },
      }),
    ])
    return { active: false, count: build[countField] }
  } else {
    const [, build] = await prisma.$transaction([
      model.create({ data: { userId, buildId } }),
      prisma.build.update({
        where: { id: buildId },
        data: { [countField]: { increment: 1 } },
        select: { [countField]: true },
      }),
    ])
    return { active: true, count: build[countField] }
  }
}

/**
 * Generic batch query for user social statuses on multiple builds.
 */
export async function getUserSocialStatusesForBuilds(
  userId: string,
  buildIds: string[],
  table: ToggleTable,
): Promise<Set<string>> {
  if (buildIds.length === 0) return new Set()

  const model = prisma[table] as any
  const records = await model.findMany({
    where: { userId, buildId: { in: buildIds } },
    select: { buildId: true },
  })

  return new Set(records.map((r: { buildId: string }) => r.buildId))
}
```

- [ ] **Step 2: Refactor `src/lib/db/votes.ts` to use the generic helper**

Replace `toggleBuildVote` body (lines ~32-68) to delegate:
```typescript
import { toggleBuildSocialAction, getUserSocialStatusesForBuilds } from "./social-toggle"

export async function toggleBuildVote(
  userId: string,
  buildId: string,
): Promise<ToggleVoteResult> {
  await voteLimiter.check(10, `vote_${userId}`)
  const result = await toggleBuildSocialAction(userId, buildId, "buildVote", "voteCount")
  return { voted: result.active, voteCount: result.count }
}
```

Replace `getUserVotesForBuilds` (lines ~92-107):
```typescript
export async function getUserVotesForBuilds(
  userId: string,
  buildIds: string[],
): Promise<Set<string>> {
  return getUserSocialStatusesForBuilds(userId, buildIds, "buildVote")
}
```

Keep the existing `hasUserVotedForBuild` function as-is (it's a single-record check, not worth abstracting).

- [ ] **Step 3: Refactor `src/lib/db/favorites.ts` to use the generic helper**

Same pattern. Replace `toggleBuildFavorite` body (lines ~59-95):
```typescript
import { toggleBuildSocialAction, getUserSocialStatusesForBuilds } from "./social-toggle"

export async function toggleBuildFavorite(
  userId: string,
  buildId: string,
): Promise<ToggleFavoriteResult> {
  await favoriteLimiter.check(20, `fav_${userId}`)
  const result = await toggleBuildSocialAction(userId, buildId, "buildFavorite", "favoriteCount")
  return { favorited: result.active, favoriteCount: result.count }
}
```

Replace `getUserFavoritesForBuilds` (lines ~197-212):
```typescript
export async function getUserFavoritesForBuilds(
  userId: string,
  buildIds: string[],
): Promise<Set<string>> {
  return getUserSocialStatusesForBuilds(userId, buildIds, "buildFavorite")
}
```

- [ ] **Step 4: Run build**

Run: `bun build`
Expected: Build succeeds — all existing call sites are unchanged because the public API of votes.ts/favorites.ts hasn't changed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/social-toggle.ts src/lib/db/votes.ts src/lib/db/favorites.ts
git commit -m "refactor: consolidate vote/favorite toggle into generic social-toggle helper"
```

---

## Task 5: Trim partner builds query

**Files:**
- Modify: `src/lib/db/builds.ts:216-228`

- [ ] **Step 1: Remove `buildData` from partner builds select**

In `src/lib/db/builds.ts`, find the `buildInclude` object (line ~197). In the `partnerBuilds.select` block, remove `buildData: true`:

```typescript
// Before (line ~222):
partnerBuilds: {
  select: {
    id: true,
    slug: true,
    name: true,
    visibility: true,
    userId: true,
    buildData: true,       // <-- Remove this line
    itemUniqueName: true,
    itemName: true,
    itemImageName: true,
    itemCategory: true,
  },
},

// After:
partnerBuilds: {
  select: {
    id: true,
    slug: true,
    name: true,
    visibility: true,
    userId: true,
    itemUniqueName: true,
    itemName: true,
    itemImageName: true,
    itemCategory: true,
  },
},
```

- [ ] **Step 2: Check for consumers that read `buildData` from partner builds**

Search for any code that accesses `partnerBuild.buildData` or `partnerBuilds[x].buildData`. If found, those consumers need to fetch `buildData` separately or the field needs to stay. If not found, the removal is safe.

Run: `grep -r "partnerBuild.*buildData\|partnerBuilds.*buildData" src/`

If matches are found, keep `buildData` and skip this task. If no matches, proceed.

- [ ] **Step 3: Run build**

Run: `bun build`
Expected: Build succeeds. If there's a type error about missing `buildData` on partner builds, a consumer exists — add `buildData` back and skip this task.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/builds.ts
git commit -m "perf: remove buildData from partner builds select to reduce query payload"
```

---

## Task 6: Add composite database indexes

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add composite indexes to Build model**

In `prisma/schema.prisma`, inside the `Build` model's index block (after the existing indexes, before `@@map("builds")`), add:

```prisma
  @@index([userId, visibility, voteCount])
  @@index([itemCategory, visibility, voteCount])
```

These cover the common query patterns:
- User profile pages: filter by `userId` + `visibility`, sort by `voteCount`
- Browse by category: filter by `itemCategory` + `visibility`, sort by `voteCount`

Do NOT remove existing indexes — they may serve other queries.

- [ ] **Step 2: Push schema**

Run: `bun run db:push`
Expected: Schema synced, indexes created. No data loss (additive change only).

- [ ] **Step 3: Run build**

Run: `bun build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "perf: add composite indexes for common profile and category queries"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run full test suite**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 2: Run full build**

Run: `bun build`
Expected: Clean build, no type errors

- [ ] **Step 3: Run lint**

Run: `bun lint`
Expected: No new lint errors
