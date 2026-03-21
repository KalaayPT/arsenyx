# Pure Function Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive test coverage for all untested pure utility functions in the Warframe domain layer, using bun:test.

**Architecture:** Nine independent test files, one per module, following existing conventions (`bun:test` imports, `__tests__/` directories, `describe`/`it` blocks, existing test fixtures). Each task creates one test file and runs it. No mocking needed — all targets are pure functions.

**Tech Stack:** Bun Test, TypeScript

---

## File Structure

All new files are test files. No source modifications.

| New File | Tests For |
|---|---|
| `src/lib/__tests__/result.test.ts` | `src/lib/result.ts` |
| `src/lib/warframe/__tests__/slugs.test.ts` | `src/lib/warframe/slugs.ts` |
| `src/lib/warframe/__tests__/formatting.test.ts` | `src/lib/warframe/formatting.ts` |
| `src/lib/warframe/__tests__/mod-variants.test.ts` | `src/lib/warframe/mod-variants.ts` |
| `src/lib/warframe/__tests__/stat-caps.test.ts` | `src/lib/warframe/stat-caps.ts` |
| `src/lib/warframe/__tests__/shards.test.ts` | `src/lib/warframe/shards.ts` |
| `src/lib/warframe/__tests__/aura-effects.test.ts` | `src/lib/warframe/aura-effects.ts` |
| `src/lib/warframe/__tests__/mods.test.ts` | `src/lib/warframe/mods.ts` |
| `src/lib/warframe/__tests__/helminth.test.ts` | `src/lib/warframe/helminth.ts` |

---

## Task 1: Result Type Tests

**Files:**
- Create: `src/lib/__tests__/result.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import { ok, err, getErrorMessage, type Result } from "../result";

// =============================================================================
// ok() TESTS
// =============================================================================

describe("ok", () => {
  it("creates a void success result", () => {
    const result = ok();
    expect(result.success).toBe(true);
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("creates a success result with data", () => {
    const result = ok("hello");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("hello");
    }
  });

  it("creates a success result with object data", () => {
    const data = { id: 1, name: "test" };
    const result = ok(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 1, name: "test" });
    }
  });
});

// =============================================================================
// err() TESTS
// =============================================================================

describe("err", () => {
  it("creates an error result", () => {
    const result = err("something went wrong");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("something went wrong");
    }
  });
});

// =============================================================================
// getErrorMessage() TESTS
// =============================================================================

describe("getErrorMessage", () => {
  it("extracts message from Error instance", () => {
    const error = new Error("test error");
    expect(getErrorMessage(error, "fallback")).toBe("test error");
  });

  it("returns fallback for string value", () => {
    expect(getErrorMessage("not an error", "fallback")).toBe("fallback");
  });

  it("returns fallback for null", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("returns fallback for number", () => {
    expect(getErrorMessage(42, "fallback")).toBe("fallback");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/__tests__/result.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/result.test.ts
git commit -m "test: add result type tests (ok, err, getErrorMessage)"
```

---

## Task 2: Slug Utility Tests

**Files:**
- Create: `src/lib/warframe/__tests__/slugs.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import { slugify, unslugify, getItemUrl, normalizeCategory } from "../slugs";

// =============================================================================
// slugify() TESTS
// =============================================================================

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Excalibur Prime")).toBe("excalibur-prime");
  });

  it("handles MK1 prefix", () => {
    expect(slugify("MK1-Braton")).toBe("mk1-braton");
  });

  it("removes apostrophes", () => {
    expect(slugify("Hell's Chamber")).toBe("hells-chamber");
  });

  it("removes curly apostrophes", () => {
    expect(slugify("Hell\u2019s Chamber")).toBe("hells-chamber");
  });

  it("replaces ampersand with 'and'", () => {
    expect(slugify("Rest & Rage")).toBe("rest-and-rage");
  });

  it("removes special characters", () => {
    expect(slugify("Cyte-09")).toBe("cyte-09");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("Kuva   Bramma")).toBe("kuva-bramma");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Braton  ")).toBe("braton");
  });

  it("handles single word", () => {
    expect(slugify("Rhino")).toBe("rhino");
  });

  it("handles parentheses", () => {
    expect(slugify("Lato (Vandal)")).toBe("lato-vandal");
  });
});

// =============================================================================
// unslugify() TESTS
// =============================================================================

describe("unslugify", () => {
  it("replaces hyphens with spaces", () => {
    expect(unslugify("excalibur-prime")).toBe("excalibur prime");
  });

  it("handles single word", () => {
    expect(unslugify("rhino")).toBe("rhino");
  });
});

// =============================================================================
// getItemUrl() TESTS
// =============================================================================

describe("getItemUrl", () => {
  it("builds browse URL", () => {
    expect(getItemUrl("warframes", "excalibur-prime")).toBe("/browse/warframes/excalibur-prime");
  });
});

// =============================================================================
// normalizeCategory() TESTS
// =============================================================================

describe("normalizeCategory", () => {
  it("lowercases category", () => {
    expect(normalizeCategory("Warframes")).toBe("warframes");
  });

  it("preserves already-lowercase", () => {
    expect(normalizeCategory("melee")).toBe("melee");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/slugs.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/slugs.test.ts
git commit -m "test: add slug utility tests (slugify, unslugify, getItemUrl, normalizeCategory)"
```

