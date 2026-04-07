/*
  Warnings:

  - A unique constraint covering the columns `[salonSlug]` on the table `PendingRegistration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[salonSlug]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_salonName_idx";

-- DropIndex
DROP INDEX "User_salonName_key";

-- AlterTable
ALTER TABLE "PendingRegistration" ADD COLUMN     "salonSlug" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "salonSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PendingRegistration_salonSlug_key" ON "PendingRegistration"("salonSlug");

-- CreateIndex
CREATE INDEX "PendingRegistration_salonSlug_idx" ON "PendingRegistration"("salonSlug");

-- CreateIndex
CREATE UNIQUE INDEX "User_salonSlug_key" ON "User"("salonSlug");

-- CreateIndex
CREATE INDEX "User_salonSlug_idx" ON "User"("salonSlug");
