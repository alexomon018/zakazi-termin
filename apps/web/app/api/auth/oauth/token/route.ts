import { validateCodeChallenge } from "@/lib/oauth/pkce";
import { createTokenPair } from "@/lib/oauth/tokens";
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
  if (grantType !== "authorization_code") {
    return NextResponse.json(
      {
        error: "unsupported_grant_type",
        error_description: "Only 'authorization_code' is supported",
      },
      { status: 400 }
    );
  }

  const code = body.get("code");
  const redirectUri = body.get("redirect_uri");
  const clientId = body.get("client_id");
  const codeVerifier = body.get("code_verifier");

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Look up the authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    select: {
      id: true,
      userId: true,
      clientId: true,
      codeChallenge: true,
      codeChallengeMethod: true,
      redirectUri: true,
      scope: true,
      expiresAt: true,
      used: true,
    },
    where: { code },
  });

  if (!authCode || authCode.used || authCode.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid or expired authorization code" },
      { status: 400 }
    );
  }

  if (authCode.clientId !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 }
    );
  }

  if (authCode.redirectUri !== redirectUri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  // Validate PKCE
  if (!validateCodeChallenge(codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod)) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 }
    );
  }

  // Mark code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { used: true },
  });

  // Look up user
  const user = await prisma.user.findUnique({
    select: { id: true, email: true, name: true, salonName: true },
    where: { id: authCode.userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "User not found" },
      { status: 400 }
    );
  }

  // Create token pair
  const tokens = await createTokenPair(user, clientId, authCode.scope);

  return NextResponse.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: tokens.tokenType,
    expires_in: tokens.expiresIn,
  });
}
