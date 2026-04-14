import { createHmac } from "node:crypto";
import { getAppUrl, logger } from "@salonko/config";
import { NextResponse } from "next/server";

import { checkChannelRateLimit, resolveChannel } from "@/lib/messaging/resolve-channel";

const DEFAULT_BOT_NAME = "Booking Assistant";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  const channel = await resolveChannel("viber", channelId);
  if (!channel?.authToken) {
    logger.warn("Viber webhook for unmapped channelId", { channelId });
    // Viber expects status 0 = OK; returning non-zero would cause retries for
    // a salon we can't route to.
    return NextResponse.json({ status: 0 });
  }

  const rawBody = await request.text();

  // Verify X-Viber-Content-Signature using the per-channel auth token.
  const signature = request.headers.get("x-viber-content-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const expected = createHmac("sha256", channel.authToken).update(rawBody).digest("hex");
  if (signature !== expected) {
    logger.error("Viber signature mismatch", { channelId });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: ViberPayload;
  try {
    payload = JSON.parse(rawBody) as ViberPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "message" || payload.message?.type !== "text" || !payload.message?.text) {
    return NextResponse.json({ status: 0 });
  }

  const senderId = payload.sender?.id;
  const userMessage = payload.message.text;
  if (!senderId) {
    return NextResponse.json({ status: 0 });
  }

  const rateLimited = await checkChannelRateLimit("viber", channelId);
  if (rateLimited) return NextResponse.json({ status: 0 });

  try {
    const agentResponse = await fetch(`${getAppUrl()}/api/messaging/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "viber",
        externalId: senderId,
        salonSlug: channel.salonSlug,
        userMessage,
      }),
    });

    if (!agentResponse.ok) {
      const errorBody = await agentResponse.text();
      logger.error("Agent endpoint returned error", {
        status: agentResponse.status,
        body: errorBody,
        senderId,
        channelId,
      });
      return NextResponse.json({ status: 0 });
    }

    const { reply } = (await agentResponse.json()) as { reply: string };

    await sendViberMessage(channel.authToken, channel.botName ?? DEFAULT_BOT_NAME, senderId, reply);
  } catch (error) {
    logger.error("Viber message processing failed", { error, senderId, channelId });
  }

  return NextResponse.json({ status: 0 });
}

async function sendViberMessage(
  authToken: string,
  botName: string,
  receiver: string,
  text: string
): Promise<void> {
  const res = await fetch("https://chatapi.viber.com/pa/send_message", {
    method: "POST",
    headers: {
      "X-Viber-Auth-Token": authToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiver,
      type: "text",
      text,
      sender: { name: botName },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    logger.error("Viber send message failed", { receiver, status: res.status, error });
  }
}

// ---- Types ----

interface ViberPayload {
  event: string;
  sender?: { id: string; name?: string };
  message?: { type: string; text?: string };
}
