import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GuidesContent } from "@/components/guides/guides-content";
import { getGuides } from "@/lib/guides";
import { CURATED_RESOURCES } from "@/lib/guides/curated-resources";

export const metadata: Metadata = {
    title: "Guides | ARSENIX",
    description:
        "Learn about Warframe mechanics, farming strategies, and game systems with in-depth guides.",
};

// ISR: Revalidate every hour
export const revalidate = 3600;

export default function GuidesPage() {
    const guides = getGuides();

    // Split guides: promoted guides go to Curated, rest to Community
    const curatedGuides = guides.filter((g) => g.isCurated);
    const communityGuides = guides.filter((g) => !g.isCurated);

    // Show curated section if there are external resources OR promoted guides
    const hasCuratedContent = CURATED_RESOURCES.length > 0 || curatedGuides.length > 0;

    return (
        <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-6 space-y-8">
                    {/* Page Header */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
                        <p className="text-muted-foreground">
                            Learn about Warframe mechanics, farming strategies, and game systems.
                        </p>
                    </div>

                    {/* Search and New Guide - Always at top */}
                    <Suspense>
                        <GuidesContent
                            curatedResources={CURATED_RESOURCES}
                            curatedGuides={curatedGuides}
                            communityGuides={communityGuides}
                            hasCuratedContent={hasCuratedContent}
                        />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}

