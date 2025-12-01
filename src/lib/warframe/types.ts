// Warframe item types for browseable equipment
// Based on @wfcd/items type definitions

export type BrowseCategory =
  | "warframes"
  | "primary"
  | "secondary"
  | "melee"
  | "necramechs"
  | "companions";

export type WfcdCategory =
  | "Warframes"
  | "Primary"
  | "Secondary"
  | "Melee"
  | "Sentinels"
  | "Pets";

// Base item interface with common fields
export interface BaseItem {
  uniqueName: string;
  name: string;
  description?: string;
  imageName?: string;
  category?: string;
  tradable: boolean;
  masteryReq?: number;
  buildPrice?: number;
  buildTime?: number;
  isPrime?: boolean;
  vaulted?: boolean;
  releaseDate?: string;
  wikiaUrl?: string;
  wikiaThumbnail?: string;
}

// Warframe-specific fields
export interface Warframe extends BaseItem {
  health: number;
  shield: number;
  armor: number;
  power: number;
  sprintSpeed?: number;
  abilities?: Ability[];
  aura?: string;
  passiveDescription?: string;
  sex?: "Male" | "Female";
  exalted?: string[];
}

export interface Ability {
  uniqueName: string;
  name: string;
  description: string;
  imageName?: string;
}

// Weapon base interface
export interface Weapon extends BaseItem {
  slot?: number;
  totalDamage?: number;
  fireRate?: number;
  criticalChance?: number;
  criticalMultiplier?: number;
  procChance?: number;
  accuracy?: number;
  damage?: DamageTypes;
  disposition?: number;
  noise?: "Alarming" | "Silent";
  trigger?: string;
  attacks?: Attack[];
  polarities?: string[];
}

export interface DamageTypes {
  impact?: number;
  puncture?: number;
  slash?: number;
  heat?: number;
  cold?: number;
  electricity?: number;
  toxin?: number;
  blast?: number;
  radiation?: number;
  gas?: number;
  magnetic?: number;
  viral?: number;
  corrosive?: number;
  void?: number;
  tau?: number;
}

export interface Attack {
  name: string;
  speed?: number;
  crit_chance?: number;
  crit_mult?: number;
  status_chance?: number;
  damage?: DamageTypes | string;
}

// Gun-specific (Primary/Secondary)
export interface Gun extends Weapon {
  magazineSize?: number;
  reloadTime?: number;
  ammo?: number;
  multishot?: number;
  flight?: number | string;
  projectile?: "Hitscan" | "Projectile" | "Thrown" | "Discharge";
}

// Melee-specific
export interface Melee extends Weapon {
  stancePolarity?: string;
  blockingAngle?: number;
  comboDuration?: number;
  followThrough?: number;
  range?: number;
  slamAttack?: number;
  slamRadialDamage?: number;
  slamRadius?: number;
  slideAttack?: number;
  heavyAttackDamage?: number;
  heavySlamAttack?: number;
  heavySlamRadialDamage?: number;
  heavySlamRadius?: number;
  windUp?: number;
}

// Necramech
export interface Necramech extends BaseItem {
  health: number;
  shield: number;
  armor: number;
  abilities?: Ability[];
}

// Companion (Sentinels + Pets)
export interface Companion extends BaseItem {
  health?: number;
  shield?: number;
  armor?: number;
  power?: number;
  type?: string;
}

// Union type for all browseable items
export type BrowseableItem = Warframe | Gun | Melee | Necramech | Companion;

// Simplified item for grid display
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
}

// Filter options for browse page
export interface BrowseFilters {
  category: BrowseCategory;
  query?: string;
  masteryMax?: number;
  primeOnly?: boolean;
  hideVaulted?: boolean;
}
