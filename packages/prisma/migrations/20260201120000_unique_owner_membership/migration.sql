-- CreateIndex
-- Partial unique index to enforce that a user can only have one OWNER membership
-- This prevents race conditions where concurrent requests could create multiple owner memberships
CREATE UNIQUE INDEX "Membership_userId_owner_unique" ON "Membership"("userId") WHERE "role" = 'OWNER';
