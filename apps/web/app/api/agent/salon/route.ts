import { verifyAgentRequest } from "@/lib/agent/auth";
import { logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

const eventTypePublicSelect = {
  id: true,
  title: true,
  slug: true,
  length: true,
  description: true,
  locations: true,
  minimumBookingNotice: true,
} as const;

export async function GET(request: Request) {
  const guardError = await verifyAgentRequest(request, "agent-salon");
  if (guardError) return guardError;

  const { searchParams } = new URL(request.url);
  const salonSlug = searchParams.get("salonSlug");

  if (!salonSlug) {
    return NextResponse.json({ error: "Missing required param: salonSlug" }, { status: 400 });
  }

  try {
    // Same resolution as user.getPublicProfile / eventType.getPublic: user salonSlug, else organization slug
    const user = await prisma.user.findFirst({
      where: {
        salonSlug,
        salonName: { not: null },
      },
      select: {
        id: true,
        salonName: true,
        salonSlug: true,
        salonCity: true,
        salonAddress: true,
        salonTypes: true,
        timeZone: true,
        memberships: {
          where: { accepted: true },
          select: { role: true, organizationId: true },
        },
      },
    });

    const organization =
      user == null
        ? await prisma.organization.findUnique({
            where: { slug: salonSlug },
            select: { id: true, name: true, slug: true, timeZone: true },
          })
        : null;

    if (!user && !organization) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    let organizationId: string | null = null;
    if (organization) {
      organizationId = organization.id;
    } else if (user) {
      const ownerMembership = user.memberships.find((m) => m.role === "OWNER");
      if (ownerMembership) {
        organizationId = ownerMembership.organizationId;
      }
    }

    const services =
      organizationId != null
        ? await prisma.eventType.findMany({
            where: {
              hidden: false,
              user: {
                memberships: {
                  some: {
                    organizationId,
                    accepted: true,
                  },
                },
              },
            },
            select: eventTypePublicSelect,
            orderBy: { title: "asc" },
          })
        : await prisma.eventType.findMany({
            where: {
              userId: user!.id,
              hidden: false,
            },
            select: eventTypePublicSelect,
            orderBy: { title: "asc" },
          });

    if (organization && !user) {
      return NextResponse.json({
        salonName: organization.name,
        salonSlug: organization.slug,
        salonCity: null,
        salonAddress: null,
        salonTypes: [],
        timeZone: organization.timeZone,
        services,
      });
    }

    return NextResponse.json({
      salonName: user!.salonName,
      salonSlug: user!.salonSlug,
      salonCity: user!.salonCity,
      salonAddress: user!.salonAddress,
      salonTypes: user!.salonTypes,
      timeZone: user!.timeZone,
      services,
    });
  } catch (error) {
    logger.error("Agent salon endpoint error", { error, salonSlug });
    return NextResponse.json({ error: "Greška pri učitavanju salona" }, { status: 500 });
  }
}
