import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

import { getAppUrl } from "@salonko/config";

// Environment variable validation
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
} as const;

// Validate at procedure call time instead
export function validateStripeConfig() {
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Stripe not configured: missing ${key}`,
      });
    }
  }

  // Validate env-based base URL fallback (must include scheme).
  try {
    // eslint-disable-next-line no-new
    new URL(getAppUrl());
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Invalid NEXT_PUBLIC_APP_URL. It must be a full URL with scheme, e.g. https://salonko.rs or http://localhost:3000",
    });
  }
}

export const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Lock Stripe API version to prevent breaking changes
  maxNetworkRetries: 2, // Add retry logic for transient network issues
});

/**
 * Checks if a Stripe ID is a test/fake ID used in E2E tests.
 * Matches known Stripe prefixes followed by "_test_":
 * sub (subscription), cus (customer), price, prod (product),
 * pm (payment method), in (invoice), si (setup intent),
 * pi (payment intent), ch (charge)
 */
const TEST_STRIPE_ID_REGEX = /^(?:sub|cus|price|prod|pm|in|si|pi|ch)_test_/;

export function isTestStripeId(stripeId: string | null | undefined): boolean {
  if (!stripeId) return false;
  return TEST_STRIPE_ID_REGEX.test(stripeId);
}

export const PRICES = {
  monthly: requiredEnvVars.STRIPE_PRICE_MONTHLY,
  yearly: requiredEnvVars.STRIPE_PRICE_YEARLY,
};
