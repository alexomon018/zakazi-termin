import { verifyAgentRequest } from "@/lib/agent/auth";
import { DEFAULT_ERROR_REPLY, compactHistory, runAgentLoop } from "@/lib/agent/loop";
import { createPublicServerCaller } from "@/lib/trpc/server";
import Anthropic from "@anthropic-ai/sdk";
import { isMessagingAiEnabled, logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_CONCURRENCY_RETRIES = 3;

const bodySchema = z.object({
  platform: z.enum(["whatsapp", "viber"]),
  externalId: z.string(),
  salonUserId: z.string(),
  userMessage: z.string(),
});

const isoDateOrDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "Expected YYYY-MM-DD or ISO-8601 datetime",
});

const checkAvailabilitySchema = z.object({
  eventTypeSlug: z.string(),
  dateFrom: isoDateOrDateTime,
  dateTo: isoDateOrDateTime,
  timeZone: z.string().default("Europe/Belgrade"),
});

const proposeBookingSchema = z.object({
  eventTypeSlug: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  timeZone: z.string().default("Europe/Belgrade"),
});

const createBookingSchema = z.object({
  proposalId: z.string().uuid(),
  confirmed: z.literal(true),
});

const PROPOSAL_TTL_MS = 10 * 60 * 1000;

type Caller = Awaited<ReturnType<typeof createPublicServerCaller>>;

async function callTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  salonUserId: string,
  salonSlug: string,
  conversationId: string,
  caller: Caller
): Promise<string> {
  if (toolName === "get_salon_info") {
    const salon = await prisma.user.findUnique({
      where: { id: salonUserId },
      select: {
        salonName: true,
        salonSlug: true,
        salonCity: true,
        salonAddress: true,
        salonTypes: true,
        timeZone: true,
        eventTypes: {
          where: { hidden: false },
          select: {
            id: true,
            title: true,
            slug: true,
            length: true,
            description: true,
            locations: true,
            minimumBookingNotice: true,
          },
          orderBy: { title: "asc" },
        },
      },
    });
    if (!salon) return JSON.stringify({ error: "Salon not found" });
    return JSON.stringify({
      salonName: salon.salonName,
      salonSlug: salon.salonSlug,
      salonCity: salon.salonCity,
      salonAddress: salon.salonAddress,
      salonTypes: salon.salonTypes,
      timeZone: salon.timeZone,
      services: salon.eventTypes,
    });
  }

  if (toolName === "check_availability") {
    const parsed = checkAvailabilitySchema.safeParse(toolInput);
    if (!parsed.success) {
      return JSON.stringify({
        error: "Neispravni parametri za proveru termina.",
        details: parsed.error.flatten().fieldErrors,
        received: toolInput,
      });
    }
    const eventType = await caller.eventType.getPublic({
      salonSlug,
      slug: parsed.data.eventTypeSlug,
    });
    if (!eventType) return JSON.stringify({ error: "Usluga nije pronađena." });
    const result = await caller.availability.getSlots({
      eventTypeId: eventType.id,
      dateFrom: new Date(parsed.data.dateFrom),
      dateTo: new Date(parsed.data.dateTo),
      timeZone: parsed.data.timeZone,
    });
    return JSON.stringify({
      slots: result.slots,
      timeZone: result.timeZone,
      eventType: { id: eventType.id, title: eventType.title, length: eventType.length },
    });
  }

  if (toolName === "propose_booking") {
    const parsed = proposeBookingSchema.safeParse(toolInput);
    if (!parsed.success) {
      return JSON.stringify({ error: "Neispravni podaci za predlog termina." });
    }
    const eventType = await caller.eventType.getPublic({
      salonSlug,
      slug: parsed.data.eventTypeSlug,
    });
    if (!eventType) return JSON.stringify({ error: "Usluga nije pronađena." });

    const proposal = await prisma.agentBookingProposal.create({
      data: {
        conversationId,
        payload: parsed.data,
        expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS),
      },
      select: { id: true, expiresAt: true },
    });
    return JSON.stringify({
      proposalId: proposal.id,
      expiresAt: proposal.expiresAt,
      summary: {
        service: eventType.title,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
      },
    });
  }

  if (toolName === "create_booking") {
    const parsed = createBookingSchema.safeParse(toolInput);
    if (!parsed.success) {
      return JSON.stringify({
        error:
          "create_booking zahteva validan proposalId i confirmed=true. Prvo pozovi propose_booking i dobij eksplicitnu potvrdu korisnika.",
      });
    }

    const proposal = await prisma.agentBookingProposal.findFirst({
      where: { id: parsed.data.proposalId, conversationId },
    });
    if (!proposal) {
      return JSON.stringify({
        error: "Predlog nije pronađen. Pripremi novi predlog kroz propose_booking.",
      });
    }
    if (proposal.expiresAt.getTime() < Date.now()) {
      await prisma.agentBookingProposal.delete({ where: { id: proposal.id } });
      return JSON.stringify({
        error: "Predlog je istekao. Pripremi novi predlog kroz propose_booking.",
      });
    }

    const payload = proposeBookingSchema.safeParse(proposal.payload);
    if (!payload.success) {
      return JSON.stringify({ error: "Predlog je neispravan. Pripremi novi predlog." });
    }

    const eventType = await caller.eventType.getPublic({
      salonSlug,
      slug: payload.data.eventTypeSlug,
    });
    if (!eventType) return JSON.stringify({ error: "Usluga nije pronađena." });

    const booking = await caller.booking.create({
      eventTypeId: eventType.id,
      startTime: new Date(payload.data.startTime),
      endTime: new Date(payload.data.endTime),
      name: payload.data.name,
      email: payload.data.email,
      phoneNumber: payload.data.phone,
      notes: payload.data.notes,
      timeZone: payload.data.timeZone,
      locale: "sr",
    });

    try {
      await prisma.agentBookingProposal.delete({ where: { id: proposal.id } });
    } catch (deleteErr) {
      logger.error("Failed to delete booking proposal after successful booking", {
        proposalId: proposal.id,
        bookingUid: booking.uid,
        error: deleteErr,
      });
    }

    return JSON.stringify({
      uid: booking.uid,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
    });
  }

  return JSON.stringify({ error: `Unknown tool: ${toolName}` });
}

