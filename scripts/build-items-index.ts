/**
 * Precompute static browse data.
 *
 *  1. `items-index.json` — every browseable item as a card payload.
 *  2. `items/<category>/<slug>.json` — one file per item, full WFCD object,
 *     consumed by the detail page.
 *
 * Reads raw WFCD JSON directly from the `@wfcd/items` package, so no
 * `legacy/` imports are required.
 *
 * Run: `bun run build:items`
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"

import { buildIndex } from "@arsenyx/shared/warframe/categorize"
import { BROWSE_CATEGORIES } from "@arsenyx/shared/warframe/categories"
import type {
  BrowseableItem,
  BrowseCategory,
  BrowseItem,
} from "@arsenyx/shared/warframe/types"

const require = createRequire(import.meta.url)
const WFCD_PKG = dirname(require.resolve("@wfcd/items/package.json"))
const WFCD_JSON = resolve(WFCD_PKG, "data/json")

// WFCD files that contribute browseable items. See legacy/scripts/sync-warframe-data.ts.
const DATA_FILES = [
  "Warframes.json",
  "Primary.json",
  "Secondary.json",
  "Melee.json",
  "Sentinels.json",
  "Pets.json",
  "SentinelWeapons.json",
  "Misc.json",
  "Archwing.json",
  "Arch-Gun.json",
  "Arch-Melee.json",
] as const

const REPO = resolve(import.meta.dirname, "..")
const PUBLIC_DATA = resolve(REPO, "apps/web/public/data")
const INDEX_OUT = resolve(PUBLIC_DATA, "items-index.json")
const DETAIL_DIR = resolve(PUBLIC_DATA, "items")

async function loadAllItems(): Promise<BrowseableItem[]> {
  const all: BrowseableItem[] = []
  for (const file of DATA_FILES) {
    const body = await readFile(resolve(WFCD_JSON, file), "utf8")
    const items = JSON.parse(body) as BrowseableItem[]
    all.push(...items)
  }
  return all
}

async function main() {
  const allItems = await loadAllItems()
  const { byCategory, slugLookup } = buildIndex(allItems)

  await mkdir(dirname(INDEX_OUT), { recursive: true })

  const indexPayload: Partial<Record<BrowseCategory, BrowseItem[]>> = {}
  for (const cat of BROWSE_CATEGORIES) {
    indexPayload[cat.id] = byCategory[cat.id] ?? []
  }
  const indexJson = JSON.stringify(indexPayload)
  await writeFile(INDEX_OUT, indexJson, "utf8")

  const totalItems = Object.values(indexPayload).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0,
  )
  const indexKb = (Buffer.byteLength(indexJson, "utf8") / 1024).toFixed(1)
  console.log(
    `✓ wrote ${totalItems} items across ${BROWSE_CATEGORIES.length} categories → items-index.json (${indexKb} KB)`,
  )

  await rm(DETAIL_DIR, { recursive: true, force: true })
  await mkdir(DETAIL_DIR, { recursive: true })

  let detailCount = 0
  let detailBytes = 0
  for (const cat of BROWSE_CATEGORIES) {
    const catDir = resolve(DETAIL_DIR, cat.id)
    await mkdir(catDir, { recursive: true })
    for (const slim of byCategory[cat.id] ?? []) {
      const full = slugLookup.get(`${cat.id}|${slim.slug}`)
      if (!full) continue
      const body = JSON.stringify(full)
      await writeFile(resolve(catDir, `${slim.slug}.json`), body, "utf8")
      detailCount++
      detailBytes += Buffer.byteLength(body, "utf8")
    }
  }
  const detailMb = (detailBytes / 1024 / 1024).toFixed(2)
  console.log(
    `✓ wrote ${detailCount} per-item detail files → items/ (${detailMb} MB total)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
