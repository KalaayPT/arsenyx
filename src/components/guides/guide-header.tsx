import { Clock, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Guide } from "@/lib/guides";
import { GUIDE_CATEGORY_INFO } from "@/lib/guides";

// Simple date formatter to avoid date-fns dependency
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

interface GuideHeaderProps {
    guide: Guide;
}

export function GuideHeader({ guide }: GuideHeaderProps) {
    const categoryInfo = GUIDE_CATEGORY_INFO[guide.category];

    return (
        <header className="mb-8 pb-8 border-b">
            {/* Category and Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="font-medium">
                    {categoryInfo.label}
                </Badge>
                {guide.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                        {tag}
                    </Badge>
                ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight mb-4 lg:text-4xl">
                {guide.title}
            </h1>

            {/* Summary */}
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {guide.summary}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{guide.author.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(guide.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{guide.readingTime} min read</span>
                </div>
            </div>
        </header>
    );
}
