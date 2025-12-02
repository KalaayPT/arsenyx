"use client";

import { useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/warframe/images";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BuildState } from "@/lib/warframe/types";
import type { CapacityStatus } from "@/lib/warframe/capacity";

interface ItemSidebarProps {
  buildState: BuildState;
  capacityStatus: CapacityStatus;
  onToggleReactor: () => void;
  onCopyBuild: () => void;
  onClearBuild: () => void;
  showCopied: boolean;
}

// Tab icons for warframe abilities/info
const ABILITY_TABS = [
  { id: "passive", icon: "◈", label: "Passive" },
  { id: "ability1", icon: "①", label: "Ability 1" },
  { id: "ability2", icon: "②", label: "Ability 2" },
  { id: "ability3", icon: "③", label: "Ability 3" },
  { id: "ability4", icon: "④", label: "Ability 4" },
];

export function ItemSidebar({
  buildState,
  capacityStatus,
  onToggleReactor,
}: ItemSidebarProps) {
  const [activeTab, setActiveTab] = useState("passive");
  const imageUrl = getImageUrl(buildState.itemImageName);
  const isWarframeOrNecramech =
    buildState.itemCategory === "warframes" ||
    buildState.itemCategory === "necramechs";

  // Calculate used and max capacity
  const usedCapacity = capacityStatus.max - capacityStatus.remaining;
  const maxCapacity = capacityStatus.max;

  return (
    <div className="flex flex-col gap-0 bg-card rounded-xl border overflow-hidden">
      {/* Item Image */}
      <div className="relative aspect-square w-full bg-gradient-to-b from-muted/30 to-muted/10">
        <Image
          src={imageUrl}
          alt={buildState.itemName}
          fill
          className="object-contain p-4"
          priority
        />
      </div>

      {/* Ability Tabs (Warframes only) */}
      {isWarframeOrNecramech && (
        <div className="flex border-t border-b bg-muted/30">
          {ABILITY_TABS.map((tab) => (
            <TooltipProvider key={tab.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 py-2 text-lg transition-colors hover:bg-muted/50",
                      activeTab === tab.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {tab.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tab.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Reactor Toggle & Capacity */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Reactor</span>
          <button
            onClick={onToggleReactor}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              buildState.hasReactor ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                buildState.hasReactor ? "left-5" : "left-0.5"
              )}
            />
          </button>
        </div>

        {/* Capacity Slider */}
        <div className="space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-200",
                capacityStatus.remaining < 0 ? "bg-destructive" : "bg-primary"
              )}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, (usedCapacity / maxCapacity) * 100)
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-end">
            <span
              className={cn(
                "text-xs font-mono",
                capacityStatus.remaining < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {usedCapacity}/{maxCapacity}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Base Stats */}
      <div className="p-3 space-y-1">
        <StatRow label="Energy" value="251" />
        <StatRow label="Health" value="350" />
        <StatRow label="Shield" value="353" />
        <StatRow label="Sprint Speed" value="1.07" />
      </div>

      <Separator />

      {/* Ability Stats */}
      {isWarframeOrNecramech && (
        <div className="p-3 space-y-1">
          <StatRow label="Duration" value="100%" />
          <StatRow label="Efficiency" value="100%" />
          <StatRow label="Range" value="100%" />
          <StatRow label="Strength" value="100%" />
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
