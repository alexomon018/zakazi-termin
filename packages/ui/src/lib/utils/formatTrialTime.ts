/**
 * Converts trialEndsAt to a Date object, handling both Date and string types
 */
export function parseTrialEndDate(trialEndsAt: Date | string | null): Date | null {
  if (!trialEndsAt) return null;
  return typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
}

/**
 * Checks if the trial still has time remaining (hasn't expired)
 */
export function hasTrialTimeRemaining(trialEndsAt: Date | string | null): boolean {
  if (!trialEndsAt) return false;
  const trialEnd = parseTrialEndDate(trialEndsAt);
  return trialEnd ? new Date() < trialEnd : false;
}

/**
 * Formats trial time remaining as days or minutes
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
