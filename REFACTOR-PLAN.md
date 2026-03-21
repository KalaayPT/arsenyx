# Arsenyx Refactoring Plan

> Created: 2026-03-21
> Goal: Make the codebase maintainable and extensible without a full rewrite.
> Approach: Extract, simplify, validate — in that order.

---

## Phase 1: Extract Build State (highest impact)

The `build-container.tsx` monster (1,654 lines, 20+ useState hooks) is the #1 problem.
Extract state into custom hooks so BuildContainer becomes a thin orchestrator (~400 lines).

- [x] **1.1 Create `useBuildState` hook**
  - Consolidate `buildState`, `setBuildState` and all mutation callbacks into a single hook using `useReducer`
  - Includes: `placeModInSlot`, `moveMod`, `handleRemoveMod`, `handleChangeRank`, `handleApplyForma`, `handleToggleReactor`, `handleClearBuild`, `handleHelminthAbilityChange`
  - Includes: `placeArcaneInSlot`, `moveArcane`, `handleRemoveArcane`, `handleChangeArcaneRank`
  - Includes: `handlePlaceShard`, `handleRemoveShard`
  - Derived state: `usedModNames`, `usedArcaneNames`, `arcaneDataMap`, capacity calculations
  - File: `src/components/build-editor/hooks/use-build-state.ts`

- [x] **1.2 Create `useBuildDragDrop` hook**
  - Extract: `activeDragItem`, `lastOverRef`, `sensors`, `dndContextId`
  - Extract: `handleDragStart`, `handleDragOver`, `handleDragEnd`, `handleDragCancel`
  - Depends on `useBuildState` for `placeModInSlot`, `moveMod`, etc.
  - File: `src/components/build-editor/hooks/use-build-drag-drop.ts`

- [x] **1.3 Create `useBuildPersistence` hook**
  - Extract: `buildId`, `buildSlug`, `buildName`, `saveStatus`, `saveError`, `publishDialogOpen`
  - Extract: `handlePublish`, `handleCancel`
  - Extract: localStorage auto-save/restore effects (debounced 300ms)
  - File: `src/components/build-editor/hooks/use-build-persistence.ts`

- [x] **1.4 Create `useBuildGuide` hook**
  - Extract: `guideSummary`, `guideDescription`
  - Extract: `partnerBuilds`, `availableBuilds`
  - Extract: `handleAddPartner`, `handleRemovePartner`
  - Extract: localStorage guide save/restore effect
  - Extract: fetch available builds effect
  - File: `src/components/build-editor/hooks/use-build-guide.ts`

- [x] **1.5 Create `useBuildUI` hook**
  - Extract: `activeSlotId`, `showCopied`, `isEditMode`, `hasMounted`
  - Extract: `handleSelectSlot`, `handleCopyBuild`
  - Derived: `canEdit`, `isAuthenticated` (from useSession)
  - File: `src/components/build-editor/hooks/use-build-ui.ts`

- [x] **1.6 Refactor `build-container.tsx` to use new hooks**
  - Replace all inline state with hook calls
  - BuildContainer becomes orchestrator: hooks + JSX layout only
  - Target: ~400-500 lines max
  - Verify all existing behavior is preserved (manual testing)

---

## Phase 2: Extract UI Sections from BuildContainer

After state is extracted, split the JSX into focused components.

- [x] **2.1 Extract `BuildEditorHeader` component**
  - The item card at top: image, name, category badge, stat badges, action buttons (save/cancel/copy/clear)
  - Currently lines ~1321-1451 in build-container.tsx
  - File: `src/components/build-editor/build-editor-header.tsx`

- [x] **2.2 Extract `BuildEditorSearchPanel` component**
  - Conditional rendering of ModSearchGrid vs ArcaneSearchPanel
  - Tab switching logic between mods and arcanes
  - Currently lines ~1512-1533
  - File: `src/components/build-editor/build-editor-search-panel.tsx`

- [x] **2.3 Extract `BuildEditorGuideSection` component**
  - Guide editor + guide reader rendering
  - Read-only vs edit mode conditional
  - Currently lines ~1535-1609
  - File: `src/components/build-editor/build-editor-guide-section.tsx`

- [x] **2.4 Update barrel exports**
  - Add new components to `src/components/build-editor/index.ts`

---

