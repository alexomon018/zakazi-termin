import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@salonko/prisma";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

interface OAuthAccessTokenPayload {
  sub: string;
  email: string;
  name: string | null;
  salonName: string | null;
  jti: string;
  clientId: string;
  scope: string;
  type: "oauth_access";
  iat: number;
  exp: number;
}

interface OAuthRefreshTokenPayload {
  sub: string;
  jti: string;
  clientId: string;
  type: "oauth_refresh";
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return secret;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

export function signJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSignature = createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifyOAuthAccessToken(token: string): OAuthAccessTokenPayload | null {
  const payload = verifyJwt(token);
  if (!payload || payload.type !== "oauth_access") return null;
  return payload as unknown as OAuthAccessTokenPayload;
}

export function verifyOAuthRefreshToken(token: string): OAuthRefreshTokenPayload | null {
  const payload = verifyJwt(token);
  if (!payload || payload.type !== "oauth_refresh") return null;
  return payload as unknown as OAuthRefreshTokenPayload;
}

/**
 * Create an access + refresh token pair, persisting both to the database.
 * Returns the signed JWT strings and expiry metadata.
 */
export async function createTokenPair(
  user: { id: string; email: string; name: string | null; salonName: string | null },
  clientId: string,
  scope = "openid profile"
) {
  const now = Math.floor(Date.now() / 1000);
  const accessExpiresAt = new Date((now + ACCESS_TOKEN_MAX_AGE_SECONDS) * 1000);
  const refreshExpiresAt = new Date((now + REFRESH_TOKEN_MAX_AGE_SECONDS) * 1000);

  const accessTokenRow = await prisma.oAuthAccessToken.create({
    select: { id: true, jti: true },
    data: {
      userId: user.id,
      clientId,
      scope,
      expiresAt: accessExpiresAt,
    },
  });

  const refreshTokenRow = await prisma.oAuthRefreshToken.create({
    select: { jti: true },
    data: {
      userId: user.id,
      clientId,
      accessTokenId: accessTokenRow.id,
      scope,
      expiresAt: refreshExpiresAt,
    },
  });

  const accessToken = signJwt({
    sub: user.id,
    email: user.email,
    name: user.name,
    salonName: user.salonName,
    jti: accessTokenRow.jti,
    clientId,
    scope,
    type: "oauth_access",
    iat: now,
    exp: now + ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  const refreshToken = signJwt({
    sub: user.id,
    jti: refreshTokenRow.jti,
    clientId,
    type: "oauth_refresh",
    iat: now,
    exp: now + REFRESH_TOKEN_MAX_AGE_SECONDS,
  });

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer" as const,
    expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
  };
}
