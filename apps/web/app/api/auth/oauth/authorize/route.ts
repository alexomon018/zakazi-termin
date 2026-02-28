import { getSession } from "@/lib/auth";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const protocol = forwardedProto ?? url.protocol.replace(":", "");
  const origin = (forwardedHost ?? host) ? `${protocol}://${forwardedHost ?? host}` : url.origin;
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope") ?? "openid profile";

  // Validate required params
  if (!clientId || !redirectUri || !responseType || !codeChallenge || !state) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters" },
      { status: 400 }
    );
  }

  if (responseType !== "code") {
    return NextResponse.json(
      { error: "unsupported_response_type", error_description: "Only 'code' is supported" },
      { status: 400 }
    );
  }

  if (codeChallengeMethod !== "S256") {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Only S256 code challenge method is supported",
      },
      { status: 400 }
    );
  }

  // Validate client
  const client = await prisma.oAuthClient.findUnique({
    select: { clientId: true, redirectUri: true, firstParty: true, type: true },
    where: { clientId },
  });

  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 }
    );
  }

  if (client.redirectUri !== redirectUri) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  // Check if user is logged in
  const session = await getSession();
  if (!session?.user?.id) {
    // Redirect to login with callback back to this authorize endpoint
    const callbackUrl = new URL(`${url.pathname}${url.search}`, origin).toString();
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl.toString());
  }

  // For first-party clients, auto-approve (no consent screen)
  if (client.firstParty) {
    const authCode = await prisma.oAuthAuthorizationCode.create({
      select: { code: true },
      data: {
        userId: session.user.id,
        clientId,
        codeChallenge,
        codeChallengeMethod: "S256",
        redirectUri,
        scope,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set("code", authCode.code);
    redirectUrl.searchParams.set("state", state);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Non-first-party clients would need a consent screen (not implemented yet)
  return NextResponse.json(
    { error: "access_denied", error_description: "Third-party clients are not supported yet" },
    { status: 403 }
  );
}
