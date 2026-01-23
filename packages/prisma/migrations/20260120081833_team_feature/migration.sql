-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "assignedHostId" TEXT;

-- AlterTable
ALTER TABLE "PendingRegistration" ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "ownerFirstName" TEXT,
ADD COLUMN     "ownerLastName" TEXT,
ADD COLUMN     "ownerPhone" TEXT,
ADD COLUMN     "salonAddress" TEXT,
ADD COLUMN     "salonCity" TEXT,
ADD COLUMN     "salonEmail" TEXT,
ADD COLUMN     "salonPhone" TEXT,
ADD COLUMN     "salonTypes" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "ownerFirstName" TEXT,
ADD COLUMN     "ownerLastName" TEXT,
ADD COLUMN     "ownerPhone" TEXT,
ADD COLUMN     "salonAddress" TEXT,
ADD COLUMN     "salonCity" TEXT,
ADD COLUMN     "salonEmail" TEXT,
ADD COLUMN     "salonIconKey" TEXT,
ADD COLUMN     "salonPhone" TEXT,
ADD COLUMN     "salonTypes" TEXT[];

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresInDays" INTEGER,
ADD COLUMN     "invitedEmail" TEXT,
ADD COLUMN     "invitedRole" "MembershipRole",
ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "Host" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER,
    "scheduleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Host_userId_idx" ON "Host"("userId");

-- CreateIndex
CREATE INDEX "Host_eventTypeId_idx" ON "Host"("eventTypeId");

-- CreateIndex
CREATE INDEX "Host_scheduleId_idx" ON "Host"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Host_userId_eventTypeId_key" ON "Host"("userId", "eventTypeId");

-- CreateIndex
CREATE INDEX "Booking_assignedHostId_idx" ON "Booking"("assignedHostId");

-- CreateIndex
CREATE INDEX "VerificationToken_token_idx" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_organizationId_idx" ON "VerificationToken"("organizationId");

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedHostId_fkey" FOREIGN KEY ("assignedHostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
