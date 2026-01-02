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
    pathname.startsWith("/forgot-password");

  const isDashboardPage = pathname.startsWith("/dashboard");

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users away from dashboard
  if (isDashboardPage && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check subscription status for protected dashboard routes
  if (isDashboardPage && token) {
    const isSubscriptionRequired = SUBSCRIPTION_REQUIRED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    const isAlwaysAccessible = ALWAYS_ACCESSIBLE_ROUTES.some((route) => pathname.startsWith(route));

    if (isSubscriptionRequired && !isAlwaysAccessible) {
      // Check subscription via JWT token data
      const subscriptionStatus = (token as { subscriptionStatus?: string }).subscriptionStatus;
      const isActive = subscriptionStatus === "TRIALING" || subscriptionStatus === "ACTIVE";

      if (!isActive) {
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
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password"],
};
