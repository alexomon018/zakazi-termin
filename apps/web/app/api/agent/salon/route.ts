import { checkAgentRateLimit, verifyAgentSecret } from "@/lib/agent/auth";
import { logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authError = verifyAgentSecret(request);
  if (authError) return authError;

  const limitError = await checkAgentRateLimit(request, "agent-salon");
  if (limitError) return limitError;

  const { searchParams } = new URL(request.url);
  const salonSlug = searchParams.get("salonSlug");

  if (!salonSlug) {
    return NextResponse.json({ error: "Missing required param: salonSlug" }, { status: 400 });
  }

  try {
    const salon = await prisma.user.findFirst({
      where: {
        salonSlug,
        salonName: { not: null },
      },
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

    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    return NextResponse.json({
      salonName: salon.salonName,
      salonSlug: salon.salonSlug,
      salonCity: salon.salonCity,
      salonAddress: salon.salonAddress,
      salonTypes: salon.salonTypes,
      timeZone: salon.timeZone,
      services: salon.eventTypes,
    });
  } catch (error) {
    logger.error("Agent salon endpoint error", { error, salonSlug });
    return NextResponse.json({ error: "Greška pri učitavanju salona" }, { status: 500 });
  }
}
