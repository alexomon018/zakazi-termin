-- AlterTable
ALTER TABLE "PendingRegistration" ADD COLUMN     "inviteToken" TEXT,
ALTER COLUMN "salonName" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PendingRegistration_inviteToken_idx" ON "PendingRegistration"("inviteToken");
