# Arsenyx migration inventory

Light inventory of what needs to cross from `legacy/` → `apps/` + `packages/`. Not a spec — a map. Gets ticked off as slices land.

## Pages (23)

**Public read:**
- [x] `/` — home
- [x] `/browse` — browse categories
- [ ] `/browse/[category]/[slug]` — browse items
- [ ] `/builds` — builds list
- [ ] `/builds/[slug]` — build view
- [ ] `/profile/[username]`
- [ ] `/org/[slug]`
- [x] `/changelog`
- [x] `/about`
- [x] `/privacy`
- [x] `/terms`

**Auth:**
- [ ] `/auth/signin`
- [ ] `/auth/error`

**Authoring (auth-required):**
- [ ] `/create`
- [ ] `/builds/mine`
- [ ] `/favorites`
- [ ] `/import`
- [ ] `/settings`
- [ ] `/org/[slug]/settings`
- [ ] `/admin`

## API routes (8)

- [ ] `/api/auth/[...all]` — Better Auth catch-all
- [ ] `/api/search` — item/build search
- [ ] `/api/import/overframe` — internal import trigger
- [ ] `/api/builds/[slug]/image` — OG image (Satori)
- [ ] `/api/builds/[slug]/screenshot` — Playwright screenshot **(moves to separate Fly service)**
- [ ] `/api/v1/builds` — public API
- [ ] `/api/v1/builds/[slug]` — public API
- [ ] `/api/v1/imports/overframe` — public import

## Server actions → Hono routes (~30)

**builds.ts:** save, delete, fork, incrementView, updateGuide, getUserBuildsForPartnerSelector
**social.ts:** toggleVote, toggleFavorite, getSocialStatus
**profile.ts:** update, getProfileBuilds, getOrgBuilds, getSettingsData
**organizations.ts:** create, update, delete, addMember, removeMember, updateMemberRole, getUserOrganizations, getOrganizationSettings
**admin.ts:** updateUserRole, banUser, unbanUser, deleteUser, deleteBuild, deleteOrganization
**api-keys.ts:** list, create, revoke

## Key libs to port / share

**Framework-free → `packages/shared`:**
- `build-codec.ts` — build serialization
- `warframe/*` — game data loaders (Maps from static JSON)
- `constants.ts`, `types.ts`, `result.ts`
- `overframe/*` — import parser

**Backend-only → `apps/api`:**
- `db.ts`, `db/*` — Prisma singleton and query helpers
- `auth.ts`, `auth-helpers.ts` — Better Auth setup (new: Hono middleware)
- `rate-limit.ts`, `lru-cache.ts`
- `screenshot.ts` → lives on separate Fly service
- `image/*` — Satori OG images

**Frontend-only → `apps/web`:**
- `auth-client.ts` — Better Auth React client
- All components from `src/components/`
- All hooks

## External pieces

- [ ] Postgres (Neon EU for prod, Docker local)
- [ ] Better Auth (GitHub OAuth, Hono middleware)
- [ ] Prisma (moves to apps/api, schema stays identical)
- [x] shadcn/ui (install in apps/web, copy components from legacy/src/components/ui)
- [x] Tailwind v4 (CSS-first config in apps/web)
- [ ] Deploy: CF Pages (web) + CF Workers (api) + Fly (screenshot) + Neon (db)

## Shape of each slice

Every vertical slice follows the same template — we define the template in slice 1 and reuse it:

1. **Shared types** in `packages/shared` (Zod schema + inferred types)
2. **Hono route** in `apps/api` with auth guard (if needed), DB query, typed response
3. **Typed client call** from `apps/web` using Hono `hc`
4. **Route + loader** in `apps/web` with TanStack Router + Query
5. **Component** rendering the data
6. **Verify:** can load the page, data matches legacy, nav feels snappy
