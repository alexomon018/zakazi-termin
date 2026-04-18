import { verifyAgentRequest } from "@/lib/agent/auth";
import { createPublicServerCaller } from "@/lib/trpc/server";
import { logger } from "@salonko/config";
import { TRPCError } from "@trpc/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/** HTTP status for tRPC errors when calling procedures via server caller (see booking router, etc.). */
function httpStatusForTrpcCode(code: TRPCError["code"]): number | null {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "BAD_REQUEST":
    case "PARSE_ERROR":
    case "UNPROCESSABLE_CONTENT":
      return 400;
    case "TOO_MANY_REQUESTS":
      return 429;
    case "FORBIDDEN":
      return 403;
    case "UNAUTHORIZED":
      return 401;
    default:
      return null;
  }
}

const bodySchema = z.object({
  salonSlug: z.string(),
  eventTypeSlug: z.string(),
  startTime: z.string().datetime(),
  /** Ignored: end time is derived from event type length server-side. */
  endTime: z.string().datetime().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  timeZone: z.string().default("Europe/Belgrade"),
});

/** Match getSlots slot instants (second/ms normalized, UTC). */
function normalizeSlotStartInstant(d: Date): number {
  const t = new Date(d);
  t.setUTCSeconds(0, 0);
  return t.getTime();
}

export async function POST(request: Request) {
  const guardError = await verifyAgentRequest(request, "agent-book");
  if (guardError) return guardError;

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

  const { salonSlug, eventTypeSlug, startTime, name, email, phone, notes, timeZone } = parsed.data;

  try {
    const caller = await createPublicServerCaller();

    const eventType = await caller.eventType.getPublic({ salonSlug, slug: eventTypeSlug });
    if (!eventType) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(bookingStart.getTime() + eventType.length * 60_000);

    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const slotsResult = await caller.availability.getSlots({
      eventTypeId: eventType.id,
      dateFrom: new Date(bookingStart.getTime() - twoDaysMs),
      dateTo: new Date(bookingStart.getTime() + twoDaysMs),
      timeZone,
    });

    const targetStart = normalizeSlotStartInstant(bookingStart);
    const slotIsOffered = slotsResult.slots.some((s) => {
      if (typeof s.time !== "string") return false;
      return normalizeSlotStartInstant(new Date(s.time)) === targetStart;
    });
    if (!slotIsOffered) {
      return NextResponse.json(
        { error: "Izabrani termin nije dostupan za ovu uslugu." },
        { status: 400 }
      );
    }

    const booking = await caller.booking.create({
      eventTypeId: eventType.id,
      startTime: bookingStart,
      endTime: bookingEnd,
      name,
      email,
      phoneNumber: phone,
      notes,
      timeZone,
      locale: "sr",
    });

    return NextResponse.json({
      uid: booking.uid,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      eventType: booking.eventType,
    });
  } catch (error) {
    if (error instanceof TRPCError) {
      const status = httpStatusForTrpcCode(error.code);
      if (status != null) {
        return NextResponse.json({ error: error.message }, { status });
      }
    }
    logger.error("Agent book endpoint error", { error, salonSlug, eventTypeSlug });
    return NextResponse.json({ error: "Greška pri zakazivanju termina" }, { status: 500 });
  }
}
