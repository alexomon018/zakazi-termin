import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { API_URL } from "./api-url";

const OAUTH_CLIENT_ID = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID ?? "";
const REDIRECT_URI = "salonko://oauth/callback";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

function generateRandomString(length: number): string {
  const bytes = Crypto.getRandomBytes(length);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  // Convert base64 to base64url
  return digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Run the full OAuth 2.0 PKCE authorization flow.
 * Opens the web login in an in-app browser, exchanges the code for tokens.
 */
export async function authorize(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    scope: "openid profile",
    prompt: "login",
  });

  const authUrl = `${API_URL}/api/auth/oauth/authorize?${params.toString()}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

  if (result.type !== "success") {
    throw new Error("Autorizacija je otkazana.");
  }

  const url = new URL(result.url);
  const error = url.searchParams.get("error");
  if (error) {
    const description = url.searchParams.get("error_description") ?? error;
    throw new Error(description);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (returnedState !== state) {
    throw new Error("Neuspela verifikacija stanja. Pokušajte ponovo.");
  }

  if (!code) {
    throw new Error("Autorizacioni kod nije primljen.");
  }

  return exchangeCode(code, codeVerifier);
}

async function exchangeCode(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: OAUTH_CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${API_URL}/api/auth/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error_description ?? "Razmena tokena nije uspela.");
  }

  const data: TokenResponse = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: OAUTH_CLIENT_ID,
  });

  const response = await fetch(`${API_URL}/api/auth/oauth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error_description ?? "Osvežavanje tokena nije uspelo.");
  }

  const data: TokenResponse = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function revokeToken(token: string): Promise<void> {
  const body = new URLSearchParams({
    token,
    client_id: OAUTH_CLIENT_ID,
  });

  await fetch(`${API_URL}/api/auth/oauth/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }).catch(() => {
    // Revocation is best-effort
  });
}

/**
 * Check if a token is expired (with 5-minute buffer).
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 5 * 60 * 1000;
}
