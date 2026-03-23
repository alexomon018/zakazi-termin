import { PaywallScreen, QueryStateView } from "@/components/atoms";
import { WEB_ORIGIN } from "@/lib/api-url";
import { trpc } from "@/lib/trpc";
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
  const generateToken = trpc.user.generateAutoLoginToken.useMutation();

  const handleOpenBilling = useCallback(async () => {
    try {
      const { token, email } = await generateToken.mutateAsync();
      const query = new URLSearchParams({
        callbackUrl: "/dashboard/settings/billing",
      });
      const fragment = new URLSearchParams({ token, email });
      await WebBrowser.openBrowserAsync(
        `${WEB_ORIGIN}/auto-login?${query.toString()}#${fragment.toString()}`
      );
    } catch {
      // Fallback: open billing page directly (user will need to log in manually)
      await WebBrowser.openBrowserAsync(`${WEB_ORIGIN}/dashboard/settings/billing`);
    }
  }, [generateToken]);

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
