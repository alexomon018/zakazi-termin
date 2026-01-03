import type { BillingInterval, SubscriptionStatus } from "@salonko/prisma";

/**
 * Subscription field validation based on status
 *
 * Business rules:
 * - TRIALING: trialStartedAt and trialEndsAt are required
 * - ACTIVE, PAST_DUE, CANCELED: stripeSubscriptionId, stripePriceId, and billingInterval are required
 * - EXPIRED: No specific requirements (subscription has ended)
 */

/**
 * Allowed status transitions
 * Note: This is optional validation - webhook handlers may already enforce transition rules
 */
const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  TRIALING: ["ACTIVE", "EXPIRED"],
  ACTIVE: ["PAST_DUE", "CANCELED", "EXPIRED", "PAUSED"],
  PAST_DUE: ["ACTIVE", "CANCELED", "EXPIRED", "UNPAID"],
  CANCELED: ["ACTIVE"], // resubscribe
  EXPIRED: ["TRIALING", "ACTIVE"], // new subscription
  INCOMPLETE: ["ACTIVE", "INCOMPLETE_EXPIRED"], // payment pending
  INCOMPLETE_EXPIRED: ["TRIALING", "ACTIVE"], // can restart
  UNPAID: ["ACTIVE", "CANCELED", "EXPIRED"], // payment failed after retries
  PAUSED: ["ACTIVE", "CANCELED"], // resume or cancel
};

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
 * Validates subscription data based on status-specific requirements
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
    case "INCOMPLETE":
    case "UNPAID":
    case "PAUSED":
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
    case "INCOMPLETE_EXPIRED":
      // No specific requirements for expired subscriptions
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a status transition and returns errors if the target state is invalid
 * Use this before updating subscription status
 */
export function validateStatusTransition(
  currentData: SubscriptionData,
  newStatus: SubscriptionStatus,
  newData?: Partial<SubscriptionData>
): ValidationResult {
  const errors: string[] = [];

  // Check if transition is allowed (optional validation)
  const currentStatus = currentData.status;
  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];
  if (allowedTargets && !allowedTargets.includes(newStatus)) {
    errors.push(
      `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTargets.join(", ")}`
    );
  }

  // Merge current data with new data for validation
  const mergedData: SubscriptionData = {
    ...currentData,
    ...newData,
    status: newStatus,
  };

  // Validate field requirements for the target status
  const fieldValidation = validateSubscriptionData(mergedData);
  errors.push(...fieldValidation.errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Throws an error if subscription data is invalid
 * Use in webhook handlers and mutation handlers
 */
export function assertValidSubscriptionData(data: SubscriptionData, context?: string): void {
  const result = validateSubscriptionData(data);
  if (!result.valid) {
    const prefix = context ? `[${context}] ` : "";
    throw new Error(`${prefix}Invalid subscription data: ${result.errors.join(", ")}`);
  }
}

/**
 * Validates and returns whether a status transition is allowed
 * Returns detailed error for webhook retry/logging
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