---

## Task 3: Formatting Tests

**Files:**
- Create: `src/lib/warframe/__tests__/formatting.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import { formatDisplayValue, formatContribution, formatPercent } from "../formatting";

// =============================================================================
// formatDisplayValue() TESTS
// =============================================================================

describe("formatDisplayValue", () => {
  describe("percent format", () => {
    it("formats whole number", () => {
      expect(formatDisplayValue(100, "percent")).toBe("100%");
    });

    it("formats decimal value", () => {
      expect(formatDisplayValue(12.5, "percent")).toBe("12.5%");
    });

    it("strips trailing .0", () => {
      expect(formatDisplayValue(50.0, "percent")).toBe("50%");
    });
  });

  describe("multiplier format", () => {
    it("formats whole number", () => {
      expect(formatDisplayValue(2, "multiplier")).toBe("2x");
    });

    it("formats decimal value", () => {
      expect(formatDisplayValue(2.5, "multiplier")).toBe("2.5x");
    });

    it("strips trailing .0", () => {
      expect(formatDisplayValue(3.0, "multiplier")).toBe("3x");
    });
  });

  describe("decimal format", () => {
    it("formats to 2 decimal places", () => {
      expect(formatDisplayValue(1.25, "decimal")).toBe("1.25");
    });

    it("strips trailing zeros", () => {
      expect(formatDisplayValue(1.5, "decimal")).toBe("1.5");
    });

    it("strips trailing dot and zeros", () => {
      expect(formatDisplayValue(3, "decimal")).toBe("3");
    });
  });

  describe("number format", () => {
    it("floors to integer", () => {
      expect(formatDisplayValue(742.8, "number")).toBe("742");
    });

    it("returns integer as-is", () => {
      expect(formatDisplayValue(300, "number")).toBe("300");
    });

    it("floors negative values", () => {
      // Math.floor(-0.5) = -1
      expect(formatDisplayValue(-0.5, "number")).toBe("-1");
    });
  });
});

// =============================================================================
// formatContribution() TESTS
// =============================================================================

describe("formatContribution", () => {
  it("adds + prefix for positive percent", () => {
    expect(formatContribution(30, "percent")).toBe("+30%");
  });

  it("shows negative sign for negative percent", () => {
    expect(formatContribution(-15.5, "percent")).toBe("-15.5%");
  });

  it("adds + prefix for positive multiplier", () => {
    expect(formatContribution(2, "multiplier")).toBe("+2x");
  });

  it("adds + prefix for positive decimal", () => {
    expect(formatContribution(0.5, "decimal")).toBe("+0.5");
  });

  it("adds + prefix for positive number", () => {
    expect(formatContribution(100, "number")).toBe("+100");
  });

  it("floors number format", () => {
    expect(formatContribution(99.9, "number")).toBe("+99");
  });

  it("treats zero as positive (+ prefix)", () => {
    expect(formatContribution(0, "percent")).toBe("+0%");
  });
});

// =============================================================================
// formatPercent() TESTS
// =============================================================================

describe("formatPercent", () => {
  it("formats whole number", () => {
    expect(formatPercent(50)).toBe("50%");
  });

  it("formats decimal", () => {
    expect(formatPercent(12.5)).toBe("12.5%");
  });

  it("strips trailing .0", () => {
    expect(formatPercent(100.0)).toBe("100%");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/formatting.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/formatting.test.ts
git commit -m "test: add stat formatting tests (formatDisplayValue, formatContribution, formatPercent)"
```

---

## Task 4: Mod Variants Tests

