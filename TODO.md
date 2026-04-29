# TODO

## Cloudflare Pages → Workers cutover (web)

Code is migrated; the dashboard moves are manual. Order matters — domains can only be attached to one product at a time.

- [ ] First-time deploy: `cd apps/web && bun run deploy` (creates the `arsenyx-web` Worker; will fail to attach `www.arsenyx.com` / `arsenyx.com` while Pages still owns them — that's expected).
- [ ] In the CF dashboard: Pages → `arsenyx` project → **Custom Domains** → remove `www.arsenyx.com` and `arsenyx.com`.
- [ ] Workers → `arsenyx-web` → **Triggers** → add both custom domains. (Or re-run `bun run deploy` once Pages has released them.)
- [ ] Verify: `curl -I https://www.arsenyx.com` returns the `_headers` cache rules, and a deep link like `https://www.arsenyx.com/browse/warframes` returns 200 with `index.html` (SPA fallback).
- [ ] Set up **Workers Builds** for `arsenyx-web` (CF dashboard → Workers → arsenyx-web → Settings → Builds → Connect repo, root dir `apps/web`, build command `bun run build`). Disable the Pages project's git integration to stop double-deploys.
- [ ] Once stable for ~a week: delete the Pages project entirely.

## Bugs

- [ ] Add riven mod support to Overframe import
- [ ] Kuva/Tenet/Coda bonus element — flow selected element into `calculateWeaponStats` so picking one actually changes the damage numbers (dropdown + codec already wired; see [apps/web/src/lib/stats/weapon.ts](apps/web/src/lib/stats/weapon.ts))
- [ ] Check exalted weapons

## Incarnon

- [ ] **Conditional damage math for incarnon perks** — picked perks (and Incarnon Form alt-fire mode) feed into stat calculations. Most perks are conditional triggers (on-headshot, on-reload, etc.), so this lands with the broader conditional-damage rework. See [apps/web/src/lib/stats/weapon.ts](apps/web/src/lib/stats/weapon.ts) and [packages/shared/src/warframe/incarnon-data.ts](packages/shared/src/warframe/incarnon-data.ts).
- [ ] **`hasIncarnon` flag on builds + filter** — add `hasIncarnon Boolean` column to the `Build` model (mirrors `hasShards`/`hasGuide`), populate in [apps/api/src/routes/builds.ts](apps/api/src/routes/builds.ts) on create/update from `buildData.incarnonEnabled`, add filter param in [apps/api/src/routes/_build-list.ts](apps/api/src/routes/_build-list.ts), then expose in [apps/web/src/lib/builds-list-query.ts](apps/web/src/lib/builds-list-query.ts) and add a "Has Incarnon" filter chip + a small badge on [apps/web/src/components/builds/build-card.tsx](apps/web/src/components/builds/build-card.tsx).
