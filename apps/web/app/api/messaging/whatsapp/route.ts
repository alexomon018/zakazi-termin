import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppUrl, logger } from "@salonko/config";
import { NextResponse } from "next/server";

import { checkChannelRateLimit, resolveChannel } from "@/lib/messaging/resolve-channel";

const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;
const WHATSAPP_SEND_TIMEOUT_MS = 5000;

/** Meta webhook verification handshake */
export async function GET(request: Request) {
  if (!WHATSAPP_WEBHOOK_SECRET) {
    logger.error("WHATSAPP_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_WEBHOOK_SECRET) {
    if (challenge) {
      return new Response(challenge, { status: 200 });
    }
    return NextResponse.json({ error: "Missing hub.challenge" }, { status: 400 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  if (!WHATSAPP_WEBHOOK_SECRET) {
    logger.error("WHATSAPP_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  // Verify X-Hub-Signature-256
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const prefix = "sha256=";
  if (!signature.toLowerCase().startsWith(prefix)) {
    logger.error("WhatsApp signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const incomingHex = signature.slice(prefix.length);
  const expectedHex = createHmac("sha256", WHATSAPP_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expectedHex, "hex");
  const incomingBuf = Buffer.from(incomingHex, "hex");
  if (incomingBuf.length !== expectedBuf.length || !timingSafeEqual(expectedBuf, incomingBuf)) {
    logger.error("WhatsApp signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: WhatsAppPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsAppPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  const phoneNumberId = value?.metadata?.phone_number_id;

  // Only handle text messages; silently ack everything else
  if (!message || message.type !== "text" || !message.text?.body || !phoneNumberId) {
    return NextResponse.json({ received: true });
  }

  const senderPhone = message.from;
  const userMessage = message.text.body;

  try {
    let channel: Awaited<ReturnType<typeof resolveChannel>>;
    try {
      channel = await resolveChannel("whatsapp", phoneNumberId);
    } catch (error) {
      logger.warn("Failed to resolve WhatsApp channel", { phoneNumberId, error });
      return NextResponse.json({ received: true });
    }

    if (!channel?.authToken) {
      logger.warn("WhatsApp message for unmapped or tokenless phone_number_id", { phoneNumberId });
      return NextResponse.json({ received: true });
    }

    try {
      const rateLimited = await checkChannelRateLimit("whatsapp", phoneNumberId);
      if (rateLimited) return NextResponse.json({ received: true });
    } catch (error) {
      logger.warn("Rate limit check failed for WhatsApp channel", { phoneNumberId, error });
      return NextResponse.json({ received: true });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WHATSAPP_SEND_TIMEOUT_MS);
    let agentResponse: Response;
    try {
      agentResponse = await fetch(`${getAppUrl()}/api/messaging/agent`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AGENT_API_SECRET}`,
        },
        body: JSON.stringify({
          platform: "whatsapp",
          externalId: senderPhone,
          salonSlug: channel.salonSlug,
          userMessage,
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logger.error("Agent fetch timed out", {
          senderPhone,
          phoneNumberId,
          timeoutMs: WHATSAPP_SEND_TIMEOUT_MS,
        });
        return NextResponse.json({ received: true });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!agentResponse.ok) {
      const errorBody = await agentResponse.text();
      logger.error("Agent endpoint returned error", {
        status: agentResponse.status,
        senderPhone,
        phoneNumberId,
        errorBody,
      });
      return NextResponse.json({ received: true });
    }

    const { reply } = (await agentResponse.json()) as { reply?: string };
    if (!reply) {
      logger.warn("Agent returned empty reply", { senderPhone });
      return NextResponse.json({ received: true });
    }

    await sendWhatsAppMessage(channel.authToken, phoneNumberId, senderPhone, reply);
  } catch (error) {
    logger.error("WhatsApp message processing failed", { error, senderPhone, phoneNumberId });
  }

  return NextResponse.json({ received: true });
}

async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WHATSAPP_SEND_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      logger.error("WhatsApp send message failed", { to, status: res.status, error });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.error("WhatsApp send message timed out", { to, timeoutMs: WHATSAPP_SEND_TIMEOUT_MS });
      return;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---- Types ----

interface WhatsAppPayload {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: {
          from: string;
          type: string;
          text?: { body: string };
        }[];
      };
    }[];
  }[];
}
