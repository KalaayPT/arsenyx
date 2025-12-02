"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ItemSidebar } from "./item-sidebar";
import { ModGrid } from "./mod-grid";
import { ModSearchPanel } from "./mod-search-panel";
import { useBuildKeyboard } from "./use-build-keyboard";
import { getCapacityStatus } from "@/lib/warframe/capacity";
import { copyBuildToClipboard } from "@/lib/build-codec";
import type {
  BuildState,
  ModSlot,
  PlacedMod,
  Polarity,
  BrowseCategory,
  BrowseableItem,
  Mod,
} from "@/lib/warframe/types";

interface BuildContainerProps {
  item: BrowseableItem;
  category: BrowseCategory;
  categoryLabel: string;
  compatibleMods: Mod[];
  importedBuild?: Partial<BuildState>;
}

// Create initial mod slots
function createInitialSlots(): ModSlot[] {
  // In the future, different categories may have different default polarities
  return Array.from({ length: 8 }, (_, i) => ({
    id: `normal-${i}`,
    type: "normal" as const,
  }));
}

// Create initial build state
function createInitialBuildState(
  item: BrowseableItem,
  category: BrowseCategory,
  importedBuild?: Partial<BuildState>
): BuildState {
  const isWarframe = category === "warframes" || category === "necramechs";

  const baseState: BuildState = {
    itemUniqueName: item.uniqueName,
    itemName: item.name,
    itemCategory: category,
    itemImageName: item.imageName,
    hasReactor: false,
    exilusSlot: { id: "exilus-0", type: "exilus" },
    normalSlots: createInitialSlots(),
    arcaneSlots: [],
    baseCapacity: 30,
    currentCapacity: 30,
  };

  // Add aura slot for warframes
  if (isWarframe) {
    baseState.auraSlot = { id: "aura-0", type: "aura" };
    baseState.arcaneSlots = [];
  }

  // Apply imported build data if available
  if (importedBuild) {
    return {
      ...baseState,
      ...importedBuild,
      // Ensure these are always from base state
      itemUniqueName: item.uniqueName,
      itemName: item.name,
      itemCategory: category,
      itemImageName: item.imageName,
    };
  }

  return baseState;
}

// Local storage key for auto-save
const STORAGE_KEY_PREFIX = "arsenix_build_";

