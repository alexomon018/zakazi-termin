import { getClientIp, logger, publicApiRateLimiter } from "@salonko/config";
import { NextResponse } from "next/server";

/**
 * Verifies the shared agent API secret from the Authorization header.
 * Returns null on success, or a NextResponse error to return immediately.
 */
export function verifyAgentSecret(request: Request): NextResponse | null {
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

/**
 * Applies the public API rate limiter scoped to the given bucket name.
 * Returns null on success, or a 429 NextResponse to return immediately.
 * No-ops when the limiter is unconfigured (no Redis) or the request IP is unknown.
 */
export async function checkAgentRateLimit(
  request: Request,
  bucket: string
): Promise<NextResponse | null> {
  if (!publicApiRateLimiter) return null;
  const ip = getClientIp(request);
  if (!ip) return null;
  const { success } = await publicApiRateLimiter.limit(`${bucket}:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Previše zahteva. Pokušajte ponovo za minut." },
      { status: 429 }
    );
  }
  return null;
}
