-- Rename username column to salonName
ALTER TABLE "User" RENAME COLUMN "username" TO "salonName";

-- Update index (drop old, create new)
DROP INDEX IF EXISTS "User_username_idx";
CREATE INDEX "User_salonName_idx" ON "User"("salonName");
