import { authOptions } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        salonTypes: true,
        salonCity: true,
        salonAddress: true,
        memberships: {
          where: { accepted: true },
          select: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Team members (ADMIN/MEMBER) without any OWNER role don't need to complete salon onboarding
    // They're joining someone else's salon, not creating their own
    const hasOwnerRole = user.memberships.some((m) => m.role === "OWNER");
    const isTeamMember =
      !hasOwnerRole && user.memberships.some((m) => m.role === "ADMIN" || m.role === "MEMBER");

    if (isTeamMember) {
      return NextResponse.json({ ok: true, isComplete: true });
    }

    // For owners or users without memberships, check if they have salon info
    const isComplete = user.salonTypes.length > 0 && !!user.salonCity && !!user.salonAddress;

    return NextResponse.json({ ok: true, isComplete });
  } catch (error) {
    logger.error("Profile complete check failed", { error });
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
