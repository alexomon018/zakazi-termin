import { verifyOAuthAccessToken } from "@/lib/oauth/tokens";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "invalid_token", error_description: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const payload = verifyOAuthAccessToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_token", error_description: "Invalid or expired access token" },
      { status: 401 }
    );
  }

  // Verify the token still exists in the database (not revoked)
  const tokenRow = await prisma.oAuthAccessToken.findUnique({
    select: { id: true },
    where: { jti: payload.jti },
  });

  if (!tokenRow) {
    return NextResponse.json(
      { error: "invalid_token", error_description: "Token has been revoked" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    select: {
      id: true,
      email: true,
      name: true,
      salonName: true,
      salonSlug: true,
      avatarUrl: true,
      locale: true,
      timeZone: true,
    },
    where: { id: payload.sub },
  });

  if (!user) {
    return NextResponse.json(
      { error: "invalid_token", error_description: "User not found" },
      { status: 401 }
    );
  }

  return NextResponse.json({ data: user });
}
