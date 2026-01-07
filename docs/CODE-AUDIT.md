# Code Audit — Arsenyx (Next.js App Router)

Date: 2026-01-05

This audit focuses on:

- Next.js server/client boundaries and initial-load performance
- Build editor state scalability and render performance
- Data fetching, caching, and DB suitability for 100+ concurrent users
- Modularity/DRY across item types
- UI “snappiness” and polish opportunities

---

## Executive Summary (Prioritized)

### P0 — High impact / likely to be felt

- **Build editor recomputes expensive stats too often**: `calculateStats()` repeatedly parses mod stat strings during each recalculation; cost scales with number of displayed stats × mods × parsing complexity.
- **Build editor rerenders too broadly**: `BuildContainer` owns the entire `buildState` object; most updates rerender the whole editor tree.
- **Global header is a client component**: makes every page pay a hydration/bundle cost even when content is mostly static.

### P1 — Medium impact / scalability

- **List queries include more data than needed** (`buildData`, guide details, partner builds) increasing DB load and response size under concurrency.
- **View counting is a write per view** and can become the hottest DB path.

### P2 — Maintainability / UX polish

- **Category branching duplicated in multiple routes** (e.g., arcane-slot logic).
- **Some visuals use hard-coded colors** that may not harmonize perfectly across themes.

---

## 1) Next.js Best Practices (Server vs Client Components)

### Strengths (Next.js)

- Route files are generally RSC-first and do server-side data prep before rendering client UI.
  - Examples:
    - `src/app/browse/page.tsx`
    - `src/app/create/page.tsx`
    - `src/app/builds/[slug]/page.tsx`

### Risks (Next.js)

- **Header is client-rendered** (`src/components/header.tsx`). Because it appears globally, it becomes a persistent bundle + hydration cost.
- **Image optimization configuration**: in `src/app/browse/[category]/[slug]/page.tsx`, the `next/image` usage uses `unoptimized` and also sets `priority`. `priority` is fine for LCP images; `unoptimized` forfeits Next’s image optimization and can hurt performance on slow networks unless the CDN is already perfectly tuned.

### Recommendations (Next.js)

- **Split header into server shell + client islands**:
  - Server component renders logo + nav links
  - Client subcomponents for `ThemeToggle`, `UserMenu`, `MobileNav`
  - Goal: reduce baseline JS and improve perceived speed
- Prefer configuring `next.config.ts` `images.remotePatterns` for `cdn.warframestat.us` and remove `unoptimized` where possible.

---

## 2) State Logic Efficiency (Build Editor Re-render Lag)

### Findings (Editor State)

- **Monolithic editor state**: `BuildContainer` stores one large `buildState` object and many other UI states in a single component. Any `setBuildState()` triggers a rerender of the full editor.
  - File: `src/components/build-editor/build-container.tsx`

- **Stat calculation cost is likely the main CPU hotspot**:
  - Hook: `src/hooks/use-calculated-stats.ts`
  - Engine: `src/lib/warframe/stats-calculator.ts`
  - Parser: `src/lib/warframe/stat-parser.ts`

  The calculator parses mod stats (regex/string parsing) repeatedly inside per-stat calculations. That means a single “mod change” can trigger many repeated parses.

- **`memo()` isn’t fully effective due to unstable props**:
  - `ModSlotCard` is memoized, but parent passes fresh inline lambdas each render (`onSelect={() => ...}`, etc.), defeating shallow equality checks.
  - File: `src/components/build-editor/mod-grid.tsx`

### Recommendations (Editor State)

- **P0: Pre-parse mod stats once per calc**
  - In `calculateStats()`, build a parsed representation of all placed mods (keyed by `(uniqueName, rank)`), then reuse it for all stat computations.
  - Optional: memoize parse results in a module-level LRU keyed by `uniqueName + rank`.

- **P0/P1: Reduce rerender scope**
  - Long-term scalable option: move build editor state to an external store with selectors (Zustand or similar) so slot changes rerender only relevant components.
  - If staying in React state: consider splitting `BuildContainer` into smaller memoized subtrees and passing stable props.

- **P1: Make memoization meaningful**
  - Avoid passing inline handlers to memoized children.
  - Pass `slotId` and a stable handler instead.

- **Perceived performance**
  - Consider deferring expensive recalculation during drag using `useDeferredValue(buildState)` (so dragging stays “buttery” and sidebar stats update slightly later).

---

## 3) Data Fetching & Caching (100+ concurrent users)

### Strengths (Data)

- Prisma schema indexes are in place for common build queries.
  - File: `prisma/schema.prisma`
