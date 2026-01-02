/**
 * Converts trialEndsAt to a Date object, handling both Date and string types
 */
export function parseTrialEndDate(trialEndsAt: Date | string | null): Date | null {
  if (!trialEndsAt) return null;
  return typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
}

/**
 * Determine whether the trial period has not yet expired.
 *
 * @param trialEndsAt - Trial end date as a `Date` object, an ISO date string, or `null`
 * @returns `true` if the current time is before the parsed trial end date, `false` otherwise
 */
export function hasTrialTimeRemaining(trialEndsAt: Date | string | null): boolean {
  if (!trialEndsAt) return false;
  const trialEnd = parseTrialEndDate(trialEndsAt);
  return trialEnd ? new Date() < trialEnd : false;
}

/**
 * Format remaining trial time into a concise Turkish string using days or minutes.
 *
 * If `trialDaysRemaining` is greater than zero the result is a days string; otherwise, if `trialEndsAt`
 * is provided and valid the result is a minutes string. If no time remains or the end date is invalid,
 * returns `"0 dana"`.
 *
 * @param trialDaysRemaining - Number of whole days remaining on the trial
 * @param trialEndsAt - Trial end date as a Date or ISO string, or null
 * @returns A localized short string:
 * - `"<n> dan"` when `trialDaysRemaining === 1`
 * - `"<n> dana"` when `trialDaysRemaining > 1`
 * - `"1 minut"` when 1 minute remains
 * - `"<n> minuta"` when multiple minutes remain
 * - `"0 dana"` when no time remains or the end date is invalid
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