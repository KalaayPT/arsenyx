"use client";

import { useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/warframe/images";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { calculateSlotDrain, getSlotPolarity } from "@/lib/warframe/capacity";
import type { ModSlot, Polarity } from "@/lib/warframe/types";

interface ModGridProps {
  auraSlot?: ModSlot;
  exilusSlot: ModSlot;
  normalSlots: ModSlot[];
  activeSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onRemoveMod: (slotId: string) => void;
  onApplyForma: (slotId: string, polarity: Polarity) => void;
  isWarframe: boolean;
}

export function ModGrid({
  auraSlot,
  exilusSlot,
  normalSlots,
  activeSlotId,
  onSelectSlot,
  onRemoveMod,
  isWarframe,
}: ModGridProps) {
  const [activeGridTab, setActiveGridTab] = useState<"mods" | "shards">("mods");

  return (
    <div className="flex flex-col h-full">
      {/* Mods / Shards Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveGridTab("mods")}
          className={cn(
            "text-sm font-medium pb-1 border-b-2 transition-colors",
            activeGridTab === "mods"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Mods
        </button>
        <button
          onClick={() => setActiveGridTab("shards")}
          className={cn(
            "text-sm font-medium pb-1 border-b-2 transition-colors",
            activeGridTab === "shards"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Shards
        </button>
      </div>

      {activeGridTab === "mods" ? (
        <div className="flex flex-col gap-3">
          {/* Row 1: Aura + 2 Normal Slots */}
          <div className="grid grid-cols-4 gap-2">
            {isWarframe && auraSlot ? (
              <ModSlotCard
                slot={auraSlot}
                isActive={activeSlotId === auraSlot.id}
                onSelect={() => onSelectSlot(auraSlot.id)}
                onRemove={() => onRemoveMod(auraSlot.id)}
              />
            ) : (
              <div className="aspect-[3/4]" />
            )}
            <ModSlotCard
              slot={normalSlots[0]}
              isActive={activeSlotId === normalSlots[0]?.id}
              onSelect={() => onSelectSlot(normalSlots[0]?.id)}
              onRemove={() => onRemoveMod(normalSlots[0]?.id)}
            />
            <ModSlotCard
              slot={normalSlots[1]}
              isActive={activeSlotId === normalSlots[1]?.id}
              onSelect={() => onSelectSlot(normalSlots[1]?.id)}
              onRemove={() => onRemoveMod(normalSlots[1]?.id)}
            />
            <div className="aspect-[3/4]" /> {/* Empty slot */}
          </div>

          {/* Row 2: 4 Normal Slots with polarity indicators */}
          <div className="grid grid-cols-4 gap-2">
            <ModSlotCard
              slot={normalSlots[2]}
              isActive={activeSlotId === normalSlots[2]?.id}
              onSelect={() => onSelectSlot(normalSlots[2]?.id)}
              onRemove={() => onRemoveMod(normalSlots[2]?.id)}
              showPolarityCorner="bottom-left"
            />
            <ModSlotCard
              slot={normalSlots[3]}
              isActive={activeSlotId === normalSlots[3]?.id}
              onSelect={() => onSelectSlot(normalSlots[3]?.id)}
              onRemove={() => onRemoveMod(normalSlots[3]?.id)}
              showPolarityCorner="top-right"
            />
            <ModSlotCard
              slot={normalSlots[4]}
              isActive={activeSlotId === normalSlots[4]?.id}
              onSelect={() => onSelectSlot(normalSlots[4]?.id)}
              onRemove={() => onRemoveMod(normalSlots[4]?.id)}
            />
            <ModSlotCard
              slot={normalSlots[5]}
              isActive={activeSlotId === normalSlots[5]?.id}
              onSelect={() => onSelectSlot(normalSlots[5]?.id)}
              onRemove={() => onRemoveMod(normalSlots[5]?.id)}
            />
          </div>

          {/* Row 3: 3 Normal Slots + 1 empty */}
          <div className="grid grid-cols-4 gap-2">
            <ModSlotCard
              slot={normalSlots[6]}
              isActive={activeSlotId === normalSlots[6]?.id}
              onSelect={() => onSelectSlot(normalSlots[6]?.id)}
              onRemove={() => onRemoveMod(normalSlots[6]?.id)}
              showPolarityCorner="bottom-left"
            />
            <ModSlotCard
              slot={normalSlots[7]}
              isActive={activeSlotId === normalSlots[7]?.id}
              onSelect={() => onSelectSlot(normalSlots[7]?.id)}
              onRemove={() => onRemoveMod(normalSlots[7]?.id)}
            />
            <div className="aspect-[3/4]" />
            <div className="aspect-[3/4]" />
          </div>

          {/* Row 4: Exilus slots (centered) */}
          <div className="grid grid-cols-4 gap-2">
            <div className="aspect-[3/4]" />
            <ModSlotCard
              slot={exilusSlot}
              isActive={activeSlotId === exilusSlot.id}
              onSelect={() => onSelectSlot(exilusSlot.id)}
              onRemove={() => onRemoveMod(exilusSlot.id)}
            />
            <ModSlotCard
              slot={{ id: "exilus-1", type: "exilus" }}
              isActive={false}
              onSelect={() => {}}
              onRemove={() => {}}
            />
            <div className="aspect-[3/4]" />
          </div>
        </div>
      ) : (
        /* Shards Tab Content */
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p className="text-sm">Archon Shards coming soon</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MOD SLOT CARD COMPONENT
// =============================================================================

interface ModSlotCardProps {
  slot: ModSlot;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  showPolarityCorner?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
}

function ModSlotCard({
  slot,
  isActive,
  onSelect,
  onRemove,
  showPolarityCorner,
}: ModSlotCardProps) {
  const hasMod = !!slot.mod;
  const polarity = getSlotPolarity(slot);
  const drain = hasMod ? calculateSlotDrain(slot) : 0;

  // Position classes for polarity indicator
  const polarityPositionClasses: Record<string, string> = {
    "top-left": "top-0 left-0 -translate-x-1/3 -translate-y-1/3",
    "top-right": "top-0 right-0 translate-x-1/3 -translate-y-1/3",
    "bottom-left": "bottom-0 left-0 -translate-x-1/3 translate-y-1/3",
    "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/3",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative aspect-[3/4] flex flex-col items-center justify-center cursor-pointer transition-all rounded-lg",
              "border border-border/50 hover:border-primary/50 bg-muted/20",
              isActive && "border-primary ring-1 ring-primary/30",
              !hasMod && "border-dashed"
            )}
            onClick={onSelect}
            onContextMenu={(e: React.MouseEvent) => {
              e.preventDefault();
              if (hasMod) onRemove();
            }}
          >
            {/* Polarity Indicator in corner */}
            {polarity && showPolarityCorner && (
              <div
                className={cn(
                  "absolute z-10",
                  polarityPositionClasses[showPolarityCorner]
                )}
              >
                <PolarityIcon polarity={polarity} className="text-sm" />
              </div>
            )}

            {hasMod ? (
              <>
                {/* Mod Image */}
                <div className="relative w-full h-full p-1">
                  <Image
                    src={getImageUrl(slot.mod!.imageName)}
                    alt={slot.mod!.name}
                    fill
                    className="object-contain p-1"
                  />
                </div>

                {/* Drain Badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "absolute bottom-1 right-1 text-[9px] px-1 py-0 h-4",
                    polarity &&
                      slot.mod!.polarity === polarity &&
                      "bg-green-500/20 text-green-600",
                    polarity &&
                      slot.mod!.polarity !== polarity &&
                      "bg-red-500/20 text-red-600"
                  )}
                >
                  {drain}
                </Badge>
              </>
            ) : /* Empty slot with subtle polarity indicator */
            polarity && !showPolarityCorner ? (
              <PolarityIcon
                polarity={polarity}
                className="text-lg opacity-30"
              />
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {hasMod ? (
            <div className="text-sm">
              <p className="font-medium">{slot.mod!.name}</p>
              <p className="text-muted-foreground">
                Rank {slot.mod!.rank}/{slot.mod!.fusionLimit} • Drain: {drain}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Right-click to remove
              </p>
            </div>
          ) : (
            <p>Click to add a mod</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// POLARITY ICON COMPONENT
// =============================================================================

interface PolarityIconProps {
  polarity: Polarity;
  className?: string;
}

function PolarityIcon({ polarity, className }: PolarityIconProps) {
  const iconMap: Record<Polarity, string> = {
    madurai: "V", // Damage
    vazarin: "D", // Defense
    naramon: "—", // Utility (dash)
    zenurik: "=", // Energy
    unairu: "R", // Resistance
    penjaga: "Y", // Sentinel
    umbra: "Ω", // Umbra (omega)
    universal: "○", // Universal (circle)
  };

  const colorMap: Record<Polarity, string> = {
    madurai: "text-orange-500",
    vazarin: "text-blue-500",
    naramon: "text-green-500",
    zenurik: "text-yellow-500",
    unairu: "text-purple-500",
    penjaga: "text-cyan-500",
    umbra: "text-amber-600",
    universal: "text-gray-400",
  };

  return (
    <span className={cn("font-bold", colorMap[polarity], className)}>
      {iconMap[polarity]}
    </span>
  );
}

export { PolarityIcon };
