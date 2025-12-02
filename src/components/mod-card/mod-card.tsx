"use client";

import Image from "next/image";
import { getImageUrl } from "@/lib/warframe/images";
import { cn } from "@/lib/utils";
import { PolarityIcon } from "@/components/icons";
import type { Mod } from "@/lib/warframe/types";

// =============================================================================
// RARITY STYLES
// =============================================================================

type ModRarity = "Common" | "Uncommon" | "Rare" | "Legendary" | "Peculiar";

// Background gradients matching Warframe's mod card colors
const RARITY_BACKGROUNDS: Record<ModRarity, string> = {
  Common: "from-amber-900/80 via-amber-950/60 to-stone-950/80",
  Uncommon: "from-slate-400/30 via-slate-600/40 to-slate-900/60",
  Rare: "from-yellow-500/40 via-yellow-700/30 to-amber-950/60",
  Legendary: "from-white/20 via-slate-300/15 to-slate-800/40",
  Peculiar: "from-purple-500/40 via-purple-800/30 to-slate-950/60",
};

// Border/frame colors
const RARITY_BORDERS: Record<ModRarity, string> = {
  Common: "border-amber-700/60",
  Uncommon: "border-slate-400/50",
  Rare: "border-yellow-500/60",
  Legendary: "border-white/40",
  Peculiar: "border-purple-500/60",
};

// Accent glow colors for active/hover states
const RARITY_GLOWS: Record<ModRarity, string> = {
  Common: "shadow-amber-700/30",
  Uncommon: "shadow-slate-400/30",
  Rare: "shadow-yellow-500/40",
  Legendary: "shadow-white/30",
  Peculiar: "shadow-purple-500/40",
};

// Top border accent (the distinctive colored bar at the top)
const RARITY_TOP_ACCENT: Record<ModRarity, string> = {
  Common: "from-amber-600 via-amber-700 to-amber-800",
  Uncommon: "from-slate-300 via-slate-400 to-slate-500",
  Rare: "from-yellow-400 via-yellow-500 to-yellow-600",
  Legendary: "from-white via-slate-200 to-slate-300",
  Peculiar: "from-purple-400 via-purple-500 to-purple-600",
};

// =============================================================================
// MOD CARD COMPONENT
// =============================================================================

export type ModCardSize = "compact" | "large";

