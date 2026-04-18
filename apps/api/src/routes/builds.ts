import { Hono } from "hono";
import { customAlphabet } from "nanoid";

import { isValidCategory } from "@arsenyx/shared/warframe/categories";
import { Prisma } from "../generated/prisma/client";
import { BuildVisibility } from "../generated/prisma/enums";
import type { InputJsonValue } from "../generated/prisma/internal/prismaNamespace";

import { auth } from "../auth";
import { prisma } from "../db";

export const builds = new Hono();

// URL-safe alphabet without visually-confusing chars (no 0/O, 1/l/I).
const generateSlug = customAlphabet(
  "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  10,
);

const MAX_NAME = 120;
const MAX_DESCRIPTION = 2000;
const MAX_GUIDE_SUMMARY = 400;
const MAX_GUIDE_DESCRIPTION = 50_000;

function isVisibility(v: unknown): v is BuildVisibility {
  return (
    typeof v === "string" &&
    Object.values(BuildVisibility).includes(v as BuildVisibility)
  );
}

function trimToMax(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t.slice(0, max) : null;
}

function hasShardsInBuildData(buildData: unknown): boolean {
  if (!buildData || typeof buildData !== "object") return false;
  const shards = (buildData as Record<string, unknown>).shards;
  return Array.isArray(shards) && shards.some((s) => s != null);
}

function parseGuide(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const g = input as Record<string, unknown>;
  const summary = trimToMax(g.summary, MAX_GUIDE_SUMMARY);
  const description = trimToMax(g.description, MAX_GUIDE_DESCRIPTION);
  return { summary, description, hasGuide: summary != null || description != null };
}

builds.post("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  if (!body || typeof body !== "object") {
    return c.json({ error: "invalid_body" }, 400);
  }
  const b = body as Record<string, unknown>;

  const itemUniqueName = typeof b.itemUniqueName === "string" ? b.itemUniqueName.trim() : "";
  const itemCategory = typeof b.itemCategory === "string" ? b.itemCategory : "";
  const itemName = typeof b.itemName === "string" ? b.itemName.trim() : "";
  const itemImageName = typeof b.itemImageName === "string" ? b.itemImageName : null;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const description = trimToMax(b.description, MAX_DESCRIPTION);
  const visibility: BuildVisibility = isVisibility(b.visibility) ? b.visibility : "PUBLIC";

  if (!itemUniqueName) return c.json({ error: "missing_item_unique_name" }, 400);
  if (!isValidCategory(itemCategory)) return c.json({ error: "invalid_category" }, 400);
  if (!itemName) return c.json({ error: "missing_item_name" }, 400);
  if (!name || name.length > MAX_NAME) return c.json({ error: "invalid_name" }, 400);
  if (!b.buildData || typeof b.buildData !== "object") {
    return c.json({ error: "invalid_build_data" }, 400);
  }

  const buildData = b.buildData as InputJsonValue;
  const guide = parseGuide(b.guide);

  // Retry on the astronomically-unlikely slug collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    try {
      const created = await prisma.build.create({
        data: {
          slug,
          userId: session.user.id,
          itemUniqueName,
          itemCategory,
          itemName,
          itemImageName,
          name,
          description,
          visibility,
          buildData,
          hasShards: hasShardsInBuildData(buildData),
          hasGuide: guide?.hasGuide ?? false,
          buildGuide: guide?.hasGuide
            ? { create: { summary: guide.summary, description: guide.description } }
            : undefined,
        },
        select: { id: true, slug: true },
      });
      return c.json(created, 201);
    } catch (err: unknown) {
      // P2002 = unique constraint on slug → retry
      if (
        typeof err === "object" &&
        err != null &&
        (err as { code?: string }).code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }

  return c.json({ error: "slug_collision" }, 500);
});

