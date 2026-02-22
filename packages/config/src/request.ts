/**
 * Extract the client IP from a Request using trusted proxy headers.
 * Checks cf-connecting-ip → x-real-ip → x-forwarded-for (rightmost entry).
 * Returns null when the IP cannot be determined so callers can skip rate-limiting.
 */
export function getClientIp(req?: Request): string | null {
  if (!req) return null;

  // Cloudflare sets this to the true client IP
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  // Nginx/reverse-proxy sets this to the real client IP
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // x-forwarded-for: rightmost entry is the one added by the trusted proxy
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    const rightmost = parts[parts.length - 1]?.trim();
    if (rightmost) return rightmost;
  }

  return null;
}
