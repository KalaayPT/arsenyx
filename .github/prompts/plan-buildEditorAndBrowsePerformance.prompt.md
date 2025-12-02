# Plan: Scaffold `/create` Build Editor + Fix Browse Tab Performance

Create the build editor page with keyboard-first mod slot navigation, base64 build encoding, immediate-filter mod search, duplicate prevention via mod families, and accurate capacity calculation including forma polarities and aura bonuses. Fix browse category switching with optimistic UI and lazy caching.

## Steps

1. **Add Mods/Arcanes data** — Update [`scripts/sync-warframe-data.ts`](c:\Users\Nick\Desktop\arsenix\arsenix\scripts\sync-warframe-data.ts) to include `Mods.json` and `Arcanes.json`, add `Mod` and `Arcane` interfaces to [`types.ts`](c:\Users\Nick\Desktop\arsenix\arsenix\src\lib\warframe\types.ts), create `src/lib/warframe/mods.ts` with `getAllMods()`, `getModsByCompatibility(category)`, `getModFamily(mod)`

2. **Add UI components** — Run `npx shadcn@latest add dialog command tooltip toggle -y`

3. **Create build state types** — Add to [`types.ts`](c:\Users\Nick\Desktop\arsenix\arsenix\src\lib\warframe\types.ts): `BuildState`, `ModSlot` (type + innate polarity + forma'd polarity), `PlacedMod`, `Polarity` enum (`vazarin`, `naramon`, `madurai`, `zenurik`, `unairu`, `penjaga`, `umbra`)

4. **Create build encoding utilities** — Add `src/lib/build-codec.ts` with `encodeBuild(state): string` and `decodeBuild(base64): BuildState`

5. **Create capacity calculation utility** — Add `src/lib/warframe/capacity.ts`:
   - `calculateModDrain(mod, slotPolarity, modPolarity)`: matching = `floor(drain / 2)`, mismatched = `ceil(drain * 1.25)`, neutral = base
   - `calculateAuraBonus(auraMod, auraSlotPolarity)`: matching = `mod.drain * 2`, mismatched = `floor(mod.drain / 2)`, neutral = base drain as bonus
   - `calculateTotalCapacity(build)`: base 30 (or 60 with reactor) + aura bonus − sum of mod drains

6. **Create `/create` page** — Add [`src/app/create/page.tsx`](c:\Users\Nick\Desktop\arsenix\arsenix\src\app\create\page.tsx) Server Component parsing `?item=slug&category=warframes` or `?draft=base64`, loads item, generates metadata

7. **Create `src/components/build-editor/` components**:
   - `build-container.tsx` — Client container with build state, active slot, localStorage auto-save, capacity tracking
   - `item-sidebar.tsx` — Left: item image, reactor/catalyst toggle, stats, capacity bar (current/max, red when negative), ability icons
   - `mod-grid.tsx` — Center: aura + exilus top row, 8 normal slots (2×4), arcane slots, Mods/Shards tabs, per-slot forma/polarity picker
   - `mod-slot.tsx` — Empty/filled states, polarity indicator (shows forma'd if changed), individual drain display, focus ring
   - `mod-search-panel.tsx` — Right: immediate-filter search, Name/Rarity/Polarity dropdowns, scrollable mod list, family duplicates grayed
   - `mod-card.tsx` — Thumbnail, name, rarity border color, disabled state
   - `use-build-keyboard.ts` — Arrow keys navigate, Enter opens search, Escape closes, placement auto-advances

8. **Implement mod family duplicate prevention** — `getModFamily(mod)` in `mods.ts` using WFCD data. Search panel filters/grays mods with family already in build

9. **Add build import/export UI** — "Copy Build" encodes to base64 URL, "Import Build" decodes pasted URL/string

10. **Fix browse tab performance** — Refactor [`browse-container.tsx`](c:\Users\Nick\Desktop\arsenix\arsenix\src\components\browse\browse-container.tsx):
    - Local `activeCategory` + `categoryCache` state
    - Instant tab switch with skeleton, background fetch if uncached
    - URL syncs after load, initial category pre-loaded from server
