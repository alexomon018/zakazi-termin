import { getClientIp, logger, publicApiRateLimiter } from "@salonko/config";
import { NextResponse } from "next/server";

/**
 * Single guard for agent API routes: rate-limits first (prevents brute-force
 * on the secret), then validates the Bearer token.
 * Returns null on success, or an error NextResponse to return immediately.
 */
export async function verifyAgentRequest(
  request: Request,
  bucket: string
): Promise<NextResponse | null> {
  if (publicApiRateLimiter) {
    const ip = getClientIp(request);
    const key = ip ? `${bucket}:${ip}` : `${bucket}:global`;
    const { success } = await publicApiRateLimiter.limit(key);
    if (!success) {
      return NextResponse.json(
        { error: "Previše zahteva. Pokušajte ponovo za minut." },
        { status: 429 }
      );
    }
  }

  const secret = process.env.AGENT_API_SECRET;
  if (!secret) {
    logger.error("AGENT_API_SECRET is not configured");
    return NextResponse.json({ error: "Agent API not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (token !== secret) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  return null;
}