**Files:**
- Create: `src/lib/warframe/__tests__/mod-variants.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import { getModBaseName, areModsVariants } from "../mod-variants";

// =============================================================================
// getModBaseName() TESTS
// =============================================================================

describe("getModBaseName", () => {
  it("returns base name unchanged", () => {
    expect(getModBaseName("Serration")).toBe("Serration");
  });

  it("strips Primed prefix", () => {
    expect(getModBaseName("Primed Continuity")).toBe("Continuity");
  });

  it("strips Umbral prefix", () => {
    expect(getModBaseName("Umbral Vitality")).toBe("Vitality");
  });

  it("strips Sacrificial prefix", () => {
    expect(getModBaseName("Sacrificial Pressure")).toBe("Pressure");
  });

  it("strips Amalgam prefix", () => {
    expect(getModBaseName("Amalgam Serration")).toBe("Serration");
  });

  it("strips Archon prefix", () => {
    expect(getModBaseName("Archon Stretch")).toBe("Stretch");
  });

  it("strips Spectral prefix", () => {
    expect(getModBaseName("Spectral Scream")).toBe("Scream");
  });

  it("maps Galvanized Chamber to Split Chamber", () => {
    expect(getModBaseName("Galvanized Chamber")).toBe("Split Chamber");
  });

  it("maps Galvanized Diffusion to Barrel Diffusion", () => {
    expect(getModBaseName("Galvanized Diffusion")).toBe("Barrel Diffusion");
  });

  it("maps Galvanized Hell to Hell's Chamber", () => {
    expect(getModBaseName("Galvanized Hell")).toBe("Hell's Chamber");
  });

  it("only strips first matching prefix", () => {
    // "Primed " prefix is found first, returning "Point Blank"
    expect(getModBaseName("Primed Point Blank")).toBe("Point Blank");
  });
});

// =============================================================================
// areModsVariants() TESTS
// =============================================================================

describe("areModsVariants", () => {
  it("detects Primed variant conflict", () => {
    expect(areModsVariants({ name: "Continuity" }, { name: "Primed Continuity" })).toBe(true);
  });

  it("detects Umbral variant conflict", () => {
    expect(areModsVariants({ name: "Vitality" }, { name: "Umbral Vitality" })).toBe(true);
  });

  it("detects Galvanized replacement conflict", () => {
    expect(areModsVariants({ name: "Split Chamber" }, { name: "Galvanized Chamber" })).toBe(true);
  });

  it("returns false for unrelated mods", () => {
    expect(areModsVariants({ name: "Serration" }, { name: "Vitality" })).toBe(false);
  });

  it("returns true for same mod", () => {
    expect(areModsVariants({ name: "Serration" }, { name: "Serration" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/mod-variants.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/mod-variants.test.ts
git commit -m "test: add mod variant detection tests (getModBaseName, areModsVariants)"
```

---

## Task 5: Stat Caps Tests

**Files:**
- Create: `src/lib/warframe/__tests__/stat-caps.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import { applyStatCap, hasStatCap, getStatCap, STAT_CAPS } from "../stat-caps";
import type { StatType } from "../stat-types";

// =============================================================================
// applyStatCap() TESTS
// =============================================================================

describe("applyStatCap", () => {
  it("caps ability efficiency at 175%", () => {
    const result = applyStatCap("ability_efficiency", 200);
    expect(result.value).toBe(175);
    expect(result.wasCapped).toBe(true);
    expect(result.uncapped).toBe(200);
  });

  it("floors ability efficiency at 25%", () => {
    const result = applyStatCap("ability_efficiency", 10);
    expect(result.value).toBe(25);
    expect(result.wasCapped).toBe(true);
    expect(result.uncapped).toBe(10);
  });

  it("does not cap efficiency within range", () => {
    const result = applyStatCap("ability_efficiency", 130);
    expect(result.value).toBe(130);
    expect(result.wasCapped).toBe(false);
    expect(result.uncapped).toBeUndefined();
  });

  it("floors ability duration at 12.5%", () => {
    const result = applyStatCap("ability_duration", 5);
    expect(result.value).toBe(12.5);
    expect(result.wasCapped).toBe(true);
  });

  it("does not cap duration above minimum", () => {
    const result = applyStatCap("ability_duration", 200);
    expect(result.value).toBe(200);
    expect(result.wasCapped).toBe(false);
  });

  it("floors ability range at 34%", () => {
    const result = applyStatCap("ability_range", 20);
    expect(result.value).toBe(34);
    expect(result.wasCapped).toBe(true);
  });

  it("passes through uncapped stat types unchanged", () => {
    const result = applyStatCap("health", 9999);
    expect(result.value).toBe(9999);
    expect(result.wasCapped).toBe(false);
  });

  it("passes through ability_strength unchanged (no cap defined)", () => {
    const result = applyStatCap("ability_strength", 500);
    expect(result.value).toBe(500);
    expect(result.wasCapped).toBe(false);
  });
});

// =============================================================================
// hasStatCap() TESTS
// =============================================================================

describe("hasStatCap", () => {
  it("returns true for ability_efficiency", () => {
    expect(hasStatCap("ability_efficiency")).toBe(true);
  });

  it("returns true for ability_duration", () => {
    expect(hasStatCap("ability_duration")).toBe(true);
  });

  it("returns true for ability_range", () => {
    expect(hasStatCap("ability_range")).toBe(true);
  });

  it("returns false for health", () => {
    expect(hasStatCap("health")).toBe(false);
  });

  it("returns false for ability_strength", () => {
    expect(hasStatCap("ability_strength")).toBe(false);
  });
});

// =============================================================================
// getStatCap() TESTS
// =============================================================================

describe("getStatCap", () => {
  it("returns cap for ability_efficiency", () => {
    const cap = getStatCap("ability_efficiency");
    expect(cap).toEqual({ min: 25, max: 175 });
  });

  it("returns cap for ability_duration (min only)", () => {
    const cap = getStatCap("ability_duration");
    expect(cap).toEqual({ min: 12.5 });
  });

  it("returns undefined for uncapped stat", () => {
    expect(getStatCap("health")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/stat-caps.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/stat-caps.test.ts
git commit -m "test: add stat cap tests (applyStatCap, hasStatCap, getStatCap)"
```

---

## Task 6: Shard Utility Tests

