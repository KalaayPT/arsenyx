import { AsyncLocalStorage } from "node:async_hooks"
import { PrismaNeon } from "@prisma/adapter-neon"

import { PrismaClient } from "./generated/prisma/client"

// Workers reuses isolates across requests, and the Neon driver's Pool is
// request-scoped. A module-level PrismaClient singleton leaks I/O across
// requests → `Cannot perform I/O on behalf of a different request`. We scope
// one client per request via AsyncLocalStorage; routes keep using the
// `prisma` proxy unchanged.

const als = new AsyncLocalStorage<PrismaClient>()

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  })
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

export function withPrisma<T>(fn: () => T | Promise<T>): Promise<T> {
  return Promise.resolve(als.run(createPrismaClient(), fn))
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = als.getStore()
    if (!client) {
      throw new Error(
        "prisma accessed outside withPrisma() — wrap the request handler",
      )
    }
    return Reflect.get(client as object, prop)
  },
})
