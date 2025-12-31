"use client";

import { useEffect } from "react";
import { useCookieConsentStore } from "../organisms/cookie-consent/store";

const COOKIE_NAME = "cookie-consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

export function useCookieConsent() {
  const store = useCookieConsentStore();

  // Hydrate from cookie on mount
  useEffect(() => {
    const cookieValue = getCookie(COOKIE_NAME);
    if (cookieValue) {
      try {
        const parsed = JSON.parse(cookieValue);
        store.hydrate({
          hasConsented: true,
          analytics: parsed.analytics ?? false,
          consentTimestamp: parsed.timestamp ?? null,
        });
      } catch {
        // Invalid cookie, mark as hydrated anyway
        store.hydrate({});
      }
    } else {
      // No cookie, mark as hydrated so banner can show
      store.hydrate({});
    }
  }, [store.hydrate]);

  // Sync to cookie when consent changes
  useEffect(() => {
    if (store.hasConsented) {
      const value = JSON.stringify({
        version: 1,
        necessary: true,
        analytics: store.analytics,
        timestamp: store.consentTimestamp,
      });
      setCookie(COOKIE_NAME, value, COOKIE_MAX_AGE);
    }
  }, [store.hasConsented, store.analytics, store.consentTimestamp]);

  return {
    hasConsented: store.hasConsented,
    isHydrated: store.isHydrated,
    analytics: store.analytics,
    necessary: store.necessary,
    acceptAll: store.acceptAll,
    acceptNecessaryOnly: store.acceptNecessaryOnly,
    resetConsent: () => {
      deleteCookie(COOKIE_NAME);
      store.resetConsent();
    },
  };
}