## Phase 3: Deduplicate Search Panels

`ModSearchGrid` (483 lines) and `ArcaneSearchPanel` (407 lines) share ~60% of their logic:
search input, rarity filter, sort, keyboard navigation, drag support.

- [x] **3.1 Extract `useSearchPanel` hook**
  - Shared: search state, deferred value, rarity filter, sort, keyboard navigation (arrow keys, enter, escape)
  - Parameterized for column count (mods = variable, arcanes = 2)
  - File: `src/components/build-editor/hooks/use-search-panel.ts`

- [x] **3.2 Simplify `ModSearchGrid`**
  - Use `useSearchPanel` for shared logic
  - Keep mod-specific: alias expansion, polarity filter, `getModSearchableStats`
  - Target: ~250 lines

- [x] **3.3 Simplify `ArcaneSearchPanel`**
  - Use `useSearchPanel` for shared logic
  - Keep arcane-specific: duplicate prevention, 2-column layout
  - Target: ~200 lines

---

## Phase 4: Standardize Error Handling

Currently mixed: some files throw, some return `{ success, error }`, some swallow errors.

- [x] **4.1 Define a standard Result type**
  - Create `src/lib/result.ts` with `type Result<T> = { success: true, data: T } | { success: false, error: string }`
  - Use this everywhere instead of ad-hoc `{ success: boolean, error?: string }` shapes

- [x] **4.2 Update server actions to use Result type**
  - `src/app/actions/builds.ts` — saveBuildAction, deleteBuildAction, forkBuildAction, updateBuildGuideAction
  - `src/app/actions/social.ts` — toggleVoteAction, toggleFavoriteAction

- [x] **4.3 Add error boundaries**
  - Add `error.tsx` files for key route segments: `app/builds/[slug]/error.tsx`, `app/browse/error.tsx`
  - Catch rendering errors gracefully instead of blank pages

- [x] **4.4 Replace TODO error toasts with actual error UI**
  - `src/components/build/build-guide-section.tsx:103` — implement error toast
  - Any other silent `console.error` calls that should surface to user

---

## Phase 5: Validate Database JSON Fields

Prisma `Json` fields are cast with `as unknown as T` — no runtime validation.

- [x] **5.1 Add Zod schemas for JSON fields**
  - `BuildStateSchema` — validates buildData stored in builds table
  - `ModDataSchema` — validates mod JSON data
  - `ArcaneDataSchema` — validates arcane JSON data
  - File: `src/lib/warframe/schemas.ts`

- [x] **5.2 Add validation at database boundaries**
  - `src/lib/db/builds.ts` — validate buildData on read and write
  - `src/lib/db/mods.ts` — validate mod data on read
  - `src/lib/db/items.ts` — validate item data on read
  - Use `.safeParse()` so invalid data logs warnings instead of crashing

---

## Phase 6: Complete or Cut Stubbed Features

- [x] **6.1 Fork build feature** — `forkBuildAction()` in `src/app/actions/builds.ts:179`
  - Decision: cut — no UI references it, stub already returns clear error
  - Kept as documented placeholder for future Sprint 4

- [x] **6.2 Shard detection** — `src/lib/db/builds.ts:281`
  - Added `detectHasShards()` helper that checks `shardSlots` for non-null entries
  - Applied in both create and update paths

- [x] **6.3 Guide author** — `src/lib/guides/data.ts:176`
  - Added `authorName`/`authorAvatar` optional fields to `GuideInput`
  - `createGuide` now uses input author with "Anonymous" fallback

---

## Phase 7: Reduce Client Component Count

74 files have `"use client"` — some may not need it.

- [x] **7.1 Audit `"use client"` directives**
  - Audited all 54 non-shadcn client components
  - Identified 9 safe candidates with zero hooks, events, or browser APIs

- [x] **7.2 Convert eligible components to server components**
  - Removed `"use client"` from 9 components:
    - `partner-builds-section.tsx`, `item-card.tsx`, `header.tsx`, `mod-card-frame.tsx`
    - `featured-guides.tsx`, `guide-breadcrumbs.tsx`, `related-guides.tsx`, `guide-card.tsx`, `guide-header.tsx`
  - Kept `theme-provider.tsx` (next-themes context), `guide-reader.tsx` (rehype-highlight), `guide-sidebar.tsx` (usePathname)

