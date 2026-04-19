import { Hono } from "hono"

import { auth } from "../auth"
import { prisma } from "../db"

export const me = new Hono()

me.get("/builds/export", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) return c.json({ error: "unauthorized" }, 401)

  const builds = await prisma.build.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      itemUniqueName: true,
      itemCategory: true,
      itemName: true,
      itemImageName: true,
      name: true,
      description: true,
      visibility: true,
      buildData: true,
      hasShards: true,
      hasGuide: true,
      createdAt: true,
      updatedAt: true,
      forkedFromId: true,
      organizationId: true,
    },
  })

  const date = new Date().toISOString().slice(0, 10)
  const payload = {
    exportedAt: new Date().toISOString(),
    userId: session.user.id,
    count: builds.length,
    builds,
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="arsenyx-builds-${date}.json"`,
    },
  })
})
