-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'VERIFIED', 'DEVELOPER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "BuildVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "username" TEXT,
    "usernameLower" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "uniqueName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageName" TEXT,
    "category" TEXT NOT NULL,
    "browseCategory" TEXT NOT NULL,
    "tradable" BOOLEAN NOT NULL DEFAULT false,
    "masteryReq" INTEGER,
    "isPrime" BOOLEAN NOT NULL DEFAULT false,
    "vaulted" BOOLEAN NOT NULL DEFAULT false,
    "releaseDate" TIMESTAMP(3),
    "data" JSONB NOT NULL,
    "supportsShards" BOOLEAN NOT NULL DEFAULT false,
    "wfcdVersion" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mods" (
    "id" TEXT NOT NULL,
    "uniqueName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageName" TEXT,
    "polarity" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "baseDrain" INTEGER NOT NULL,
    "fusionLimit" INTEGER NOT NULL,
    "compatName" TEXT,
    "type" TEXT NOT NULL,
    "tradable" BOOLEAN NOT NULL DEFAULT false,
    "isAugment" BOOLEAN NOT NULL DEFAULT false,
    "isPrime" BOOLEAN NOT NULL DEFAULT false,
    "isExilus" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arcanes" (
    "id" TEXT NOT NULL,
    "uniqueName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageName" TEXT,
    "rarity" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tradable" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arcanes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wfcd_sync_logs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "modsUpdated" INTEGER NOT NULL DEFAULT 0,
    "arcanesUpdated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "triggeredBy" TEXT,

    CONSTRAINT "wfcd_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "BuildVisibility" NOT NULL DEFAULT 'PUBLIC',
    "buildData" JSONB NOT NULL,
    "hasShards" BOOLEAN NOT NULL DEFAULT false,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "forkedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_guides" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "build_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_links" (
    "id" TEXT NOT NULL,
    "fromBuildId" TEXT NOT NULL,
    "toBuildId" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guides" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "coverImage" TEXT,
    "content" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isCurated" BOOLEAN NOT NULL DEFAULT false,
    "readingTime" INTEGER NOT NULL DEFAULT 1,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_embeds" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_embeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_images" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "options" JSONB,
    "imageUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_usernameLower_key" ON "users"("usernameLower");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "items_uniqueName_key" ON "items"("uniqueName");

-- CreateIndex
CREATE INDEX "items_browseCategory_idx" ON "items"("browseCategory");

-- CreateIndex
CREATE INDEX "items_name_idx" ON "items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mods_uniqueName_key" ON "mods"("uniqueName");

-- CreateIndex
CREATE INDEX "mods_compatName_idx" ON "mods"("compatName");

-- CreateIndex
CREATE INDEX "mods_type_idx" ON "mods"("type");

-- CreateIndex
CREATE INDEX "mods_name_idx" ON "mods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "arcanes_uniqueName_key" ON "arcanes"("uniqueName");

-- CreateIndex
CREATE INDEX "arcanes_type_idx" ON "arcanes"("type");

-- CreateIndex
CREATE INDEX "arcanes_name_idx" ON "arcanes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "builds_slug_key" ON "builds"("slug");

-- CreateIndex
CREATE INDEX "builds_userId_idx" ON "builds"("userId");

-- CreateIndex
CREATE INDEX "builds_itemId_idx" ON "builds"("itemId");

-- CreateIndex
CREATE INDEX "builds_visibility_idx" ON "builds"("visibility");

-- CreateIndex
CREATE INDEX "builds_voteCount_idx" ON "builds"("voteCount");

-- CreateIndex
CREATE INDEX "builds_createdAt_idx" ON "builds"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "build_guides_buildId_key" ON "build_guides"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "build_links_fromBuildId_toBuildId_key" ON "build_links"("fromBuildId", "toBuildId");

-- CreateIndex
CREATE UNIQUE INDEX "build_votes_userId_buildId_key" ON "build_votes"("userId", "buildId");

-- CreateIndex
CREATE UNIQUE INDEX "build_favorites_userId_buildId_key" ON "build_favorites"("userId", "buildId");

-- CreateIndex
CREATE UNIQUE INDEX "guides_slug_key" ON "guides"("slug");

-- CreateIndex
CREATE INDEX "guides_category_idx" ON "guides"("category");

-- CreateIndex
CREATE INDEX "guides_status_idx" ON "guides"("status");

-- CreateIndex
CREATE INDEX "guides_userId_idx" ON "guides"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_embeds_guideId_buildId_key" ON "guide_embeds"("guideId", "buildId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_votes_userId_guideId_key" ON "guide_votes"("userId", "guideId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_favorites_userId_guideId_key" ON "guide_favorites"("userId", "guideId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "generated_images_buildId_template_options_key" ON "generated_images"("buildId", "template", "options");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_forkedFromId_fkey" FOREIGN KEY ("forkedFromId") REFERENCES "builds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_guides" ADD CONSTRAINT "build_guides_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_links" ADD CONSTRAINT "build_links_fromBuildId_fkey" FOREIGN KEY ("fromBuildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_links" ADD CONSTRAINT "build_links_toBuildId_fkey" FOREIGN KEY ("toBuildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_votes" ADD CONSTRAINT "build_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_votes" ADD CONSTRAINT "build_votes_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_favorites" ADD CONSTRAINT "build_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_favorites" ADD CONSTRAINT "build_favorites_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guides" ADD CONSTRAINT "guides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_embeds" ADD CONSTRAINT "guide_embeds_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_embeds" ADD CONSTRAINT "guide_embeds_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_votes" ADD CONSTRAINT "guide_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_votes" ADD CONSTRAINT "guide_votes_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_favorites" ADD CONSTRAINT "guide_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_favorites" ADD CONSTRAINT "guide_favorites_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
