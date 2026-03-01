import { createHash } from "node:crypto";

/**
 * Validate a PKCE code challenge against the provided code verifier.
 * Only supports the S256 method (SHA-256 hash of the verifier, base64url-encoded).
 */
export function validateCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: string
): boolean {
  if (method !== "S256") return false;
  const hash = createHash("sha256").update(codeVerifier).digest("base64url");
  return hash === codeChallenge;
}