export interface ModCardProps {
  mod: Mod;
  size?: ModCardSize;
  rank?: number; // Current rank (0 to fusionLimit)
  isSelected?: boolean;
  isDisabled?: boolean;
  showStats?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ModCard({
  mod,
  size = "compact",
  rank,
  isSelected = false,
  isDisabled = false,
  showStats = true,
  onClick,
  className,
}: ModCardProps) {
  const rarity = (mod.rarity as ModRarity) ?? "Common";
  const currentRank = rank ?? mod.fusionLimit;
  const maxRank = mod.fusionLimit;

  if (size === "large") {
    return (
      <LargeModCard
        mod={mod}
        rarity={rarity}
        currentRank={currentRank}
        maxRank={maxRank}
        isSelected={isSelected}
        isDisabled={isDisabled}
        showStats={showStats}
        onClick={onClick}
        className={className}
      />
    );
  }

  return (
    <CompactModCard
      mod={mod}
      rarity={rarity}
      currentRank={currentRank}
      maxRank={maxRank}
      isSelected={isSelected}
      isDisabled={isDisabled}
      onClick={onClick}
      className={className}
    />
  );
}

// =============================================================================
// COMPACT MOD CARD ASSET PATHS
// =============================================================================

// Map rarity to asset folder and prefix
const RARITY_ASSET_MAP: Record<ModRarity, { folder: string; prefix: string }> =
  {
    Common: { folder: "common", prefix: "Bronze" },
    Uncommon: { folder: "uncommon", prefix: "Silver" },
    Rare: { folder: "rare", prefix: "Gold" },
    Legendary: { folder: "legendary", prefix: "Legendary" },
    Peculiar: { folder: "legendary", prefix: "Legendary" }, // Peculiar uses Legendary assets
  };

function getModAssetUrl(rarity: ModRarity, asset: string): string {
  const { folder, prefix } = RARITY_ASSET_MAP[rarity];
  return `/mod-components/${folder}/${prefix}${asset}.png`;
}

// =============================================================================
// COMPACT MOD CARD (Horizontal bar style, using real assets)
// =============================================================================

interface InternalModCardProps {
  mod: Mod;
  rarity: ModRarity;
  currentRank: number;
  maxRank: number;
  isSelected: boolean;
  isDisabled: boolean;
  showStats?: boolean;
  onClick?: () => void;
  className?: string;
}

function CompactModCard({
  mod,
  rarity,
  currentRank,
  maxRank,
  isSelected,
  isDisabled,
  onClick,
  className,
}: InternalModCardProps) {
  return (
    <div className="relative w-[310px] h-[100px] flex items-center justify-center">
      {/* Mod Image */}
      <div className="absolute top-2 left-8.5 right-8.5 -bottom-4 z-10 overflow-hidden">
        <Image
          src={getImageUrl(mod.imageName)}
          alt={mod.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Top Frame */}
      <img
        src={getModAssetUrl(rarity, "FrameTop")}
        alt="Top Frame"
        className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
      />

      {/* Bottom Frame */}
      <img
        src={getModAssetUrl(rarity, "FrameBottom")}
        alt="Bottom Frame"
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20"
      />
    </div>
  );
}

// =============================================================================
// LARGE MOD CARD (Vertical, like in-game)
// =============================================================================

function LargeModCard({
  mod,
  rarity,
  currentRank,
  maxRank,
  isSelected,
  isDisabled,
  showStats,
  onClick,
  className,
}: InternalModCardProps) {
  // Parse the first stat from levelStats if available
  const currentStats = mod.levelStats?.[currentRank]?.stats ?? [];

  return (
    <div
      onClick={isDisabled ? undefined : onClick}
      className={cn(
        "relative flex flex-col rounded-lg transition-all group overflow-hidden",
        "border-2 bg-gradient-to-b",
        RARITY_BACKGROUNDS[rarity],
        RARITY_BORDERS[rarity],
        onClick && !isDisabled && "cursor-pointer hover:scale-[1.02]",
        isSelected && cn("ring-2 ring-primary shadow-xl", RARITY_GLOWS[rarity]),
        isDisabled && "opacity-50 grayscale cursor-not-allowed",
        "w-[128px]",
        className
      )}
    >
      {/* Top Accent Bar */}
      <div
        className={cn(
          "h-1.5 w-full bg-gradient-to-r",
          RARITY_TOP_ACCENT[rarity]
        )}
      />

      {/* Header: Polarity & Drain */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-1">
          {mod.polarity && mod.polarity !== "universal" && (
            <PolarityIcon polarity={mod.polarity} size="sm" />
          )}
        </div>
        <span className="text-xs font-bold text-white/90">{mod.baseDrain}</span>
      </div>

      {/* Mod Image */}
      <div className="relative w-full aspect-square bg-black/20 overflow-hidden">
        <Image
          src={getImageUrl(mod.imageName)}
          alt={mod.name}
          fill
          className="object-contain p-2"
        />
        {/* Corner lights effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={cn(
              "absolute top-0 left-0 w-6 h-6 bg-gradient-to-br opacity-30",
              rarity === "Common" && "from-amber-500/50",
              rarity === "Uncommon" && "from-slate-300/50",
              rarity === "Rare" && "from-yellow-400/50",
              rarity === "Legendary" && "from-white/50",
              rarity === "Peculiar" && "from-purple-400/50"
            )}
          />
          <div
            className={cn(
              "absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl opacity-30",
              rarity === "Common" && "from-amber-500/50",
              rarity === "Uncommon" && "from-slate-300/50",
              rarity === "Rare" && "from-yellow-400/50",
              rarity === "Legendary" && "from-white/50",
              rarity === "Peculiar" && "from-purple-400/50"
            )}
          />
        </div>
      </div>

      {/* Mod Name */}
      <div className="px-2 py-1.5 text-center">
        <span className="text-xs font-semibold text-white leading-tight line-clamp-2">
          {mod.name}
        </span>
      </div>

      {/* Stats (if enabled) */}
      {showStats && currentStats.length > 0 && (
        <div className="px-2 pb-1.5">
          <div className="text-[10px] text-white/70 text-center leading-tight line-clamp-2">
            {currentStats[0]}
          </div>
        </div>
      )}

      {/* Rank Pips */}
      <div className="px-2 pb-2">
        <RankPips currentRank={currentRank} maxRank={maxRank} size="md" />
      </div>

      {/* Bottom Accent */}
      <div
        className={cn(
          "h-0.5 w-full bg-gradient-to-r opacity-60",
          RARITY_TOP_ACCENT[rarity]
        )}
      />
    </div>
  );
}

// =============================================================================
// RANK PIPS COMPONENT
// =============================================================================

interface RankPipsProps {
  currentRank: number;
  maxRank: number;
  size?: "xs" | "sm" | "md";
}

function RankPips({ currentRank, maxRank, size = "sm" }: RankPipsProps) {
  if (maxRank === 0) return null;

  const pipSize =
    size === "xs" ? "w-1 h-1" : size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const gap = size === "xs" ? "gap-[2px]" : size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div className={cn("flex items-center justify-center", gap)}>
      {Array.from({ length: maxRank }).map((_, i) => (
        <div
          key={i}
          className={cn(
            pipSize,
            "rounded-full transition-colors",
            i < currentRank
              ? "bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.6)]"
              : "bg-white/20 border border-white/10"
          )}
        />
      ))}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { RankPips };
export type { ModRarity };