**Files:**
- Create: `src/lib/warframe/__tests__/shards.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import {
  getShardImageUrl,
  getStatsForColor,
  findStat,
  getStatIndex,
  getStatByIndex,
  formatStatValue,
  getShardCssColor,
  getShardGlowColor,
  SHARD_COLORS,
  SHARD_COLOR_NAMES,
} from "../shards";

// =============================================================================
// getShardImageUrl() TESTS
// =============================================================================

describe("getShardImageUrl", () => {
  it("returns regular image URL", () => {
    const url = getShardImageUrl("crimson", false);
    expect(url).toContain("CrimsonArchonShard");
    expect(url).not.toContain("Tauforged");
  });

  it("returns tauforged image URL", () => {
    const url = getShardImageUrl("crimson", true);
    expect(url).toContain("TauforgedCrimsonArchonShard");
  });

  it("works for all shard colors", () => {
    for (const color of SHARD_COLORS) {
      expect(getShardImageUrl(color, false)).toBeTruthy();
      expect(getShardImageUrl(color, true)).toBeTruthy();
    }
  });
});

// =============================================================================
// getStatsForColor() TESTS
// =============================================================================

describe("getStatsForColor", () => {
  it("returns stats for crimson", () => {
    const stats = getStatsForColor("crimson");
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0].name).toBe("Melee Critical Damage");
  });

  it("returns stats for all colors", () => {
    for (const color of SHARD_COLORS) {
      const stats = getStatsForColor(color);
      expect(stats.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// findStat() TESTS
// =============================================================================

describe("findStat", () => {
  it("finds existing stat by name", () => {
    const stat = findStat("crimson", "Ability Strength");
    expect(stat).toBeDefined();
    expect(stat!.baseValue).toBe(10);
    expect(stat!.tauforgedValue).toBe(15);
  });

  it("returns undefined for non-existent stat", () => {
    expect(findStat("crimson", "Nonexistent Stat")).toBeUndefined();
  });
});

// =============================================================================
// getStatIndex() / getStatByIndex() ROUNDTRIP TESTS
// =============================================================================

describe("getStatIndex", () => {
  it("returns index for known stat", () => {
    // "Ability Strength" is the 4th crimson stat (index 3)
    expect(getStatIndex("crimson", "Ability Strength")).toBe(3);
  });

  it("returns 0 for unknown stat", () => {
    expect(getStatIndex("crimson", "Nonexistent")).toBe(0);
  });
});

describe("getStatByIndex", () => {
  it("returns stat name for valid index", () => {
    expect(getStatByIndex("crimson", 0)).toBe("Melee Critical Damage");
  });

  it("returns first stat for out-of-range index", () => {
    expect(getStatByIndex("crimson", 999)).toBe("Melee Critical Damage");
  });

  it("returns first stat for negative index", () => {
    expect(getStatByIndex("crimson", -1)).toBe("Melee Critical Damage");
  });
});

describe("stat index roundtrip", () => {
  it("roundtrips all crimson stats", () => {
    const stats = getStatsForColor("crimson");
    for (let i = 0; i < stats.length; i++) {
      const index = getStatIndex("crimson", stats[i].name);
      const name = getStatByIndex("crimson", index);
      expect(name).toBe(stats[i].name);
    }
  });
});

// =============================================================================
// formatStatValue() TESTS
// =============================================================================

describe("formatStatValue", () => {
  it("formats regular shard stat with unit", () => {
    const stat = { name: "Ability Strength", baseValue: 10, tauforgedValue: 15, unit: "%" };
    expect(formatStatValue(stat, false)).toBe("+10%");
  });

  it("formats tauforged shard stat", () => {
    const stat = { name: "Ability Strength", baseValue: 10, tauforgedValue: 15, unit: "%" };
    expect(formatStatValue(stat, true)).toBe("+15%");
  });

  it("formats stat with decimal value", () => {
    const stat = { name: "Melee Critical Damage", baseValue: 25, tauforgedValue: 37.5, unit: "%" };
    expect(formatStatValue(stat, true)).toBe("+37.5%");
  });

  it("formats stat without unit", () => {
    const stat = { name: "Health", baseValue: 150, tauforgedValue: 225, unit: "" };
    expect(formatStatValue(stat, false)).toBe("+150");
  });

  it("formats stat with complex unit", () => {
    const stat = { name: "Health Regen", baseValue: 5, tauforgedValue: 7.5, unit: "/s" };
    expect(formatStatValue(stat, false)).toBe("+5/s");
  });
});

// =============================================================================
// CSS COLOR TESTS
// =============================================================================

describe("getShardCssColor", () => {
  it("returns hex color for each shard color", () => {
    for (const color of SHARD_COLORS) {
      const css = getShardCssColor(color);
      expect(css).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("getShardGlowColor", () => {
  it("returns rgba color for each shard color", () => {
    for (const color of SHARD_COLORS) {
      const glow = getShardGlowColor(color);
      expect(glow).toMatch(/^rgba\(/);
    }
  });
});

// =============================================================================
// SHARD_COLOR_NAMES TESTS
// =============================================================================

describe("SHARD_COLOR_NAMES", () => {
  it("has a display name for every shard color", () => {
    for (const color of SHARD_COLORS) {
      expect(SHARD_COLOR_NAMES[color]).toBeTruthy();
    }
  });

  it("capitalizes color names", () => {
    expect(SHARD_COLOR_NAMES["crimson"]).toBe("Crimson");
    expect(SHARD_COLOR_NAMES["azure"]).toBe("Azure");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/shards.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/shards.test.ts
git commit -m "test: add archon shard tests (images, stats, formatting, codec roundtrips)"
```

