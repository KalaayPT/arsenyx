"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GuideListItem } from "@/lib/guides";

interface RelatedGuidesProps {
    guides: GuideListItem[];
}

export function RelatedGuides({ guides }: RelatedGuidesProps) {
    if (guides.length === 0) return null;

    return (
        <Card className="mt-8">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Related Guides</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {guides.map((guide) => (
                        <li key={guide.id}>
                            <Link
                                href={`/guides/${guide.slug}`}
                                className="group flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="min-w-0">
                                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                        {guide.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {guide.summary}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
