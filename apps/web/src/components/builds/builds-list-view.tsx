import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { BuildCard } from "@/components/builds/build-card";
import { BuildsCategoryTabs } from "@/components/builds/builds-category-tabs";
import { BuildsSortDropdown } from "@/components/builds/builds-sort-dropdown";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import {
  publicBuildsQuery,
  type BuildListSort,
} from "@/lib/builds-list-query";
import { type BrowseCategory } from "@/lib/warframe";

type BuildsQuery = ReturnType<typeof publicBuildsQuery>;

export type BuildsListSearch = {
  page?: number;
  sort?: BuildListSort;
  q?: string;
  category?: string;
};

const SEARCH_DEBOUNCE_MS = 200;

export function BuildsListView({
  title,
  description,
  query,
  page,
  sort,
  q,
  category,
  onUpdateSearch,
  emptyState,
  showFilters,
}: {
  title: string;
  description: string;
  query: BuildsQuery;
  page: number;
  sort: BuildListSort;
  q: string;
  category: BrowseCategory | undefined;
  onUpdateSearch: (next: BuildsListSearch) => void;
  emptyState: ReactNode;
  showFilters: boolean;
}) {
  const { data } = useSuspenseQuery(query);
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  const [qLocal, setQLocal] = useState(q);
  useEffect(() => setQLocal(q), [q]);

  const latest = useRef({ sort, category, onUpdateSearch });
  latest.current = { sort, category, onUpdateSearch };

  useEffect(() => {
    if (qLocal === q) return;
    const t = setTimeout(() => {
      latest.current.onUpdateSearch({
        sort: latest.current.sort,
        category: latest.current.category,
        q: qLocal || undefined,
        page: undefined,
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [qLocal, q]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {showFilters ? (
          <InputGroup className="flex-1">
            <InputGroupInput
              placeholder="Search builds…"
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
            />
            {!qLocal && (
              <InputGroupAddon align="inline-end">
                <Kbd>/</Kbd>
              </InputGroupAddon>
            )}
          </InputGroup>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex gap-3">
          <BuildsSortDropdown
            value={sort}
            onChange={(value) =>
              onUpdateSearch({ sort: value, q, category, page: undefined })
            }
          />
          {showFilters ? (
            <Button variant="outline" size="sm" disabled>
              Filters
            </Button>
          ) : null}
        </div>
      </div>

      {showFilters ? (
        <BuildsCategoryTabs
          value={category}
          onChange={(next) =>
            onUpdateSearch({
              sort,
              q,
              category: next,
              page: undefined,
            })
          }
        />
      ) : null}

      <div className="text-muted-foreground text-sm">
        {data.total} {data.total === 1 ? "build" : "builds"}
        {q ? ` matching "${q}"` : ""}
      </div>

      {data.builds.length === 0 ? (
        <div className="py-16 text-center">{emptyState}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data.builds.map((b) => (
            <BuildCard key={b.id} build={b} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-2">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdateSearch({
                  sort,
                  q,
                  category,
                  page: page - 1 === 1 ? undefined : page - 1,
                })
              }
            >
              Previous
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdateSearch({ sort, q, category, page: page + 1 })
              }
            >
              Next
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

