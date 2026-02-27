import { useEffect, useRef } from "react";
import { trpc } from "./trpc";

/**
 * Ensures the authenticated user has an active trial subscription.
 * Mirrors the web dashboard pattern (apps/web/app/(dashboard)/layout.tsx)
 * where startTrial is called on first visit. Idempotent — safe to call repeatedly.
 *
 * Returns { isReady, isLoading, error } so consumers can gate rendering
 * until the trial is confirmed active — preventing race conditions where
 * subscriptionProtectedProcedure calls fire before the trial exists.
 */
export function useEnsureTrial() {
  const utils = trpc.useUtils();
  const { data: status, isLoading: isStatusLoading } = trpc.subscription.getStatus.useQuery();
  const startTrial = trpc.subscription.startTrial.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
  });
  const attempted = useRef(false);

  useEffect(() => {
    if (status?.needsSubscription && !attempted.current && !startTrial.isPending) {
      attempted.current = true;
      startTrial.mutate();
    }
  }, [status?.needsSubscription, startTrial]);

  const isReady = status?.hasSubscription === true && status?.isActive === true;
  const isLoading =
    isStatusLoading ||
    startTrial.isPending ||
    (status?.needsSubscription === true && !startTrial.isError);

  return { isReady, isLoading, error: startTrial.error };
}
