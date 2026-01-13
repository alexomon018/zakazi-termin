/**
 * Centralized pricing configuration for all plan tiers
 *
 * Note: These are display prices in RSD. The actual Stripe prices are configured
 * via environment variables:
 * - STRIPE_PRICE_STARTER
 * - STRIPE_PRICE_GROWTH
 * - STRIPE_PRICE_GROWTH_YEARLY
 * - STRIPE_PRICE_WEB_PRESENCE
 *
 * If Stripe prices change, update these values to keep the UI in sync.
 */

export type PlanTier = "starter" | "growth" | "growth_yearly" | "web_presence";

export type BillingInterval = "MONTH" | "YEAR";

export type PlanConfig = {
  name: string;
  price: string;
  period: string;
  billingInterval: BillingInterval;
  badge: string | null;
  features: string[];
};

export const PLAN_TIERS: PlanTier[] = ["starter", "web_presence", "growth", "growth_yearly"];

export const PRICING_CONFIG: Record<PlanTier, PlanConfig> = {
  starter: {
    name: "Starter",
    price: "1.999",
    period: "mesečno",
    billingInterval: "MONTH",
    badge: null,
    features: [
      "Online zakazivanje 24/7",
      "Email podsetnici",
      "Upravljanje rasporedom",
      "Google Calendar sinhronizacija",
      "Mobilni pristup",
    ],
  },
  web_presence: {
    name: "Web Presence",
    price: "1.999",
    period: "mesečno",
    billingInterval: "MONTH",
    badge: "Buduća funkcionalnost",
    features: ["Listing na Salonko sajtu", "Vidljivost za nove klijente", "Profil salona"],
  },
  growth: {
    name: "Growth",
    price: "2.999",
    period: "mesečno",
    billingInterval: "MONTH",
    badge: "Najpopularnije",
    features: ["Sve iz Starter plana", "Sve iz Web Presence plana", "Prioritetna podrška"],
  },
  growth_yearly: {
    name: "Growth Godišnje",
    price: "29.999",
    period: "godišnje",
    billingInterval: "YEAR",
    badge: "Ušteda 17%",
    features: ["Sve iz Growth plana", "Godišnja naplata", "2 meseca besplatno"],
  },
} as const;

/**
 * Get billing interval from plan tier
 */
export function getBillingIntervalFromPlan(plan: PlanTier): BillingInterval {
  return PRICING_CONFIG[plan].billingInterval;
}
