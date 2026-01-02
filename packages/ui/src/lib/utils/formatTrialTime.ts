/**
 * Convert a trial end value to a Date or return null for missing values.
 *
 * @param trialEndsAt - The trial end as a Date, an ISO date string, or null/undefined
 * @returns A Date representing the trial end, or `null` if `trialEndsAt` is falsy or missing
 */
export function parseTrialEndDate(trialEndsAt: Date | string | null): Date | null {
  if (!trialEndsAt) return null;
  return typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
}

/**
 * Determine whether the trial has not yet expired.
 *
 * @param trialEndsAt - The trial end as a Date, an ISO date string, or null.
 * @returns `true` if the current time is before the provided trial end date, `false` otherwise.
 */
export function hasTrialTimeRemaining(trialEndsAt: Date | string | null): boolean {
  if (!trialEndsAt) return false;
  const trialEnd = parseTrialEndDate(trialEndsAt);
  return trialEnd ? new Date() < trialEnd : false;
}

/**
 * Format remaining trial time as a localized day or minute string.
 *
 * @param trialDaysRemaining - Number of whole days remaining on the trial
 * @param trialEndsAt - Trial end timestamp as a `Date`, an ISO date `string`, or `null`
 * @returns A human-readable string representing remaining time:
 * - "<n> dan" when `trialDaysRemaining` is 1
 * - "<n> dana" when `trialDaysRemaining` is greater than 1
 * - "1 minut" when fewer than 1 day remains and 1 minute remains
 * - "<n> minuta" when fewer than 1 day remains and 2–N minutes remain
 * - "0 dana" when no remaining time can be determined or the trial has expired
 */
export function formatTrialTimeRemaining(
  trialDaysRemaining: number,
  trialEndsAt: Date | string | null
): string {
  if (trialDaysRemaining > 0) {
    return `${trialDaysRemaining} ${trialDaysRemaining === 1 ? "dan" : "dana"}`;
  }

  // If 0 days but trial hasn't expired, show minutes
  if (trialEndsAt) {
    const now = new Date();
    const trialEnd = parseTrialEndDate(trialEndsAt);
    if (!trialEnd) return "0 dana";

    const minutesRemaining = Math.floor((trialEnd.getTime() - now.getTime()) / (1000 * 60));

    if (minutesRemaining > 0) {
      if (minutesRemaining === 1) {
        return "1 minut";
      }
      if (minutesRemaining < 5) {
        return `${minutesRemaining} minuta`;
      }
      return `${minutesRemaining} minuta`;
    }
  }

  return "0 dana";
}