# Arsenyx Codebase Analysis (local workspace)

Date: 2025-12-16

## Git state (what I could verify locally)

- Branch: `master`
- Local HEAD: `278f068` (`feat: introduce Warframe build editor with item types, mod slots, and drag-and-drop support`)
- Working tree: **many modified files** (not clean).
- Remote update check: **not performed** (network access is restricted in this environment and requires explicit approval).

If you want me to verify you’re on the latest remote commit, approve running `git fetch origin` and then I’ll confirm whether `master` is behind/ahead and can fast-forward if desired.

---

## High-level architecture

- Framework: Next.js 16 App Router + React 19 + Tailwind v4 + shadcn/ui.
- Data: WFCD JSON copied into `src/data/warframe/*.json` via `scripts/sync-warframe-data.ts`.
- Server utilities:
  - `src/lib/warframe/items.ts`: imports large item JSONs and precomputes caches (category lists, slug lookup, uniqueName lookup).
  - `src/lib/warframe/mods.ts`: imports `Mods.json` + `Arcanes.json`, normalizes/filter mods, exposes queries.
- Build editor:
  - Server page `src/app/create/page.tsx` loads `compatibleMods` and passes them to client component `src/components/build-editor/build-container.tsx`.
  - Client-side build state stored in React state and persisted to `localStorage`.
  - Share links use `src/lib/build-codec.ts` (base64 JSON of placed mod uniqueName + rank + slot polarities).

---

## “Dynamic mods” in this codebase (what it is today)

Right now, “mods” are treated as:

- **Data objects** from WFCD (`Mod`), plus a smaller “placed” subset (`PlacedMod`) stored in `BuildState`.
- **Slotting rules** are currently limited to:
  - Aura restriction: only aura mods in aura slot (drag restriction enforced in `BuildContainer` and UI disabled state in `ModGrid`).
  - Exilus restriction: only `isExilus` mods in exilus slot.
  - Duplicate prevention: mostly by uniqueName/name; `canAddModToBuild()` / `getModFamily()` exist in `src/lib/warframe/mods.ts` but are not wired into the editor.
- **Stat effects**: not implemented yet.
  - `src/components/build-editor/item-sidebar.tsx` displays Ability stats as static `100%` (Duration/Efficiency/Range/Strength).
  - Capacity math is implemented (`src/lib/warframe/capacity.ts`) and wired into the editor.

This matters because switching UI stacks won’t make the hard part (parsing/applying `mod.levelStats[].stats[]`) easier; you’ll still need a clear stats engine.

---

## Biggest correctness/performance risks (actionable)

### 1) Client bundle bloat risk: importing server-only module in client component

`src/components/build-editor/build-container.tsx` is a `"use client"` component and imports:

- `normalizePolarity` from `src/lib/warframe/mods.ts`

But `src/lib/warframe/mods.ts` imports:

- `src/data/warframe/Mods.json` (~6.6MB)
- `src/data/warframe/Arcanes.json` (~481KB)

Depending on how Next traces module dependencies, this is a serious risk of pulling those JSON blobs into the client bundle (or at least into the compilation graph), even if you only use `normalizePolarity`.

**Fix direction:** split pure helpers (like `normalizePolarity`) into a client-safe module (no JSON imports), and make `mods.ts` explicitly server-only (`import "server-only"`).

### 2) Over-sending data to the browser: full mod objects passed from server to client

`src/app/create/page.tsx` loads `compatibleMods = getModsForCategory(category)` and passes them to `<BuildContainer compatibleMods={compatibleMods} />`.

Even though TypeScript types list only certain fields, the runtime objects still contain whatever WFCD JSON includes. That means the RSC payload can be much larger than it looks on the type surface.

**Fix direction:** map mods to a minimal DTO before passing to client components (only fields the editor/search needs), e.g.:

- `uniqueName`, `name`, `imageName`, `polarity`, `rarity`, `baseDrain`, `fusionLimit`, `compatName`, `type`, `isExilus`, `levelStats`, `modSet`, `modSetStats`

And consider whether `levelStats` (often large) is needed client-side up front, or only on “details hover”.

### 3) Mod compatibility is currently coarse

`getModsForCategory("primary")` returns both Rifle + Shotgun, rather than being specific to the selected weapon subtype. That might be intentional for early UX, but it’s a source of “why can I slot this?” confusion later.

**Fix direction:** when you’re ready, make compatibility depend on item subtype (weapon type/stance/etc), not only the browse category.

---

## Should you rewrite for the “new shadcn stack”?

Based on this codebase, a rewrite is unlikely to pay off **right now** because:

- Your core complexity is domain logic + data boundaries, not component library.
- You’re already on a modern baseline (Next App Router, React 19, Tailwind v4, shadcn/ui).
- The most urgent problems look like **data shipping / module boundaries**, which are fixable with surgical refactors.

### When a rewrite *would* be justified

Only if you can name hard blockers that incremental refactors won’t solve, like:

- You need a fundamentally different routing/data model (e.g., you must move away from Next RSC entirely).
- Your “mods system” needs third-party plugin loading with sandboxing and you’ve chosen a model that can’t support it.
- You have structural constraints (auth/db/SSR caching model) that are incompatible with current organization.

---

## Recommended next steps (lowest risk → highest leverage)

1) **Fix server/client boundaries**
   - Extract `normalizePolarity` (and any other pure helpers) into `src/lib/warframe/polarity.ts` (or similar), import it from both server and client modules.
   - Add `import "server-only"` to `src/lib/warframe/mods.ts` and `src/lib/warframe/items.ts`.

2) **Stop passing giant objects to client components**
   - Create a `toClientMod()` mapping in `src/app/create/page.tsx` (or a shared server-only mapper) and only pass the minimal fields.

3) **Define a real “dynamic mods” architecture**
   - Parse WFCD `levelStats[].stats[]` strings into structured modifiers.
   - Apply them to a canonical stat model (`strength`, `range`, `duration`, `efficiency`, plus weapon stats later).
   - Keep this engine separate from UI so you can test it and iterate without rewiring components.

If you want, I can implement (1) and (2) in code next; they’re contained changes and will directly improve perceived performance and maintainability.

