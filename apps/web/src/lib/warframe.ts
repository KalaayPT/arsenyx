/**
 * Minimal client-side warframe helpers. The heavy data loading lives at
 * build time in legacy/scripts/build-items-index.ts — the frontend only
 * needs enough to render cards and link to detail pages.
 */

const WFCD_CDN_BASE = "https://cdn.warframestat.us/img";

const PLACEHOLDER_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect fill='%23374151' width='128' height='128' rx='8'/%3E%3Ctext x='64' y='72' text-anchor='middle' fill='%236b7280' font-family='system-ui' font-size='48' font-weight='bold'%3E%3F%3C/text%3E%3C/svg%3E";

export function getImageUrl(imageName?: string): string {
  if (!imageName) return PLACEHOLDER_URL;
  return `${WFCD_CDN_BASE}/${imageName}`;
}

export function getItemUrl(category: string, slug: string): string {
  return `/browse/${category}/${slug}`;
}

export type BrowseCategory =
  | "warframes"
  | "primary"
  | "secondary"
  | "melee"
  | "necramechs"
  | "companions"
  | "companion-weapons"
  | "exalted-weapons"
  | "archwing";

export interface BrowseItem {
  uniqueName: string;
  name: string;
  slug: string;
  category: BrowseCategory;
  imageName?: string;
  masteryReq?: number;
  isPrime?: boolean;
  vaulted?: boolean;
  type?: string;
  releaseDate?: string;
}

export type ItemsIndex = Partial<Record<BrowseCategory, BrowseItem[]>>;

export const CATEGORIES: { id: BrowseCategory; label: string }[] = [
  { id: "warframes", label: "Warframes" },
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
  { id: "melee", label: "Melee" },
  { id: "companions", label: "Companions" },
  { id: "companion-weapons", label: "Companion Weapons" },
  { id: "archwing", label: "Archwing" },
  { id: "necramechs", label: "Necramechs" },
  { id: "exalted-weapons", label: "Exalted" },
];

export function isValidCategory(value: string): value is BrowseCategory {
  return CATEGORIES.some((c) => c.id === value);
}
