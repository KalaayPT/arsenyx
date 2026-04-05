# React Performance Audit Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 16 performance issues identified by a Vercel React Best Practices audit, grouped into 7 independent tasks ordered by impact.

**Architecture:** Each task is a standalone fix touching 1-2 files. No task depends on another. Tasks are ordered CRITICAL > HIGH > MEDIUM. Each task ends with a `bun build` verification.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript, Prisma, next/dynamic, React.cache()

---

### Task 1: Parallelize sequential DB queries in org page

**Files:**
- Modify: `src/app/org/[slug]/page.tsx:54-76`

- [ ] **Step 1: Parallelize builds + count with Promise.all**

In `src/app/org/[slug]/page.tsx`, replace the sequential `findMany` then `count` (lines 54-76) with a single `Promise.all`:

```typescript
// Replace lines 54-76 with:
const [builds, totalBuilds] = await Promise.all([
  prisma.build.findMany({
    where: { organizationId: org.id, visibility: "PUBLIC" },
    orderBy: { voteCount: "desc" },
    take: 12,
    select: {
      id: true,
      slug: true,
      name: true,
      itemName: true,
      itemImageName: true,
      voteCount: true,
      viewCount: true,
    },
  }),
  prisma.build.count({
    where: { organizationId: org.id, visibility: "PUBLIC" },
  }),
])

const createdDate = new Date(org.createdAt).toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
})
```

- [ ] **Step 2: Verify build**

Run: `bun build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/org/[slug]/page.tsx
git commit -m "perf: parallelize org page DB queries with Promise.all"
```

---

### Task 2: Dynamic import GuideReader on guides page

**Files:**
- Modify: `src/app/guides/[slug]/page.tsx:10,126`

The `build-guide-section.tsx` already uses `next/dynamic` for `GuideReader`. The standalone guides page imports it eagerly, pulling ~120KB of markdown libs into the page bundle.

- [ ] **Step 1: Replace static import with dynamic import**

In `src/app/guides/[slug]/page.tsx`, replace line 10:

```typescript
// OLD (line 10):
import { GuideReader } from "@/components/guides/guide-reader"

// NEW:
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const GuideReader = dynamic(
  () =>
    import("@/components/guides/guide-reader").then((mod) => mod.GuideReader),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] rounded-md" />,
  },
)
```

Remove the now-unused static import line. The `dynamic` import from `next/dynamic` replaces it. The `Suspense` import on line 5 can stay (used for `RelatedGuides`).

- [ ] **Step 2: Verify build**

Run: `bun build`
Expected: Build succeeds. The guides page JS bundle should be smaller (markdown libs deferred).

- [ ] **Step 3: Commit**

```bash
git add src/app/guides/[slug]/page.tsx
git commit -m "perf: lazy-load GuideReader on guides page via next/dynamic"
```

---

### Task 3: Parallelize independent profile updates

**Files:**
- Modify: `src/app/actions/profile.ts:58-76`

Username validation must remain sequential (check → update), but the bio update is independent and can run in parallel with the username update.

- [ ] **Step 1: Restructure to collect parallel promises**

In `src/app/actions/profile.ts`, replace lines 58-76 with:

```typescript
    // Update username via Better Auth API (keeps session in sync)
    if (username && username.toLowerCase() !== oldUsername?.toLowerCase()) {
      const taken = await isUsernameTaken(username, session.user.id)
      if (taken) {
        return err("Username is already taken")
      }

      // Run username update and bio update in parallel
      const updates: Promise<unknown>[] = [
        auth.api.updateUser({
          body: { username: username },
          headers: await headers(),
        }),
      ]

      if (bio !== undefined) {
        updates.push(updateUserBio(session.user.id, bio || null))
      }

      await Promise.all(updates)
    } else if (bio !== undefined) {
      // Only bio changed
      await updateUserBio(session.user.id, bio || null)
    }
```

- [ ] **Step 2: Verify build**

Run: `bun build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/profile.ts
git commit -m "perf: parallelize username and bio updates in profile action"
```

---

### Task 4: Add React.cache() to uncached DB queries

**Files:**
- Modify: `src/lib/db/users.ts:81`
- Modify: `src/lib/db/organizations.ts:83,108,119`

Three frequently-used DB functions lack `React.cache()` for per-request deduplication. Other similar functions in these files already use it.

- [ ] **Step 1: Wrap getUserById with cache**

In `src/lib/db/users.ts`, replace lines 81-100:

