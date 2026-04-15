-- Step 1: Add the new salonUserId column (nullable initially for backfill)
ALTER TABLE "AgentConversation" ADD COLUMN "salonUserId" TEXT;

-- Step 2: Backfill salonUserId from User.salonSlug → User.id
UPDATE "AgentConversation" ac
SET "salonUserId" = u."id"
FROM "User" u
WHERE u."salonSlug" = ac."salonSlug";

-- Step 3: Delete orphaned rows that couldn't be resolved
DELETE FROM "AgentConversation" WHERE "salonUserId" IS NULL;

-- Step 4: Make salonUserId NOT NULL now that all rows are backfilled
ALTER TABLE "AgentConversation" ALTER COLUMN "salonUserId" SET NOT NULL;

-- Step 5: Drop the old unique index on (platform, externalId, salonSlug)
DROP INDEX "AgentConversation_platform_externalId_salonSlug_key";

-- Step 6: Drop the salonSlug column
ALTER TABLE "AgentConversation" DROP COLUMN "salonSlug";

-- Step 7: Create the new unique index on (platform, externalId, salonUserId)
CREATE UNIQUE INDEX "AgentConversation_platform_externalId_salonUserId_key" ON "AgentConversation"("platform", "externalId", "salonUserId");

-- Step 8: Create index on salonUserId for FK lookups
CREATE INDEX "AgentConversation_salonUserId_idx" ON "AgentConversation"("salonUserId");

-- Step 9: Add FK constraint with cascade delete
ALTER TABLE "AgentConversation" ADD CONSTRAINT "AgentConversation_salonUserId_fkey" FOREIGN KEY ("salonUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
