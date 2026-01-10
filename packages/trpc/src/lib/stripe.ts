import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

import { getAppUrl } from "@salonko/config";

// Environment variable validation
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
} as const;

type StripeEnvVars = {
  STRIPE_SECRET_KEY: string;
  STRIPE_PRICE_MONTHLY: string;
  STRIPE_PRICE_YEARLY: string;
};

function requireEnvVar(key: keyof typeof requiredEnvVars, value: string | undefined): string {
  if (!value) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Stripe not configured: missing ${key}`,
    });
  }
  return value;
}

// Validate at procedure call time instead (and return narrowed values).
export function validateStripeConfig(): StripeEnvVars {
  const STRIPE_SECRET_KEY = requireEnvVar("STRIPE_SECRET_KEY", requiredEnvVars.STRIPE_SECRET_KEY);
  const STRIPE_PRICE_MONTHLY = requireEnvVar(
    "STRIPE_PRICE_MONTHLY",
    requiredEnvVars.STRIPE_PRICE_MONTHLY
  );
  const STRIPE_PRICE_YEARLY = requireEnvVar(
    "STRIPE_PRICE_YEARLY",
    requiredEnvVars.STRIPE_PRICE_YEARLY
  );

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

  return { STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY };
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const { STRIPE_SECRET_KEY } = validateStripeConfig();
    _stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover", // Lock Stripe API version to prevent breaking changes
      maxNetworkRetries: 2, // Add retry logic for transient network issues
    });
  }
  return _stripe;
}

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
  get monthly(): string {
    return validateStripeConfig().STRIPE_PRICE_MONTHLY;
  },
  get yearly(): string {
    return validateStripeConfig().STRIPE_PRICE_YEARLY;
  },
} as const;
