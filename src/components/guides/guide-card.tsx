"use client";

import Link from "next/link";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { GuideListItem } from "@/lib/guides";
import { GUIDE_CATEGORY_INFO } from "@/lib/guides";

// Simple relative time formatter
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

interface GuideCardProps {
    guide: GuideListItem;
}

export function GuideCard({ guide }: GuideCardProps) {
    const categoryInfo = GUIDE_CATEGORY_INFO[guide.category];

    return (
        <Link href={`/guides/${guide.slug}`} className="group block">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
                {guide.coverImage && (
                    <div className="relative h-40 overflow-hidden rounded-t-lg">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                            style={{ backgroundImage: `url(${guide.coverImage})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    </div>
                )}
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge
                            variant="secondary"
                            className="text-xs font-medium"
                        >
                            {categoryInfo.label}
                        </Badge>
                        {guide.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {guide.title}
                    </h3>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {guide.summary}
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {guide.readingTime} min read
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatRelativeTime(guide.updatedAt)}
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
