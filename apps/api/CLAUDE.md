# CLAUDE.md — apps/api

Hono backend on Bun. Better Auth + Prisma 7 (PrismaPg adapter) + Postgres. Serves user data only — game data (items, mods, arcanes) is static JSON under `apps/web/public/data/`, not this API.

## Layout

```
src/
  index.ts            # Hono app entry (CORS, mounts, /health) — listens on :8787
  auth.ts             # Better Auth config (GitHub OAuth, username plugin)
  db.ts               # Prisma singleton with PrismaPg adapter
  env.ts              # shared env parsing (webOrigins, etc.)
  routes/
    builds.ts         # GET/POST/PATCH /builds, visibility checks, votes, favorites
    users.ts          # GET /users/:username (profiles, paginated builds)
    imports.ts        # POST /imports/overframe (scraper + ID resolution)
    _build-list.ts    # shared list query helper (paginated + filtered build queries)
  lib/
    overframe/        # Overframe import pipeline (scrape → decode → normalize → match)
  generated/          # Prisma client output (gitignored)
prisma/
  schema.prisma       # single source of truth — push with `bun run db:push`
prisma.config.ts      # Prisma 7 datasource config (loads .env via dotenv)
```

## Run

- `just api` (or `bun --cwd apps/api run dev`) — hot-reload on :8787
- `just dev` — web + api together
- `bun run db:push` (from `apps/api/`) — push schema without migrations (dev flow)
- `bun run db:studio` — Prisma Studio GUI

## Environment

`.env` is the only env source. Required keys (see `.env.example`):

- `DATABASE_URL` — Postgres connection string (local Docker `arsenyx` DB or Neon)
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `BETTER_AUTH_URL` — `http://localhost:8787` in dev
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — from the dev OAuth app
- `WEB_ORIGIN` — comma-separated trusted origins for CORS and Better Auth

**Prod has its own env.** Same var names, different values injected by the host (Cloudflare/Fly secrets). Don't branch on `NODE_ENV` in code to pick between dev/prod credentials — the env itself does that.

## Prisma conventions

- Schema lives at `apps/api/prisma/schema.prisma` — a single file, not per-domain splits.
- Prisma 7: datasource `url` goes in `prisma.config.ts`, not the schema.
- Generator output is `../src/generated/prisma` (gitignored). Imports use relative paths: `import { Prisma } from "../generated/prisma/client"`.
- `db.ts` uses `PrismaPg` adapter with `max: 3` — appropriate for Neon's pooler and scale-to-zero.
- **Dev workflow: `db:push`, never `migrate`.** Migrations are deferred until prod.

## Auth conventions

- Better Auth mounted at `/auth/*` via `app.all("/auth/*", (c) => auth.handler(c.req.raw))`.
- Session check in route handlers: `await auth.api.getSession({ headers: c.req.raw.headers })`.
- `trustedOrigins` comes from `WEB_ORIGIN` (comma-separated). Same list feeds Hono CORS.
- Cookies are same-site `lax` + `secure` in prod. Cross-subdomain is off — the deploy plan is same-origin (SPA + `/api/*` on one domain), so no cross-domain cookie gymnastics.

## Route conventions

- Each domain is a sub-`Hono()` app exported from `src/routes/<name>.ts`, mounted via `app.route("/<name>", sub)` in `index.ts`.
- Files prefixed with `_` (e.g. `_build-list.ts`) are shared helpers, not mounted.
- Build list queries (`/builds`, `/users/:username`, `/favorites`) share `_build-list.ts` — don't hand-roll a new list query, extend `parseListQuery` / `runList`.
- Visibility enforcement for builds is centralised in `builds.ts` — owner sees all, org members see org builds, public/unlisted to anyone with the slug, private blocked.
- Slug generation uses `nanoid` with a URL-safe alphabet (no `0/O/1/l/I`).

## Shared code

Cross-cut types (warframe categories, build codecs) live in `packages/shared` and are imported via `@arsenyx/shared/*`. If you add a type that both `apps/web` and `apps/api` need, put it in `packages/shared` — don't duplicate.

## Boundaries

### Always

- Run `bunx tsc --noEmit` (from `apps/api/`) before claiming work is done.
- Regenerate the Prisma client after schema changes: `bun run db:generate` (or just `db:push`, which implies generate).
- Use `bun` / `bunx`, never `npm` / `npx`.

### Never

- Import `apps/web/*` or `legacy/*` into `apps/api` — only `@arsenyx/shared` is shared.
- Commit `src/generated/` — gitignored at both repo root and `apps/api/.gitignore`.
- Branch on `NODE_ENV` to pick OAuth credentials or DB URLs. Use env vars; the host provides them.
- Hand-roll a build list query — use `_build-list.ts`.

## Reference Docs

- [../../CLAUDE.md](../../CLAUDE.md) — monorepo-level rules
- [../web/CLAUDE.md](../web/CLAUDE.md) — web conventions (router, shadcn)
- [prisma/schema.prisma](prisma/schema.prisma) — data model
