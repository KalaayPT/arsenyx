# Organizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collaborative organizations so teams can publish and manage builds under a shared identity.

**Architecture:** New `Organization` and `OrganizationMember` Prisma models with a nullable `organizationId` FK on `Build`. User role system refactored from single enum to independent boolean flags. Org builds display an "ORG" badge. All org members have full edit/delete access to org builds (trust-based). Orgs are created by community leaders or admins, members added by username.

**Tech Stack:** Prisma (schema + queries), Next.js Server Actions, React Server Components, shadcn/ui, Tailwind CSS, Bun test runner.

---

### Task 1: Refactor User Roles — Schema

**Files:**
- Modify: `prisma/schema.prisma` (User model, lines 14-50)

- [ ] **Step 1: Replace the role enum with boolean flags on User model**

In `prisma/schema.prisma`, replace the `role` field and `Role` enum with four boolean columns:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?

  // App-specific fields
  username          String?  @unique
  displayUsername   String?
  bio               String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Role flags (independent, a user can have multiple)
  isVerified        Boolean @default(false)
  isCommunityLeader Boolean @default(false)
  isModerator       Boolean @default(false)
  isAdmin           Boolean @default(false)

  // Relations
  accounts       Account[]
  sessions       Session[]
  builds         Build[]
  votes          BuildVote[]
  favorites      BuildFavorite[]
  guideVotes     GuideVote[]
  guideFavorites GuideFavorite[]
  guides         Guide[]
  apiKeys        ApiKey[]
  organizationMemberships OrganizationMember[]

  @@map("users")
}
```

Delete the `Role` enum block entirely (lines 44-50 in current schema).

- [ ] **Step 2: Commit**

```bash
git add prisma/schema.prisma
git commit -m "refactor: replace user role enum with boolean flags"
```

---

### Task 2: Add Organization Models — Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add OrgRole enum, Organization model, and OrganizationMember model**

Add after the User model section in `prisma/schema.prisma`:

```prisma
// =============================================================================
// ORGANIZATIONS
// =============================================================================

enum OrgRole {
  ADMIN
  MEMBER
}

model Organization {
  id          String  @id @default(cuid())
  name        String
  slug        String  @unique
  image       String?
  description String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members OrganizationMember[]
  builds  Build[]

  @@map("organizations")
}