- Item/mod DB queries use `unstable_cache` with `revalidate` and tags.
  - Files:
    - `src/lib/db/items.ts`
    - `src/lib/db/mods.ts`

### Risks (Data)

- **Heavy includes on list pages**:
  - `getPublicBuilds()` and `getUserBuilds()` use `include: buildInclude`.
  - `buildInclude` includes `partnerBuilds`, `buildGuide`, and likely `buildData` (large JSON).
  - File: `src/lib/db/builds.ts`
  Under concurrency this increases query time, DB bandwidth, and response size.

- **Per-view DB write**:
  - `incrementBuildViewCount()` runs an `UPDATE ... increment` per view.
  - File: `src/lib/db/builds.ts`
  This can become the busiest DB path and may lock hot rows.

- **Potential perf cliff in DB slug lookup**:
  - `getItemBySlugFromDb()` pulls all items for a category and slugifies in a loop.
  - File: `src/lib/db/items.ts`
  If DB mode is enabled for item detail pages, this becomes slow.

- **Connection pooling**:
  - Prisma uses `pg.Pool({ max: 3 })`.
  - File: `src/lib/db.ts`
  This may be too low for a long-lived server under 100+ concurrent requests, depending on workload and deployment topology.

### Recommendations (Data)

- **P1: “List shape” queries**
  - For list endpoints/pages: `select` only what’s needed (id/slug/name/item thumbnail/counts/updatedAt). Exclude `buildData`, exclude guide description, exclude partner builds.

- **P1: View count strategy**
  - Throttle view count increments per viewer (cookie/session + time window), or buffer in Redis and flush, or append-only analytics table with periodic aggregation.

- **P1: Slug lookup in DB**
  - Store `slug` on the `Item` model (computed at sync time) and add an index on `(browseCategory, slug)`.

- **P1: Pool tuning**
  - If running in a long-lived server: raise pool size and confirm DB max connections.
  - If serverless: avoid per-lambda pools; use PgBouncer/Prisma Accelerate patterns.

---

## 4) Maintainability & DRY Across Item Types

### Findings (Maintainability)

- Category-based branching is duplicated across routes:
  - Arcane slot selection logic exists in both `src/app/create/page.tsx` and `src/app/builds/[slug]/page.tsx`.

- There are parallel “static JSON mode” and “DB mode” implementations.
  - This is valid, but it’s easy for the two paths to drift unless you enforce a single façade boundary.

### Recommendations (Maintainability)

- **P2: Centralize category → arcane-slot mapping**
  - Add a helper (or extend existing category config) so routes don’t copy/paste category branching.

- **P2: Enforce data access façade**
  - Ensure route pages import from one “source of truth” module for items/mods/builds.

---

## 5) Visual Polish / “Snappiness” Opportunities

### Findings (UI)

- Hard-coded Tailwind colors are used for semantic states (stat deltas and damage types).
  - Files:
    - `src/components/build-editor/stat-row.tsx`
    - `src/components/build-editor/damage-breakdown.tsx`
  This can look less cohesive across themes than using theme tokens or a limited design palette.

- Skeleton usage is already present in key routes (`create`, `build view`), which is good for perceived performance.

### Recommendations (UI)

- **P0: Reduce global hydration by server-rendering header shell**
  - This usually provides the biggest perceived “instant UI” improvement.

- **P2: Theme-cohesive semantic colors**
  - Consider mapping colors to a minimal semantic palette that looks right in both light/dark.

- **P2: Layout stability**
  - Prefer `next/image` with correct `sizes` to reduce layout shift.

---

## Suggested Next Steps (Implementation Order)

1) Pre-parse/memoize mod stats in `calculateStats` to reduce CPU on every mod change.
2) Make memoization effective in editor grid components (stable handlers/props) or adopt a selector-based store to reduce rerenders.
3) Slim down build list queries to avoid loading heavy JSON for lists.
4) Address view count writes (throttle/buffer).
5) Refactor duplicated category branching into one helper.

---

## Appendix: Key Files Reviewed

- Server/client boundaries
  - `src/app/layout.tsx`
  - `src/components/header.tsx`

- Build editor & calculations
  - `src/components/build-editor/build-container.tsx`
  - `src/components/build-editor/mod-grid.tsx`
  - `src/hooks/use-calculated-stats.ts`
  - `src/lib/warframe/stats-calculator.ts`
  - `src/lib/warframe/stat-parser.ts`

- Data access layer
  - `src/lib/db.ts`
  - `src/lib/db/builds.ts`
  - `src/lib/db/items.ts`
  - `src/lib/db/mods.ts`

- Static WFCD data access
  - `src/lib/warframe/items.ts`
  - `src/lib/warframe/mods.ts`