---

## Task 7: Aura Effects Tests

**Files:**
- Create: `src/lib/warframe/__tests__/aura-effects.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import {
  isAuraSelfAffecting,
  getAuraStats,
  getAuraMaxValue,
} from "../aura-effects";

// =============================================================================
// isAuraSelfAffecting() TESTS
// =============================================================================

describe("isAuraSelfAffecting", () => {
  it("returns true for Steel Charge", () => {
    expect(isAuraSelfAffecting("Steel Charge")).toBe(true);
  });

  it("returns true for Growing Power", () => {
    expect(isAuraSelfAffecting("Growing Power")).toBe(true);
  });

  it("returns true for Physique", () => {
    expect(isAuraSelfAffecting("Physique")).toBe(true);
  });

  it("returns false for Corrosive Projection (excluded)", () => {
    expect(isAuraSelfAffecting("Corrosive Projection")).toBe(false);
  });

  it("returns false for Energy Siphon (excluded)", () => {
    expect(isAuraSelfAffecting("Energy Siphon")).toBe(false);
  });

  it("returns false for unknown aura", () => {
    expect(isAuraSelfAffecting("Nonexistent Aura")).toBe(false);
  });
});

// =============================================================================
// getAuraStats() TESTS
// =============================================================================

describe("getAuraStats", () => {
  it("returns stats for Steel Charge at rank", () => {
    const stats = getAuraStats("Steel Charge", 5);
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe("melee_damage");
    // perRank * (rank + 1) = 10 * 6 = 60
    expect(stats[0].value).toBe(60);
  });

  it("returns stats for Steel Charge at rank 0", () => {
    const stats = getAuraStats("Steel Charge", 0);
    expect(stats[0].value).toBe(10); // perRank * 1 = 10
  });

  it("returns empty array for unknown aura", () => {
    expect(getAuraStats("Nonexistent", 5)).toEqual([]);
  });

  it("returns empty array for excluded aura", () => {
    expect(getAuraStats("Corrosive Projection", 5)).toEqual([]);
  });
});

// =============================================================================
// getAuraMaxValue() TESTS
// =============================================================================

describe("getAuraMaxValue", () => {
  it("returns max value for Steel Charge melee_damage", () => {
    expect(getAuraMaxValue("Steel Charge", "melee_damage")).toBe(60);
  });

  it("returns max value for Physique health", () => {
    expect(getAuraMaxValue("Physique", "health")).toBe(20);
  });

  it("returns undefined for wrong stat type", () => {
    expect(getAuraMaxValue("Steel Charge", "health")).toBeUndefined();
  });

  it("returns undefined for unknown aura", () => {
    expect(getAuraMaxValue("Nonexistent", "health")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/aura-effects.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/aura-effects.test.ts
git commit -m "test: add aura effects tests (isAuraSelfAffecting, getAuraStats, getAuraMaxValue)"
```

---

## Task 8: Mods Service Tests

**Files:**
- Create: `src/lib/warframe/__tests__/mods.test.ts`

This is the largest and most important test file. It tests the mod service which reads from real JSON data (not mocked). The tests verify filtering logic against real Warframe data.

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import {
  normalizePolarity,
  getAllMods,
  getModsByCompatibility,
  getModsForCategory,
  getModsForItem,
  getModByUniqueName,
  getModByName,
  getModFamily,
  canAddModToBuild,
  getAllArcanes,
  getArcanesForSlot,
  getArcaneByUniqueName,
  getArcaneByName,
} from "../mods";
import type { Polarity, Mod } from "../types";

// =============================================================================
// normalizePolarity() TESTS
// =============================================================================

describe("normalizePolarity", () => {
  it("normalizes standard polarity names", () => {
    expect(normalizePolarity("madurai")).toBe("madurai");
    expect(normalizePolarity("vazarin")).toBe("vazarin");
    expect(normalizePolarity("naramon")).toBe("naramon");
    expect(normalizePolarity("zenurik")).toBe("zenurik");
    expect(normalizePolarity("unairu")).toBe("unairu");
    expect(normalizePolarity("penjaga")).toBe("penjaga");
    expect(normalizePolarity("umbra")).toBe("umbra");
  });

  it("normalizes case-insensitive", () => {
    expect(normalizePolarity("Madurai")).toBe("madurai");
    expect(normalizePolarity("VAZARIN")).toBe("vazarin");
  });

  it("normalizes alternative names", () => {
    expect(normalizePolarity("d")).toBe("vazarin");
    expect(normalizePolarity("r")).toBe("madurai");
    expect(normalizePolarity("v")).toBe("madurai");
    expect(normalizePolarity("dash")).toBe("naramon");
  });

  it("returns universal for undefined", () => {
    expect(normalizePolarity(undefined)).toBe("universal");
  });

  it("returns universal for empty string", () => {
    expect(normalizePolarity("")).toBe("universal");
  });

  it("returns universal for unknown string", () => {
    expect(normalizePolarity("xyzabc")).toBe("universal");
  });
});

