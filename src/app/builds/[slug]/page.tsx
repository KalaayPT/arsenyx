import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BuildContainer } from "@/components/build-editor/build-container";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { getBuildBySlug, incrementBuildViewCount } from "@/lib/db/index";
import { getFullItem } from "@/lib/warframe/items";
import { getModsForCategory, getArcanesForSlot } from "@/lib/warframe/mods";
import { getCategoryConfig } from "@/lib/warframe";
import type { BrowseCategory } from "@/lib/warframe/types";

interface BuildPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate metadata for social sharing
export async function generateMetadata({
    params,
}: BuildPageProps): Promise<Metadata> {
    const { slug } = await params;
    const build = await getBuildBySlug(slug);

    if (!build) {
        return {
            title: "Build Not Found | ARSENIX",
        };
    }

    const title = `${build.name} - ${build.item.name} Build | ARSENIX`;
    const description = build.description || `${build.item.name} build by ${build.user.username || build.user.name || "Anonymous"}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

function BuildViewSkeleton() {
    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-32" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left sidebar skeleton */}
                <div className="lg:col-span-3 space-y-4">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                {/* Center mod grid skeleton */}
                <div className="lg:col-span-6 space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-lg" />
                        ))}
                    </div>
                </div>
                {/* Right panel skeleton */}
                <div className="lg:col-span-3 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
}

export default async function BuildPage({ params }: BuildPageProps) {
    const { slug } = await params;

    // Get current user session for visibility checks
    const session = await auth();
    const viewerId = session?.user?.id;

    // Fetch the build with visibility check
    const build = await getBuildBySlug(slug, viewerId);

    if (!build) {
        notFound();
    }

    // Increment view count (fire and forget)
    incrementBuildViewCount(build.id).catch(() => {
        // Ignore errors - view count is not critical
    });

    // Get the category from the build's item
    const category = build.item.browseCategory as BrowseCategory;

    // Fetch the full item data
    const fullItem = getFullItem(category, build.item.uniqueName);

    if (!fullItem) {
        notFound();
    }

    // Get compatible mods and arcanes
    const categoryConfig = getCategoryConfig(category);
    const compatibleMods = getModsForCategory(category);
    const isWarframeCategory = category === "warframes" || category === "necramechs";
    const compatibleArcanes = isWarframeCategory ? getArcanesForSlot("warframe") : [];

    // Check if the current user is the owner
    const isOwner = viewerId === build.userId;

    return (
        <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {/* Build Info Banner */}
                <div className="border-b bg-muted/30">
                    <div className="container py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-semibold">{build.name}</h1>
                                <span className="text-sm text-muted-foreground">
                                    by {build.user.username || build.user.name || "Anonymous"}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{build.voteCount} votes</span>
                                <span>{build.viewCount} views</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Suspense fallback={<BuildViewSkeleton />}>
                    <BuildContainer
                        item={fullItem}
                        category={category}
                        categoryLabel={categoryConfig?.label ?? "Item"}
                        compatibleMods={compatibleMods}
                        compatibleArcanes={compatibleArcanes}
                        importedBuild={build.buildData}
                        savedBuildId={isOwner ? build.id : undefined}
                        savedBuildSlug={isOwner ? build.slug : undefined}
                        readOnly={!isOwner}
                    />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
