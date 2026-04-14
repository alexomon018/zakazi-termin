import { checkAgentRateLimit, verifyAgentSecret } from "@/lib/agent/auth";
import { createPublicServerCaller } from "@/lib/trpc/server";
import { logger } from "@salonko/config";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authError = verifyAgentSecret(request);
  if (authError) return authError;

  const limitError = await checkAgentRateLimit(request, "agent-slots");
  if (limitError) return limitError;

  const { searchParams } = new URL(request.url);
  const salonSlug = searchParams.get("salonSlug");
  const eventTypeSlug = searchParams.get("eventTypeSlug");
  const dateFromRaw = searchParams.get("dateFrom");
  const dateToRaw = searchParams.get("dateTo");
  const timeZone = searchParams.get("timeZone") ?? "Europe/Belgrade";

  if (!salonSlug || !eventTypeSlug || !dateFromRaw || !dateToRaw) {
    return NextResponse.json(
      { error: "Missing required params: salonSlug, eventTypeSlug, dateFrom, dateTo" },
      { status: 400 }
    );
  }

  const dateFrom = new Date(dateFromRaw);
  const dateTo = new Date(dateToRaw);

  if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
    return NextResponse.json({ error: "Invalid dateFrom or dateTo" }, { status: 400 });
  }

  try {
    const caller = await createPublicServerCaller();

    const eventType = await caller.eventType.getPublic({ salonSlug, slug: eventTypeSlug });
    if (!eventType) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    const result = await caller.availability.getSlots({
      eventTypeId: eventType.id,
      dateFrom,
      dateTo,
      timeZone,
    });

    return NextResponse.json({
      slots: result.slots,
      eventType: {
        id: eventType.id,
        title: eventType.title,
        length: eventType.length,
      },
      timeZone: result.timeZone,
    });
  } catch (error) {
    logger.error("Agent slots endpoint error", { error, salonSlug, eventTypeSlug });
    return NextResponse.json({ error: "Greška pri učitavanju termina" }, { status: 500 });
  }
}
