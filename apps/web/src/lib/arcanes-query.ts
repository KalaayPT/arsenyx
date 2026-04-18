import { queryOptions } from "@tanstack/react-query";

import type { Arcane } from "@arsenyx/shared/warframe/types";

export const arcanesQuery = queryOptions({
  queryKey: ["arcanes-all"],
  queryFn: async (): Promise<Arcane[]> => {
    const r = await fetch("/data/arcanes-all.json");
    if (!r.ok) throw new Error("failed to load arcanes");
    return r.json();
  },
  staleTime: Infinity,
  gcTime: Infinity,
});
