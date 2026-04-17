/**
 * Precompute the slim browse index.
 *
 * Reads WFCD JSON via legacy's `items.ts`, builds a `{ [category]: BrowseItem[] }`
 * map, and writes it as a single static asset that the frontend fetches once.
 *
 * Run with: `bun --cwd legacy run scripts/build-items-index.ts`
 */

import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

import { BROWSE_CATEGORIES } from "@/lib/warframe/categories"
import { getItemsByCategory } from "@/lib/warframe/items"
import type { BrowseCategory, BrowseItem } from "@/lib/warframe/types"

const OUT_PATH = resolve(process.cwd(), "../apps/web/public/data/items-index.json")

async function main() {
  const index: Partial<Record<BrowseCategory, BrowseItem[]>> = {}

  for (const cat of BROWSE_CATEGORIES) {
    const items = getItemsByCategory(cat.id)
    index[cat.id] = items
  }

  const totalItems = Object.values(index).reduce((sum, arr) => sum + (arr?.length ?? 0), 0)
  const json = JSON.stringify(index)

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, json, "utf8")

  const sizeKb = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1)
  console.log(`✓ wrote ${totalItems} items across ${BROWSE_CATEGORIES.length} categories → ${OUT_PATH} (${sizeKb} KB)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
