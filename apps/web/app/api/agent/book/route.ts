import { checkAgentRateLimit, verifyAgentSecret } from "@/lib/agent/auth";
import { createPublicServerCaller } from "@/lib/trpc/server";
import { logger } from "@salonko/config";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  salonSlug: z.string(),
  eventTypeSlug: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  timeZone: z.string().default("Europe/Belgrade"),
});

export async function POST(request: Request) {
  const authError = verifyAgentSecret(request);
  if (authError) return authError;

  const limitError = await checkAgentRateLimit(request, "agent-book");
  if (limitError) return limitError;

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

  const { salonSlug, eventTypeSlug, startTime, endTime, name, email, phone, notes, timeZone } =
    parsed.data;

  try {
    const caller = await createPublicServerCaller();

    const eventType = await caller.eventType.getPublic({ salonSlug, slug: eventTypeSlug });
    if (!eventType) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    const booking = await caller.booking.create({
      eventTypeId: eventType.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
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
    logger.error("Agent book endpoint error", { error, salonSlug, eventTypeSlug });
    return NextResponse.json({ error: "Greška pri zakazivanju termina" }, { status: 500 });
  }
}
