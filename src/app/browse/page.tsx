import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrowseContainer, BrowseKeyboardHandler } from "@/components/browse";
// Server-only imports (uses Node.js fs via @wfcd/items)
import { getItemsByCategory, getCategoryCounts } from "@/lib/warframe/items";
import { getDefaultCategory, isValidCategory } from "@/lib/warframe";
import type { BrowseCategory } from "@/lib/warframe/types";

export const metadata: Metadata = {
  title: "Browse Items | ARSENIX",
  description:
    "Browse Warframes, weapons, companions, and more. Find the perfect equipment for your next build.",
};

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

interface BrowsePageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;

  // Parse search params - only category needs server-side handling
  const category: BrowseCategory = isValidCategory(params.category ?? "")
    ? (params.category as BrowseCategory)
    : getDefaultCategory();

  const query = params.q ?? "";

  // Fetch ALL items for the category (filtering happens client-side for speed)
  const allItems = getItemsByCategory(category);
  const counts = getCategoryCounts();

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      {/* Keyboard navigation handler */}
      <Suspense>
        <BrowseKeyboardHandler />
      </Suspense>
      <main className="flex-1">
        <div className="container py-6 space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Browse Items</h1>
            <p className="text-muted-foreground">
              Find and explore Warframes, weapons, and companions for your
              builds.
            </p>
          </div>

          {/* Client-side browse container with instant filtering */}
          <Suspense>
            <BrowseContainer
              initialItems={allItems}
              initialCategory={category}
              counts={counts}
              initialQuery={query}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