export function BuildContainer({
  item,
  category,
  categoryLabel: _categoryLabel,
  compatibleMods,
  importedBuild,
}: BuildContainerProps) {
  // Build state
  const [buildState, setBuildState] = useState<BuildState>(() =>
    createInitialBuildState(item, category, importedBuild)
  );

  // Active slot for mod placement
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  // Search panel visibility
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Copy notification
  const [showCopied, setShowCopied] = useState(false);

  // Calculate capacity
  const capacityStatus = getCapacityStatus(buildState);

  // Auto-save to localStorage
  useEffect(() => {
    const key = `${STORAGE_KEY_PREFIX}${item.uniqueName}`;
    try {
      localStorage.setItem(key, JSON.stringify(buildState));
    } catch {
      // Ignore storage errors
    }
  }, [buildState, item.uniqueName]);

  // Load from localStorage on mount
  useEffect(() => {
    if (importedBuild) return; // Don't override imported builds

    const key = `${STORAGE_KEY_PREFIX}${item.uniqueName}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBuildState((prev) => ({
          ...prev,
          ...parsed,
          // Always use current item info
          itemUniqueName: item.uniqueName,
          itemName: item.name,
          itemCategory: category,
          itemImageName: item.imageName,
        }));
      }
    } catch {
      // Ignore parse errors
    }
  }, [item.uniqueName, item.name, item.imageName, category, importedBuild]);

  // Toggle reactor/catalyst
  const handleToggleReactor = useCallback(() => {
    setBuildState((prev) => ({
      ...prev,
      hasReactor: !prev.hasReactor,
      baseCapacity: !prev.hasReactor ? 60 : 30,
    }));
  }, []);

  // Select a slot for mod placement
  const handleSelectSlot = useCallback((slotId: string) => {
    setActiveSlotId(slotId);
    setIsSearchOpen(true);
  }, []);

  // Place a mod in the active slot
  const handlePlaceMod = useCallback(
    (mod: Mod, rank: number = mod.fusionLimit) => {
      if (!activeSlotId) return;

      const placedMod: PlacedMod = {
        uniqueName: mod.uniqueName,
        name: mod.name,
        imageName: mod.imageName,
        polarity: mod.polarity,
        baseDrain: mod.baseDrain,
        fusionLimit: mod.fusionLimit,
        rank,
        rarity: mod.rarity,
      };

      setBuildState((prev) => {
        const newState = { ...prev };

        // Find and update the slot
        if (activeSlotId.startsWith("aura") && newState.auraSlot) {
          newState.auraSlot = { ...newState.auraSlot, mod: placedMod };
        } else if (activeSlotId.startsWith("exilus")) {
          newState.exilusSlot = { ...newState.exilusSlot, mod: placedMod };
        } else {
          const slotIndex = parseInt(activeSlotId.replace("normal-", ""));
          if (!isNaN(slotIndex)) {
            newState.normalSlots = [...newState.normalSlots];
            newState.normalSlots[slotIndex] = {
              ...newState.normalSlots[slotIndex],
              mod: placedMod,
            };
          }
        }

        return newState;
      });

      // Auto-advance to next slot
      const currentIndex = parseInt(activeSlotId.replace("normal-", ""));
      if (!isNaN(currentIndex) && currentIndex < 7) {
        setActiveSlotId(`normal-${currentIndex + 1}`);
      } else {
        setIsSearchOpen(false);
        setActiveSlotId(null);
      }
    },
    [activeSlotId]
  );

  // Remove a mod from a slot
  const handleRemoveMod = useCallback((slotId: string) => {
    setBuildState((prev) => {
      const newState = { ...prev };

      if (slotId.startsWith("aura") && newState.auraSlot) {
        newState.auraSlot = { ...newState.auraSlot, mod: undefined };
      } else if (slotId.startsWith("exilus")) {
        newState.exilusSlot = { ...newState.exilusSlot, mod: undefined };
      } else {
        const slotIndex = parseInt(slotId.replace("normal-", ""));
        if (!isNaN(slotIndex)) {
          newState.normalSlots = [...newState.normalSlots];
          newState.normalSlots[slotIndex] = {
            ...newState.normalSlots[slotIndex],
            mod: undefined,
          };
        }
      }

      return newState;
    });
  }, []);

  // Apply forma to a slot
  const handleApplyForma = useCallback((slotId: string, polarity: Polarity) => {
    setBuildState((prev) => {
      const newState = { ...prev };

      if (slotId.startsWith("aura") && newState.auraSlot) {
        newState.auraSlot = { ...newState.auraSlot, formaPolarity: polarity };
      } else if (slotId.startsWith("exilus")) {
        newState.exilusSlot = {
          ...newState.exilusSlot,
          formaPolarity: polarity,
        };
      } else {
        const slotIndex = parseInt(slotId.replace("normal-", ""));
        if (!isNaN(slotIndex)) {
          newState.normalSlots = [...newState.normalSlots];
          newState.normalSlots[slotIndex] = {
            ...newState.normalSlots[slotIndex],
            formaPolarity: polarity,
          };
        }
      }

      return newState;
    });
  }, []);

  // Copy build to clipboard
  const handleCopyBuild = useCallback(async () => {
    const success = await copyBuildToClipboard(buildState);
    if (success) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  }, [buildState]);

  // Clear build
  const handleClearBuild = useCallback(() => {
    setBuildState(createInitialBuildState(item, category));
    setActiveSlotId(null);
    setIsSearchOpen(false);
  }, [item, category]);

  // Get all used mod names for duplicate checking
  const usedModNames = useMemo((): string[] => {
    const names: string[] = [];

    if (buildState.auraSlot?.mod) names.push(buildState.auraSlot.mod.name);
    if (buildState.exilusSlot?.mod) names.push(buildState.exilusSlot.mod.name);

    for (const slot of buildState.normalSlots) {
      if (slot.mod) names.push(slot.mod.name);
    }

    return names;
  }, [buildState]);

  // Keyboard navigation
  const isWarframeOrNecramech =
    category === "warframes" || category === "necramechs";

  useBuildKeyboard({
    isSearchOpen,
    onSelectSlot: handleSelectSlot,
    onOpenSearch: () => setIsSearchOpen(true),
    onCloseSearch: () => {
      setIsSearchOpen(false);
      setActiveSlotId(null);
    },
    onCopyBuild: handleCopyBuild,
    onClearBuild: handleClearBuild,
    onToggleReactor: handleToggleReactor,
    hasAuraSlot: isWarframeOrNecramech,
  });

  return (
    <div className="container py-6">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">New Build: {item.name}</h1>
          <span className="px-2 py-0.5 text-xs bg-muted rounded font-mono">
            ⬡ 5
          </span>
          <span className="px-2 py-0.5 text-xs bg-muted rounded font-mono">
            ⟡ 999,999
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearBuild}
            className="px-3 py-1.5 text-xs border rounded hover:bg-muted transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleCopyBuild}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            {showCopied ? "Copied!" : "Copy Build"}
          </button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Item sidebar with image and stats */}
        <div className="lg:col-span-2">
          <ItemSidebar
            buildState={buildState}
            capacityStatus={capacityStatus}
            onToggleReactor={handleToggleReactor}
            onCopyBuild={handleCopyBuild}
            onClearBuild={handleClearBuild}
            showCopied={showCopied}
          />
        </div>

        {/* Center: Mod grid */}
        <div className="lg:col-span-6">
          <ModGrid
            auraSlot={buildState.auraSlot}
            exilusSlot={buildState.exilusSlot}
            normalSlots={buildState.normalSlots}
            activeSlotId={activeSlotId}
            onSelectSlot={handleSelectSlot}
            onRemoveMod={handleRemoveMod}
            onApplyForma={handleApplyForma}
            isWarframe={isWarframeOrNecramech}
          />
        </div>

        {/* Right: Mod search panel (always visible) */}
        <div className="lg:col-span-4 h-[600px]">
          <ModSearchPanel
            isOpen={true}
            onClose={() => setIsSearchOpen(false)}
            onSelectMod={handlePlaceMod}
            availableMods={compatibleMods}
            slotType={getSlotType(activeSlotId)}
            usedModNames={usedModNames}
          />
        </div>
      </div>
    </div>
  );
}

// Helper to determine slot type from slot ID
function getSlotType(
  slotId: string | null
): "aura" | "exilus" | "normal" | "arcane" {
  if (!slotId) return "normal";
  if (slotId.startsWith("aura")) return "aura";
  if (slotId.startsWith("exilus")) return "exilus";
  if (slotId.startsWith("arcane")) return "arcane";
  return "normal";
}
