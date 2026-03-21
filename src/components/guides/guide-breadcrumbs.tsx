import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface GuideBreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function GuideBreadcrumbs({ items }: GuideBreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <li>
                    <Link
                        href="/"
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        <Home className="h-3.5 w-3.5" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="hover:text-foreground transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-foreground font-medium">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
