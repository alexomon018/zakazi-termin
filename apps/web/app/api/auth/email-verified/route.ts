import { authOptions } from "@salonko/auth/server";
import { prisma } from "@salonko/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ emailVerified: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, identityProvider: true },
  });

  // OAuth users are always considered verified
  const isVerified = user?.identityProvider !== "EMAIL" || user?.emailVerified !== null;

  return NextResponse.json({ emailVerified: isVerified });
}