// =============================================================================
// getAllMods() TESTS
// =============================================================================

describe("getAllMods", () => {
  it("returns a non-empty array of mods", () => {
    const mods = getAllMods();
    expect(mods.length).toBeGreaterThan(100);
  });

  it("filters out Riven mods", () => {
    const mods = getAllMods();
    const rivens = mods.filter((m) => m.name.includes("Riven Mod"));
    expect(rivens).toHaveLength(0);
  });

  it("filters out PvP mods", () => {
    const mods = getAllMods();
    const pvp = mods.filter((m) => m.uniqueName.includes("/PvPMods/"));
    expect(pvp).toHaveLength(0);
  });

  it("filters out Beginner mods", () => {
    const mods = getAllMods();
    const beginner = mods.filter((m) => m.uniqueName.includes("/Beginner/"));
    expect(beginner).toHaveLength(0);
  });

  it("includes well-known mods", () => {
    const mods = getAllMods();
    const names = mods.map((m) => m.name);
    expect(names).toContain("Serration");
    expect(names).toContain("Vitality");
    expect(names).toContain("Steel Fiber");
    expect(names).toContain("Intensify");
  });

  it("normalizes polarity on all mods", () => {
    const mods = getAllMods();
    const validPolarities: Polarity[] = [
      "madurai", "vazarin", "naramon", "zenurik",
      "unairu", "penjaga", "umbra", "any", "universal",
    ];
    for (const mod of mods) {
      expect(validPolarities).toContain(mod.polarity);
    }
  });

  it("sets Amalgam rarity on Amalgam mods", () => {
    const mods = getAllMods();
    const amalgams = mods.filter((m) => m.name.startsWith("Amalgam "));
    for (const mod of amalgams) {
      expect(mod.rarity).toBe("Amalgam");
    }
  });

  it("sets Galvanized rarity on Galvanized mods", () => {
    const mods = getAllMods();
    const galvanized = mods.filter((m) => m.name.startsWith("Galvanized "));
    for (const mod of galvanized) {
      expect(mod.rarity).toBe("Galvanized");
    }
  });
});

// =============================================================================
// getModsByCompatibility() TESTS
// =============================================================================

describe("getModsByCompatibility", () => {
  it("returns warframe mods", () => {
    const mods = getModsByCompatibility("Warframe");
    expect(mods.length).toBeGreaterThan(10);
    // Should include general warframe mods
    const names = mods.map((m) => m.name);
    expect(names).toContain("Vitality");
  });

  it("returns rifle mods", () => {
    const mods = getModsByCompatibility("Rifle");
    expect(mods.length).toBeGreaterThan(5);
    const names = mods.map((m) => m.name);
    expect(names).toContain("Serration");
  });

  it("returns melee mods", () => {
    const mods = getModsByCompatibility("Melee");
    expect(mods.length).toBeGreaterThan(5);
  });

  it("returns empty for invalid compatibility", () => {
    const mods = getModsByCompatibility("InvalidType" as any);
    expect(mods).toHaveLength(0);
  });
});

// =============================================================================
// getModsForCategory() TESTS
// =============================================================================

describe("getModsForCategory", () => {
  it("returns mods for warframes category", () => {
    const mods = getModsForCategory("warframes");
    expect(mods.length).toBeGreaterThan(10);
  });

  it("returns combined mods for primary (rifle + shotgun)", () => {
    const primaryMods = getModsForCategory("primary");
    const rifleMods = getModsByCompatibility("Rifle");
    const shotgunMods = getModsByCompatibility("Shotgun");
    // Primary should include both rifle and shotgun
    expect(primaryMods.length).toBeGreaterThanOrEqual(rifleMods.length);
    expect(primaryMods.length).toBeGreaterThanOrEqual(shotgunMods.length);
  });

  it("returns empty for unknown category", () => {
    expect(getModsForCategory("nonexistent")).toHaveLength(0);
  });
});

// =============================================================================
// getModByUniqueName() / getModByName() TESTS
// =============================================================================

describe("getModByUniqueName", () => {
  it("roundtrips a known mod through name -> uniqueName -> lookup", () => {
    const serration = getModByName("Serration");
    expect(serration).toBeDefined();
    const found = getModByUniqueName(serration!.uniqueName);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Serration");
  });

  it("returns undefined for unknown unique name", () => {
    expect(getModByUniqueName("/Nonexistent/Path")).toBeUndefined();
  });
});

