import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

import { getAppUrl } from "@salonko/config";
import type { PlanTier } from "@salonko/config";

// Environment variable validation
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_GROWTH: process.env.STRIPE_PRICE_GROWTH,
  STRIPE_PRICE_GROWTH_YEARLY: process.env.STRIPE_PRICE_GROWTH_YEARLY,
  STRIPE_PRICE_WEB_PRESENCE: process.env.STRIPE_PRICE_WEB_PRESENCE,
} as const;

type StripeEnvVars = {
  STRIPE_SECRET_KEY: string;
  STRIPE_PRICE_STARTER: string;
  STRIPE_PRICE_GROWTH: string;
  STRIPE_PRICE_GROWTH_YEARLY: string;
  STRIPE_PRICE_WEB_PRESENCE: string;
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
  const STRIPE_PRICE_STARTER = requireEnvVar(
    "STRIPE_PRICE_STARTER",
    requiredEnvVars.STRIPE_PRICE_STARTER
  );
  const STRIPE_PRICE_GROWTH = requireEnvVar(
    "STRIPE_PRICE_GROWTH",
    requiredEnvVars.STRIPE_PRICE_GROWTH
  );
  const STRIPE_PRICE_GROWTH_YEARLY = requireEnvVar(
    "STRIPE_PRICE_GROWTH_YEARLY",
    requiredEnvVars.STRIPE_PRICE_GROWTH_YEARLY
  );
  const STRIPE_PRICE_WEB_PRESENCE = requireEnvVar(
    "STRIPE_PRICE_WEB_PRESENCE",
    requiredEnvVars.STRIPE_PRICE_WEB_PRESENCE
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

  return {
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_STARTER,
    STRIPE_PRICE_GROWTH,
    STRIPE_PRICE_GROWTH_YEARLY,
    STRIPE_PRICE_WEB_PRESENCE,
  };
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

export const PRICES: Record<PlanTier, string> = {
  get starter(): string {
    return validateStripeConfig().STRIPE_PRICE_STARTER;
  },
  get growth(): string {
    return validateStripeConfig().STRIPE_PRICE_GROWTH;
  },
  get growth_yearly(): string {
    return validateStripeConfig().STRIPE_PRICE_GROWTH_YEARLY;
  },
  get web_presence(): string {
    return validateStripeConfig().STRIPE_PRICE_WEB_PRESENCE;
  },
};

/**
 * Get plan tier from Stripe price ID
 * Returns null for unknown/legacy price IDs
 */
export function getPlanTierFromPriceId(priceId: string | null): PlanTier | null {
  if (!priceId) return null;

  const config = validateStripeConfig();

  if (priceId === config.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === config.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === config.STRIPE_PRICE_GROWTH_YEARLY) return "growth_yearly";
  if (priceId === config.STRIPE_PRICE_WEB_PRESENCE) return "web_presence";

  return null; // Legacy or unknown price
}
