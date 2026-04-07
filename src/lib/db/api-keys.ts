import "server-only"

import { prisma } from "@/lib/db"

/**
 * Find an API key by its hashed value
 */
export async function findApiKeyByHash(
  hashedKey: string,
): Promise<{
  id: string
  userId: string
  name: string
  keyPrefix: string
  scopes: string[]
  rateLimit: number
  isActive: boolean
  lastUsedAt: Date | null
  expiresAt: Date | null
} | null> {
  return prisma.apiKey.findUnique({
    where: { key: hashedKey },
    select: {
      id: true,
      userId: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      rateLimit: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  })
}

/**
 * Update lastUsedAt timestamp for an API key
 */
export async function touchApiKey(id: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  })
}

/**
 * List all API keys (for admin panel)
 */
export async function listApiKeys() {
  return prisma.apiKey.findMany({
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Create a new API key (stores hashed key, returns raw key once)
 */
export async function createApiKey(input: {
  userId: string
  name: string
  hashedKey: string
  keyPrefix: string
  scopes: string[]
  rateLimit: number
  expiresAt: Date | null
}) {
  return prisma.apiKey.create({
    data: {
      userId: input.userId,
      name: input.name,
      key: input.hashedKey,
      keyPrefix: input.keyPrefix,
      scopes: input.scopes,
      rateLimit: input.rateLimit,
      expiresAt: input.expiresAt,
    },
  })
}

/**
 * Toggle API key active status
 */
export async function setApiKeyActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await prisma.apiKey.update({
    where: { id },
    data: { isActive },
  })
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(id: string): Promise<void> {
  await prisma.apiKey.delete({ where: { id } })
}
