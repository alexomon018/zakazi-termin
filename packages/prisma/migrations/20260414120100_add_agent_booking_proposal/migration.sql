-- CreateTable
CREATE TABLE "AgentBookingProposal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentBookingProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentBookingProposal_conversationId_expiresAt_idx" ON "AgentBookingProposal"("conversationId", "expiresAt");

-- AddForeignKey
ALTER TABLE "AgentBookingProposal" ADD CONSTRAINT "AgentBookingProposal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
