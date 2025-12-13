/**
 * Data Access Layer
 *
 * Provides unified access to Warframe data with feature flag support
 * to switch between static JSON files and database queries.
 *
 * Set USE_DATABASE=true in environment to use database
 */

export { prisma } from "@/lib/db";

// Re-export database query functions
export {
  getItemsByCategoryFromDb,
  getItemByUniqueNameFromDb,
  getItemBySlugFromDb,
  getCategoryCountsFromDb,
  searchItemsFromDb,
} from "./items";

export {
  getAllModsFromDb,
  getModsByCompatibilityFromDb,
  getModsForCategoryFromDb,
  getModByUniqueNameFromDb,
  getAllArcanesFromDb,
  getArcanesForSlotFromDb,
  searchModsFromDb,
} from "./mods";

/**
 * Check if database mode is enabled
 */
export function useDatabase(): boolean {
  return process.env.USE_DATABASE === "true";
}
