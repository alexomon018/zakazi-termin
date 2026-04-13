import { test as base } from "@playwright/test";
import { type BillingInterval, PrismaClient, type SubscriptionStatus } from "@salonko/prisma";

// Plan tier type matching the 4-plan model
export type PlanTier = "starter" | "growth" | "growth_yearly" | "web_presence";

export interface SubscriptionFixture {
  /**
   * Create a trial subscription for a user
   */
  createWithTrial: (userId: string, options?: { daysRemaining?: number }) => Promise<string>;

  /**
   * Create an active paid subscription for a user
   */
  createWithActiveSubscription: (
    userId: string,
    options?: {
      planTier?: PlanTier;
      /** @deprecated Use planTier instead. Kept for backwards compatibility. */
      interval?: "monthly" | "yearly";
      canceledAtPeriodEnd?: boolean;
    }
  ) => Promise<string>;

  /**
   * Expire a user's trial subscription
   */
  expireTrial: (userId: string) => Promise<void>;

  /**
   * Mark a subscription as canceled at period end
   */
  markCanceled: (userId: string) => Promise<void>;

  /**
   * Resume a canceled subscription
   */
  resumeSubscription: (userId: string) => Promise<void>;

  /**
   * Update subscription plan tier (for testing plan changes)
   */
  updatePlanTier: (userId: string, planTier: PlanTier) => Promise<void>;

  /**
   * Update subscription billing interval (for testing upgrade/downgrade)
   * @deprecated Use updatePlanTier instead
   */
  updateBillingInterval: (userId: string, interval: "monthly" | "yearly") => Promise<void>;

  /**
   * Get subscription for a user
   */
  getSubscription: (userId: string) => Promise<{
    id: string;
    status: SubscriptionStatus;
    billingInterval: BillingInterval | null;
    cancelAtPeriodEnd: boolean;
    stripePriceId: string | null;
  } | null>;

  /**
   * Delete subscription for a user (for cleanup)
   */
  deleteSubscription: (userId: string) => Promise<void>;
}

export type SubscriptionFixtureType = {
  subscription: SubscriptionFixture;
};

// Shared Prisma instance
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

// Generate unique IDs using random component to avoid collisions across parallel workers
function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateStripeCustomerId(): string {
  return `cus_test_${generateUniqueId()}`;
}

function generateStripeSubscriptionId(): string {
  return `sub_test_${generateUniqueId()}`;
}

function generateStripePriceId(interval: "monthly" | "yearly"): string {
  return interval === "monthly" ? "price_test_monthly" : "price_test_yearly";
}

/**
 * Generate a test Stripe price ID for a plan tier
 */
function generateStripePriceIdForPlan(planTier: PlanTier): string {
  return `price_test_${planTier}`;
}

/**
 * Get billing interval from plan tier
 */
function getBillingIntervalFromPlanTier(planTier: PlanTier): BillingInterval {
  return planTier === "growth_yearly" ? "YEAR" : "MONTH";
}

export const test = base.extend<SubscriptionFixtureType>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring syntax
  subscription: async ({}, use) => {
    const prisma = getPrismaClient();

    const subscriptionFixture: SubscriptionFixture = {
      createWithTrial: async (userId: string, options?: { daysRemaining?: number }) => {
        const daysRemaining = options?.daysRemaining ?? 30;
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);

        const subscription = await prisma.subscription.create({
          data: {
            userId,
            stripeCustomerId: generateStripeCustomerId(),
            status: "TRIALING",
            trialStartedAt: now,
            trialEndsAt,
          },
        });

        return subscription.id;
      },

      createWithActiveSubscription: async (
        userId: string,
        options?: {
          planTier?: PlanTier;
          /** @deprecated Use planTier instead */
          interval?: "monthly" | "yearly";
          canceledAtPeriodEnd?: boolean;
        }
      ) => {
        const canceledAtPeriodEnd = options?.canceledAtPeriodEnd ?? false;

        // Support both new planTier and legacy interval options
        let billingInterval: BillingInterval;
        let stripePriceId: string;

        if (options?.planTier) {
          // New 4-plan model
          billingInterval = getBillingIntervalFromPlanTier(options.planTier);
          stripePriceId = generateStripePriceIdForPlan(options.planTier);
        } else {
          // Legacy monthly/yearly model (backwards compatibility)
          const interval = options?.interval ?? "monthly";
          billingInterval = interval === "monthly" ? "MONTH" : "YEAR";
          stripePriceId = generateStripePriceId(interval);
        }

        const now = new Date();
        const periodEnd = new Date(
          now.getTime() + (billingInterval === "MONTH" ? 30 : 365) * 24 * 60 * 60 * 1000
        );

        const subscription = await prisma.subscription.create({
          data: {
            userId,
            stripeCustomerId: generateStripeCustomerId(),
            stripeSubscriptionId: generateStripeSubscriptionId(),
            stripePriceId,
            status: "ACTIVE",
            billingInterval,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: canceledAtPeriodEnd,
            canceledAt: canceledAtPeriodEnd ? now : null,
          },
        });

        return subscription.id;
      },

      expireTrial: async (userId: string) => {
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: "EXPIRED",
            trialEndsAt: new Date(Date.now() - 1000), // Set to past
          },
        });
      },

      markCanceled: async (userId: string) => {
        await prisma.subscription.update({
          where: { userId },
          data: {
            cancelAtPeriodEnd: true,
            canceledAt: new Date(),
          },
        });
      },

      resumeSubscription: async (userId: string) => {
        await prisma.subscription.update({
          where: { userId },
          data: {
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
        });
      },

      updatePlanTier: async (userId: string, planTier: PlanTier) => {
        await prisma.subscription.update({
          where: { userId },
          data: {
            billingInterval: getBillingIntervalFromPlanTier(planTier),
            stripePriceId: generateStripePriceIdForPlan(planTier),
          },
        });
      },

      updateBillingInterval: async (userId: string, interval: "monthly" | "yearly") => {
        await prisma.subscription.update({
          where: { userId },
          data: {
            billingInterval: interval === "monthly" ? "MONTH" : "YEAR",
            stripePriceId: generateStripePriceId(interval),
          },
        });
      },

      getSubscription: async (userId: string) => {
        const subscription = await prisma.subscription.findUnique({
          where: { userId },
          select: {
            id: true,
            status: true,
            billingInterval: true,
            cancelAtPeriodEnd: true,
            stripePriceId: true,
          },
        });

        return subscription;
      },

      deleteSubscription: async (userId: string) => {
        await prisma.subscription
          .delete({
            where: { userId },
          })
          .catch(() => {
            // Ignore if subscription doesn't exist
          });
      },
    };

    await use(subscriptionFixture);
  },
});
