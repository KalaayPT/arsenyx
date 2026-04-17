/**
 * Precompute static browse data.
 *
 * 1. Slim `items-index.json` — every browsable item as a card payload.
 * 2. Per-item JSON at `data/items/<category>/<slug>.json` — full WFCD item
 *    for the detail page. Each file is small and CDN-cacheable.
 *
 * Run with: `bun --cwd legacy run scripts/build-items-index.ts`
 */

import { mkdir, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import { BROWSE_CATEGORIES } from "@/lib/warframe/categories"
import { getItemBySlug, getItemsByCategory } from "@/lib/warframe/items"
import type { BrowseCategory, BrowseItem } from "@/lib/warframe/types"

const PUBLIC_DATA = resolve(process.cwd(), "../apps/web/public/data")
const INDEX_OUT = resolve(PUBLIC_DATA, "items-index.json")
const DETAIL_DIR = resolve(PUBLIC_DATA, "items")

async function main() {
  const index: Partial<Record<BrowseCategory, BrowseItem[]>> = {}

  for (const cat of BROWSE_CATEGORIES) {
    index[cat.id] = getItemsByCategory(cat.id)
  }

  const json = JSON.stringify(index)
  await mkdir(dirname(INDEX_OUT), { recursive: true })
  await writeFile(INDEX_OUT, json, "utf8")

  const totalItems = Object.values(index).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0,
  )
  const sizeKb = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1)
  console.log(
    `✓ wrote ${totalItems} items across ${BROWSE_CATEGORIES.length} categories → ${INDEX_OUT} (${sizeKb} KB)`,
  )

  // Per-item detail JSON — clear stale files first.
  await rm(DETAIL_DIR, { recursive: true, force: true })
  await mkdir(DETAIL_DIR, { recursive: true })

  let detailCount = 0
  let detailBytes = 0
  for (const cat of BROWSE_CATEGORIES) {
    const catDir = resolve(DETAIL_DIR, cat.id)
    await mkdir(catDir, { recursive: true })
    const items = index[cat.id] ?? []
    for (const slim of items) {
      const full = getItemBySlug(cat.id, slim.slug)
      if (!full) continue
      const body = JSON.stringify(full)
      await writeFile(resolve(catDir, `${slim.slug}.json`), body, "utf8")
      detailCount++
      detailBytes += Buffer.byteLength(body, "utf8")
    }
  }
  const detailMb = (detailBytes / 1024 / 1024).toFixed(2)
  console.log(
    `✓ wrote ${detailCount} per-item detail files → ${DETAIL_DIR} (${detailMb} MB total)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
