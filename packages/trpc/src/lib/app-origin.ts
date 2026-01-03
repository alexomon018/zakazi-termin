import { getAppUrl } from "@salonko/config";

function firstForwardedHost(value: string): string {
  // Vercel/Proxies may send a comma-separated list; first is the original host.
  return value.split(",")[0]!.trim();
}

/**
 * Compute the public origin (scheme + host) for absolute URLs.
 *
 * Prefer request headers (custom domains, proxies, Vercel) and fall back to env-based app URL.
 */
export function getAppOriginFromRequest(req?: Request): string {
  if (req) {
    const headers = req.headers;
    const forwardedHost =
      headers.get("x-forwarded-host") ?? headers.get("x-forwarded-host".toUpperCase());
    const host = forwardedHost
      ? firstForwardedHost(forwardedHost)
      : (headers.get("host") ?? headers.get("host".toUpperCase()));

    const proto =
      headers.get("x-forwarded-proto") ??
      headers.get("x-forwarded-proto".toUpperCase()) ??
      (host?.includes("localhost") ? "http" : "https");

    if (host) {
      return `${proto}://${host}`;
    }
  }

  // Fallback to env-driven behavior (production / preview / localhost)
  return getAppUrl();
}
