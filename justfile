set dotenv-load := true
set shell := ["pwsh", "-NoLogo", "-Command"]

# Run legacy Next.js app (while migration is in progress).
legacy:
    docker compose up -d postgres
    Push-Location legacy; bun run dev

# Run legacy app without starting Docker Postgres (for low-power machines).
legacy-nodb:
    Push-Location legacy; bun run dev

# Run new Vite SPA + Hono API in parallel.
dev:
    docker compose up -d postgres
    Start-Process -NoNewWindow -WorkingDirectory apps/api -FilePath bun -ArgumentList 'run','dev'
    Push-Location apps/web; bun run dev

# Run new web + api without Docker (for low-power machines).
dev-nodb:
    Start-Process -NoNewWindow -WorkingDirectory apps/api -FilePath bun -ArgumentList 'run','dev'
    Push-Location apps/web; bun run dev

# Run only the new web frontend.
web:
    Push-Location apps/web; bun run dev

# Regenerate the slim items index (static asset consumed by /browse).
build-items-index:
    Push-Location legacy; bun run scripts/build-items-index.ts

# Run only the new Hono API.
api:
    Push-Location apps/api; bun run dev

# First-run setup for a fresh clone.
setup:
    bun install
    docker compose up -d postgres
    Push-Location legacy; bun run db:push
    Push-Location legacy; bun run sync-data

# Update game data and reset DB (runs in legacy for now).
reset:
    Push-Location legacy; bun run update-data
    cd legacy; bunx prisma db push --force-reset
    Get-Content legacy/scripts/setup-search.sql | docker compose exec -T postgres psql -U arsenyx arsenyx

# Lint, format, test (legacy only for now).
check:
    Push-Location legacy; bun run lint
    Push-Location legacy; bun run fmt:check
    Push-Location legacy; bun run test
