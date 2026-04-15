import { logger, messagingChannelRateLimiter } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

import { decryptToken } from "@salonko/trpc/lib/messaging-crypto";

export type MessagingPlatform = "whatsapp" | "viber";

export interface ResolvedChannel {
  channelId: string;
  salonUserId: string;
  /** Decrypted Viber bot auth token. Undefined for WhatsApp. */
  authToken?: string;
  /** Viber bot display name. Undefined for WhatsApp. */
  botName?: string;
}

/**
 * Looks up a messaging channel by `(platform, externalId)` and returns the
 * salon it routes to. Returns `null` if no mapping exists.
 */
export async function resolveChannel(
  platform: MessagingPlatform,
  externalId: string
): Promise<ResolvedChannel | null> {
  const channel = await prisma.messagingChannel.findUnique({
    where: { platform_externalId: { platform, externalId } },
    select: {
      id: true,
      authTokenEnc: true,
      botName: true,
      salon: { select: { id: true } },
    },
  });

  if (!channel?.salon) return null;

  let authToken: string | undefined;
  if (channel.authTokenEnc) {
    try {
      authToken = decryptToken(channel.authTokenEnc);
    } catch (error) {
      logger.error("Failed to decrypt messaging channel auth token", {
        channelId: channel.id,
        error,
      });
      return null;
    }
  }

  return {
    channelId: channel.id,
    salonUserId: channel.salon.id,
    authToken,
    botName: channel.botName ?? undefined,
  };
}

/**
 * Applies the per-channel rate limiter. Returns a 429 NextResponse if limit
 * exceeded, otherwise null. No-ops when Upstash isn't configured.
 */
export async function checkChannelRateLimit(
  platform: MessagingPlatform,
  externalId: string
): Promise<NextResponse | null> {
  if (!messagingChannelRateLimiter) return null;
  const { success } = await messagingChannelRateLimiter.limit(
    `messaging:${platform}:${externalId}`
  );
  if (!success) {
    logger.warn("Messaging channel rate limit exceeded", { platform, externalId });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}
