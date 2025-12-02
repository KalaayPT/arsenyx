// Warframe items service - directly importing JSON data
// Note: We import JSON directly instead of using the Items class
// because @wfcd/items uses fs.readdirSync which doesn't work with Next.js bundling
// Data files are copied from @wfcd/items/data/json/ to src/data/warframe/

import WarframesData from "@/data/warframe/Warframes.json";
import PrimaryData from "@/data/warframe/Primary.json";
import SecondaryData from "@/data/warframe/Secondary.json";
import MeleeData from "@/data/warframe/Melee.json";
import SentinelsData from "@/data/warframe/Sentinels.json";
import PetsData from "@/data/warframe/Pets.json";

import type {
  BrowseCategory,
  BrowseItem,
  BrowseFilters,
  BrowseableItem,
} from "./types";
import { BROWSE_CATEGORIES, getCategoryConfig } from "./categories";
import { slugify } from "./slugs";

// Combined items array from all categories
const allItems: BrowseableItem[] = [
  ...(WarframesData as BrowseableItem[]),
  ...(PrimaryData as BrowseableItem[]),
  ...(SecondaryData as BrowseableItem[]),
  ...(MeleeData as BrowseableItem[]),
  ...(SentinelsData as BrowseableItem[]),
  ...(PetsData as BrowseableItem[]),
];

/**
 * Check if an item is a Necramech
 */
function isNecramech(item: BrowseableItem): boolean {
  return (
    item.category === "Warframes" &&
    (item.name.includes("Necramech") ||
      item.name === "Bonewidow" ||
      item.name === "Voidrig")
  );
}

/**
 * Map a raw WFCD item to our BrowseItem format
 */
function toBrowseItem(
  item: BrowseableItem,
  category: BrowseCategory
): BrowseItem {
  return {
    uniqueName: item.uniqueName,
    name: item.name,
    slug: slugify(item.name),
    category,
    imageName: item.imageName,
    masteryReq: item.masteryReq,
    isPrime: item.isPrime ?? item.name.includes("Prime"),
    vaulted: item.vaulted,
    type: (item as { type?: string }).type,
  };
}

/**
 * Get all items for a specific browse category
 */
export function getItemsByCategory(category: BrowseCategory): BrowseItem[] {
  const config = getCategoryConfig(category);

  if (!config) return [];

  const result: BrowseItem[] = [];

  for (const item of allItems) {
    // Skip items without names or that are components
    if (!item.name || item.name.includes(" Blueprint")) continue;

    const itemCategory = item.category as string;

    // Handle Necramechs specially
    if (category === "necramechs") {
      if (isNecramech(item as BrowseableItem)) {
        result.push(toBrowseItem(item as BrowseableItem, category));
      }
      continue;
    }

    // For Warframes, exclude Necramechs
    if (category === "warframes") {
      if (
        itemCategory === "Warframes" &&
        !isNecramech(item as BrowseableItem)
      ) {
        result.push(toBrowseItem(item as BrowseableItem, category));
      }
      continue;
    }

    // For companions, include both Sentinels and Pets
    if (category === "companions") {
      if (itemCategory === "Sentinels" || itemCategory === "Pets") {
        result.push(toBrowseItem(item as BrowseableItem, category));
      }
      continue;
    }

    // Standard category matching
    if (config.wfcdCategories.includes(itemCategory as never)) {
      result.push(toBrowseItem(item as BrowseableItem, category));
    }
  }

  // Sort alphabetically by name
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter items based on browse filters
 */
export function filterItems(
  items: BrowseItem[],
  filters: Partial<BrowseFilters>
): BrowseItem[] {
  let result = [...items];

  // Text search
  if (filters.query) {
    const query = filters.query.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.type?.toLowerCase().includes(query)
    );
  }

  // Mastery requirement filter
  if (filters.masteryMax !== undefined) {
    result = result.filter(
      (item) => (item.masteryReq ?? 0) <= filters.masteryMax!
    );
  }

  // Prime only filter
  if (filters.primeOnly) {
    result = result.filter((item) => item.isPrime);
  }

  // Hide vaulted filter
  if (filters.hideVaulted) {
    result = result.filter((item) => !item.vaulted);
  }

  return result;
}

/**
 * Get a single item by slug and category
 */
export function getItemBySlug(
  category: BrowseCategory,
  slug: string
): BrowseableItem | null {
  const config = getCategoryConfig(category);

  if (!config) return null;

  for (const item of allItems) {
    if (!item.name) continue;

    const itemSlug = slugify(item.name);
    if (itemSlug !== slug) continue;

    const itemCategory = item.category as string;

    // Verify the item belongs to the requested category
    if (category === "necramechs" && isNecramech(item as BrowseableItem)) {
      return item as BrowseableItem;
    }

    if (
      category === "warframes" &&
      itemCategory === "Warframes" &&
      !isNecramech(item as BrowseableItem)
    ) {
      return item as BrowseableItem;
    }

    if (
      category === "companions" &&
      (itemCategory === "Sentinels" || itemCategory === "Pets")
    ) {
      return item as BrowseableItem;
    }

    if (config.wfcdCategories.includes(itemCategory as never)) {
      return item as BrowseableItem;
    }
  }

  return null;
}

/**
 * Get items for static generation (top N items per category)
 */
export function getStaticItems(limit = 50): Array<{
  category: BrowseCategory;
  slug: string;
}> {
  const result: Array<{ category: BrowseCategory; slug: string }> = [];

  for (const config of BROWSE_CATEGORIES) {
    const items = getItemsByCategory(config.id);
    // Prioritize prime items and popular frames
    const sorted = items.sort((a, b) => {
      // Primes first
      if (a.isPrime && !b.isPrime) return -1;
      if (!a.isPrime && b.isPrime) return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });

    for (const item of sorted.slice(0, limit)) {
      result.push({
        category: config.id,
        slug: item.slug,
      });
    }
  }

  return result;
}

/**
 * Get total count of items per category (for UI display)
 */
export function getCategoryCounts(): Record<BrowseCategory, number> {
  const counts = {} as Record<BrowseCategory, number>;

  for (const config of BROWSE_CATEGORIES) {
    counts[config.id] = getItemsByCategory(config.id).length;
  }

  return counts;
}

/**
 * Get full item data by unique name and category
 * Returns the complete item object with all fields
 */
export function getFullItem(
  category: BrowseCategory,
  uniqueName: string
): BrowseableItem | null {
  const config = getCategoryConfig(category);
  if (!config) return null;

  for (const item of allItems) {
    if (item.uniqueName === uniqueName) {
      return item as BrowseableItem;
    }
  }

  return null;
}
