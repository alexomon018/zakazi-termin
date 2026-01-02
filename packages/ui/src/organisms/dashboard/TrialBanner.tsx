"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@salonko/ui";
import {
  formatTrialTimeRemaining,
  hasTrialTimeRemaining,
  parseTrialEndDate,
} from "@salonko/ui/lib/utils/formatTrialTime";
import { AlertCircle, Clock, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Render a contextual subscription and trial banner for the dashboard based on the current subscription status.
 *
 * The banner is hidden while status is loading, after user dismissal, or when no banner is applicable.
 * It conditionally displays:
 * - a prompt to subscribe for users with no subscription,
 * - a warning about imminent trial expiration with an option to dismiss,
 * - an expired/locked subscription notice with a destructive subscribe action,
 * - or a past-due payment notice with a destructive update-payment action.
 *
 * @returns A JSX element containing the appropriate banner when applicable, or `null` otherwise.
 */
export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: status, isLoading } = trpc.subscription.getStatus.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Don't show if loading, dismissed, or no subscription data
  if (isLoading || dismissed || !status) return null;

  // Don't show for active paid subscriptions
  if (status.status === "ACTIVE" && !status.isInTrial) return null;

  // Show banner for users who have never subscribed
  if (!status.hasSubscription) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Pretplatite se da biste koristili sve funkcije aplikacije.
              </p>
            </div>
            <Link href="/dashboard/settings/billing">
              <Button size="sm">Pretplatite se</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show trial banner when trial is active and less than 7 days remaining
  // Also check that trial hasn't actually expired (has minutes remaining)
  const hasTimeRemaining = hasTrialTimeRemaining(status.trialEndsAt);
  if (
    status.isInTrial &&
    status.trialDaysRemaining <= 7 &&
    (status.trialDaysRemaining > 0 || hasTimeRemaining)
  ) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Vaš probni period ističe za{" "}
                <strong>
                  {formatTrialTimeRemaining(status.trialDaysRemaining, status.trialEndsAt)}
                </strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/settings/billing">
                <Button size="sm">Pretplatite se</Button>
              </Link>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-800/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show expired/locked banner
  // Check if trial has actually expired (not just 0 days, but past trialEndsAt)
  const trialEndDate = parseTrialEndDate(status.trialEndsAt);
  const isTrialExpired =
    status.status === "EXPIRED" ||
    (status.isInTrial &&
      status.trialDaysRemaining === 0 &&
      (!trialEndDate || new Date() >= trialEndDate));

  if (isTrialExpired) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Vaša pretplata je istekla. Pretplatite se da biste nastavili da koristite sve
                funkcije.
              </p>
            </div>
            <Link href="/dashboard/settings/billing">
              <Button size="sm" variant="destructive">
                Pretplatite se
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show past due banner
  if (status.status === "PAST_DUE") {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Plaćanje nije uspelo. Ažurirajte način plaćanja.
              </p>
            </div>
            <Link href="/dashboard/settings/billing">
              <Button size="sm" variant="destructive">
                Ažuriraj plaćanje
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}