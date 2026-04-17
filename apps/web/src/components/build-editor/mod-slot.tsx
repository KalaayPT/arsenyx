import { cn } from "@/lib/utils";
import type { Mod, Polarity } from "@arsenyx/shared/warframe/types";

import { ModCard } from "./mod-card";
import { PolarityIcon } from "./polarity-icon";

export type ModSlotKind = "normal" | "aura" | "exilus";

interface ModSlotProps {
  kind?: ModSlotKind;
  /** Pre-forma polarity on the slot itself. */
  slotPolarity?: Polarity;
  mod?: Mod;
  rank?: number;
  active?: boolean;
  onClick?: () => void;
}

const KIND_LABEL: Record<ModSlotKind, string> = {
  normal: "",
  aura: "Aura",
  exilus: "Exilus",
};

/**
 * Build slot tile. Sized to match the legacy editor:
 * 80px (mobile) → 90px (tablet) → 100px (desktop). Filled slot renders a
 * ModCard; empty slot shows slot-polarity stamp + kind label.
 */
export function ModSlot({
  kind = "normal",
  slotPolarity,
  mod,
  rank = 0,
  active,
  onClick,
}: ModSlotProps) {
  if (mod) {
    return (
      <div className="flex items-start justify-center">
        <ModCard mod={mod} rank={rank} onClick={onClick} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "border-muted-foreground/20 bg-muted/20 relative flex h-[80px] w-full flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors",
        "sm:h-[90px] sm:w-[150px] md:h-[100px] md:w-[184px]",
        active && "border-primary bg-primary/10",
        onClick && "hover:border-muted-foreground/50 cursor-pointer",
        !onClick && "cursor-default",
      )}
    >
      {slotPolarity &&
        slotPolarity !== "universal" &&
        slotPolarity !== "any" && (
          <PolarityIcon polarity={slotPolarity} className="size-5" />
        )}
      {KIND_LABEL[kind] && (
        <span className="text-muted-foreground mt-1 text-[10px] font-semibold uppercase tracking-wide">
          {KIND_LABEL[kind]}
        </span>
      )}
    </button>
  );
}
