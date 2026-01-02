import { authOptions } from "@salonko/auth";
import { prisma } from "@salonko/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function computeAccess(
  subscription: {
    status: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
  } | null
) {
  const now = Date.now();

  if (!subscription) {
    return {
      hasSubscription: false,
      isActive: false,
      isInTrial: false,
      canAccess: false,
      reason: "NO_SUBSCRIPTION",
    } as const;
  }

  const isInTrial =
    subscription.status === "TRIALING" &&
    subscription.trialEndsAt !== null &&
    now <= subscription.trialEndsAt.getTime();

  const isActive =
    subscription.status === "ACTIVE" &&
    (subscription.currentPeriodEnd === null || now <= subscription.currentPeriodEnd.getTime());

  const canAccess = isInTrial || isActive;

  return {
    hasSubscription: true,
    isActive,
    isInTrial,
    canAccess,
    reason: canAccess ? null : "INACTIVE_OR_EXPIRED",
  } as const;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { status: true, trialEndsAt: true, currentPeriodEnd: true },
  });

  const access = computeAccess(
    subscription
      ? {
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null
  );

  return NextResponse.json({ ok: true, ...access });
}
