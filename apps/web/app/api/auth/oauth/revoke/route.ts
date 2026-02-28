import { verifyOAuthAccessToken, verifyOAuthRefreshToken } from "@/lib/oauth/tokens";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: URLSearchParams;
  try {
    const text = await request.text();
    body = new URLSearchParams(text);
  } catch {
    // Per RFC 7009, always return 200
    return NextResponse.json({ revoked: true });
  }

  const token = body.get("token");
  if (!token) {
    return NextResponse.json({ revoked: true });
  }

  // Try as access token first
  const accessPayload = verifyOAuthAccessToken(token);
  if (accessPayload) {
    try {
      // Delete the access token — cascade will delete the refresh token
      await prisma.oAuthAccessToken.delete({
        where: { jti: accessPayload.jti },
      });
    } catch {
      // Token might already be deleted
    }
    return NextResponse.json({ revoked: true });
  }

  // Try as refresh token
  const refreshPayload = verifyOAuthRefreshToken(token);
  if (refreshPayload) {
    try {
      const refreshTokenRow = await prisma.oAuthRefreshToken.findUnique({
        select: { id: true, accessTokenId: true },
        where: { jti: refreshPayload.jti },
      });

      if (refreshTokenRow) {
        await prisma.$transaction([
          prisma.oAuthRefreshToken.update({
            where: { id: refreshTokenRow.id },
            data: { revoked: true },
          }),
          prisma.oAuthAccessToken.delete({
            where: { id: refreshTokenRow.accessTokenId },
          }),
        ]);
      }
    } catch {
      // Token might already be revoked/deleted
    }
    return NextResponse.json({ revoked: true });
  }

  // Unknown token format — still return 200 per RFC 7009
  return NextResponse.json({ revoked: true });
}
