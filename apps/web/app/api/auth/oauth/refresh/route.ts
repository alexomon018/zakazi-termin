import { createTokenPair, verifyOAuthRefreshToken } from "@/lib/oauth/tokens";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: URLSearchParams;
  try {
    const text = await request.text();
    body = new URLSearchParams(text);
  } catch {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Invalid request body" },
      { status: 400 }
    );
  }

  const grantType = body.get("grant_type");
  if (grantType !== "refresh_token") {
    return NextResponse.json(
      { error: "unsupported_grant_type", error_description: "Only 'refresh_token' is supported" },
      { status: 400 }
    );
  }

  const refreshTokenJwt = body.get("refresh_token");
  const clientId = body.get("client_id");

  if (!refreshTokenJwt || !clientId) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Verify the JWT signature and type
  const payload = verifyOAuthRefreshToken(refreshTokenJwt);
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid or expired refresh token" },
      { status: 400 }
    );
  }

  if (payload.clientId !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 }
    );
  }

  // Look up the refresh token in the database
  const refreshTokenRow = await prisma.oAuthRefreshToken.findUnique({
    select: {
      id: true,
      userId: true,
      clientId: true,
      scope: true,
      accessTokenId: true,
      revoked: true,
      expiresAt: true,
    },
    where: { jti: payload.jti },
  });

  if (!refreshTokenRow || refreshTokenRow.revoked || refreshTokenRow.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Refresh token is revoked or expired" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    select: { id: true, email: true, name: true, salonName: true },
    where: { id: refreshTokenRow.userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "User not found" },
      { status: 400 }
    );
  }

  // Revoke old tokens (refresh token + cascade deletes access token)
  await prisma.$transaction([
    prisma.oAuthRefreshToken.update({
      where: { id: refreshTokenRow.id },
      data: { revoked: true },
    }),
    prisma.oAuthAccessToken.delete({
      where: { id: refreshTokenRow.accessTokenId },
    }),
  ]);

  // Create new token pair
  const tokens = await createTokenPair(user, clientId, refreshTokenRow.scope);

  return NextResponse.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: tokens.tokenType,
    expires_in: tokens.expiresIn,
  });
}
