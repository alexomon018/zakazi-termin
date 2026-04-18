-- CreateTable
CREATE TABLE "AgentConversation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "salonSlug" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentConversation_updatedAt_idx" ON "AgentConversation"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentConversation_platform_externalId_salonSlug_key" ON "AgentConversation"("platform", "externalId", "salonSlug");
