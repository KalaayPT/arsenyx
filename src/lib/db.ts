import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3, // Limit connections per worker during build
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @types/pg version mismatch between pg and @prisma/adapter-pg
  const adapter = new PrismaPg(pool as any)

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Cache in all environments (needed for next build with multiple workers)
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma
