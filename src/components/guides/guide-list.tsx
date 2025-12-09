"use client";

import { useState, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GuideCard } from "./guide-card";
import type { GuideListItem, GuideCategory, GuideSortOption } from "@/lib/guides";
import { GUIDE_CATEGORIES, GUIDE_CATEGORY_INFO } from "@/lib/guides";

interface GuideListProps {
    initialGuides: GuideListItem[];
    allTags: string[];
}

export function GuideList({ initialGuides, allTags }: GuideListProps) {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<GuideCategory | "all">("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<GuideSortOption>("recent");
    const [showFilters, setShowFilters] = useState(false);

    // Filter and sort guides
    const filteredGuides = useMemo(() => {
        let guides = [...initialGuides];

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            guides = guides.filter(
                (g) =>
                    g.title.toLowerCase().includes(searchLower) ||
                    g.summary.toLowerCase().includes(searchLower) ||
                    g.tags.some((t) => t.toLowerCase().includes(searchLower))
            );
        }

        // Filter by category
        if (selectedCategory !== "all") {
            guides = guides.filter((g) => g.category === selectedCategory);
        }

        // Filter by tags
        if (selectedTags.length > 0) {
            guides = guides.filter((g) =>
                selectedTags.some((tag) => g.tags.includes(tag))
            );
        }

        // Sort
        switch (sortBy) {
            case "recent":
                guides.sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
                break;
            case "title":
                guides.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "readingTime":
                guides.sort((a, b) => a.readingTime - b.readingTime);
                break;
        }

        return guides;
    }, [initialGuides, search, selectedCategory, selectedTags, sortBy]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("all");
        setSelectedTags([]);
        setSortBy("recent");
    };

    const hasActiveFilters =
        search || selectedCategory !== "all" || selectedTags.length > 0;

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search guides..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? "bg-primary/10" : ""}
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as GuideSortOption)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Most Recent</SelectItem>
                            <SelectItem value="title">Title A-Z</SelectItem>
                            <SelectItem value="readingTime">Reading Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Expanded filters */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/30 border">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Category:</span>
                            <Select
                                value={selectedCategory}
                                onValueChange={(v) => setSelectedCategory(v as GuideCategory | "all")}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {GUIDE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {GUIDE_CATEGORY_INFO[cat].label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium mr-2">Tags:</span>
                            <div className="inline-flex flex-wrap gap-1">
                                {allTags.slice(0, 10).map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-primary/20"
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Active filters indicator */}
            {hasActiveFilters && !showFilters && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing {filteredGuides.length} of {initialGuides.length} guides</span>
                    {selectedCategory !== "all" && (
                        <Badge variant="secondary">{GUIDE_CATEGORY_INFO[selectedCategory].label}</Badge>
                    )}
                    {selectedTags.map((tag) => (
                        <Badge key={tag} variant="outline">
                            {tag}
                        </Badge>
                    ))}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto py-0 px-2">
                        Clear
                    </Button>
                </div>
            )}

            {/* Guide Grid */}
            {filteredGuides.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredGuides.map((guide) => (
                        <GuideCard key={guide.id} guide={guide} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-medium mb-2">No guides found</h3>
                    <p className="text-muted-foreground max-w-sm">
                        {hasActiveFilters
                            ? "Try adjusting your filters or search terms."
                            : "Check back later for new guides!"}
                    </p>
                    {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="mt-4">
                            Clear filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
