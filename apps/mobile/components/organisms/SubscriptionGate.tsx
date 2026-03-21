import { PaywallScreen, QueryStateView } from "@/components/atoms";
import { WEB_ORIGIN } from "@/lib/api-url";
import { useSubscription } from "@/lib/use-subscription";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";
import type { ReactNode } from "react";

/**
 * Gates children behind an active subscription or trial.
 * Shows a loading indicator while checking, or a paywall screen when expired.
 */
export function SubscriptionGate({ children }: { children: ReactNode }) {
  const { state, refetch, error } = useSubscription();

  const handleOpenBilling = useCallback(() => {
    WebBrowser.openBrowserAsync(`${WEB_ORIGIN}/dashboard/settings/billing`);
  }, []);

  if (state === "loading") {
    return <QueryStateView state="loading" />;
  }

  if (state === "error") {
    return <QueryStateView state="error" message={error?.message} onRetry={refetch} />;
  }

  if (state === "expired") {
    return <PaywallScreen onOpenBilling={handleOpenBilling} />;
  }

  return <>{children}</>;
}
