"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, BookOpen, Settings, Coins, Gamepad2, User, Sword } from "lucide-react";
import { cn } from "@/lib/utils";
import { GUIDE_CATEGORIES, GUIDE_CATEGORY_INFO, type GuideCategory } from "@/lib/guides";
import type { GuideListItem } from "@/lib/guides";
import { ScrollArea } from "@/components/ui/scroll-area";

// Map category to icon
const categoryIcons: Record<GuideCategory, React.ReactNode> = {
    systems: <Settings className="h-4 w-4" />,
    resources: <Coins className="h-4 w-4" />,
    modes: <Gamepad2 className="h-4 w-4" />,
    warframes: <User className="h-4 w-4" />,
    gear: <Sword className="h-4 w-4" />,
};

interface GuideSidebarProps {
    guidesByCategory: Record<GuideCategory, GuideListItem[]>;
    currentSlug?: string;
}

export function GuideSidebar({ guidesByCategory, currentSlug }: GuideSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
                <ScrollArea className="h-[calc(100vh-6rem)] pr-4">
                    <nav className="space-y-6">
                        {/* All Guides Link */}
                        <Link
                            href="/guides"
                            className={cn(
                                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                                pathname === "/guides"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <BookOpen className="h-4 w-4" />
                            All Guides
                        </Link>

                        {/* Category Sections */}
                        {GUIDE_CATEGORIES.map((category) => {
                            const guides = guidesByCategory[category];
                            const categoryInfo = GUIDE_CATEGORY_INFO[category];

                            if (guides.length === 0) return null;

                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3">
                                        {categoryIcons[category]}
                                        <span className="text-sm font-semibold text-foreground">
                                            {categoryInfo.label}
                                        </span>
                                    </div>
                                    <ul className="space-y-1 border-l border-border pl-4">
                                        {guides.map((guide) => {
                                            const isActive = guide.slug === currentSlug;

                                            return (
                                                <li key={guide.id}>
                                                    <Link
                                                        href={`/guides/${guide.slug}`}
                                                        className={cn(
                                                            "group flex items-center gap-2 py-1.5 text-sm transition-colors hover:text-primary",
                                                            isActive
                                                                ? "text-primary font-medium border-l-2 border-primary -ml-[17px] pl-[15px]"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        <ChevronRight
                                                            className={cn(
                                                                "h-3 w-3 transition-transform",
                                                                isActive
                                                                    ? "text-primary"
                                                                    : "text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5"
                                                            )}
                                                        />
                                                        <span className="truncate">{guide.title}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                    </nav>
                </ScrollArea>
            </div>
        </aside>
    );
}
