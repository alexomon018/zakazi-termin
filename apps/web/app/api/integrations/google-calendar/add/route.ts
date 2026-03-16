import { createHmac } from "node:crypto";
import { getSession } from "@/lib/auth";
import { verifyOAuthAccessToken } from "@/lib/oauth/tokens";
import { getGoogleAuthUrl } from "@salonko/calendar";
import { getAppUrl } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Support both cookie-based (web) and Bearer token (mobile) auth
  let userId: string | undefined;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyOAuthAccessToken(token);
    if (payload) {
      const tokenRow = await prisma.oAuthAccessToken.findUnique({
        select: { id: true },
        where: { jti: payload.jti },
      });
      if (tokenRow) userId = payload.sub;
    }
  }

  if (!userId) {
    const session = await getSession();
    userId = session?.user?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google Calendar not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const rawReturnTo = searchParams.get("returnTo") || "/dashboard/settings";
  const rawMobileRedirect = searchParams.get("mobileRedirect");

  // Validate returnTo is a relative path (starts with /, no protocol/double-slash)
  const returnTo = /^\/(?!\/)/.test(rawReturnTo) ? rawReturnTo : "/dashboard/settings";

  // Validate mobileRedirect uses an allowed scheme (salonko:// or exp://)
  const mobileRedirect =
    rawMobileRedirect && /^(salonko|exp):\/\//.test(rawMobileRedirect)
      ? rawMobileRedirect
      : undefined;

  const baseUrl = getAppUrl().replace(/\/+$/, "");
  const redirectUri = `${baseUrl}/api/integrations/google-calendar/callback`;

  // Encode state with returnTo URL, userId (for mobile Bearer-token flow), and mobile redirect
  // Sign with HMAC-SHA256 to prevent state tampering in the callback
  const statePayload = { returnTo, userId, ...(mobileRedirect && { mobileRedirect }) };
  const stateString = JSON.stringify(statePayload);
  const sig = createHmac("sha256", process.env.STATE_SECRET!).update(stateString).digest("hex");
  const state = Buffer.from(JSON.stringify({ ...statePayload, sig })).toString("base64");

  const authUrl = getGoogleAuthUrl(clientId, clientSecret, redirectUri, state);

  return NextResponse.json({ url: authUrl });
}
