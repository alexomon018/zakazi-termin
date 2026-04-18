-- CreateTable
CREATE TABLE "MessagingChannel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "salonUserId" TEXT NOT NULL,
    "authTokenEnc" TEXT,
    "botName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessagingChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessagingChannel_platform_externalId_key" ON "MessagingChannel"("platform", "externalId");

-- CreateIndex
CREATE INDEX "MessagingChannel_salonUserId_idx" ON "MessagingChannel"("salonUserId");

-- AddForeignKey
ALTER TABLE "MessagingChannel" ADD CONSTRAINT "MessagingChannel_salonUserId_fkey" FOREIGN KEY ("salonUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