export async function POST(request: Request) {
  if (!isMessagingAiEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guardError = await verifyAgentRequest(request, "agent-messaging");
  if (guardError) return guardError;

  if (!ANTHROPIC_API_KEY) {
    logger.error("ANTHROPIC_API_KEY is not configured");
    return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { platform, externalId, salonUserId, userMessage } = parsed.data;

  const conversation = await prisma.agentConversation.upsert({
    where: { platform_externalId_salonUserId: { platform, externalId, salonUserId } },
    create: { platform, externalId, salonUserId, messages: [] },
    update: {},
    select: { id: true, messages: true, messagesVersion: true },
  });

  const salon = await prisma.user.findUnique({
    where: { id: salonUserId },
    select: { salonName: true, salonSlug: true },
  });
  if (!salon?.salonSlug) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }
  const { salonSlug } = salon;
  const salonName = salon.salonName ?? salonSlug;

  const initialMessages: Anthropic.MessageParam[] = [
    ...(conversation.messages as unknown as Anthropic.MessageParam[]),
    { role: "user", content: userMessage },
  ];

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const caller = await createPublicServerCaller();

  let reply = DEFAULT_ERROR_REPLY;
  let finalMessages = initialMessages;

  try {
    const result = await runAgentLoop({
      client,
      messages: initialMessages,
      salonName,
      toolExecutor: (name, input) =>
        callTool(name, input, salonUserId, salonSlug, conversation.id, caller),
      onToolError: (tool, err) => logger.error("Agent tool call failed", { tool, error: err }),
    });
    reply = result.reply;
    finalMessages = result.messages;
  } catch (error) {
    logger.error("Claude API error", { error, platform, salonUserId });
  }

  const persistErr = await persistMessages(
    conversation.id,
    conversation.messagesVersion,
    finalMessages
  );
  if (persistErr) return persistErr;

  return NextResponse.json({ reply });
}

/**
 * Persist compacted messages with optimistic concurrency.
 * Returns a NextResponse on unrecoverable conflict, or null on success.
 */
async function persistMessages(
  conversationId: string,
  initialVersion: number,
  finalMessages: Anthropic.MessageParam[]
): Promise<NextResponse | null> {
  let currentVersion = initialVersion;
  let messagesToWrite = finalMessages;

  for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt++) {
    const trimmed = compactHistory(messagesToWrite);

    const updated = await prisma.agentConversation.updateMany({
      where: { id: conversationId, messagesVersion: currentVersion },
      data: {
        messages: trimmed as object[],
        messagesVersion: currentVersion + 1,
      },
    });

    if (updated.count > 0) return null;

    const fresh = await prisma.agentConversation.findUnique({
      where: { id: conversationId },
      select: { messages: true, messagesVersion: true },
    });
    if (!fresh) return null;

    currentVersion = fresh.messagesVersion;
    const existingMessages = fresh.messages as unknown as Anthropic.MessageParam[];

    // Keep everything the DB already has, then append only the turns
    // this request produced beyond the shared prefix length.
    const newTail = finalMessages.slice(existingMessages.length);
    messagesToWrite = [...existingMessages, ...newTail];
  }

  logger.warn("Optimistic concurrency retries exhausted for agent conversation", {
    conversationId,
  });
  return NextResponse.json(
    { error: "Conversation was modified concurrently, please retry" },
    { status: 409 }
  );
}
