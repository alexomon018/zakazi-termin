/**
 * Centralized pricing configuration
 *
 * Note: These are display prices in RSD. The actual Stripe prices are configured
 * via STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY environment variables.
 *
 * If Stripe prices change, update these values to keep the UI in sync.
 */
export const PRICING_CONFIG = {
  monthly: {
    price: "5.000",
    period: "mesečno",
    total: "5.000 RSD/mes",
    savings: null,
  },
  yearly: {
    price: "50.000",
    period: "godišnje",
    total: "~4.167 RSD/mes",
    savings: "2 meseca besplatno",
  },
} as const;
