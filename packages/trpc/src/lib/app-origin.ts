import { getAppUrl } from "@salonko/config";

function firstForwardedHost(value: string): string {
  // Vercel/Proxies may send a comma-separated list; first is the original host.
  return value.split(",")[0]!.trim();
}

function normalizeProtocol(value: string): "http" | "https" | undefined {
  const v = value.trim().toLowerCase().replace("://", "");
  if (v === "http" || v === "https") return v;
  return undefined;
}

/**
 * Compute the public origin (scheme + host) for absolute URLs.
 *
 * Prefer request headers (custom domains, proxies, Vercel) and fall back to env-based app URL.
 */
export function getAppOriginFromRequest(req?: Request, protocol?: "http" | "https"): string {
  if (req) {
    const headers = req.headers;
    const forwardedHost = headers.get("x-forwarded-host");
    const host = forwardedHost ? firstForwardedHost(forwardedHost) : headers.get("host");

    // Protocol override precedence:
    // 1) explicit parameter (call-site controlled)
    // 2) env configuration (useful for dev/staging custom domains behind proxies)
    // 3) forwarded proto header (proxies / Vercel)
    // 4) legacy heuristic fallback (localhost => http, otherwise https)
    const envProtocol =
      normalizeProtocol(process.env.NEXT_PUBLIC_APP_PROTOCOL ?? "") ??
      normalizeProtocol(process.env.APP_PROTOCOL ?? "");
    const forwardedProtoRaw = headers.get("x-forwarded-proto");
    const forwardedProto = forwardedProtoRaw ? firstForwardedHost(forwardedProtoRaw) : undefined;
    const inferredProto = host?.includes("localhost") ? "http" : "https";
    const proto =
      protocol ?? envProtocol ?? normalizeProtocol(forwardedProto ?? "") ?? inferredProto;

    if (host) {
      return `${proto}://${host}`;
    }
  }

  // Fallback to env-driven behavior (production / preview / localhost)
  return getAppUrl();
}