---

## Phase 8: Split Domain Logic (Nice to Have)

`stats-calculator.ts` (953 lines) works but is dense. Already well-tested.

- [x] **8.1 Split stats-calculator.ts**
  - `src/lib/warframe/stats/warframe-stats.ts` — warframe-specific calculations
  - `src/lib/warframe/stats/weapon-stats.ts` — weapon-specific calculations
  - `src/lib/warframe/stats/stat-engine.ts` — shared utilities (getAllPlacedMods, countUmbralMods, getStatValue, sumDamageTypes, buildHasConditionalMods)
  - `src/lib/warframe/stats/index.ts` — entry point with calculateStats + re-exports
  - All imports updated (index.ts barrel, use-calculated-stats hook, test file)

- [ ] **8.2 Split capacity.ts (422 lines)**
  - Only if it gets more complex — currently manageable
  - Low priority

---

## Done Criteria

Each phase is independent and can be merged separately. The codebase is "refactored" when:

1. `build-container.tsx` is under 500 lines
2. Build state lives in a `useReducer`-based hook
3. No `as unknown as T` casts on database JSON without validation
4. Error handling follows a single consistent pattern
5. Stubbed features are either implemented or removed
6. No `w-N h-N` when `size-N` works, no `space-y-*`, no raw colors
7. All icons inside Buttons use `data-icon`, no manual sizing
8. `CommunityBuildsSection` wrapped in Suspense, barrel imports replaced with direct imports
9. `BuildContainer` dynamically imported, serialization minimized

---

## Phase 9: shadcn/ui Best Practices

Audit found violations across styling, composition, and forms.

### Styling Fixes

- [x] **9.1 Replace `w-N h-N` with `size-N` where equal**
  - ~40 replacements across 21 files (build-editor, mod-card, browse, builds pages)
  - Skipped responsive variants (`md:w-24 md:h-24`) and mismatched sizes

- [x] **9.2 Replace `space-y-*` / `space-x-*` with `flex flex-col gap-*` / `flex gap-*`**
  - All `space-y-*` replaced across 33 files; no `space-x-*` instances found

- [x] **9.3 Replace raw color values with semantic tokens**
  - Added `--positive` and `--warning` CSS custom properties to `globals.css` (light + dark)
  - `text-red-500` → `text-destructive`, `fill-red-500` → `fill-destructive`
  - `text-green-500/600` → `text-positive`, `text-yellow-500` → `text-warning`
  - Left `mod-card.tsx` gray colors (domain-specific dark card background) and `damage-breakdown.tsx` (14 game damage type colors) as-is

- [x] **9.4 Remove manual `dark:` overrides**
  - `guide-editor.tsx` — `text-green-600 dark:text-green-400` → `text-positive`
  - `theme-toggle.tsx` dark: overrides left as-is (acceptable per plan)

### Composition Fixes

- [x] **9.5 Add `data-icon` to icons inside Buttons**
  - Added `data-icon="inline-start"` and removed manual sizing in 6 text+icon buttons
  - Removed manual sizing from 3 icon-only buttons (`size="icon"`)
  - Left `theme-toggle.tsx` as-is (complex transition animation requires sizing classes)

- [x] **9.6 Replace custom empty state divs with `Alert` component**
  - Installed `@shadcn/alert` component
  - `partner-build-selector.tsx` and `partner-builds-section.tsx` converted to `Alert`

- [x] **9.7 Standardize loading button pattern**
  - `publish-dialog.tsx` — Loader2 now uses `data-icon="inline-start"`, removed `mr-2 h-4 w-4`

### Form Fixes

- [x] **9.8 Install missing form components**
  - Installed `@shadcn/field` and `@shadcn/spinner`

- [x] **9.9 Replace manual button toggles with `ToggleGroup`** — DEFERRED
  - Filter toggles are independent boolean toggles with different URL params — not a selection group
  - Visibility selector is a rich card layout with icons/descriptions — not suitable for ToggleGroup
  - Current patterns work correctly; conversion would add complexity

- [x] **9.10 Wrap form layouts in `Field` + `FieldGroup`** — DEFERRED
  - Forms work correctly without validation states
  - Field component's key benefit (data-invalid) not needed yet
  - Will apply when form validation is added

---

## Phase 10: Vercel/React Performance Best Practices

