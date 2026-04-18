import type { Arcane, Mod, RivenStats } from "@arsenyx/shared/warframe/types";

import type { ParsedStat, StatType } from "./types";
import { DAMAGE_TYPE_COLORS } from "./types";

const COLOR_TAG_PATTERN =
  /([+-]?\d+(?:\.\d+)?)\s*%\s*<([A-Z_]+)>([A-Za-z]+)/g;
const PERCENT_PATTERN =
  /([+-]?\d+(?:\.\d+)?)\s*%\s+([A-Za-z][A-Za-z\s]*?)(?:\.|$|\n|,|<)/g;
const FLAT_PATTERN =
  /([+-]\d+(?:\.\d+)?)\s+(?!%|s\b|m\b|x\b)([A-Za-z][A-Za-z\s]*?)(?:\.|$|\n|,)/g;
const MULT_PATTERN =
  /(\d+(?:\.\d+)?)\s*x\s+([A-Za-z][A-Za-z\s]*?)(?:\.|$|\n|,)/g;

const STAT_NAME_MAP: Record<string, StatType> = {
  health: "health",
  "maximum health": "health",
  shield: "shield",
  "shield capacity": "shield",
  shields: "shield",
  armor: "armor",
  "armor rating": "armor",
  energy: "energy",
  "energy max": "energy",
  "sprint speed": "sprint_speed",
  "ability strength": "ability_strength",
  strength: "ability_strength",
  "ability duration": "ability_duration",
  duration: "ability_duration",
  "ability efficiency": "ability_efficiency",
  efficiency: "ability_efficiency",
  "ability range": "ability_range",
  range: "range",
  damage: "damage",
  "critical chance": "critical_chance",
  "crit chance": "critical_chance",
  "critical damage": "critical_multiplier",
  "critical multiplier": "critical_multiplier",
  "crit damage": "critical_multiplier",
  "crit multiplier": "critical_multiplier",
  "status chance": "status_chance",
  "fire rate": "fire_rate",
  "attack speed": "fire_rate",
  "magazine size": "magazine_size",
  "magazine capacity": "magazine_size",
  "reload speed": "reload_speed",
  "reload time": "reload_speed",
  multishot: "multishot",
  "punch through": "punch_through",
  "combo duration": "combo_duration",
  impact: "impact",
  puncture: "puncture",
  slash: "slash",
  heat: "heat",
  cold: "cold",
  electricity: "electricity",
  toxin: "toxin",
  blast: "blast",
  radiation: "radiation",
  gas: "gas",
  magnetic: "magnetic",
  viral: "viral",
  corrosive: "corrosive",
  "melee damage": "melee_damage",
  "tau resistance": "tau_resistance",
};

export interface PlacedModInput {
  mod: Mod;
  rank: number;
}

export interface PlacedArcaneInput {
  arcane: Arcane;
  rank: number;
}

const modCache = new WeakMap<Mod, Map<number, ParsedStat[]>>();

/** Parse all stat effects from a placed mod at its current rank. */
export function parseModStats(input: PlacedModInput): ParsedStat[] {
  const { mod, rank } = input;

  // Rivens: synthesize stat strings from rivenStats instead of levelStats.
  if (mod.rivenStats) {
    return parseRivenStats(mod.rivenStats);
  }

  let perRank = modCache.get(mod);
  if (!perRank) {
    perRank = new Map();
    modCache.set(mod, perRank);
  }
  const cached = perRank.get(rank);
  if (cached) return cached;

  const results: ParsedStat[] = [];
  const levels = mod.levelStats;
  if (levels && levels.length > 0) {
    const rankIndex = Math.min(Math.max(rank, 0), levels.length - 1);
    const levelData = levels[rankIndex];
    if (levelData?.stats) {
      for (const s of levelData.stats) {
        results.push(...parseStatString(s));
      }
    }
  }
  perRank.set(rank, results);
  return results;
}

