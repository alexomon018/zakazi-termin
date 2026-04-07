import { useEffect, useRef } from "react";
import { trpc } from "./trpc";

type SubscriptionState = "loading" | "active" | "expired" | "error";

/**
 * Manages subscription state for the mobile app.
 *
 * - Auto-starts trial when `needsSubscription` is true (mirrors web dashboard pattern)
 * - Returns a clear `state` discriminant so consumers can gate UI accordingly
 * - Fixes the infinite-loading bug where expired trials left `useEnsureTrial` in limbo
 */
export function useSubscription() {
  const utils = trpc.useUtils();
  const {
    data: status,
    isLoading: isStatusLoading,
    error: statusError,
    refetch,
  } = trpc.subscription.getStatus.useQuery();
  const startTrial = trpc.subscription.startTrial.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
    onError: () => {
      attempted.current = false;
    },
  });
  const attempted = useRef(false);

  useEffect(() => {
    if (status?.needsSubscription && !attempted.current && !startTrial.isPending) {
      attempted.current = true;
      startTrial.mutate();
    }
  }, [status?.needsSubscription, startTrial.isPending, startTrial.mutate]);

  const error = statusError ?? startTrial.error;

  const isTrialStarting =
    startTrial.isPending || (status?.needsSubscription === true && !startTrial.isError);

  let state: SubscriptionState;
  if (error) {
    state = "error";
  } else if (isStatusLoading || isTrialStarting) {
    state = "loading";
  } else if (status?.isActive) {
    state = "active";
  } else {
    state = "expired";
  }

  return {
    state,
    isInTrial: status?.isInTrial ?? false,
    trialDaysRemaining: status?.trialDaysRemaining ?? 0,
    refetch,
    error,
  };
}
