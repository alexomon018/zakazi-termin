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
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Profile is complete if user has salon types, city, and address
    const isComplete = user.salonTypes.length > 0 && !!user.salonCity && !!user.salonAddress;

    return NextResponse.json({ ok: true, isComplete });
  } catch (error) {
    logger.error("Profile complete check failed", { error });
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