builds.patch("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "unauthorized" }, 401);

  const existing = await prisma.build.findUnique({
    where: { slug },
    select: { id: true, userId: true },
  });
  if (!existing) return c.json({ error: "not_found" }, 404);
  if (existing.userId !== session.user.id) {
    return c.json({ error: "forbidden" }, 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!body || typeof body !== "object") {
    return c.json({ error: "invalid_body" }, 400);
  }
  const b = body as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (typeof b.name === "string") {
    const name = b.name.trim();
    if (!name || name.length > MAX_NAME) return c.json({ error: "invalid_name" }, 400);
    data.name = name;
  }
  if (typeof b.description === "string" || b.description === null) {
    data.description = trimToMax(b.description, MAX_DESCRIPTION);
  }
  if (isVisibility(b.visibility)) {
    data.visibility = b.visibility;
  }
  if (b.buildData && typeof b.buildData === "object") {
    data.buildData = b.buildData as InputJsonValue;
    data.hasShards = hasShardsInBuildData(b.buildData);
  }

  const guide = parseGuide(b.guide);
  if (guide) {
    data.hasGuide = guide.hasGuide;
    data.buildGuide = {
      upsert: {
        create: { summary: guide.summary, description: guide.description },
        update: { summary: guide.summary, description: guide.description },
      },
    };
  }

  const updated = await prisma.build.update({
    where: { id: existing.id },
    data,
    select: { id: true, slug: true },
  });
  return c.json(updated);
});

const LIST_LIMIT = 24;
const LIST_SORTS = ["newest", "updated"] as const;
type ListSort = (typeof LIST_SORTS)[number];

const LIST_SELECT = {
  id: true,
  slug: true,
  name: true,
  visibility: true,
  voteCount: true,
  favoriteCount: true,
  viewCount: true,
  hasGuide: true,
  hasShards: true,
  createdAt: true,
  updatedAt: true,
  itemName: true,
  itemImageName: true,
  itemCategory: true,
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      image: true,
    },
  },
  organization: {
    select: { id: true, name: true, slug: true, image: true },
  },
} as const;

type ListRow = Prisma.BuildGetPayload<{ select: typeof LIST_SELECT }>;

function serializeListRow(b: ListRow) {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    visibility: b.visibility,
    voteCount: b.voteCount,
    favoriteCount: b.favoriteCount,
    viewCount: b.viewCount,
    hasGuide: b.hasGuide,
    hasShards: b.hasShards,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    item: {
      name: b.itemName,
      imageName: b.itemImageName,
      category: b.itemCategory,
    },
    user: b.user,
    organization: b.organization,
  };
}

type ListFilters = {
  page: number;
  sort: ListSort | undefined;
  q: string | undefined;
  category: string | undefined;
};

function parseListQuery(c: {
  req: { query: (k: string) => string | undefined };
}): ListFilters {
  const pageRaw = parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const sortRaw = c.req.query("sort");
  const sort: ListSort | undefined = (LIST_SORTS as readonly string[]).includes(
    sortRaw ?? "",
  )
    ? (sortRaw as ListSort)
    : undefined;
  const qRaw = c.req.query("q")?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw.slice(0, 200) : undefined;
  const catRaw = c.req.query("category");
  const category = catRaw && isValidCategory(catRaw) ? catRaw : undefined;
  return { page, sort, q, category };
}

function orderByForSort(sort: ListSort) {
  return sort === "updated"
    ? { updatedAt: "desc" as const }
    : { createdAt: "desc" as const };
}

/**
 * Search path: tsvector match ordered by ts_rank (with sort as tiebreaker).
 * Returns the paginated ID list + total match count.
 */
async function searchBuildIds(params: {
  q: string;
  category: string | undefined;
  baseFilter: Prisma.Sql;
  sort: ListSort;
  skip: number;
  take: number;
}): Promise<{ ids: string[]; total: number }> {
  const { q, category, baseFilter, sort, skip, take } = params;
  const query = Prisma.sql`websearch_to_tsquery('english', ${q})`;
  const categoryFilter = category
    ? Prisma.sql`AND "itemCategory" = ${category}`
    : Prisma.empty;
  const tiebreaker =
    sort === "updated"
      ? Prisma.sql`"updatedAt" DESC`
      : Prisma.sql`"createdAt" DESC`;

  const [rows, totalRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id
      FROM builds
      WHERE "searchVector" @@ ${query}
        AND ${baseFilter}
        ${categoryFilter}
      ORDER BY ts_rank("searchVector", ${query}) DESC, ${tiebreaker}
      LIMIT ${take} OFFSET ${skip}
    `),
    prisma.$queryRaw<{ n: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS n
      FROM builds
      WHERE "searchVector" @@ ${query}
        AND ${baseFilter}
        ${categoryFilter}
    `),
  ]);
  return { ids: rows.map((r) => r.id), total: totalRows[0]?.n ?? 0 };
}

