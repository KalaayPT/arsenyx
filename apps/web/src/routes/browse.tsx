import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useDeferredValue, useMemo } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ItemCard } from "@/components/browse/item-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  isValidCategory,
  type BrowseCategory,
  type ItemsIndex,
} from "@/lib/warframe";

const itemsIndexQuery = queryOptions({
  queryKey: ["items-index"],
  queryFn: async (): Promise<ItemsIndex> => {
    const r = await fetch("/data/items-index.json");
    if (!r.ok) throw new Error("failed to load items index");
    return r.json();
  },
  staleTime: Infinity,
  gcTime: Infinity,
});

type BrowseSearch = {
  category: BrowseCategory;
  q?: string;
};

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => {
    const cat = typeof search.category === "string" && isValidCategory(search.category)
      ? search.category
      : "warframes";
    const q = typeof search.q === "string" && search.q.length > 0 ? search.q : undefined;
    return { category: cat, q };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsIndexQuery),
  component: BrowsePage,
});

function BrowsePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex flex-col gap-6 py-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Browse Items</h1>
            <p className="text-muted-foreground">
              Find and explore Warframes, weapons, and companions for your builds.
            </p>
          </div>
          <Suspense fallback={<p className="text-muted-foreground">Loading items…</p>}>
            <BrowseContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BrowseContent() {
  const { data } = useSuspenseQuery(itemsIndexQuery);
  const { category, q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const deferredQ = useDeferredValue(q);

  const items = data[category] ?? [];

  const filtered = useMemo(() => {
    const term = deferredQ.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(term) ||
        it.type?.toLowerCase().includes(term),
    );
  }, [items, deferredQ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => {
          const count = data[c.id]?.length ?? 0;
          const active = c.id === category;
          return (
            <Button
              key={c.id}
              size="sm"
              variant={active ? "secondary" : "ghost"}
              onClick={() =>
                navigate({ search: (s) => ({ ...s, category: c.id }) })
              }
            >
              {c.label}
              <span className={cn("ml-1.5 text-xs", active ? "text-muted-foreground" : "text-muted-foreground/60")}>
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      <Input
        placeholder="Search by name or type…"
        value={q}
        onChange={(e) => {
          const next = e.target.value;
          navigate({
            search: (s) => ({ ...s, q: next || undefined }),
            replace: true,
          });
        }}
        className="max-w-md"
      />

      <div className="text-muted-foreground text-sm">
        {filtered.length} {filtered.length === 1 ? "item" : "items"}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No items match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((item, i) => (
            <ItemCard key={item.uniqueName} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
