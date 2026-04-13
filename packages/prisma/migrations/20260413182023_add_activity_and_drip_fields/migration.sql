-- AlterTable
ALTER TABLE "User" ADD COLUMN     "educationEmailsOptOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inactivityEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailDripRecord" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "emailKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDripRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailDripRecord_userId_idx" ON "EmailDripRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDripRecord_userId_emailKey_key" ON "EmailDripRecord"("userId", "emailKey");

-- AddForeignKey
ALTER TABLE "EmailDripRecord" ADD CONSTRAINT "EmailDripRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
