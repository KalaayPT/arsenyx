import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { GuideList, GuideSidebar } from "@/components/guides";
import { getGuides, getAllTags, getGuidesByCategory } from "@/lib/guides";

export const metadata: Metadata = {
    title: "Guides | ARSENIX",
    description:
        "Learn about Warframe mechanics, farming strategies, and game systems with in-depth guides.",
};

// ISR: Revalidate every hour
export const revalidate = 3600;

export default function GuidesPage() {
    const guides = getGuides();
    const allTags = getAllTags();
    const guidesByCategory = getGuidesByCategory();

    return (
        <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-8">
                    {/* Page Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
                            <p className="text-muted-foreground max-w-2xl">
                                Learn about Warframe mechanics, farming strategies, modding tips,
                                and game systems with our in-depth guides.
                            </p>
                        </div>
                        {/* TODO: Gate behind auth */}
                        {process.env.NODE_ENV === "development" && (
                            <Button asChild className="gap-2">
                                <Link href="/guides/new">
                                    <Plus className="h-4 w-4" />
                                    New Guide
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Main Layout with Sidebar */}
                    <div className="flex gap-8">
                        <Suspense>
                            <GuideSidebar guidesByCategory={guidesByCategory} />
                        </Suspense>

                        <div className="flex-1 min-w-0">
                            <Suspense>
                                <GuideList initialGuides={guides} allTags={allTags} />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
