"use client";

import { useSyncExternalStore } from "react";
import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const emptySubscribe = () => () => {};
const getCanShare = () =>
  typeof navigator !== "undefined" && !!navigator.share;
const getServerCanShare = () => false;

interface ShareButtonProps {
  buildName: string;
  itemName: string;
}

export function ShareButton({ buildName, itemName }: ShareButtonProps) {
  const canShare = useSyncExternalStore(
    emptySubscribe,
    getCanShare,
    getServerCanShare,
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: `${buildName} - ${itemName} Build | ARSENYX`,
        url: window.location.href,
      });
    } catch (e) {
      // User cancelled share — not an error
      if (e instanceof Error && e.name !== "AbortError") {
        toast.error("Failed to share");
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 data-icon="inline-start" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={copyLink}>
            <Link2 />
            Copy Link
          </DropdownMenuItem>
          {canShare && (
            <DropdownMenuItem onSelect={nativeShare}>
              <Share2 />
              Share...
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