```typescript
export const getUserById = cache(async function getUserById(
  userId: string,
): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      image: true,
      bio: true,
      createdAt: true,
      isVerified: true,
      isCommunityLeader: true,
      isModerator: true,
      isAdmin: true,
    },
  })

  return user
})
```

- [ ] **Step 2: Wrap getOrganizationById with cache**

In `src/lib/db/organizations.ts`, replace lines 83-106:

```typescript
export const getOrganizationById = cache(async function getOrganizationById(
  id: string,
): Promise<OrganizationProfile | null> {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              displayUsername: true,
              image: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  })
  return org
})
```

- [ ] **Step 3: Wrap isOrgMember and isOrgAdmin with cache**

In `src/lib/db/organizations.ts`, replace lines 108-128:

```typescript
export const isOrgMember = cache(async function isOrgMember(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { userId: true },
  })
  return !!member
})

export const isOrgAdmin = cache(async function isOrgAdmin(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  })
  return member?.role === "ADMIN"
})
```

- [ ] **Step 4: Verify build**

Run: `bun build`
Expected: Build succeeds. The `cache` import already exists at the top of both files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/users.ts src/lib/db/organizations.ts
git commit -m "perf: add React.cache() to getUserById, getOrganizationById, isOrgMember, isOrgAdmin"
```

---

### Task 5: Build index Maps for O(n) lookups in import/apply hot paths

**Files:**
- Modify: `src/lib/overframe/apply.ts:138-163`
- Modify: `src/lib/overframe/import.ts:386-406,310-311,250-261`
- Modify: `src/lib/warframe/categories.ts:88-178`

- [ ] **Step 1: Build mod index Map in apply.ts**

In `src/lib/overframe/apply.ts`, add a Map before the mod placement loop. Before the `for (const m of importResult.mods)` loop (line 138), insert:

```typescript
  // Build index for O(1) mod lookup by uniqueName
  const compatibleModsByName = new Map(
    compatibleMods.map((cm) => [cm.uniqueName, cm]),
  )
```

Then replace the `compatibleMods.find()` on line 153-155:

```typescript
    // OLD:
    const fullMod = compatibleMods.find(
      (cm) => cm.uniqueName === m.matched!.uniqueName,
    )

    // NEW:
    const fullMod = compatibleModsByName.get(m.matched!.uniqueName)
```

- [ ] **Step 2: Build arcane index Map in import.ts**

In `src/lib/overframe/import.ts`, after `const allArcanes = getAllArcanes()` (line 388), add:

```typescript
  const arcanesByNameLower = new Map(
    allArcanes.map((a) => [a.name.toLowerCase(), a]),
  )
```

Then replace the `.find()` on line 406:

```typescript
    // OLD:
    const arcane = allArcanes.find((a) => a.name.toLowerCase() === lowerName)

    // NEW:
    const arcane = arcanesByNameLower.get(lowerName)
```

- [ ] **Step 3: Single-pass partition in import.ts**

In `src/lib/overframe/import.ts`, replace lines 310-311:

```typescript
  // OLD:
  const modSlots = slotList.filter((s) => s.slotType !== "arcane")
  const arcaneSlots = slotList.filter((s) => s.slotType === "arcane")

  // NEW:
  const modSlots: typeof slotList = []
  const arcaneSlots: typeof slotList = []
  for (const s of slotList) {
    if (s.slotType === "arcane") {
      arcaneSlots.push(s)
    } else {
      modSlots.push(s)
    }
  }
```

- [ ] **Step 4: Static lookup Maps in categories.ts**

In `src/lib/warframe/categories.ts`, add static Maps after the `BROWSE_CATEGORIES` array (after line 87):

```typescript
// Static lookup maps built once at module init
const CATEGORY_BY_ID = new Map(
  BROWSE_CATEGORIES.map((c) => [c.id, c]),
)

const VALID_CATEGORY_IDS = new Set<string>(
  BROWSE_CATEGORIES.map((c) => c.id),
)

const WARFRAME_CATEGORIES_SET = new Set<BrowseCategory>(["warframes", "necramechs"])
const WEAPON_CATEGORIES_SET = new Set<BrowseCategory>(["primary", "secondary", "melee"])
const GUN_CATEGORIES_SET = new Set<BrowseCategory>(["primary", "secondary"])
```

Then update the functions (lines 92-178):

```typescript
export function getCategoryConfig(
  categoryId: BrowseCategory,
): CategoryConfig | undefined {
  return CATEGORY_BY_ID.get(categoryId)
}

// getCategoryByWfcd stays as-is (nested .includes on small arrays, called rarely)

