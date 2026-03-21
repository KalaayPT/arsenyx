-- AlterTable
ALTER TABLE "builds" ADD COLUMN     "hasGuide" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "searchVector" tsvector;

-- CreateIndex
CREATE INDEX "builds_hasGuide_idx" ON "builds"("hasGuide");

-- GIN index for full-text search
CREATE INDEX "builds_search_vector_idx" ON "builds" USING GIN ("searchVector");

-- Trigger function to auto-update searchVector
CREATE OR REPLACE FUNCTION builds_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := (
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce((SELECT name FROM items WHERE id = NEW."itemId"), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER builds_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description, "itemId"
  ON "builds"
  FOR EACH ROW
  EXECUTE FUNCTION builds_search_vector_update();

-- Backfill searchVector for existing builds
UPDATE "builds" SET name = name WHERE true;

-- Backfill hasGuide for existing builds
UPDATE "builds" b SET "hasGuide" = true
WHERE EXISTS (SELECT 1 FROM "build_guides" bg WHERE bg."buildId" = b.id);
