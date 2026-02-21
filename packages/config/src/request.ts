/** Extract the client IP from a Request's x-forwarded-for header. */
export function getClientIp(req?: Request): string {
  if (!req) return "unknown";
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
