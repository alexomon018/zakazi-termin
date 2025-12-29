"use client";

import { useCookieConsent } from "@salonko/ui";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "./GoogleAnalytics";

export function ConditionalAnalytics() {
  const { hasConsented, analytics } = useCookieConsent();

  if (!hasConsented || !analytics) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics />
      <Analytics />
    </>
  );
}
