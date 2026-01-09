import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

// Routes that require active subscription
const SUBSCRIPTION_REQUIRED_ROUTES = [
  "/dashboard/bookings",
  "/dashboard/event-types",
  "/dashboard/availability",
  "/dashboard/out-of-office",
];

// Routes always accessible (even with expired subscription)
const ALWAYS_ACCESSIBLE_ROUTES = [
  "/dashboard/settings/billing",
  "/dashboard/settings/profile",
  "/dashboard/settings/appearance",
];

export async function middleware(req: NextRequest, _event: NextFetchEvent) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/verify-email");

  const isDashboardPage = pathname.startsWith("/dashboard");

  // Redirect authenticated users away from auth pages (except verify-email)
  if (isAuthPage && token && !pathname.startsWith("/verify-email")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Handle verify-email page access
  if (pathname.startsWith("/verify-email")) {
    const emailParam = req.nextUrl.searchParams.get("email");

    // If user has email param, they're verifying from signup (no token yet) - allow access
    if (emailParam && !token) {
      return NextResponse.next();
    }

    // If no email param and no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Authenticated user - check if already verified
    const cookie = req.headers.get("cookie") ?? "";
    const verifyCheckRes = await fetch(new URL("/api/auth/email-verified", req.url), {
      headers: { cookie },
      cache: "no-store",
    });

    if (verifyCheckRes.ok) {
      const verifyData = (await verifyCheckRes.json()) as { emailVerified: boolean };
      if (verifyData.emailVerified) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // Redirect unauthenticated users away from dashboard
  if (isDashboardPage && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check email verification for dashboard access
  if (isDashboardPage && token) {
    const cookie = req.headers.get("cookie") ?? "";
    const emailVerifiedRes = await fetch(new URL("/api/auth/email-verified", req.url), {
      headers: { cookie },
      cache: "no-store",
    });

    if (emailVerifiedRes.ok) {
      const emailData = (await emailVerifiedRes.json()) as { emailVerified: boolean };
      if (!emailData.emailVerified) {
        return NextResponse.redirect(new URL("/verify-email", req.url));
      }
    }
  }

  // Check subscription status for protected dashboard routes
  if (isDashboardPage && token) {
    // Use exact route matching to prevent false positives (e.g., /dashboard/bookings-archive)
    const isSubscriptionRequired = SUBSCRIPTION_REQUIRED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const isAlwaysAccessible = ALWAYS_ACCESSIBLE_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isSubscriptionRequired && !isAlwaysAccessible) {
      // Do NOT trust JWT claims for subscription gating (token can be long-lived and stale).
      // Validate against the current database state via a server (Node) API route.
      const cookie = req.headers.get("cookie") ?? "";
      const res = await fetch(new URL("/api/subscription/access", req.url), {
        headers: { cookie },
        cache: "no-store",
      });

      if (res.status === 401) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      const data = (await res.json()) as { ok: boolean; canAccess?: boolean };
      const canAccess = data.ok && data.canAccess === true;

      if (!canAccess) {
        // Redirect to billing page with lock message
        const billingUrl = new URL("/dashboard/settings/billing", req.url);
        billingUrl.searchParams.set("locked", "true");
        return NextResponse.redirect(billingUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/verify-email"],
};