describe("getModByName", () => {
  it("finds mod by exact name", () => {
    const mod = getModByName("Vitality");
    expect(mod).toBeDefined();
    expect(mod!.name).toBe("Vitality");
  });

  it("finds mod case-insensitively", () => {
    const mod = getModByName("vitality");
    expect(mod).toBeDefined();
    expect(mod!.name).toBe("Vitality");
  });

  it("returns undefined for unknown mod", () => {
    expect(getModByName("Nonexistent Mod Name 12345")).toBeUndefined();
  });
});

// =============================================================================
// getModFamily() TESTS
// =============================================================================

describe("getModFamily", () => {
  it("returns family for known mod", () => {
    const serration = getModByName("Serration");
    expect(serration).toBeDefined();
    expect(getModFamily(serration!)).toBe("Serration");
  });

  it("returns base name for Primed variant", () => {
    // Primed Continuity -> family "Continuity"
    const mod = getModByName("Primed Continuity");
    if (mod) {
      expect(getModFamily(mod)).toBe("Continuity");
    }
  });

  it("returns null for mod with no family", () => {
    // A mod that isn't in any family and has no variant prefix
    const mod = getModByName("Hellfire");
    if (mod) {
      expect(getModFamily(mod)).toBeNull();
    }
  });
});

// =============================================================================
// canAddModToBuild() TESTS
// =============================================================================

describe("canAddModToBuild", () => {
  it("allows mod with no family conflicts", () => {
    const vitality = getModByName("Vitality")!;
    const serration = getModByName("Serration")!;
    expect(canAddModToBuild(vitality, [serration])).toBe(true);
  });

  it("blocks exact duplicate", () => {
    const vitality = getModByName("Vitality")!;
    expect(canAddModToBuild(vitality, [vitality])).toBe(false);
  });

  it("blocks family conflict (Primed variant)", () => {
    const continuity = getModByName("Continuity");
    const primedContinuity = getModByName("Primed Continuity");
    if (continuity && primedContinuity) {
      expect(canAddModToBuild(primedContinuity, [continuity])).toBe(false);
    }
  });

  it("allows mod to empty build", () => {
    const vitality = getModByName("Vitality")!;
    expect(canAddModToBuild(vitality, [])).toBe(true);
  });
});

// =============================================================================
// getModsForItem() TESTS
// =============================================================================

