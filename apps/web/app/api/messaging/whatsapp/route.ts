import { createHmac } from "node:crypto";
import { getAppUrl, logger } from "@salonko/config";
import { NextResponse } from "next/server";

import { checkChannelRateLimit, resolveChannel } from "@/lib/messaging/resolve-channel";

const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/** Meta webhook verification handshake */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_WEBHOOK_SECRET) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  if (!WHATSAPP_WEBHOOK_SECRET || !WHATSAPP_ACCESS_TOKEN) {
    logger.error("WhatsApp env vars not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  // Verify X-Hub-Signature-256
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const expected = `sha256=${createHmac("sha256", WHATSAPP_WEBHOOK_SECRET).update(rawBody).digest("hex")}`;
  if (signature !== expected) {
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

  // Resolve the salon this phone number belongs to
  const channel = await resolveChannel("whatsapp", phoneNumberId);
  if (!channel) {
    // Silent 200 so Meta doesn't retry unmapped numbers into a loop.
    logger.warn("WhatsApp message for unmapped phone_number_id", { phoneNumberId });
    return NextResponse.json({ received: true });
  }

  const rateLimited = await checkChannelRateLimit("whatsapp", phoneNumberId);
  if (rateLimited) return NextResponse.json({ received: true });

  const senderPhone = message.from;
  const userMessage = message.text.body;

  try {
    const agentResponse = await fetch(`${getAppUrl()}/api/messaging/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "whatsapp",
        externalId: senderPhone,
        salonSlug: channel.salonSlug,
        userMessage,
      }),
    });

    const { reply } = (await agentResponse.json()) as { reply: string };

    await sendWhatsAppMessage(phoneNumberId, senderPhone, reply);
  } catch (error) {
    logger.error("WhatsApp message processing failed", { error, senderPhone });
  }

  return NextResponse.json({ received: true });
}

async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
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
