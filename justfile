set dotenv-load := true
set positional-arguments := true
set shell := ["pwsh", "-NoLogo", "-Command"]

default:
    just --list

help:
    just --list

# Install dependencies and generate the Prisma client.
install:
    bun install

# Generate Prisma client from the current schema.
db-generate:
    bunx prisma generate

# Start the local Postgres container.
db-up:
    docker compose up -d postgres

# Stop the local Postgres container.
db-down:
    docker compose down

# Restart the local Postgres container.
db-restart:
    docker compose restart postgres

# Show Docker Compose service status.
db-ps:
    docker compose ps

# Tail Postgres logs.
db-logs:
    docker compose logs -f postgres

# Push the Prisma schema to the local database.
db-push:
    bun run db:push

# Reset the database schema and re-apply it.
db-reset:
    bunx prisma db push --force-reset

# Create and run a Prisma migration.
db-migrate:
    bun run db:migrate

# Open Prisma Studio.
db-studio:
    bun run db:studio

# Sync WFCD item/mod/arcane data into PostgreSQL.
db-sync:
    bun run db:sync

# Full local database bootstrap: start DB, push schema, sync data.
db-bootstrap: db-up db-push db-sync

# Copy WFCD JSON from node_modules into src/data/warframe.
data-sync:
    bun run sync-data

# Update @wfcd/items and refresh the local JSON snapshot.
data-update:
    bun run update-data

# Start the Next.js development server.
dev:
    bun dev

# Install deps, start DB, apply schema, sync DB data, then start dev server.
dev-full: install db-up db-push db-sync
    bun dev

# Build the production app.
build:
    bun build

# Start the production server.
start:
    bun start

# Run the linter.
lint:
    bun lint

# Run the linter with autofixes.
lint-fix:
    bun lint:fix

# Format source files.
fmt:
    bun fmt

# Check formatting without writing changes.
fmt-check:
    bun fmt:check

# Run the test suite.
test:
    bun test

# Run tests in watch mode.
test-watch:
    bun test:watch

# Run tests with coverage.
test-coverage:
    bun test:coverage

# Common local verification pass.
check: lint fmt-check test

# CI-style verification including a production build.
ci: lint fmt-check test build

# Convert Overframe item mappings.
overframe-build-map:
    bun run overframe:build-map

# Scrape Overframe item IDs into src/data/overframe/items.csv.
overframe-scrape:
    go run ./scripts/go/scraper.go

# Find the current max Overframe item ID.
overframe-find-max:
    go run ./scripts/go/find_max.go

# Print whether expected local env files exist.
env-check:
    if (Test-Path .env.local) { Write-Host '.env.local present' } else { Write-Host '.env.local missing' }
    if (Test-Path .env.example) { Write-Host '.env.example present' } else { Write-Host '.env.example missing' }

# Show the local DATABASE_URL without exposing other env values.
env-db-url:
    if ($env:DATABASE_URL) { Write-Host $env:DATABASE_URL } else { Write-Host 'DATABASE_URL is not set' }

# Remove Next.js build output.
clean:
    if (Test-Path .next) { Remove-Item -Recurse -Force .next }

# Remove installed dependencies and build output.
clean-all:
    if (Test-Path .next) { Remove-Item -Recurse -Force .next }
    if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }

# First-run local setup for a fresh clone.
setup: install db-up db-push data-sync

# First-run local setup plus DB data import.
setup-full: install db-up db-push data-sync db-sync
