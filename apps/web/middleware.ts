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
  const token = await getToken({
    req: req as unknown as Parameters<typeof getToken>[0]["req"],
  });
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/verify-email");

  const isDashboardPage = pathname.startsWith("/dashboard");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isTeamsAcceptPage = pathname.startsWith("/teams/accept");

  // Handle team invitation acceptance page
  // If user has invite token and is authenticated, allow access to accept page
  if (isTeamsAcceptPage) {
    if (!token) {
      // Not logged in - redirect to login, preserving the token
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    // Authenticated user accessing accept page - allow through
    return NextResponse.next();
  }

  // Check if user is coming from signup with an invite token
  const inviteToken = req.nextUrl.searchParams.get("token");

  // Redirect authenticated users with invite token to accept page
  if (isAuthPage && token && !pathname.startsWith("/verify-email") && inviteToken) {
    return NextResponse.redirect(new URL(`/teams/accept?token=${inviteToken}`, req.url));
  }

  // Redirect unauthenticated users with invite token to invite signup page
  // (unless they're already on the invite signup page or verify-email)
  if (pathname === "/signup" && !token && inviteToken && !pathname.startsWith("/signup/invite")) {
    return NextResponse.redirect(new URL(`/signup/invite?token=${inviteToken}`, req.url));
  }

  // Redirect authenticated users away from auth pages (except verify-email)
  // If callbackUrl points to the OAuth authorize endpoint, honor it instead of going to /dashboard
  if (isAuthPage && token && !pathname.startsWith("/verify-email")) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      try {
        const parsed = new URL(callbackUrl, req.url);
        const isSameOrigin = parsed.origin === req.nextUrl.origin;
        const isOAuthAuthorizePath = parsed.pathname === "/api/auth/oauth/authorize";

        if (isSameOrigin && isOAuthAuthorizePath) {
          return NextResponse.redirect(parsed);
        }
      } catch {
        // Ignore invalid callbackUrl and fall back to dashboard
      }
    }
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
        // User ID in JWT doesn't match any DB record (e.g., database was re-seeded).
        // Session is stale — force re-login instead of onboarding.
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        const response = NextResponse.redirect(loginUrl);
        // Clear the stale session cookie so the user can log in fresh
        const cookieName =
          process.env.NODE_ENV === "production"
            ? "__Secure-next-auth.session-token"
            : "next-auth.session-token";
        response.cookies.delete(cookieName);
        return response;
      }
      // For 401 or other errors, let the request continue - the dashboard layout will handle auth
    } catch {
      // Fetch failed, let the request continue - dashboard will handle missing data
    }
  }

  // If user has completed onboarding, redirect away from onboarding page
  if (isOnboardingPage && token) {
    try {
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
    } catch {
      // Allow onboarding to proceed if the check fails
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
      try {
        const res = await fetch(new URL("/api/subscription/access", req.url), {
          headers: { cookie },
          cache: "no-store",
        });

        if (res.status === 401) {
          const loginUrl = new URL("/login", req.url);
          loginUrl.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(loginUrl);
        }

        if (!res.ok) {
          return NextResponse.next();
        }

        const data = (await res.json()) as { ok: boolean; canAccess?: boolean };
        const canAccess = data.ok && data.canAccess === true;

        if (!canAccess) {
          // Redirect to billing page with lock message
          const billingUrl = new URL("/dashboard/settings/billing", req.url);
          billingUrl.searchParams.set("locked", "true");
          return NextResponse.redirect(billingUrl);
        }
      } catch {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/teams/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-email",
  ],
};
