/**
 * Slim helpers — strip bulky WFCD fields before serializing to client components.
 *
 * Full item / mod / arcane objects carry fields like `drops`, `patchlogs`,
 * `components`, `wikiaUrl`, `transmutable`, etc. that are never used by the
 * build editor UI.  Stripping them here avoids sending unnecessary bytes in the
 * RSC payload.
 */

import type { Arcane, BrowseableItem, Mod } from "./types"

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

/**
 * Keep only the fields that `BuildContainer` and its descendants actually read:
 * - identity: uniqueName, name, imageName, category, type
 * - layout: aura, polarities, maxLevelCap, tradable
 * - sidebar trigger: trigger (exalted weapons check this)
 * - stat display / calculateStats: health, shield, armor, power, sprintSpeed,
 *   abilities, fireRate, criticalChance, criticalMultiplier, procChance,
 *   totalDamage, magazineSize, reloadTime, range, comboDuration, attacks, damage
 */
export function slimItemForClient(item: BrowseableItem): BrowseableItem {
  const raw = item as unknown as Record<string, unknown>

  const slim: Record<string, unknown> = {
    uniqueName: raw.uniqueName,
    name: raw.name,
    imageName: raw.imageName,
    category: raw.category,
    tradable: raw.tradable,
  }

  // Optional fields — only copy when present to keep the object small
  const optional = [
    // Layout / build-state init
    "type",
    "aura",
    "polarities",
    "maxLevelCap",
    // Sidebar / stat display
    "trigger",
    "health",
    "shield",
    "armor",
    "power",
    "sprintSpeed",
    "abilities",
    "fireRate",
    "criticalChance",
    "criticalMultiplier",
    "procChance",
    "totalDamage",
    "magazineSize",
    "reloadTime",
    "range",
    "comboDuration",
    "attacks",
    "damage",
  ] as const

  for (const key of optional) {
    if (raw[key] !== undefined) {
      slim[key] = raw[key]
    }
  }

  return slim as unknown as BrowseableItem
}

// ---------------------------------------------------------------------------
// Mods
// ---------------------------------------------------------------------------

/** Fields the client actually reads from a Mod object. */
type ClientModKey =
  | "uniqueName"
  | "name"
  | "description"
  | "imageName"
  | "polarity"
  | "rarity"
  | "baseDrain"
  | "fusionLimit"
  | "compatName"
  | "type"
  | "isAugment"
  | "isExilus"
  | "isUtility"
  | "levelStats"
  | "modSet"
  | "modSetStats"
  | "wikiaThumbnail"

const MOD_KEYS: ClientModKey[] = [
  "uniqueName",
  "name",
  "description",
  "imageName",
  "polarity",
  "rarity",
  "baseDrain",
  "fusionLimit",
  "compatName",
  "type",
  "isAugment",
  "isExilus",
  "isUtility",
  "levelStats",
  "modSet",
  "modSetStats",
  "wikiaThumbnail",
]

function slimMod(mod: Mod): Mod {
  const slim = {} as Record<string, unknown>
  for (const key of MOD_KEYS) {
    const value = mod[key]
    if (value !== undefined) {
      slim[key] = value
    }
  }
  // tradable is required in the Mod type
  slim.tradable = mod.tradable
  return slim as unknown as Mod
}

export function slimModsForClient(mods: Mod[]): Mod[] {
  return mods.map(slimMod)
}

/**
 * Slim a helminth-augment map (Record<uniqueName, Mod[]>).
 */
export function slimHelminthAugmentModsForClient(
  map: Record<string, Mod[]> | undefined,
): Record<string, Mod[]> | undefined {
  if (!map) return undefined
  const slim: Record<string, Mod[]> = {}
  for (const [key, mods] of Object.entries(map)) {
    slim[key] = mods.map(slimMod)
  }
  return slim
}

// ---------------------------------------------------------------------------
// Arcanes
// ---------------------------------------------------------------------------

/** Fields the client actually reads from an Arcane object. */
type ClientArcaneKey =
  | "uniqueName"
  | "name"
  | "imageName"
  | "rarity"
  | "type"
  | "levelStats"

const ARCANE_KEYS: ClientArcaneKey[] = [
  "uniqueName",
  "name",
  "imageName",
  "rarity",
  "type",
  "levelStats",
]

export function slimArcanesForClient(arcanes: Arcane[]): Arcane[] {
  return arcanes.map((arcane) => {
    const slim = {} as Record<string, unknown>
    for (const key of ARCANE_KEYS) {
      const value = arcane[key]
      if (value !== undefined) {
        slim[key] = value
      }
    }
    // tradable is required in the Arcane type
    slim.tradable = arcane.tradable
    return slim as unknown as Arcane
  })
}
