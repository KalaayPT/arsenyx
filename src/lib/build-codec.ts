// Build encoding/decoding utilities
// Encodes builds to shareable base64 URLs and decodes them back

import type {
  BuildState,
  ModSlot,
  Polarity,
  BrowseCategory,
} from "./warframe/types";

// =============================================================================
// BUILD ENCODING
// =============================================================================

interface EncodedBuild {
  v: number; // Version for forward compatibility
  i: string; // Item unique name
  c: string; // Category
  r: boolean; // Has reactor/catalyst
  a?: EncodedSlot; // Aura slot (warframes only)
  e?: EncodedSlot; // Exilus slot
  s: EncodedSlot[]; // Normal slots (8)
  ar?: EncodedArcane[]; // Arcane slots (2)
  n?: string; // Build name
}

interface EncodedSlot {
  p?: string; // Forma polarity (if different from innate)
  m?: EncodedMod; // Placed mod
}

interface EncodedMod {
  u: string; // Unique name
  r: number; // Rank
}

interface EncodedArcane {
  u: string; // Unique name
  r: number; // Rank
}

/**
 * Encode a build state to a base64 string for sharing
 */
export function encodeBuild(state: BuildState): string {
  const encoded: EncodedBuild = {
    v: 1,
    i: state.itemUniqueName,
    c: state.itemCategory,
    r: state.hasReactor,
    s: state.normalSlots.map(encodeSlot),
  };

  // Optional fields
  if (state.auraSlot) {
    encoded.a = encodeSlot(state.auraSlot);
  }

  if (state.exilusSlot?.mod || state.exilusSlot?.formaPolarity) {
    encoded.e = encodeSlot(state.exilusSlot);
  }

  if (state.arcaneSlots?.length > 0) {
    encoded.ar = state.arcaneSlots
      .filter((a) => a)
      .map((a) => ({ u: a.uniqueName, r: a.rank }));
  }

  if (state.buildName) {
    encoded.n = state.buildName;
  }

  // Encode to base64
  const jsonString = JSON.stringify(encoded);

  // Use browser-safe base64 encoding
  if (typeof window !== "undefined") {
    return btoa(encodeURIComponent(jsonString));
  }

  // Node.js environment
  return Buffer.from(jsonString, "utf-8").toString("base64");
}

function encodeSlot(slot: ModSlot): EncodedSlot {
  const encoded: EncodedSlot = {};

  if (slot.formaPolarity) {
    encoded.p = slot.formaPolarity;
  }

  if (slot.mod) {
    encoded.m = {
      u: slot.mod.uniqueName,
      r: slot.mod.rank,
    };
  }

  return encoded;
}

// =============================================================================
// BUILD DECODING
// =============================================================================

/**
 * Decode a base64 string back to a partial build state
 * Returns null if decoding fails
 */
export function decodeBuild(base64String: string): Partial<BuildState> | null {
  try {
    // Decode from base64
    let jsonString: string;

    if (typeof window !== "undefined") {
      jsonString = decodeURIComponent(atob(base64String));
    } else {
      jsonString = Buffer.from(base64String, "base64").toString("utf-8");
    }

    const encoded: EncodedBuild = JSON.parse(jsonString);

    // Validate version
    if (encoded.v !== 1) {
      console.warn(`Unknown build version: ${encoded.v}`);
      return null;
    }

    // Convert back to BuildState
    const state: Partial<BuildState> = {
      itemUniqueName: encoded.i,
      itemCategory: encoded.c as BrowseCategory,
      hasReactor: encoded.r,
      buildName: encoded.n,
    };

    // Decode aura slot
    if (encoded.a) {
      state.auraSlot = decodeSlot(encoded.a, "aura", "aura-0");
    }

    // Decode exilus slot
    if (encoded.e) {
      state.exilusSlot = decodeSlot(encoded.e, "exilus", "exilus-0");
    }

    // Decode normal slots
    if (encoded.s) {
      state.normalSlots = encoded.s.map((s, i) =>
        decodeSlot(s, "normal", `normal-${i}`)
      );
    }

    // Decode arcanes
    if (encoded.ar) {
      state.arcaneSlots = encoded.ar.map((a) => ({
        uniqueName: a.u,
        name: "", // Will be filled by the loader
        rank: a.r,
        rarity: "",
      }));
    }

    return state;
  } catch (error) {
    console.error("Failed to decode build:", error);
    return null;
  }
}

function decodeSlot(
  encoded: EncodedSlot,
  type: "aura" | "exilus" | "normal",
  id: string
): ModSlot {
  const slot: ModSlot = {
    id,
    type,
  };

  if (encoded.p) {
    slot.formaPolarity = encoded.p as Polarity;
  }

  if (encoded.m) {
    slot.mod = {
      uniqueName: encoded.m.u,
      name: "", // Will be filled by the loader
      polarity: "universal" as Polarity, // Will be filled by the loader
      baseDrain: 0,
      fusionLimit: 0,
      rank: encoded.m.r,
      rarity: "",
    };
  }

  return slot;
}

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Generate a shareable URL for a build
 */
export function generateBuildUrl(state: BuildState, baseUrl?: string): string {
  const encoded = encodeBuild(state);
  const base =
    baseUrl || (typeof window !== "undefined" ? window.location.origin : "");

  return `${base}/create?build=${encodeURIComponent(encoded)}`;
}

/**
 * Extract build data from a URL
 */
export function extractBuildFromUrl(url: string): Partial<BuildState> | null {
  try {
    const urlObj = new URL(url);
    const buildParam = urlObj.searchParams.get("build");

    if (!buildParam) return null;

    return decodeBuild(decodeURIComponent(buildParam));
  } catch {
    return null;
  }
}

/**
 * Copy build URL to clipboard
 */
export async function copyBuildToClipboard(
  state: BuildState
): Promise<boolean> {
  try {
    const url = generateBuildUrl(state);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
