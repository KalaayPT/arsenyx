import {
  createFileRoute,
  redirect,
  Link as RouterLink,
} from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { itemQuery } from "@/lib/item-query";
import {
  getImageUrl,
  isValidCategory,
  type BrowseCategory,
} from "@/lib/warframe";

type CreateSearch = {
  item: string;
  category: BrowseCategory;
};

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): CreateSearch => {
    const item = typeof search.item === "string" ? search.item : "";
    const category =
      typeof search.category === "string" && isValidCategory(search.category)
        ? search.category
        : ("warframes" as BrowseCategory);
    return { item, category };
  },
  beforeLoad: ({ search }) => {
    if (!search.item) {
      throw redirect({ to: "/browse", search: { category: "warframes" } });
    }
  },
  loaderDeps: ({ search }) => ({
    item: search.item,
    category: search.category,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(itemQuery(deps.category, deps.item)),
  component: CreatePage,
});

function CreatePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex flex-col gap-6 py-6">
          <Suspense
            fallback={<p className="text-muted-foreground">Loading item…</p>}
          >
            <EditorShell />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EditorShell() {
  const { item: slug, category } = Route.useSearch();
  const { data: item } = useSuspenseQuery(itemQuery(category, slug));

  return (
    <>
      <nav className="text-muted-foreground flex items-center gap-2 text-sm">
        <RouterLink
          to="/browse"
          search={{ category: "warframes" }}
          className="hover:text-foreground transition-colors"
        >
          Browse
        </RouterLink>
        <span>/</span>
        <RouterLink
          to="/browse/$category/$slug"
          params={{ category, slug }}
          className="hover:text-foreground transition-colors"
        >
          {item.name}
        </RouterLink>
        <span>/</span>
        <span className="text-foreground">New Build</span>
      </nav>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          New {item.name} Build
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Save (sign in required)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ItemSidebar item={item} />
        <EditorPlaceholder />
      </div>
    </>
  );
}

function ItemSidebar({
  item,
}: {
  item: { name: string; imageName?: string; masteryReq?: number; type?: string; isPrime?: boolean; vaulted?: boolean };
}) {
  return (
    <Card className="h-fit gap-0 overflow-hidden py-0">
      <div className="bg-muted/30 flex aspect-square items-center justify-center overflow-hidden">
        <img
          src={getImageUrl(item.imageName)}
          alt={item.name}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{item.name}</h2>
          {item.isPrime && (
            <Badge className="bg-wf-prime text-white">Prime</Badge>
          )}
          {item.vaulted && <Badge variant="outline">Vaulted</Badge>}
        </div>
        <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
          {item.type && (
            <>
              <dt>Type</dt>
              <dd className="text-foreground">{item.type}</dd>
            </>
          )}
          {item.masteryReq !== undefined && item.masteryReq > 0 && (
            <>
              <dt>Mastery</dt>
              <dd className="text-foreground">MR {item.masteryReq}</dd>
            </>
          )}
        </dl>
      </div>
    </Card>
  );
}

function EditorPlaceholder() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-muted text-muted-foreground grid grid-cols-4 gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm sm:grid-cols-5 md:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border-muted bg-muted/20 aspect-[3/4] rounded-md border"
              />
            ))}
            <p className="col-span-full pt-2">
              Mod slot editor coming next — select mods, set ranks, drain
              totals.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Live stat recalculation will appear here once mods are wired up.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