/** Parse stat effects from a placed arcane (same levelStats shape as mods). */
export function parseArcaneStats(input: PlacedArcaneInput): ParsedStat[] {
  const { arcane, rank } = input;
  const levels = arcane.levelStats;
  if (!levels || levels.length === 0) return [];
  const rankIndex = Math.min(Math.max(rank, 0), levels.length - 1);
  const levelData = levels[rankIndex];
  if (!levelData?.stats) return [];
  const out: ParsedStat[] = [];
  for (const s of levelData.stats) {
    out.push(...parseStatString(s));
  }
  return out;
}

/** Convert a RivenStats object into ParsedStats. Negatives already carry sign. */
export function parseRivenStats(rivenStats: RivenStats): ParsedStat[] {
  const out: ParsedStat[] = [];
  for (const p of rivenStats.positives) {
    const mapped = STAT_NAME_MAP[p.stat.toLowerCase()];
    if (!mapped) continue;
    out.push({ type: mapped, value: p.value, operation: "percent_add" });
  }
  for (const n of rivenStats.negatives) {
    const mapped = STAT_NAME_MAP[n.stat.toLowerCase()];
    if (!mapped) continue;
    out.push({ type: mapped, value: n.value, operation: "percent_add" });
  }
  return out;
}

/** Parse a single stat string from WFCD data. */
export function parseStatString(statString: string): ParsedStat[] {
  const results: ParsedStat[] = [];

  const lower = statString.toLowerCase();
  if (lower.includes("augment:")) return results;
  if (lower.includes("pickups give")) return results;
  if (lower.includes("lethal damage")) return results;

  let match: RegExpMatchArray;

  for (match of statString.matchAll(COLOR_TAG_PATTERN)) {
    const value = parseFloat(match[1]);
    const colorTag = match[2];
    const damageType = DAMAGE_TYPE_COLORS[colorTag];
    if (damageType) {
      results.push({
        type: damageType as StatType,
        value,
        operation: "percent_add",
        damageType,
      });
    }
  }

  for (match of statString.matchAll(PERCENT_PATTERN)) {
    const value = parseFloat(match[1]);
    const statName = match[2].trim().toLowerCase();
    if (DAMAGE_TYPE_COLORS[`DT_${statName.toUpperCase()}_COLOR`]) continue;
    const statType = STAT_NAME_MAP[statName];
    if (statType) {
      results.push({ type: statType, value, operation: "percent_add" });
    }
  }

  for (match of statString.matchAll(FLAT_PATTERN)) {
    const value = parseFloat(match[1]);
    const statName = match[2].trim().toLowerCase();
    if (
      ["damage", "enemies", "seconds", "meters", "radius"].some((s) =>
        statName.includes(s),
      )
    ) {
      continue;
    }
    const statType = STAT_NAME_MAP[statName];
    if (statType) {
      if (!results.find((r) => r.type === statType)) {
        results.push({ type: statType, value, operation: "flat_add" });
      }
    }
  }

  for (match of statString.matchAll(MULT_PATTERN)) {
    const value = parseFloat(match[1]);
    const statName = match[2].trim().toLowerCase();
    const statType = STAT_NAME_MAP[statName];
    if (statType) {
      results.push({ type: statType, value, operation: "percent_mult" });
    }
  }

  return results;
}

export interface SourcedStat extends ParsedStat {
  sourceName: string;
}

/** Flatten mods + arcanes into a single list tagged with source names. */
export function collectSourcedStats(
  mods: PlacedModInput[],
  arcanes: PlacedArcaneInput[],
  opts?: { setMultiplierFor?: (modName: string) => number },
): SourcedStat[] {
  const out: SourcedStat[] = [];
  for (const m of mods) {
    const mult = opts?.setMultiplierFor?.(m.mod.name) ?? 1;
    const sourceName =
      m.mod.rivenStats !== undefined ? "Riven" : m.mod.name;
    for (const s of parseModStats(m)) {
      const value = s.operation === "percent_add" ? s.value * mult : s.value;
      out.push({ ...s, value, sourceName });
    }
  }
  for (const a of arcanes) {
    for (const s of parseArcaneStats(a)) {
      out.push({ ...s, sourceName: a.arcane.name });
    }
  }
  return out;
}