model OrganizationMember {
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  role     OrgRole  @default(MEMBER)
  joinedAt DateTime @default(now())

  @@id([organizationId, userId])
  @@index([userId])
  @@map("organization_members")
}
```

- [ ] **Step 2: Add organizationId FK to Build model**

In the Build model, add the organization relation after the user relation (after line 117 in current schema):

```prisma
  // Organization (optional — when set, org owns the build)
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
```

Add an index at the bottom of the Build model's indexes:

```prisma
  @@index([organizationId])
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Organization and OrganizationMember models"
```

---

### Task 3: Push Schema and Reset Database

**Files:**
- No file changes — database operations only

- [ ] **Step 1: Push schema to local database (force reset)**

```bash
bun run db:push --force-reset
```

Expected: Schema pushed successfully, data wiped.

- [ ] **Step 2: Re-run search setup**

```bash
bash -c 'docker exec -i arsenyx-db psql "postgresql://arsenyx:arsenyx_dev@localhost:5432/arsenyx" < scripts/setup-search.sql'
```

Expected: Search trigger and GIN index created.

- [ ] **Step 3: Verify Prisma Client generated correctly**

```bash
bunx prisma generate
```

Expected: Prisma Client generated, new types available.

- [ ] **Step 4: Commit** (nothing to commit — schema already committed in Tasks 1-2)

---

### Task 4: Update Auth Config for Boolean Role Flags

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Replace the single role additionalField with boolean flags**

In `src/lib/auth.ts`, replace the `user.additionalFields` block:

```typescript
  user: {
    additionalFields: {
      isVerified: {
        type: "boolean",
        defaultValue: false,
      },
      isCommunityLeader: {
        type: "boolean",
        defaultValue: false,
      },
      isModerator: {
        type: "boolean",
        defaultValue: false,
      },
      isAdmin: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "refactor: update auth config for boolean role flags"
```

---

### Task 5: Update User Types and Queries

**Files:**
- Modify: `src/lib/db/users.ts`

- [ ] **Step 1: Update UserProfile interface**

Replace the `role: string` field with boolean flags:

```typescript
export interface UserProfile {
  id: string
  name: string | null
  username: string | null
  displayUsername: string | null
  image: string | null
  bio: string | null
  createdAt: Date
  isVerified: boolean
  isCommunityLeader: boolean
  isModerator: boolean
  isAdmin: boolean
}
```

- [ ] **Step 2: Update all select statements that reference `role`**

In `getUserByUsername`, `getUserById`, and `getUserForSettings`, replace `role: true` with:

```typescript
      isVerified: true,
      isCommunityLeader: true,
      isModerator: true,
      isAdmin: true,
```

- [ ] **Step 3: Run type check to find remaining references**

```bash
bun build 2>&1 | head -60
```

Expected: May show errors in profile page or settings referencing `user.role`. Note them for next tasks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/users.ts
git commit -m "refactor: update user queries for boolean role flags"
```

---

### Task 6: Update Profile Page for Boolean Roles

**Files:**
- Modify: `src/app/profile/[username]/page.tsx`

- [ ] **Step 1: Replace role badge rendering**

Replace this block (around line 96-98):

```tsx
{user.role !== "USER" && (
  <Badge variant="secondary">{user.role}</Badge>
)}
```

With:

```tsx
{user.isAdmin && (
  <Badge variant="secondary">ADMIN</Badge>
)}
{user.isModerator && (
  <Badge variant="secondary">MODERATOR</Badge>
)}
{user.isVerified && (
  <Badge variant="secondary">VERIFIED</Badge>
)}
{user.isCommunityLeader && (
  <Badge variant="secondary">COMMUNITY LEADER</Badge>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/profile/[username]/page.tsx
git commit -m "refactor: update profile page for boolean role flags"
```

---

### Task 7: Fix Any Remaining Role References

**Files:**
- Potentially: any file referencing `user.role` or the `Role` enum

- [ ] **Step 1: Search for remaining references to old role system**

```bash
bun build 2>&1 | head -80
```

Also search for string references:

```bash
cd /c/Users/Nick/Desktop/arsenyx/.claude/worktrees/musing-brattain && grep -r "\.role" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts"
```

- [ ] **Step 2: Fix each reference found**

Common fixes:
- `user.role !== "USER"` → check individual boolean flags
- `user.role` display → render applicable badges
- `Role` type import → remove
- Any Prisma `where: { role: ... }` → use boolean flags

- [ ] **Step 3: Verify build passes**

```bash
bun build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve remaining role enum references"
```

---

### Task 8: Organization Database Queries

**Files:**
- Create: `src/lib/db/organizations.ts`

- [ ] **Step 1: Create the organization query module**

Create `src/lib/db/organizations.ts`:

```typescript
import "server-only"

import type { OrgRole } from "@prisma/client"
import { cache } from "react"

import { prisma } from "../db"

// =============================================================================
// TYPES
// =============================================================================

export interface OrganizationProfile {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
  createdAt: Date
  members: {
    userId: string
    role: OrgRole
    joinedAt: Date
    user: {
      id: string
      name: string | null
      username: string | null
      displayUsername: string | null
      image: string | null
    }
  }[]
}

export interface OrganizationListItem {
  id: string
  name: string
  slug: string
  image: string | null
  role: OrgRole
}

export interface CreateOrganizationInput {
  name: string
  slug: string
  image?: string
  description?: string
}

export interface UpdateOrganizationInput {
  name?: string
  slug?: string
  image?: string | null
  description?: string | null
}

// =============================================================================
// READ
// =============================================================================

/** Get organization by slug with members */
export const getOrganizationBySlug = cache(
  async function getOrganizationBySlug(
    slug: string,
  ): Promise<OrganizationProfile | null> {
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
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
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
      },
    })

    return org
  },
)

/** Get organization by ID */
export async function getOrganizationById(
  id: string,
): Promise<OrganizationProfile | null> {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
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
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  })

  return org
}

/** Check if a user is a member of an organization */
export async function isOrgMember(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { userId: true },
  })

  return !!member
}

/** Check if a user is an admin of an organization */
export async function isOrgAdmin(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { role: true },
  })

  return member?.role === "ADMIN"
}

/** Get all organizations a user belongs to */
export async function getUserOrganizations(
  userId: string,
): Promise<OrganizationListItem[]> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }))
}

/** Check if an organization slug is taken */
export async function isOrgSlugTaken(
  slug: string,
  excludeOrgId?: string,
): Promise<boolean> {
  const existing = await prisma.organization.findFirst({
    where: {
      slug: { equals: slug, mode: "insensitive" },
      ...(excludeOrgId && { id: { not: excludeOrgId } }),
    },
    select: { id: true },
  })
  return !!existing
}

// =============================================================================
// CREATE
// =============================================================================

/** Create a new organization and add the creator as ADMIN */
export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput,
): Promise<OrganizationProfile> {
  const org = await prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug.toLowerCase(),
      image: input.image ?? null,
      description: input.description ?? null,
      members: {
        create: {
          userId,
          role: "ADMIN",
        },
      },
    },
    include: {
      members: {
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
        },
      },
    },
  })

  return org
}

// =============================================================================
// UPDATE
// =============================================================================

/** Update organization details (admin only — caller must verify) */
export async function updateOrganization(
  orgId: string,
  input: UpdateOrganizationInput,
): Promise<OrganizationProfile> {
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug.toLowerCase() }),
      ...(input.image !== undefined && { image: input.image }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
    },
    include: {
      members: {
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
        },
      },
    },
  })

  return org
}

// =============================================================================
// MEMBERS
// =============================================================================

/** Add a member to an organization by username */
export async function addOrgMember(
  orgId: string,
  username: string,
  role: OrgRole = "MEMBER",
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  })

  if (!user) {
    throw new Error(`User "${username}" not found`)
  }

  // Check if already a member
  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId: orgId, userId: user.id },
    },
  })

  if (existing) {
    throw new Error(`User "${username}" is already a member`)
  }

  await prisma.organizationMember.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      role,
    },
  })
}

/** Remove a member from an organization */
export async function removeOrgMember(
  orgId: string,
  userId: string,
): Promise<void> {
  // Check if this is the last admin
  const adminCount = await prisma.organizationMember.count({
    where: { organizationId: orgId, role: "ADMIN" },
  })

  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId: orgId, userId },
    },
    select: { role: true },
  })

  if (member?.role === "ADMIN" && adminCount <= 1) {
    throw new Error("Cannot remove the last admin")
  }

  await prisma.organizationMember.delete({
    where: {
      organizationId_userId: { organizationId: orgId, userId },
    },
  })
}

/** Update a member's role */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: OrgRole,
): Promise<void> {
  // If demoting from admin, check if last admin
  if (role === "MEMBER") {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId },
      },
      select: { role: true },
    })

    if (member?.role === "ADMIN") {
      const adminCount = await prisma.organizationMember.count({
        where: { organizationId: orgId, role: "ADMIN" },
      })

      if (adminCount <= 1) {
        throw new Error("Cannot demote the last admin")
      }
    }
  }

  await prisma.organizationMember.update({
    where: {
      organizationId_userId: { organizationId: orgId, userId },
    },
    data: { role },
  })
}

// =============================================================================
// DELETE
// =============================================================================

/** Delete an organization, orphaning its builds back to creators */
export async function deleteOrganization(orgId: string): Promise<void> {
  await prisma.$transaction([
    // Orphan all builds back to their creators
    prisma.build.updateMany({
      where: { organizationId: orgId },
      data: { organizationId: null },
    }),
    // Delete the org (cascade deletes OrganizationMember rows)
    prisma.organization.delete({
      where: { id: orgId },
    }),
  ])
}
```

- [ ] **Step 2: Export from barrel**

Add to `src/lib/db/index.ts`:

```typescript
// Organization operations
export {
  getOrganizationBySlug,
  getOrganizationById,
  isOrgMember,
  isOrgAdmin,
  getUserOrganizations,
  isOrgSlugTaken,
  createOrganization,
  updateOrganization,
  addOrgMember,
  removeOrgMember,
  updateMemberRole,
  deleteOrganization,
} from "./organizations"

export type {
  OrganizationProfile,
  OrganizationListItem,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "./organizations"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/organizations.ts src/lib/db/index.ts
git commit -m "feat: add organization database queries"
```

---

### Task 9: Update Build Permission Checks

**Files:**
- Modify: `src/lib/db/builds.ts`

- [ ] **Step 1: Update BuildWithUser type to include organization**

Add to the `BuildWithUser` interface (after the `user` field):

```typescript
  organization: {
    id: string
    name: string
    slug: string
    image: string | null
  } | null
```

- [ ] **Step 2: Update BuildListItem type**

Add to the `BuildListItem` interface:

```typescript
  organization: {
    id: string
    name: string
    slug: string
  } | null
```

- [ ] **Step 3: Update buildInclude to include organization**

In the `buildInclude` constant, add:

```typescript
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
  },
```

- [ ] **Step 4: Update buildListSelect to include organization**

In the `buildListSelect` constant, add:

```typescript
  organizationId: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
```

- [ ] **Step 5: Update mapBuildListItem to pass through organization**

In `mapBuildListItem`, the spread already handles it, but ensure the type mapping is correct. The `organization` field will be passed through by the spread. Verify:

```typescript
function mapBuildListItem(
  build: Record<string, unknown>,
): BuildListItem {
  return {
    ...build,
    item: {
      name: build.itemName as string,
      imageName: (build.itemImageName as string | null) ?? null,
      browseCategory: build.itemCategory as string,
    },
  } as BuildListItem
}
```

No changes needed — the spread passes `organization` through, and the `as BuildListItem` cast handles the type.

- [ ] **Step 6: Update canViewBuild to check org membership for private builds**

Replace the `canViewBuild` function:

```typescript
function canViewBuild(
  build: { visibility: BuildVisibility; userId: string; organizationId?: string | null },
  viewerId?: string,
): boolean {
  // Owner can always view
  if (viewerId && build.userId === viewerId) {
    return true
  }

  // Public and unlisted builds are viewable by anyone
  if (build.visibility === "PUBLIC" || build.visibility === "UNLISTED") {
    return true
  }

  // Private builds are only viewable by owner (org membership checked at higher level)
  return false
}
```

- [ ] **Step 7: Update updateBuild to allow org members**

Replace the ownership check in `updateBuild`:

```typescript
export async function updateBuild(
  buildId: string,
  userId: string,
  input: UpdateBuildInput,
): Promise<BuildWithUser> {
  // First verify ownership or org membership
  const existing = await prisma.build.findUnique({
    where: { id: buildId },
    select: { userId: true, organizationId: true },
  })

  if (!existing) {
    throw new Error("Build not found")
  }

  const isOwner = existing.userId === userId
  let isOrgMemberAllowed = false

  if (!isOwner && existing.organizationId) {
    const { isOrgMember } = await import("./organizations")
    isOrgMemberAllowed = await isOrgMember(existing.organizationId, userId)
  }

  if (!isOwner && !isOrgMemberAllowed) {
    throw new Error("Not authorized to update this build")
  }
```

The rest of the function stays the same.

- [ ] **Step 8: Update deleteBuild to allow org members**

Replace the ownership check in `deleteBuild`:

```typescript
export async function deleteBuild(
  buildId: string,
  userId: string,
): Promise<void> {
  const existing = await prisma.build.findUnique({
    where: { id: buildId },
    select: { userId: true, organizationId: true },
  })

  if (!existing) {
    throw new Error("Build not found")
  }

  const isOwner = existing.userId === userId
  let isOrgMemberAllowed = false

  if (!isOwner && existing.organizationId) {
    const { isOrgMember } = await import("./organizations")
    isOrgMemberAllowed = await isOrgMember(existing.organizationId, userId)
  }

  if (!isOwner && !isOrgMemberAllowed) {
    throw new Error("Not authorized to delete this build")
  }

  await prisma.build.delete({
    where: { id: buildId },
  })
}
```

- [ ] **Step 9: Update CreateBuildInput to accept organizationId**

Add to `CreateBuildInput`:

```typescript
export interface CreateBuildInput {
  organizationId?: string
  itemUniqueName: string
  // ... rest stays the same
}
```

- [ ] **Step 10: Update createBuild to set organizationId**

In the `prisma.build.create` data block inside `createBuild`, add:

```typescript
      organizationId: input.organizationId ?? null,
```

- [ ] **Step 11: Commit**

```bash
git add src/lib/db/builds.ts
git commit -m "feat: update build queries for org ownership"
```

---

### Task 10: Update Build Server Actions

**Files:**
- Modify: `src/app/actions/builds.ts`

- [ ] **Step 1: Add organizationId to SaveBuildInput**

```typescript
export interface SaveBuildInput {
  buildId?: string
  organizationId?: string  // Publish under this org
  itemUniqueName: string
  // ... rest stays the same
}
```

- [ ] **Step 2: Update saveBuildAction to validate org membership and pass organizationId**

In `saveBuildAction`, after the auth check, add org validation:

```typescript
    // Validate org membership if publishing under an org
    if (input.organizationId) {
      const { isOrgMember } = await import("@/lib/db/organizations")
      const isMember = await isOrgMember(input.organizationId, userId)
      if (!isMember) {
        return err("You are not a member of this organization")
      }
    }
```

In the create path, pass `organizationId`:

```typescript
    const createData: CreateBuildInput = {
      organizationId: input.organizationId,
      itemUniqueName: input.itemUniqueName,
      // ... rest stays the same
    }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/builds.ts
git commit -m "feat: update build actions for org publishing"
```

---

### Task 11: Organization Server Actions

**Files:**
- Create: `src/app/actions/organizations.ts`

- [ ] **Step 1: Create the organization server actions file**

Create `src/app/actions/organizations.ts`:

```typescript
"use server"

import type { OrgRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getServerSession } from "@/lib/auth"
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addOrgMember,
  removeOrgMember,
  updateMemberRole,
  isOrgSlugTaken,
  isOrgAdmin,
  getUserOrganizations,
  getOrganizationBySlug,
  type OrganizationProfile,
  type OrganizationListItem,
} from "@/lib/db/organizations"
import { prisma } from "@/lib/db"
import { err, getErrorMessage, ok, type Result } from "@/lib/result"

// =============================================================================
// SCHEMAS
// =============================================================================

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(30, "Slug must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  image: z.string().url().optional().or(z.literal("")),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .optional()
    .or(z.literal("")),
})

const updateOrgSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .optional(),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  image: z.string().url().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
})

// =============================================================================
// CREATE
// =============================================================================

export async function createOrganizationAction(
  input: z.infer<typeof createOrgSchema>,
): Promise<Result<OrganizationProfile>> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    // Check if user can create orgs
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isCommunityLeader: true, isAdmin: true },
    })

    if (!user?.isCommunityLeader && !user?.isAdmin) {
      return err("You do not have permission to create organizations")
    }

    const parsed = createOrgSchema.safeParse(input)
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    // Check slug availability
    const slugTaken = await isOrgSlugTaken(parsed.data.slug)
    if (slugTaken) {
      return err("This slug is already taken")
    }

    const org = await createOrganization(session.user.id, {
      name: parsed.data.name,
      slug: parsed.data.slug,
      image: parsed.data.image || undefined,
      description: parsed.data.description || undefined,
    })

    revalidatePath("/settings")

    return ok(org)
  } catch (error) {
    return err(getErrorMessage(error, "Failed to create organization"))
  }
}

// =============================================================================
// UPDATE
// =============================================================================

export async function updateOrganizationAction(
  orgId: string,
  input: z.infer<typeof updateOrgSchema>,
): Promise<Result<OrganizationProfile>> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    const admin = await isOrgAdmin(orgId, session.user.id)
    if (!admin) {
      return err("Only admins can update organization settings")
    }

    const parsed = updateOrgSchema.safeParse(input)
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input")
    }

    // Check slug availability if changing
    if (parsed.data.slug) {
      const slugTaken = await isOrgSlugTaken(parsed.data.slug, orgId)
      if (slugTaken) {
        return err("This slug is already taken")
      }
    }

    const org = await updateOrganization(orgId, parsed.data)
    revalidatePath(`/org/${org.slug}`)

    return ok(org)
  } catch (error) {
    return err(getErrorMessage(error, "Failed to update organization"))
  }
}

// =============================================================================
// DELETE
// =============================================================================

export async function deleteOrganizationAction(
  orgId: string,
): Promise<Result> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    const admin = await isOrgAdmin(orgId, session.user.id)
    if (!admin) {
      return err("Only admins can delete an organization")
    }

    await deleteOrganization(orgId)
    revalidatePath("/settings")

    return ok()
  } catch (error) {
    return err(getErrorMessage(error, "Failed to delete organization"))
  }
}

// =============================================================================
// MEMBERS
// =============================================================================

export async function addOrgMemberAction(
  orgId: string,
  username: string,
): Promise<Result> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    const admin = await isOrgAdmin(orgId, session.user.id)
    if (!admin) {
      return err("Only admins can add members")
    }

    await addOrgMember(orgId, username.trim())
    revalidatePath(`/org`)

    return ok()
  } catch (error) {
    return err(getErrorMessage(error, "Failed to add member"))
  }
}

export async function removeOrgMemberAction(
  orgId: string,
  userId: string,
): Promise<Result> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    const admin = await isOrgAdmin(orgId, session.user.id)
    if (!admin) {
      return err("Only admins can remove members")
    }

    await removeOrgMember(orgId, userId)
    revalidatePath(`/org`)

    return ok()
  } catch (error) {
    return err(getErrorMessage(error, "Failed to remove member"))
  }
}

export async function updateMemberRoleAction(
  orgId: string,
  userId: string,
  role: OrgRole,
): Promise<Result> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    const admin = await isOrgAdmin(orgId, session.user.id)
    if (!admin) {
      return err("Only admins can change member roles")
    }

    await updateMemberRole(orgId, userId, role)
    revalidatePath(`/org`)

    return ok()
  } catch (error) {
    return err(getErrorMessage(error, "Failed to update member role"))
  }
}

// =============================================================================
// READ (for client use)
// =============================================================================

export async function getUserOrganizationsAction(): Promise<
  Result<OrganizationListItem[]>
> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    const orgs = await getUserOrganizations(session.user.id)
    return ok(orgs)
  } catch (error) {
    return err(getErrorMessage(error, "Failed to load organizations"))
  }
}

export async function getOrganizationSettingsAction(
  slug: string,
): Promise<Result<OrganizationProfile>> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return err("You must be signed in")
    }

    const org = await getOrganizationBySlug(slug)
    if (!org) {
      return err("Organization not found")
    }

    const admin = await isOrgAdmin(org.id, session.user.id)
    if (!admin) {
      return err("Only admins can access organization settings")
    }

    return ok(org)
  } catch (error) {
    return err(getErrorMessage(error, "Failed to load organization"))
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/organizations.ts
git commit -m "feat: add organization server actions"
```

---

### Task 12: Org Profile Page

**Files:**
- Create: `src/app/org/[slug]/page.tsx`

- [ ] **Step 1: Create the org profile page**

Create `src/app/org/[slug]/page.tsx`:

```tsx
import { Calendar } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { ProfileBuilds } from "@/components/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getServerSession } from "@/lib/auth"
import { getOrganizationBySlug } from "@/lib/db/organizations"
import { getPublicBuilds } from "@/lib/db/builds"

export const revalidate = 3600

interface OrgPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: OrgPageProps): Promise<Metadata> {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return { title: "Organization Not Found | ARSENYX" }
  }

  return {
    title: `${org.name} | ARSENYX`,
    description:
      org.description || `View ${org.name}'s Warframe builds on ARSENYX`,
  }
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { slug } = await params
  const [org, session] = await Promise.all([
    getOrganizationBySlug(slug),
    getServerSession(),
  ])

  if (!org) {
    notFound()
  }

  const viewerId = session?.user?.id
  const isMember = org.members.some((m) => m.userId === viewerId)

  // Get org builds — query public builds filtered by organizationId
  // For now, use a direct Prisma query since getPublicBuilds doesn't support org filter yet
  const { prisma } = await import("@/lib/db")
  const [builds, totalBuilds] = await Promise.all([
    prisma.build.findMany({
      where: { organizationId: org.id, visibility: "PUBLIC" },
      select: {
        id: true,
        slug: true,
        name: true,
        visibility: true,
        voteCount: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true, username: true } },
        itemUniqueName: true,
        itemName: true,
        itemImageName: true,
        itemCategory: true,
        organizationId: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { voteCount: "desc" },
      take: 12,
    }),
    prisma.build.count({
      where: { organizationId: org.id, visibility: "PUBLIC" },
    }),
  ])

  const mappedBuilds = builds.map((b) => ({
    ...b,
    item: {
      name: b.itemName,
      imageName: b.itemImageName,
      browseCategory: b.itemCategory,
    },
  }))

  const joinDate = new Date(org.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex flex-col gap-8 py-8">
          {/* Org Header */}
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <div className="shrink-0">
              {org.image ? (
                <Image
                  src={org.image}
                  alt={org.name}
                  width={128}
                  height={128}
                  unoptimized
                  className="rounded-full"
                />
              ) : (
                <div className="bg-muted flex size-32 items-center justify-center rounded-full text-4xl font-bold">
                  {org.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{org.name}</h1>
                <Badge
                  className="bg-[#7c3aed] text-white hover:bg-[#7c3aed]"
                >
                  ORG
                </Badge>
                {isMember && (
                  <Link href={`/org/${slug}/settings`}>
                    <Button variant="outline" size="sm">
                      Settings
                    </Button>
                  </Link>
                )}
              </div>

              {org.description && (
                <p className="text-muted-foreground max-w-xl">
                  {org.description}
                </p>
              )}

              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  Created {joinDate}
                </span>
              </div>

              <div className="flex gap-6 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalBuilds}</div>
                  <div className="text-muted-foreground text-xs">Builds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{org.members.length}</div>
                  <div className="text-muted-foreground text-xs">Members</div>
                </div>
              </div>
            </div>
          </div>

          {/* Members */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Members</h2>
            <div className="flex flex-wrap gap-4">
              {org.members.map((member) => (
                <Link
                  key={member.userId}
                  href={`/profile/${member.user.username}`}
                  className="hover:bg-muted flex items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <Avatar className="size-10">
                    <AvatarImage
                      src={member.user.image ?? undefined}
                      alt={
                        member.user.displayUsername ??
                        member.user.username ??
                        "Member"
                      }
                    />
                    <AvatarFallback>
                      {(
                        member.user.displayUsername ??
                        member.user.username ??
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {member.user.displayUsername ??
                        member.user.username ??
                        member.user.name}
                    </div>
                    {member.role === "ADMIN" && (
                      <Badge variant="secondary" className="text-[10px]">
                        Admin
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Org Builds */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Builds</h2>
            {mappedBuilds.length > 0 ? (
              <ProfileBuilds
                userId=""
                initialBuilds={mappedBuilds as any}
                initialHasMore={totalBuilds > 12}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                No builds published yet.
              </p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

Note: The `ProfileBuilds` component reuse is a simplification — it expects `userId` for pagination. This will need refinement when pagination is wired up for org builds. For the MVP, the initial 12 builds display correctly.

- [ ] **Step 2: Commit**

```bash
git add src/app/org/[slug]/page.tsx
git commit -m "feat: add organization profile page"
```

---

### Task 13: Org Settings Page

**Files:**
- Create: `src/app/org/[slug]/settings/page.tsx`
- Create: `src/components/org/org-settings-form.tsx`
- Create: `src/components/org/index.ts`

- [ ] **Step 1: Create the org settings server page**

Create `src/app/org/[slug]/settings/page.tsx`:

```tsx
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OrgSettingsForm } from "@/components/org"
import { getServerSession } from "@/lib/auth"
import { getOrganizationBySlug, isOrgAdmin } from "@/lib/db/organizations"

export const metadata: Metadata = {
  title: "Organization Settings | ARSENYX",
}

interface OrgSettingsPageProps {
  params: Promise<{ slug: string }>
}

export default async function OrgSettingsPage({
  params,
}: OrgSettingsPageProps) {
  const { slug } = await params
  const [org, session] = await Promise.all([
    getOrganizationBySlug(slug),
    getServerSession(),
  ])

  if (!org) {
    notFound()
  }

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const admin = await isOrgAdmin(org.id, session.user.id)
  if (!admin) {
    notFound()
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          <OrgSettingsForm org={org} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Create the OrgSettingsForm client component**

Create `src/components/org/org-settings-form.tsx`:

```tsx
"use client"

import type { OrgRole } from "@prisma/client"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import {
  updateOrganizationAction,
  deleteOrganizationAction,
  addOrgMemberAction,
  removeOrgMemberAction,
  updateMemberRoleAction,
} from "@/app/actions/organizations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { OrganizationProfile } from "@/lib/db/organizations"

interface OrgSettingsFormProps {
  org: OrganizationProfile
}

export function OrgSettingsForm({ org }: OrgSettingsFormProps) {
  const router = useRouter()

  // General settings
  const [name, setName] = useState(org.name)
  const [slug, setSlug] = useState(org.slug)
  const [image, setImage] = useState(org.image ?? "")
  const [description, setDescription] = useState(org.description ?? "")
  const [isSaving, setIsSaving] = useState(false)

  // Members
  const [newUsername, setNewUsername] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [members, setMembers] = useState(org.members)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    const result = await updateOrganizationAction(org.id, {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      image: image.trim() || null,
      description: description.trim() || null,
    })

    setIsSaving(false)

    if (result.success) {
      toast.success("Organization updated")
      if (slug.trim().toLowerCase() !== org.slug) {
        router.push(`/org/${slug.trim().toLowerCase()}/settings`)
      }
    } else {
      toast.error(result.error)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newUsername.trim()) return

    setIsAddingMember(true)
    const result = await addOrgMemberAction(org.id, newUsername.trim())
    setIsAddingMember(false)

    if (result.success) {
      toast.success(`Added ${newUsername.trim()}`)
      setNewUsername("")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleRemoveMember(userId: string, username: string) {
    const result = await removeOrgMemberAction(org.id, userId)

    if (result.success) {
      toast.success(`Removed ${username}`)
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
    } else {
      toast.error(result.error)
    }
  }

  async function handleRoleChange(userId: string, role: OrgRole) {
    const result = await updateMemberRoleAction(org.id, userId, role)

    if (result.success) {
      toast.success("Role updated")
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
      )
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== org.name) return

    setIsDeleting(true)
    const result = await deleteOrganizationAction(org.id)
    setIsDeleting(false)

    if (result.success) {
      toast.success("Organization deleted")
      router.push("/settings")
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Organization Settings</h1>

      {/* General */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">General</h2>
        <form onSubmit={handleSaveGeneral}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">Name</FieldLabel>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-slug">Slug</FieldLabel>
              <Input
                id="org-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                maxLength={30}
              />
              <FieldDescription>
                URL: arsenyx.com/org/{slug.toLowerCase() || "..."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="org-image">Avatar URL</FieldLabel>
              <Input
                id="org-image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-description">Description</FieldLabel>
              <Textarea
                id="org-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={2}
              />
              <FieldDescription>{description.length}/200</FieldDescription>
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={isSaving} className="mt-4">
            {isSaving && <Spinner />}
            Save
          </Button>
        </form>
      </section>

      {/* Members */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Members</h2>

        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage
                    src={member.user.image ?? undefined}
                    alt={member.user.username ?? "Member"}
                  />
                  <AvatarFallback>
                    {(member.user.username ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {member.user.displayUsername ??
                    member.user.username ??
                    member.user.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={member.role}
                  onValueChange={(value) =>
                    handleRoleChange(member.userId, value as OrgRole)
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleRemoveMember(
                      member.userId,
                      member.user.username ?? "user",
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddMember} className="flex gap-2">
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Username to add..."
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={isAddingMember}>
            {isAddingMember && <Spinner />}
            Add Member
          </Button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="flex flex-col gap-4 rounded-lg border border-red-500/20 p-4">
        <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
        <p className="text-muted-foreground text-sm">
          Deleting this organization will orphan all builds back to their
          original creators. This cannot be undone.
        </p>
        <div className="flex items-end gap-2">
          <Field className="flex-1">
            <FieldLabel htmlFor="delete-confirm">
              Type &quot;{org.name}&quot; to confirm
            </FieldLabel>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={org.name}
            />
          </Field>
          <Button
            variant="destructive"
            disabled={deleteConfirm !== org.name || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting && <Spinner />}
            Delete Organization
          </Button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Create barrel export**

Create `src/components/org/index.ts`:

```typescript
export { OrgSettingsForm } from "./org-settings-form"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/org/[slug]/settings/page.tsx src/components/org/org-settings-form.tsx src/components/org/index.ts
git commit -m "feat: add organization settings page"
```

---

### Task 14: Organizations Section in User Settings

**Files:**
- Modify: `src/components/settings/settings-sheet.tsx`

- [ ] **Step 1: Add organizations section to settings sheet**

Import the org actions at the top:

```typescript
import {
  getUserOrganizationsAction,
  createOrganizationAction,
} from "@/app/actions/organizations"
import type { OrganizationListItem } from "@/lib/db/organizations"
```

Add state after existing state declarations:

```typescript
const [orgs, setOrgs] = useState<OrganizationListItem[]>([])
const [showCreateOrg, setShowCreateOrg] = useState(false)
const [newOrgName, setNewOrgName] = useState("")
const [newOrgSlug, setNewOrgSlug] = useState("")
const [isCreatingOrg, setIsCreatingOrg] = useState(false)
const [canCreateOrg, setCanCreateOrg] = useState(false)
```

In the `useEffect` that fetches settings data, also fetch orgs:

```typescript
getUserOrganizationsAction().then((result) => {
  if (result.success) {
    setOrgs(result.data)
  }
})
```

Also read user flags from the settings result to determine `canCreateOrg`:

```typescript
// After the existing getSettingsDataAction().then(...)
// The user flags need to come from the settings data
// Add isCommunityLeader and isAdmin to UserProfileFull type if not already there
```

Add an org creation handler:

```typescript
async function handleCreateOrg(e: React.FormEvent) {
  e.preventDefault()
  setIsCreatingOrg(true)

  const result = await createOrganizationAction({
    name: newOrgName.trim(),
    slug: newOrgSlug.trim().toLowerCase() || newOrgName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
  })

  setIsCreatingOrg(false)

  if (result.success) {
    toast.success("Organization created")
    setShowCreateOrg(false)
    setNewOrgName("")
    setNewOrgSlug("")
    // Refresh orgs list
    const orgsResult = await getUserOrganizationsAction()
    if (orgsResult.success) {
      setOrgs(orgsResult.data)
    }
  } else {
    toast.error(result.error)
  }
}
```

Add the organizations section in the form JSX, after the existing fields and before `</FieldGroup>`:

```tsx
{/* Organizations */}
<div className="border-t pt-4">
  <h3 className="mb-3 text-sm font-semibold">Organizations</h3>
  {orgs.length > 0 ? (
    <div className="flex flex-col gap-2">
      {orgs.map((org) => (
        <Link
          key={org.id}
          href={`/org/${org.slug}`}
          className="hover:bg-muted flex items-center justify-between rounded-lg border p-2 text-sm transition-colors"
        >
          <span className="font-medium">{org.name}</span>
          <Badge variant="secondary" className="text-[10px]">
            {org.role}
          </Badge>
        </Link>
      ))}
    </div>
  ) : (
    <p className="text-muted-foreground text-sm">
      You&apos;re not in any organizations yet.
    </p>
  )}

  {canCreateOrg && !showCreateOrg && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-3"
      onClick={() => setShowCreateOrg(true)}
    >
      Create Organization
    </Button>
  )}

  {showCreateOrg && (
    <form onSubmit={handleCreateOrg} className="mt-3 flex flex-col gap-2">
      <Input
        value={newOrgName}
        onChange={(e) => {
          setNewOrgName(e.target.value)
          setNewOrgSlug(
            e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          )
        }}
        placeholder="Organization name..."
        maxLength={50}
      />
      <Input
        value={newOrgSlug}
        onChange={(e) => setNewOrgSlug(e.target.value)}
        placeholder="slug..."
        maxLength={30}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isCreatingOrg || !newOrgName.trim()}
        >
          {isCreatingOrg && <Spinner />}
          Create
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateOrg(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )}
</div>
```

Add the `Link` import at the top if not already there:

```typescript
import Link from "next/link"
```

- [ ] **Step 2: Update UserProfileFull to include role flags**

In `src/lib/db/users.ts`, ensure `UserProfileFull` includes the flags:

```typescript
export interface UserProfileFull extends UserProfile {
  email: string
}
```

Since `UserProfile` already has the boolean flags (from Task 5), `UserProfileFull` inherits them. Verify `getUserForSettings` selects them (should already from Task 5).

- [ ] **Step 3: Pass canCreateOrg flag in the useEffect**

In the settings sheet `useEffect`, after `setUserData(...)`:

```typescript
setCanCreateOrg(
  user.isCommunityLeader === true || user.isAdmin === true,
)
```

This requires `isCommunityLeader` and `isAdmin` to be in the response. They should be via `UserProfileFull` → `UserProfile`.

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/settings-sheet.tsx src/lib/db/users.ts
git commit -m "feat: add organizations section to settings sheet"
```

---

### Task 15: Org Badge Component

**Files:**
- Create: `src/components/org/org-badge.tsx`
- Modify: `src/components/org/index.ts`

- [ ] **Step 1: Create the OrgBadge component**

Create `src/components/org/org-badge.tsx`:

```tsx
import Link from "next/link"

interface OrgBadgeProps {
  name: string
  slug: string
  /** Render as a link to the org profile */
  linked?: boolean
}

/** Purple "ORG" pill badge with org name */
export function OrgBadge({ name, slug, linked = true }: OrgBadgeProps) {
  const content = (
    <span className="inline-flex items-center gap-1">
      <span className="rounded bg-[#7c3aed] px-[5px] py-[1px] text-[9px] font-semibold text-white">
        ORG
      </span>
      <span className="text-[#a78bfa]">{name}</span>
    </span>
  )

  if (linked) {
    return (
      <Link
        href={`/org/${slug}`}
        className="hover:underline"
      >
        {content}
      </Link>
    )
  }

  return content
}
```

- [ ] **Step 2: Export from barrel**

Update `src/components/org/index.ts`:

```typescript
export { OrgBadge } from "./org-badge"
export { OrgSettingsForm } from "./org-settings-form"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/org/org-badge.tsx src/components/org/index.ts
git commit -m "feat: add OrgBadge component"
```

---

### Task 16: Update Build Display with Org Badge

**Files:**
- Modify: `src/app/builds/[slug]/page.tsx`
- Modify: `src/app/browse/[category]/[slug]/page.tsx` (CommunityBuildsSection)

- [ ] **Step 1: Update build detail page header**

In `src/app/builds/[slug]/page.tsx`, add import:

```typescript
import { OrgBadge } from "@/components/org"
```

Replace the author line (around line 181-183):

```tsx
<span className="text-muted-foreground text-sm">
  by {build.user.username || build.user.name || "Anonymous"}
</span>
```

With:

```tsx
{build.organization ? (
  <span className="text-sm">
    <OrgBadge
      name={build.organization.name}
      slug={build.organization.slug}
    />
  </span>
) : (
  <span className="text-muted-foreground text-sm">
    by {build.user.username || build.user.name || "Anonymous"}
  </span>
)}
```

- [ ] **Step 2: Update isOwner check to include org membership**

Currently (line 141):

```tsx
const isOwner = viewerId === build.userId
```

Replace with an org-aware check. Since we need a DB call for org membership, import `isOrgMember`:

```typescript
import { isOrgMember } from "@/lib/db/organizations"
```

```tsx
const isOwner = viewerId === build.userId
const canEdit = isOwner || (
  build.organization && viewerId
    ? await isOrgMember(build.organization.id, viewerId)
    : false
)
```

Then pass `canEdit` instead of `isOwner` to `readOnly`:

```tsx
<BuildContainer
  ...
  readOnly={!canEdit}
  isOwner={canEdit}
  ...
/>
```

- [ ] **Step 3: Update community builds section with org badge**

In `src/app/browse/[category]/[slug]/page.tsx`, add import:

```typescript
import { OrgBadge } from "@/components/org"
```

Find the `subtitle` prop on `BuildCardLink` in the community builds mapping and replace:

```tsx
subtitle={
  <p className="text-muted-foreground line-clamp-1 text-xs">
    by {build.user.username || build.user.name || "Anonymous"}
  </p>
}
```

With:

```tsx
subtitle={
  build.organization ? (
    <p className="line-clamp-1 text-xs">
      <OrgBadge
        name={build.organization.name}
        slug={build.organization.slug}
      />
    </p>
  ) : (
    <p className="text-muted-foreground line-clamp-1 text-xs">
      by {build.user.username || build.user.name || "Anonymous"}
    </p>
  )
}
```

- [ ] **Step 4: Update metadata description for org builds**

In `src/app/builds/[slug]/page.tsx` `generateMetadata`, update the description:

```typescript
const description =
  build.description ||
  (build.organization
    ? `${build.item.name} build by ${build.organization.name}`
    : `${build.item.name} build by ${build.user.username || build.user.name || "Anonymous"}`)
```

This requires `getBuildBySlug` to return the organization. It will since we updated `buildInclude` in Task 9. But the metadata call doesn't pass a `viewerId`, so we need `organization` in the non-authenticated select too — it already is since `buildInclude` is used for all `getBuildBySlug` calls.

- [ ] **Step 5: Commit**

```bash
git add src/app/builds/[slug]/page.tsx src/app/browse/[category]/[slug]/page.tsx
git commit -m "feat: display org badge on build pages"
```

---

### Task 17: "Publish As" Picker in Build Editor

**Files:**
- Modify: `src/components/build-editor/hooks/use-build-persistence.ts`
- Modify: `src/app/actions/builds.ts` (already done in Task 10)

- [ ] **Step 1: Add organizationId to the persistence hook**

In `src/components/build-editor/hooks/use-build-persistence.ts`, add to `UseBuildPersistenceProps`:

```typescript
  organizationId?: string
```

Add to `UseBuildPersistenceReturn`:

```typescript
  organizationId: string | undefined
  setOrganizationId: (id: string | undefined) => void
```

Add state:

```typescript
const [organizationId, setOrganizationId] = useState<string | undefined>(undefined)
```

In `handlePublish`, add `organizationId` to the `saveBuildAction` call:

```typescript
const result = await saveBuildAction({
  buildId: buildId,
  organizationId,
  itemUniqueName: item.uniqueName,
  // ... rest stays the same
})
```

Return `organizationId` and `setOrganizationId` from the hook.

- [ ] **Step 2: Update PublishDialog to include "Publish as" org picker**

Modify `src/components/build-editor/publish-dialog.tsx`. Add imports:

```typescript
import { useEffect } from "react"

import { getUserOrganizationsAction } from "@/app/actions/organizations"
import type { OrganizationListItem } from "@/lib/db/organizations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
```

Update `PublishDialogProps`:

```typescript
interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPublish: (visibility: Visibility) => Promise<void>
  isPublishing: boolean
  isUpdate?: boolean
  organizationId?: string
  onOrganizationChange?: (id: string | undefined) => void
}
```

Add `organizationId` and `onOrganizationChange` to the destructured props.

Inside `PublishDialog`, add state and fetch logic:

```typescript
const [orgs, setOrgs] = useState<OrganizationListItem[]>([])

useEffect(() => {
  if (!open) return
  getUserOrganizationsAction().then((result) => {
    if (result.success) {
      setOrgs(result.data)
    }
  })
}, [open])
```

Add the "Publish as" select in the JSX, before the visibility options `<div className="grid gap-4 py-4">`:

```tsx
{orgs.length > 0 && onOrganizationChange && (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium">Publish as</label>
    <Select
      value={organizationId ?? "__personal"}
      onValueChange={(value) =>
        onOrganizationChange(value === "__personal" ? undefined : value)
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Yourself" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__personal">Yourself</SelectItem>
        {orgs.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

- [ ] **Step 3: Wire up the org picker from BuildEditorHeader through to PublishDialog**

In `src/components/build-editor/build-editor-header.tsx` (or wherever `PublishDialog` is rendered), pass the `organizationId` and `onOrganizationChange` props from the persistence hook:

```tsx
<PublishDialog
  open={publishDialogOpen}
  onOpenChange={setPublishDialogOpen}
  onPublish={handlePublish}
  isPublishing={saveStatus === "saving"}
  isUpdate={!!buildId}
  organizationId={organizationId}
  onOrganizationChange={setOrganizationId}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/build-editor/
git commit -m "feat: add publish-as-org picker to build editor"
```

---

### Task 18: Build and Verify

**Files:**
- No file changes

- [ ] **Step 1: Run the full build**

```bash
bun build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 2: Start dev server and smoke test**

```bash
bun dev
```

Manual verification checklist:
1. Home page loads
2. Browse page loads, build cards render
3. Create a build — verify save works
4. Profile page shows boolean role badges (not enum)
5. Settings sheet opens and shows organizations section

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build and integration issues"
```

---

### Task 19: Lint and Format

**Files:**
- All new/modified files

- [ ] **Step 1: Run linter**

```bash
bun lint:fix
```

Expected: No errors (or auto-fixed).

- [ ] **Step 2: Run formatter**

```bash
bun fmt
```

Expected: All files formatted.

- [ ] **Step 3: Final build check**

```bash
bun build
```

Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: lint and format"
```
