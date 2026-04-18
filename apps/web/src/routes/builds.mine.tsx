import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Suspense } from "react";

import {
  BuildsListView,
  type BuildsListSearch,
} from "@/components/builds/builds-list-view";
import { SORT_VALUES } from "@/components/builds/builds-sort-dropdown";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { authClient } from "@/lib/auth-client";
import { myBuildsQuery, type BuildListSort } from "@/lib/builds-list-query";

type MineSearch = { page?: number; sort?: BuildListSort };

export const Route = createFileRoute("/builds/mine")({
  validateSearch: (search: Record<string, unknown>): MineSearch => {
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
    return { page, sort };
  },
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data?.user) {
      throw redirect({ to: "/auth/signin" });
    }
  },
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    sort: search.sort ?? "updated",
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(myBuildsQuery(deps)),
  component: MineBuildsPage,
});

function MineBuildsPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex flex-col gap-6 py-6">
          <Suspense
            fallback={<p className="text-muted-foreground">Loading builds…</p>}
          >
            <MineBuildsContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MineBuildsContent() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = search.page ?? 1;
  const sort = search.sort ?? "updated";

  const onUpdateSearch = (next: BuildsListSearch) =>
    navigate({
      search: {
        page: next.page && next.page > 1 ? next.page : undefined,
        sort: next.sort && next.sort !== "updated" ? next.sort : undefined,
      },
      replace: true,
    });

  return (
    <BuildsListView
      title="My Builds"
      description="Builds you've authored."
      query={myBuildsQuery({ page, sort })}
      page={page}
      sort={sort}
      q=""
      category={undefined}
      onUpdateSearch={onUpdateSearch}
      showFilters={false}
      emptyState={
        <>
          <p className="text-muted-foreground">You haven't saved any builds yet.</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Start one from{" "}
            <Link
              to="/browse"
              search={{ category: "warframes" }}
              className="text-primary underline"
            >
              Browse
            </Link>
            .
          </p>
        </>
      }
    />
  );
}
