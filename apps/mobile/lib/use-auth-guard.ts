import { router, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "./auth-context";

/**
 * Redirects users based on authentication state:
 * - Unauthenticated users → login screen
 * - Authenticated users on auth screens → tabs
 *
 * @param areFontsReady - Whether fonts have finished loading
 * @returns Auth loading state
 */
export function useAuthGuard(areFontsReady: boolean) {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const isReady = !isLoading && areFontsReady;

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    // Top-level routes outside "(auth)" and "(tabs)" (e.g. /oauth/callback)
    // are intentionally exempt from redirect logic so deep-link handlers
    // can complete before the guard intervenes.
    const path = `/${segments.join("/")}`;
    const isWhitelistedRoute = path.startsWith("/oauth/callback");

    if (!isAuthenticated && !inAuthGroup && !isWhitelistedRoute) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isReady, isAuthenticated, segments]);

  return { isLoading };
}
