"use client";

import { useEffect, useRef } from "react";

interface UseExponentialBackoffPollingOptions {
  /**
   * Whether polling should be active
   */
  enabled: boolean;
  /**
   * Function to call on each poll attempt
   */
  onPoll: () => void;
  /**
   * Base delay in milliseconds (default: 1000)
   */
  baseDelay?: number;
  /**
   * Maximum number of polling attempts (default: 4)
   */
  maxAttempts?: number;
  /**
   * Maximum delay in milliseconds (default: 8000)
   */
  maxDelay?: number;
}

/**
 * Custom hook for exponential backoff polling
 *
 * Polls with exponential backoff: baseDelay, baseDelay*2, baseDelay*4, etc.
 * Useful for waiting for async operations like webhook processing.
 *
 * @example
 * ```tsx
 * const { refetch } = trpc.subscription.getStatus.useQuery();
 * useExponentialBackoffPolling({
 *   enabled: success,
 *   onPoll: refetch,
 * });
 * ```
 */
export function useExponentialBackoffPolling({
  enabled,
  onPoll,
  baseDelay = 1000,
  maxAttempts = 4,
  maxDelay = 8000,
}: UseExponentialBackoffPollingOptions): void {
  const attemptRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // Reset attempt counter when disabled
      attemptRef.current = 0;
      isActiveRef.current = false;
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Reset attempt counter when polling starts
    attemptRef.current = 0;
    isActiveRef.current = true;

    const poll = () => {
      // Check if polling was cancelled
      if (!isActiveRef.current || attemptRef.current >= maxAttempts) {
        return;
      }

      const delay = Math.min(baseDelay * 2 ** attemptRef.current, maxDelay);
      attemptRef.current++;

      timeoutRef.current = setTimeout(() => {
        // Check again before polling (in case it was cancelled during the delay)
        if (isActiveRef.current) {
          onPoll();
          poll(); // Schedule next poll
        }
      }, delay);
    };

    poll();

    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, onPoll, baseDelay, maxAttempts, maxDelay]);
}