export function isValidCategory(category: string): category is BrowseCategory {
  return VALID_CATEGORY_IDS.has(category)
}

// ... (keep getDefaultCategory and mapWfcdCategory unchanged)

export function isWarframeCategory(category: BrowseCategory): boolean {
  return WARFRAME_CATEGORIES_SET.has(category)
}

export function isWeaponCategory(category: BrowseCategory): boolean {
  return WEAPON_CATEGORIES_SET.has(category)
}

export function isGunCategory(category: BrowseCategory): boolean {
  return GUN_CATEGORIES_SET.has(category)
}
```

- [ ] **Step 5: Verify build**

Run: `bun build`
Expected: Build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/overframe/apply.ts src/lib/overframe/import.ts src/lib/warframe/categories.ts
git commit -m "perf: use Map/Set for O(1) lookups in import, apply, and categories"
```

---

### Task 6: Memoize parseModStats with WeakMap

**Files:**
- Modify: `src/lib/warframe/stat-parser.ts:110-260` (add cache), `265-293` (unchanged, benefit from cache)

Four exported functions call `parseModStats()` on the same mod object. Adding a `WeakMap` cache means the regex parsing only runs once per mod instance per GC lifetime.

- [ ] **Step 1: Add WeakMap cache to parseModStats**

In `src/lib/warframe/stat-parser.ts`, find the `parseModStats` function. Add the cache just above its definition:

```typescript
const parseModStatsCache = new WeakMap<PlacedMod, ParsedModStat[]>()
```

Then at the top of the `parseModStats` function body, add an early return:

```typescript
export function parseModStats(mod: PlacedMod): ParsedModStat[] {
  const cached = parseModStatsCache.get(mod)
  if (cached) return cached

  // ... existing function body unchanged ...

  // At the end, before `return results`:
  parseModStatsCache.set(mod, results)
  return results
}
```

Make sure to replace the existing `return results` at the end of the function with the two lines above.

- [ ] **Step 2: Verify build**

Run: `bun build`
Expected: Build succeeds. The four helper functions (`modAffectsStat`, `getModAffectedStats`, `hasConditionalEffects`, `getMaxStacks`) automatically benefit from the cache.

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/stat-parser.ts
git commit -m "perf: memoize parseModStats with WeakMap to avoid redundant regex parsing"
```

---

### Task 7: Hoist RegExp + make scroll listener passive

**Files:**
- Modify: `src/lib/overframe/items-map.ts:7-36`
- Modify: `src/components/mod-card/mod-card.tsx:467`

- [ ] **Step 1: Hoist RegExp in items-map.ts**

In `src/lib/overframe/items-map.ts`, add hoisted patterns above the `parseItemsCsv` function (before line 7):

```typescript
const HEADER_RE = /^id\s*,/i
const QUOTE_WRAP_RE = /^"|"$/g
const ESCAPED_QUOTE_RE = /""/g
```

Then update `parseItemsCsv` to use them. Replace lines 20, 25, 29, 31:

```typescript
    // Line 20 — was: if (/^id\s*,/i.test(line)) continue
    if (HEADER_RE.test(line)) continue

    // Line 25 — was: .replace(/^"|"$/g, "")
    const id = line.slice(0, firstComma).trim().replace(QUOTE_WRAP_RE, "")

    // Line 29 — was: name.replace(/^"|"$/g, "")
    name = name.replace(QUOTE_WRAP_RE, "")
    // Line 31 — was: name.replace(/""/g, '"')
    name = name.replace(ESCAPED_QUOTE_RE, '"')
```

**Important:** `QUOTE_WRAP_RE` uses the `/g` flag. Since `String.prototype.replace()` with a global regex resets `lastIndex` automatically, this is safe to reuse. However, `HEADER_RE` uses `.test()` — since it has no `/g` flag, there is no `lastIndex` issue.

- [ ] **Step 2: Make scroll listener passive in mod-card.tsx**

In `src/components/mod-card/mod-card.tsx`, replace line 467-468:

```typescript
    // OLD:
    window.addEventListener("scroll", handleScroll, true)
    return () => window.removeEventListener("scroll", handleScroll, true)

    // NEW:
    const scrollOpts: AddEventListenerOptions = { capture: true, passive: true }
    window.addEventListener("scroll", handleScroll, scrollOpts)
    return () => window.removeEventListener("scroll", handleScroll, scrollOpts)
```

- [ ] **Step 3: Verify build**

Run: `bun build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/overframe/items-map.ts src/components/mod-card/mod-card.tsx
git commit -m "perf: hoist RegExp out of CSV loop, make scroll listener passive"
```
