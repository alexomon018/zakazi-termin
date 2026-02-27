import { createHmac, timingSafeEqual } from "node:crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

interface MobileTokenPayload {
  sub: string; // user id
  email: string;
  name?: string | null;
  salonName?: string | null;
  type: "access" | "refresh";
}

function getSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return JWT_SECRET;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

function sign(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

function verify(token: string): Record<string, unknown> | null {
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
      return null; // expired
    }
    return payload;
  } catch {
    return null;
  }
}

export function createAccessToken(user: {
  id: string;
  email: string;
  name?: string | null;
  salonName?: string | null;
}): string {
  return sign({
    sub: user.id,
    email: user.email,
    name: user.name,
    salonName: user.salonName,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
}

export function createRefreshToken(userId: string): string {
  return sign({
    sub: userId,
    type: "refresh",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function verifyAccessToken(token: string): MobileTokenPayload | null {
  const payload = verify(token);
  if (!payload || payload.type !== "access") return null;
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    name: payload.name as string | null | undefined,
    salonName: payload.salonName as string | null | undefined,
    type: "access",
  };
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  const payload = verify(token);
  if (!payload || payload.type !== "refresh") return null;
  return { sub: payload.sub as string };
}
