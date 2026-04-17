import { useCallback, useMemo, useState } from "react";

import type { Mod } from "@arsenyx/shared/warframe/types";

import type { ModSlotKind } from "./mod-slot";

export type SlotId = "aura" | "exilus" | `normal-${number}`;

export function isAuraMod(mod: Mod): boolean {
  return mod.compatName?.toUpperCase() === "AURA";
}

export function isExilusCompatible(mod: Mod): boolean {
  return Boolean(mod.isExilus || mod.isUtility);
}

function slotKind(id: SlotId): ModSlotKind {
  if (id === "aura") return "aura";
  if (id === "exilus") return "exilus";
  return "normal";
}

function canPlaceIn(mod: Mod, id: SlotId): boolean {
  switch (slotKind(id)) {
    case "aura":
      return isAuraMod(mod);
    case "exilus":
      return !isAuraMod(mod) && isExilusCompatible(mod);
    case "normal":
      return !isAuraMod(mod);
  }
}

export interface BuildSlotsState {
  placed: Partial<Record<SlotId, Mod>>;
  usedNames: Set<string>;
  place: (mod: Mod) => void;
  remove: (id: SlotId) => void;
}

export function useBuildSlots(normalSlotCount: number): BuildSlotsState {
  const [placed, setPlaced] = useState<Partial<Record<SlotId, Mod>>>({});

  const place = useCallback(
    (mod: Mod) => {
      setPlaced((prev) => {
        // Disallow duplicate by name — mirrors legacy's usedModNames gate.
        if (Object.values(prev).some((m) => m?.name === mod.name)) return prev;

        const tryIds: SlotId[] = isAuraMod(mod)
          ? ["aura"]
          : isExilusCompatible(mod)
            ? [
                "exilus",
                ...Array.from(
                  { length: normalSlotCount },
                  (_, i) => `normal-${i}` as SlotId,
                ),
              ]
            : Array.from(
                { length: normalSlotCount },
                (_, i) => `normal-${i}` as SlotId,
              );

        for (const id of tryIds) {
          if (!prev[id] && canPlaceIn(mod, id)) {
            return { ...prev, [id]: mod };
          }
        }
        return prev;
      });
    },
    [normalSlotCount],
  );

  const remove = useCallback((id: SlotId) => {
    setPlaced((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const usedNames = useMemo(
    () => new Set(Object.values(placed).map((m) => m!.name)),
    [placed],
  );

  return { placed, usedNames, place, remove };
}
