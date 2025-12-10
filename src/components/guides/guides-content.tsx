"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Star, Users, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GuideCard } from "./guide-card";
import type { GuideListItem } from "@/lib/guides";
import type { CuratedResource } from "@/lib/guides/curated-resources";

interface GuidesContentProps {
    curatedResources: CuratedResource[];
    curatedGuides: GuideListItem[];
    communityGuides: GuideListItem[];
    hasCuratedContent: boolean;
}

export function GuidesContent({
    curatedResources,
    curatedGuides,
    communityGuides,
    hasCuratedContent,
}: GuidesContentProps) {
    const [search, setSearch] = useState("");

    // Filter all content by search
    const filteredCuratedResources = useMemo(() => {
        if (!search) return curatedResources;
        const searchLower = search.toLowerCase();
        return curatedResources.filter(
            (r) =>
                r.title.toLowerCase().includes(searchLower) ||
                r.description.toLowerCase().includes(searchLower)
        );
    }, [curatedResources, search]);

    const filteredCuratedGuides = useMemo(() => {
        if (!search) return curatedGuides;
        const searchLower = search.toLowerCase();
        return curatedGuides.filter(
            (g) =>
                g.title.toLowerCase().includes(searchLower) ||
                g.summary.toLowerCase().includes(searchLower) ||
                g.tags.some((t) => t.toLowerCase().includes(searchLower))
        );
    }, [curatedGuides, search]);

    const filteredCommunityGuides = useMemo(() => {
        if (!search) return communityGuides;
        const searchLower = search.toLowerCase();
        return communityGuides.filter(
            (g) =>
                g.title.toLowerCase().includes(searchLower) ||
                g.summary.toLowerCase().includes(searchLower) ||
                g.tags.some((t) => t.toLowerCase().includes(searchLower))
        );
    }, [communityGuides, search]);

    const hasFilteredCuratedContent =
        filteredCuratedResources.length > 0 || filteredCuratedGuides.length > 0;

    return (
        <div className="space-y-8">
            {/* Search Row - Full Width */}
            <div className="flex flex-col sm:flex-row gap-3">
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
                <Button asChild className="gap-2 shrink-0">
                    <Link href="/guides/new">
                        <Plus className="h-4 w-4" />
                        New Guide
                    </Link>
                </Button>
            </div>

            {/* Curated Section - External Resources + Promoted Guides */}
            {hasCuratedContent && hasFilteredCuratedContent && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-xl font-semibold">Curated</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* External Resources */}
                        {filteredCuratedResources.map((resource) => (
                            <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group"
                            >
                                <Card className="h-full transition-colors hover:bg-accent/50">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-lg group-hover:underline">
                                                {resource.title}
                                            </CardTitle>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </div>
                                        <CardDescription>{resource.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </a>
                        ))}
                        {/* Promoted Community Guides */}
                        {filteredCuratedGuides.map((guide) => (
                            <GuideCard key={guide.id} guide={guide} />
                        ))}
                    </div>
                </section>
            )}

            {/* Community Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Community</h2>
                </div>

                {/* Results info */}
                <div className="text-sm text-muted-foreground">
                    {filteredCommunityGuides.length}{" "}
                    {filteredCommunityGuides.length === 1 ? "guide" : "guides"}
                    {search && ` matching "${search}"`}
                </div>

                {/* Guide Grid */}
                {filteredCommunityGuides.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCommunityGuides.map((guide) => (
                            <GuideCard key={guide.id} guide={guide} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-lg font-medium mb-2">No guides found</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {search
                                ? "Try adjusting your search terms."
                                : "Check back later for new guides!"}
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
