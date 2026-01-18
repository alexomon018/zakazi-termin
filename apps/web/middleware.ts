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
  const isOnboardingPage = pathname.startsWith("/onboarding");

  // Redirect authenticated users away from auth pages (except verify-email)
  if (isAuthPage && token && !pathname.startsWith("/verify-email")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Handle onboarding page - require authentication
  if (isOnboardingPage && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
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

    // If already authenticated, no need to be on verify-email (Option A: don't gate dashboard by verification)
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users away from dashboard
  if (isDashboardPage && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check profile completeness for dashboard access (redirect incomplete profiles to onboarding)
  if (isDashboardPage && token) {
    const cookie = req.headers.get("cookie") ?? "";
    try {
      const profileRes = await fetch(new URL("/api/profile/complete", req.url), {
        headers: { cookie },
        cache: "no-store",
      });

      if (profileRes.ok) {
        const profileData = (await profileRes.json()) as {
          ok: boolean;
          isComplete?: boolean;
        };
        if (profileData.ok && profileData.isComplete === false) {
          return NextResponse.redirect(new URL("/onboarding/complete-profile", req.url));
        }
      } else if (profileRes.status === 404) {
        // User not found in database - redirect to onboarding
        return NextResponse.redirect(new URL("/onboarding/complete-profile", req.url));
      }
      // For 401 or other errors, let the request continue - the dashboard layout will handle auth
    } catch {
      // Fetch failed, let the request continue - dashboard will handle missing data
      return NextResponse.next();
    }
  }

  // If user has completed onboarding, redirect away from onboarding page
  if (isOnboardingPage && token) {
    const cookie = req.headers.get("cookie") ?? "";
    const profileRes = await fetch(new URL("/api/profile/complete", req.url), {
      headers: { cookie },
      cache: "no-store",
    });

    if (profileRes.ok) {
      const profileData = (await profileRes.json()) as {
        ok: boolean;
        isComplete?: boolean;
      };
      if (profileData.ok && profileData.isComplete === true) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
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
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-email",
  ],
};
