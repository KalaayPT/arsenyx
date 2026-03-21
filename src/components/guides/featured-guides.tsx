import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GuideListItem } from "@/lib/guides";
import { GUIDE_CATEGORY_INFO } from "@/lib/guides";

interface FeaturedGuidesProps {
    guides: GuideListItem[];
}

export function FeaturedGuides({ guides }: FeaturedGuidesProps) {
    if (guides.length === 0) return null;

    return (
        <section className="py-16 bg-muted/30">
            <div className="container">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <h2 className="text-2xl font-bold tracking-tight">
                                Featured Guides
                            </h2>
                        </div>
                        <p className="text-muted-foreground">
                            Learn about game mechanics, farming strategies, and optimization tips.
                        </p>
                    </div>
                    <Button variant="outline" asChild className="gap-2">
                        <Link href="/guides">
                            View all guides
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {guides.map((guide) => {
                        const categoryInfo = GUIDE_CATEGORY_INFO[guide.category];

                        return (
                            <Link
                                key={guide.id}
                                href={`/guides/${guide.slug}`}
                                className="group"
                            >
                                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 bg-card/80 backdrop-blur-sm">
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge variant="secondary" className="text-xs">
                                                {categoryInfo.label}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {guide.readingTime} min read
                                            </span>
                                        </div>
                                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                            {guide.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {guide.summary}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
