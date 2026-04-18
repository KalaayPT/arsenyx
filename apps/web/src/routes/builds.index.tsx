import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";

import {
  BuildsListView,
  type BuildsListSearch,
} from "@/components/builds/builds-list-view";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  publicBuildsQuery,
  type BuildListSort,
} from "@/lib/builds-list-query";
import { SORT_VALUES } from "@/components/builds/builds-sort-dropdown";
import { isValidCategory, type BrowseCategory } from "@/lib/warframe";

type BuildsSearch = {
  page?: number;
  sort?: BuildListSort;
  q?: string;
  category?: BrowseCategory;
};

export const Route = createFileRoute("/builds/")({
  validateSearch: (search: Record<string, unknown>): BuildsSearch => {
    const rawPage =
      typeof search.page === "string"
        ? parseInt(search.page, 10)
        : typeof search.page === "number"
          ? search.page
          : NaN;
    const page = Number.isFinite(rawPage) && rawPage > 1 ? rawPage : undefined;
    const sort =
      typeof search.sort === "string" &&
      (SORT_VALUES as string[]).includes(search.sort)
        ? (search.sort as BuildListSort)
        : undefined;
    const q =
      typeof search.q === "string" && search.q.length > 0
        ? search.q
        : undefined;
    const category =
      typeof search.category === "string" && isValidCategory(search.category)
        ? search.category
        : undefined;
    return { page, sort, q, category };
  },
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    sort: search.sort ?? "newest",
    q: search.q,
    category: search.category,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(publicBuildsQuery(deps)),
  component: BuildsIndexPage,
});

function BuildsIndexPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex flex-col gap-6 py-6">
          <Suspense
            fallback={<p className="text-muted-foreground">Loading builds…</p>}
          >
            <BuildsIndexContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BuildsIndexContent() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = search.page ?? 1;
  const sort = search.sort ?? "newest";
  const q = search.q ?? "";
  const category = search.category;

  const onUpdateSearch = (next: BuildsListSearch) =>
    navigate({
      search: {
        page: next.page && next.page > 1 ? next.page : undefined,
        sort:
          next.sort && next.sort !== "newest"
            ? next.sort
            : undefined,
        q: next.q && next.q.length > 0 ? next.q : undefined,
        category:
          typeof next.category === "string" && isValidCategory(next.category)
            ? next.category
            : undefined,
      },
      replace: true,
    });

  return (
    <BuildsListView
      title="Community Builds"
      description="Discover builds created by the community."
      query={publicBuildsQuery({ page, sort, q: q || undefined, category })}
      page={page}
      sort={sort}
      q={q}
      category={category}
      onUpdateSearch={onUpdateSearch}
      showFilters
      emptyState={
        <>
          <p className="text-muted-foreground">No builds match.</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Try a different search, or head to{" "}
            <Link
              to="/browse"
              search={{ category: "warframes" }}
              className="text-primary underline"
            >
              Browse
            </Link>{" "}
            to publish one.
          </p>
        </>
      }
    />
  );
}
