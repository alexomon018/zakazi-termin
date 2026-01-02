import type { BillingInterval, SubscriptionStatus } from "@salonko/prisma";

/**
 * Subscription field validation based on status
 *
 * Business rules:
 * - TRIALING: trialStartedAt and trialEndsAt are required
 * - ACTIVE, PAST_DUE, CANCELED: stripeSubscriptionId, stripePriceId, and billingInterval are required
 * - EXPIRED: No specific requirements (subscription has ended)
 */

export interface SubscriptionData {
  status: SubscriptionStatus;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  billingInterval?: BillingInterval | null;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate subscription fields required for the subscription's status.
 *
 * @param data - Subscription data to validate; required fields depend on `data.status`.
 * @returns A ValidationResult with `valid` set to `true` when all required fields for the status are present, and `errors` containing human-readable messages for any missing fields.
 */
export function validateSubscriptionData(data: SubscriptionData): ValidationResult {
  const errors: string[] = [];

  switch (data.status) {
    case "TRIALING":
      if (!data.trialStartedAt) {
        errors.push("trialStartedAt is required for TRIALING status");
      }
      if (!data.trialEndsAt) {
        errors.push("trialEndsAt is required for TRIALING status");
      }
      break;

    case "ACTIVE":
    case "PAST_DUE":
    case "CANCELED":
      if (!data.stripeSubscriptionId) {
        errors.push(`stripeSubscriptionId is required for ${data.status} status`);
      }
      if (!data.stripePriceId) {
        errors.push(`stripePriceId is required for ${data.status} status`);
      }
      if (!data.billingInterval) {
        errors.push(`billingInterval is required for ${data.status} status`);
      }
      break;

    case "EXPIRED":
      // No specific requirements for expired subscriptions
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that applying optional updates and changing a subscription's status meets the status-specific requirements.
 *
 * @param currentData - The existing subscription data to use as a base for validation
 * @param newStatus - The target subscription status to validate against
 * @param newData - Optional partial data to merge over `currentData` before validation
 * @returns `valid` is `true` if the merged subscription data satisfies the requirements for `newStatus`, `false` otherwise; `errors` lists human-readable validation messages
 */
export function validateStatusTransition(
  currentData: SubscriptionData,
  newStatus: SubscriptionStatus,
  newData?: Partial<SubscriptionData>
): ValidationResult {
  // Merge current data with new data for validation
  const mergedData: SubscriptionData = {
    ...currentData,
    ...newData,
    status: newStatus,
  };

  return validateSubscriptionData(mergedData);
}

/**
 * Validate subscription data and throw an Error when validation fails.
 *
 * @param data - The subscription data to validate.
 * @param context - Optional context label included in the thrown error message as a prefix (e.g., webhook or mutation name).
 * @throws Error when validation fails; message is prefixed by `context` if provided and lists the validation errors.
 */
export function assertValidSubscriptionData(data: SubscriptionData, context?: string): void {
  const result = validateSubscriptionData(data);
  if (!result.valid) {
    const prefix = context ? `[${context}] ` : "";
    throw new Error(`${prefix}Invalid subscription data: ${result.errors.join(", ")}`);
  }
}

/**
 * Ensure a transition to `newStatus` (optionally applying `newData`) yields valid subscription data.
 *
 * @param currentData - The current subscription state to base the transition on
 * @param newStatus - The target subscription status
 * @param newData - Partial subscription fields to apply before validation
 * @param context - Optional context prefix included in the thrown error message
 * @throws Error if the merged subscription data is invalid; the message is optionally prefixed with `[context] ` and lists validation errors
 */
export function assertValidStatusTransition(
  currentData: SubscriptionData,
  newStatus: SubscriptionStatus,
  newData?: Partial<SubscriptionData>,
  context?: string
): void {
  const result = validateStatusTransition(currentData, newStatus, newData);
  if (!result.valid) {
    const prefix = context ? `[${context}] ` : "";
    throw new Error(`${prefix}Cannot transition to ${newStatus}: ${result.errors.join(", ")}`);
  }
}