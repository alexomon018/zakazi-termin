-- AlterTable
ALTER TABLE "PendingRegistration" ADD COLUMN IF NOT EXISTS "lastSentAt" TIMESTAMP(3);

-- Backfill: keep existing behavior by treating the last send time as record creation time
UPDATE "PendingRegistration"
SET "lastSentAt" = "createdAt"
WHERE "lastSentAt" IS NULL;

-- Make it required and default to now() for new rows
ALTER TABLE "PendingRegistration"
ALTER COLUMN "lastSentAt" SET NOT NULL;

ALTER TABLE "PendingRegistration"
ALTER COLUMN "lastSentAt" SET DEFAULT CURRENT_TIMESTAMP;