### Critical: Waterfalls & Suspense

- [x] **10.1 Add Suspense boundary around `CommunityBuildsSection`**
  - Wrapped in `<Suspense fallback={<CommunityBuildsSkeleton />}>` with grid skeleton
  - Async component no longer blocks full page render

- [x] **10.2 Add Suspense fallbacks where missing**
  - `guides/[slug]/page.tsx` — added `fallback={null}` to Suspense around RelatedGuides
  - `guides/page.tsx` — removed unnecessary Suspense (data is synchronous, no useSearchParams)

- [x] **10.3 Parallelize independent fetches in build page** — N/A
  - `getFullItem`, `getModsForItem`, `getCategoryConfig`, `getArcanesForSlot` are all synchronous
  - They read from Node.js fs / static data — `Promise.all()` provides no benefit

### Critical: Bundle Size

- [x] **10.4 Replace barrel imports with direct imports**
  - `browse/page.tsx` → direct imports from `browse-container` and `keyboard-handler`
  - `build-container.tsx` → direct imports from `mod-card/mod-card` and `arcane-card/arcane-card`
  - `mod-grid.tsx`, `searchable-mod-card.tsx`, `arcane-slot-card.tsx`, `arcane-search-panel.tsx` — all updated
  - `guides/[slug]/page.tsx` → direct imports for all guide components

- [x] **10.5 Dynamic import `BuildContainer`** — ALREADY HANDLED
  - `BuildContainer` has `"use client"` which creates a separate chunk in RSC
  - Both pages already wrap it in `<Suspense>` — code-splitting is already in effect
  - `next/dynamic` would add unnecessary client-side loading on top of server Suspense

- [x] **10.6 Lazy-load `DescriptionEditor`**
  - Used `next/dynamic` with `ssr: false` in `guide-editor.tsx`
  - Lexical editor bundle only loads when guide editor is opened

### High: Server Serialization

- [x] **10.7 Minimize props passed to `BuildContainer`** — ALREADY MINIMAL
  - `initialPartnerBuilds` already maps to `{ id, slug, name, item, buildData: { formaCount } }`
  - `compatibleMods` needs full `Mod[]` with `levelStats` for stat calculations — trimming requires on-demand fetch architecture (deferred to future sprint)

- [x] **10.8 Minimize props in browse page** — ALREADY MINIMAL
  - `getItemsByCategory` returns `BrowseItem[]` which only has: `uniqueName`, `name`, `slug`, `category`, `imageName`, `masteryReq`, `isPrime`, `vaulted`, `type`, `releaseDate`

### Medium: Re-render & JS Performance

- [x] **10.9 Convert `usedModNames` and `usedArcaneNames` to `Set`**
  - Changed from `string[]` to `Set<string>` in `use-build-state.ts`
  - Updated `build-editor-search-panel.tsx`, `mod-search-grid.tsx`, `arcane-search-panel.tsx` to use `.has()` instead of `.includes()`
  - O(1) lookups instead of O(n) for 100+ cards per render

- [x] **10.10 Pre-build mod family reverse Map**
  - Built `Map<string, string>` at module init from `MOD_FAMILIES`
  - `getModFamily()` now does O(1) Map lookup instead of looping through all families

- [x] **10.11 Replace inline style objects with CSS classes**
  - `searchable-mod-card.tsx` — removed `style={{ opacity }}`, uses `cn(isDragging && "opacity-0")`
  - `arcane-search-panel.tsx` — same pattern for SearchableArcaneCard
  - `mod-grid.tsx` — moved `opacity` and `willChange` to className, kept `transform` inline (dnd-kit requirement)

- [x] **10.12 Add `content-visibility: auto` to search grids**
  - Added `.search-grid-item` CSS class to `globals.css` with `content-visibility: auto` and `contain-intrinsic-size`
  - Applied class to `SearchableModCard` and `SearchableArcaneCard` wrappers

---

## What We're NOT Doing

- Not switching from Prisma to Drizzle (Prisma 7.3 is current, the problems aren't in the ORM)
- Not adding a global state library (custom hooks with useReducer is sufficient for this app's complexity)
- Not rewriting from scratch (the foundation is solid)
- Not adding full test coverage yet (that's a separate initiative after refactoring stabilizes)
- Not upgrading Next.js (already on 16, which is current)
