# Arsenyx — Warframe Build Planner

Create, share, and discover Warframe equipment builds. Live at [www.arsenyx.com](https://www.arsenyx.com).

## Stack

- **Web** — Vite + React 19 + TanStack Router + Tailwind v4 + shadcn/ui → Cloudflare Pages
- **API** — Hono + Prisma 7 + Better Auth on Cloudflare Workers (workerd) → `api.arsenyx.com`
- **DB** — Neon Postgres (`eu-central-1`)
- **Screenshot service** — standalone Playwright worker on homelab Docker
- **Data source** — `@wfcd/items`, precomputed to static JSON at build time

Bun workspaces. Never use npm/npx.

## Layout

- [apps/web/](apps/web/) — frontend SPA
- [apps/api/](apps/api/) — Hono API on Workers
- [packages/shared/](packages/shared/) — types and codecs shared by web + api
- [services/screenshot/](services/screenshot/) — Playwright screenshot service

Game data is static (served from `apps/web/public/data/`), user data is dynamic (Postgres via the API).

## Development

```bash
bun install
just setup   # first run — pushes schema to the Neon branch in apps/api/.env
just dev     # runs web (5173) + api (8787)
```

See the [justfile](justfile) for the full command list, or [docs/commands.md](docs/commands.md) for build/db/data details.

## Agent docs

- [CLAUDE.md](CLAUDE.md) — project overview and boundaries
- [apps/web/CLAUDE.md](apps/web/CLAUDE.md), [apps/api/CLAUDE.md](apps/api/CLAUDE.md) — per-app guidance
- [TODO.md](TODO.md) — open work

## Build Upload API

Arsenyx supports bearer-token build publishing for automation.

1. Sign in, open the user menu, go to `Settings`.
2. Create a personal access token with the `build:write` scope.
3. Send it as `Authorization: Bearer <token>`.

### Endpoints

- `POST /api/v1/builds`
- `PUT /api/v1/builds/:slug`
- `POST /api/v1/imports/overframe`

### Request format

`POST /api/v1/builds` and `PUT /api/v1/builds/:slug` accept a thin JSON payload:

```json
{
  "name": "Rhino Tank",
  "visibility": "PUBLIC",
  "itemUniqueName": "/Lotus/Powersuits/Rhino/Rhino",
  "itemCategory": "warframes",
  "organizationSlug": null,
  "guide": {
    "summary": "Optional short summary",
    "description": "Optional markdown guide"
  },
  "partnerBuildSlugs": [],
  "build": {
    "hasReactor": true,
    "slots": [
      {
        "slotId": "aura-0",
        "mod": {
          "uniqueName": "/Lotus/Upgrades/Mods/Aura/SteelCharge",
          "rank": 5
        }
      }
    ],
    "arcanes": [],
    "shards": [],
    "helminthAbility": null
  }
}
```

The server resolves canonical item/mod/arcane/shard data, recomputes derived capacity and forma fields, and rejects invalid writes with structured `4xx` JSON errors.

### Overframe save endpoint

`POST /api/v1/imports/overframe` accepts:

```json
{
  "url": "https://overframe.gg/build/935570/",
  "visibility": "PUBLIC",
  "organizationSlug": null,
  "nameOverride": "Optional custom title",
  "description": "Optional build description",
  "guide": {
    "summary": "Optional short summary",
    "description": "Optional markdown guide"
  },
  "partnerBuildSlugs": []
}
```

If `nameOverride`, `description`, or `guide` fields are omitted, the importer preserves Overframe metadata when available: the Overframe title becomes the build name, the page description becomes the build description/guide summary, and the Overframe guide markdown becomes the guide body. Imported Overframe guide newlines are stored as Markdown hard breaks so line-oriented text keeps its layout. Explicit `null` overrides still clear nullable fields. The response returns the created build plus any import warnings.
