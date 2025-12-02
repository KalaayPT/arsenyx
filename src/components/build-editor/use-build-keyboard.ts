"use client";

import { useEffect, useCallback } from "react";

interface UseBuildKeyboardOptions {
  isSearchOpen: boolean;
  onSelectSlot: (slotId: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onCopyBuild: () => void;
  onClearBuild: () => void;
  onToggleReactor: () => void;
  hasAuraSlot: boolean;
}

/**
 * Keyboard shortcuts for build editor:
 * - 1-8: Select normal slot
 * - A: Select aura slot (if warframe)
 * - E: Select exilus slot
 * - R: Toggle reactor/catalyst
 * - C: Copy build link
 * - X: Clear build
 * - Enter/Space: Open mod search for selected slot
 * - Escape: Close mod search
 */
export function useBuildKeyboard({
  isSearchOpen,
  onSelectSlot,
  onOpenSearch,
  onCloseSearch,
  onCopyBuild,
  onClearBuild,
  onToggleReactor,
  hasAuraSlot,
}: UseBuildKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        // Only handle Escape in inputs
        if (e.key === "Escape" && isSearchOpen) {
          e.preventDefault();
          onCloseSearch();
        }
        return;
      }

      // Handle search panel open
      if (isSearchOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          onCloseSearch();
        }
        // Other keys handled by search panel
        return;
      }

      // Number keys 1-8 for normal slots
      if (e.key >= "1" && e.key <= "8") {
        e.preventDefault();
        const slotIndex = parseInt(e.key) - 1;
        onSelectSlot(`normal-${slotIndex}`);
        onOpenSearch();
        return;
      }

      // Letter shortcuts
      switch (e.key.toLowerCase()) {
        case "a":
          if (hasAuraSlot) {
            e.preventDefault();
            onSelectSlot("aura-0");
            onOpenSearch();
          }
          break;
        case "e":
          e.preventDefault();
          onSelectSlot("exilus-0");
          onOpenSearch();
          break;
        case "r":
          e.preventDefault();
          onToggleReactor();
          break;
        case "c":
          if (e.ctrlKey || e.metaKey) {
            // Let default copy behavior through
            return;
          }
          e.preventDefault();
          onCopyBuild();
          break;
        case "x":
          e.preventDefault();
          onClearBuild();
          break;
        case "enter":
        case " ":
          e.preventDefault();
          onOpenSearch();
          break;
      }
    },
    [
      isSearchOpen,
      onSelectSlot,
      onOpenSearch,
      onCloseSearch,
      onCopyBuild,
      onClearBuild,
      onToggleReactor,
      hasAuraSlot,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