describe("getModsForItem", () => {
  it("returns rifle mods for a rifle item", () => {
    const mods = getModsForItem({ type: "Rifle" });
    expect(mods.length).toBeGreaterThan(5);
    const names = mods.map((m) => m.name);
    expect(names).toContain("Serration");
  });

  it("returns pistol mods for a pistol item", () => {
    const mods = getModsForItem({ type: "Pistol" });
    expect(mods.length).toBeGreaterThan(5);
  });

  it("returns melee mods for a melee item", () => {
    const mods = getModsForItem({ type: "Melee" });
    expect(mods.length).toBeGreaterThan(5);
  });

  it("returns warframe mods including auras for warframe type", () => {
    const mods = getModsForItem({ type: "Warframe" });
    expect(mods.length).toBeGreaterThan(10);
    const names = mods.map((m) => m.name);
    expect(names).toContain("Vitality");
  });

  it("includes augments for named warframe", () => {
    // Ash should have augment mods (e.g., "Seeking Shuriken")
    const mods = getModsForItem({ type: "Warframe", name: "Ash" });
    const augments = mods.filter((m) => m.isAugment);
    expect(augments.length).toBeGreaterThan(0);
  });

  it("includes augments for Prime variant via base name matching", () => {
    const primeMods = getModsForItem({ type: "Warframe", name: "Ash Prime" });
    const baseMods = getModsForItem({ type: "Warframe", name: "Ash" });
    const primeAugments = primeMods.filter((m) => m.isAugment);
    const baseAugments = baseMods.filter((m) => m.isAugment);
    // Prime should get same augments as base
    expect(primeAugments.length).toBe(baseAugments.length);
  });

  it("falls back to category when no type", () => {
    const mods = getModsForItem({ category: "primary" });
    expect(mods.length).toBeGreaterThan(5);
  });

  it("returns empty for item with no type or category", () => {
    expect(getModsForItem({})).toHaveLength(0);
  });

  it("returns shotgun mods for shotgun type", () => {
    const mods = getModsForItem({ type: "Shotgun" });
    expect(mods.length).toBeGreaterThan(5);
  });

  it("returns necramech mods for necramech type", () => {
    const mods = getModsForItem({ type: "Necramech" });
    expect(mods.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// ARCANE TESTS
// =============================================================================

describe("getAllArcanes", () => {
  it("returns non-empty array", () => {
    const arcanes = getAllArcanes();
    expect(arcanes.length).toBeGreaterThan(10);
  });

  it("filters out unnamed arcanes", () => {
    const arcanes = getAllArcanes();
    for (const arcane of arcanes) {
      expect(arcane.name).toBeTruthy();
      expect(arcane.name).not.toBe("Arcane");
    }
  });
});

describe("getArcanesForSlot", () => {
  it("returns warframe arcanes", () => {
    const arcanes = getArcanesForSlot("warframe");
    expect(arcanes.length).toBeGreaterThan(5);
  });
});

describe("getArcaneByUniqueName", () => {
  it("roundtrips a known arcane through name -> uniqueName -> lookup", () => {
    const arcanes = getAllArcanes();
    if (arcanes.length > 0) {
      const arcane = arcanes[0];
      const found = getArcaneByUniqueName(arcane.uniqueName);
      expect(found).toBeDefined();
      expect(found!.name).toBe(arcane.name);
    }
  });

  it("returns undefined for unknown unique name", () => {
    expect(getArcaneByUniqueName("/Nonexistent/Arcane")).toBeUndefined();
  });
});

describe("getArcaneByName", () => {
  it("finds arcane case-insensitively", () => {
    const arcanes = getAllArcanes();
    if (arcanes.length > 0) {
      const name = arcanes[0].name;
      const found = getArcaneByName(name.toLowerCase());
      expect(found).toBeDefined();
      expect(found!.name).toBe(name);
    }
  });

  it("returns undefined for unknown arcane", () => {
    expect(getArcaneByName("Nonexistent Arcane 12345")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/mods.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/mods.test.ts
git commit -m "test: add mods service tests (polarity, queries, families, conflicts, arcanes)"
```

---

## Task 9: Helminth Tests

**Files:**
- Create: `src/lib/warframe/__tests__/helminth.test.ts`

This test reads real JSON data. It verifies that the Helminth ability resolver correctly finds native Helminth abilities and subsumable abilities from other warframes.

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from "bun:test";
import { getHelminthAbilities, SUBSUMABLE_ABILITIES } from "../helminth";

// =============================================================================
// getHelminthAbilities() TESTS
// =============================================================================

describe("getHelminthAbilities", () => {
  it("returns a non-empty array", () => {
    const abilities = getHelminthAbilities();
    expect(abilities.length).toBeGreaterThan(10);
  });

  it("includes native Helminth abilities (source: Helminth)", () => {
    const abilities = getHelminthAbilities();
    const native = abilities.filter((a) => a.source === "Helminth");
    expect(native.length).toBeGreaterThan(0);
  });

  it("includes subsumable abilities from warframes", () => {
    const abilities = getHelminthAbilities();
    // Roar from Rhino should be present
    const roar = abilities.find((a) => a.name === "Roar");
    expect(roar).toBeDefined();
    expect(roar!.source).toBe("Rhino");
  });

  it("includes Eclipse from Mirage", () => {
    const abilities = getHelminthAbilities();
    const eclipse = abilities.find((a) => a.name === "Eclipse");
    expect(eclipse).toBeDefined();
    expect(eclipse!.source).toBe("Mirage");
  });

  it("has required fields on all abilities", () => {
    const abilities = getHelminthAbilities();
    for (const ability of abilities) {
      expect(ability.uniqueName).toBeTruthy();
      expect(ability.name).toBeTruthy();
      expect(ability.source).toBeTruthy();
    }
  });

  it("is sorted alphabetically by name", () => {
    const abilities = getHelminthAbilities();
    for (let i = 1; i < abilities.length; i++) {
      expect(abilities[i].name.localeCompare(abilities[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
  });

  it("has no duplicate ability names from different sources", () => {
    const abilities = getHelminthAbilities();
    const nameCount = new Map<string, number>();
    for (const a of abilities) {
      nameCount.set(a.name, (nameCount.get(a.name) ?? 0) + 1);
    }
    // Each ability should appear once (Helminth native abilities have unique names)
    for (const [name, count] of nameCount) {
      if (count > 1) {
        // This is acceptable only if they come from different sources
        // (e.g., native Helminth + subsumable shouldn't overlap)
        const sources = abilities.filter((a) => a.name === name).map((a) => a.source);
        const uniqueSources = new Set(sources);
        expect(uniqueSources.size).toBe(count);
      }
    }
  });
});

describe("SUBSUMABLE_ABILITIES", () => {
  it("maps warframe names to ability names", () => {
    expect(SUBSUMABLE_ABILITIES["Rhino"]).toBe("Roar");
    expect(SUBSUMABLE_ABILITIES["Mirage"]).toBe("Eclipse");
    expect(SUBSUMABLE_ABILITIES["Wisp"]).toBe("Breach Surge");
  });

  it("has more than 40 entries", () => {
    expect(Object.keys(SUBSUMABLE_ABILITIES).length).toBeGreaterThan(40);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
bun test src/lib/warframe/__tests__/helminth.test.ts
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/warframe/__tests__/helminth.test.ts
git commit -m "test: add helminth ability resolver tests"
```

---

## Task 10: Run Full Test Suite

- [ ] **Step 1: Run all tests together**

```bash
bun test
```

Expected: all 13 test files pass (4 existing + 9 new)

- [ ] **Step 2: Check coverage**

```bash
bun test:coverage
```

Review output to see improvement. No target threshold — just verify the new files are counted.

- [ ] **Step 3: Final commit if any fixups were needed**

```bash
git status
# If clean, no commit needed
```