async function runList({
  filters,
  baseWhere,
  baseFilter,
  defaultSort,
}: {
  filters: ListFilters;
  baseWhere: Record<string, unknown>;
  baseFilter: Prisma.Sql;
  defaultSort: ListSort;
}) {
  const { page, q, category } = filters;
  const sort: ListSort = filters.sort ?? defaultSort;
  const skip = (page - 1) * LIST_LIMIT;

  const where: Record<string, unknown> = { ...baseWhere };
  if (category) where.itemCategory = category;

  if (q) {
    const { ids, total } = await searchBuildIds({
      q,
      category,
      baseFilter,
      sort,
      skip,
      take: LIST_LIMIT,
    });
    if (ids.length === 0) {
      return { builds: [], total, page, limit: LIST_LIMIT };
    }
    const rows = await prisma.build.findMany({
      where: { id: { in: ids } },
      select: LIST_SELECT,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((r): r is ListRow => r != null);
    return {
      builds: ordered.map(serializeListRow),
      total,
      page,
      limit: LIST_LIMIT,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.build.findMany({
      where,
      orderBy: orderByForSort(sort),
      skip,
      take: LIST_LIMIT,
      select: LIST_SELECT,
    }),
    prisma.build.count({ where }),
  ]);

  return {
    builds: rows.map(serializeListRow),
    total,
    page,
    limit: LIST_LIMIT,
  };
}

builds.get("/", async (c) => {
  const result = await runList({
    filters: parseListQuery(c),
    baseWhere: { visibility: BuildVisibility.PUBLIC },
    baseFilter: Prisma.sql`visibility = 'PUBLIC'`,
    defaultSort: "newest",
  });
  return c.json(result);
});

builds.get("/mine", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "unauthorized" }, 401);

  const result = await runList({
    filters: parseListQuery(c),
    baseWhere: { userId: session.user.id },
    baseFilter: Prisma.sql`"userId" = ${session.user.id}`,
    defaultSort: "updated",
  });
  return c.json(result);
});

builds.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [session, build] = await Promise.all([
    auth.api.getSession({ headers: c.req.raw.headers }),
    prisma.build.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            displayUsername: true,
            image: true,
          },
        },
        organization: {
          select: { id: true, name: true, slug: true, image: true },
        },
        buildGuide: {
          select: { summary: true, description: true, updatedAt: true },
        },
      },
    }),
  ]);

  if (!build) return c.json({ error: "not_found" }, 404);

  const viewerId = session?.user.id;
  const canView =
    build.visibility === "PUBLIC" ||
    build.visibility === "UNLISTED" ||
    (viewerId != null && build.userId === viewerId) ||
    (viewerId != null &&
      build.organizationId != null &&
      (await isOrgMember(build.organizationId, viewerId)));

  if (!canView) return c.json({ error: "not_found" }, 404);

  return c.json({
    id: build.id,
    slug: build.slug,
    name: build.name,
    description: build.description,
    visibility: build.visibility,
    item: {
      uniqueName: build.itemUniqueName,
      category: build.itemCategory,
      name: build.itemName,
      imageName: build.itemImageName,
    },
    buildData: build.buildData,
    hasShards: build.hasShards,
    hasGuide: build.hasGuide,
    voteCount: build.voteCount,
    favoriteCount: build.favoriteCount,
    viewCount: build.viewCount,
    createdAt: build.createdAt,
    updatedAt: build.updatedAt,
    user: build.user,
    organization: build.organization,
    guide: build.buildGuide,
    isOwner: viewerId != null && build.userId === viewerId,
  });
});

async function isOrgMember(organizationId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { userId: true },
  });
  return membership != null;
}
