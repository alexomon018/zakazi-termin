import { emailService } from "@salonko/emails";
import type { Subscription } from "@salonko/prisma";
import { protectedProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import Stripe from "stripe";
import { z } from "zod";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://salonko.rs";

// Environment variable validation
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
} as const;

// Validate all required environment variables at module load
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Lock Stripe API version to prevent breaking changes
  maxNetworkRetries: 2, // Add retry logic for transient network issues
});

const TRIAL_PERIOD_MINUTES = parseInt(
  process.env.TRIAL_PERIOD_MINUTES || "43200",
  10
); // Default 30 days
const TRIAL_DAYS = Math.ceil(TRIAL_PERIOD_MINUTES / (60 * 24));
const PRICES = {
  monthly: requiredEnvVars.STRIPE_PRICE_MONTHLY,
  yearly: requiredEnvVars.STRIPE_PRICE_YEARLY,
};

// Distributed rate limiting using Upstash Redis (serverless-compatible)
// Falls back to allowing requests if Redis is not configured (development)
let checkoutRateLimiter: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  checkoutRateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 checkout sessions per hour
    prefix: "@salonko/checkout-ratelimit",
    ephemeralCache: new Map(), // Local cache for better performance
  });
}

async function checkCheckoutRateLimit(userId: string): Promise<boolean> {
  // If rate limiter is not configured, allow all requests (development mode)
  if (!checkoutRateLimiter) {
    return true;
  }

  const identifier = `checkout:${userId}`;
  const { success } = await checkoutRateLimiter.limit(identifier);
  return success;
}

/**
 * Helper to calculate trial status
 */
function getTrialStatus(subscription: Subscription | null): {
  isInTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
} {
  if (!subscription) {
    return { isInTrial: false, trialDaysRemaining: 0, trialExpired: false };
  }

  if (subscription.status !== "TRIALING") {
    return { isInTrial: false, trialDaysRemaining: 0, trialExpired: false };
  }

  const now = new Date();
  const trialEnd = subscription.trialEndsAt;

  if (!trialEnd || now > trialEnd) {
    return { isInTrial: false, trialDaysRemaining: 0, trialExpired: true };
  }

  // Use Math.floor to match Stripe's calculation (days until trial_end timestamp)
  const daysRemaining = Math.floor(
    (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return {
    isInTrial: true,
    trialDaysRemaining: daysRemaining,
    trialExpired: false,
  };
}

export const subscriptionRouter = router({
  /**
   * Get current subscription status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        hasPaidSubscription: false,
        status: null,
        isActive: false,
        isInTrial: false,
        trialDaysRemaining: 0,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingInterval: null,
        needsSubscription: true, // User has never subscribed
      };
    }

    const trialInfo = getTrialStatus(subscription);
    const isActive =
      ["TRIALING", "ACTIVE"].includes(subscription.status) &&
      !trialInfo.trialExpired;
    // User has paid subscription if they have a Stripe subscription ID
    const hasPaidSubscription = !!subscription.stripeSubscriptionId;

    return {
      hasSubscription: true,
      hasPaidSubscription,
      status: subscription.status,
      isActive,
      isInTrial: trialInfo.isInTrial,
      trialDaysRemaining: trialInfo.trialDaysRemaining,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      billingInterval: subscription.billingInterval,
      needsSubscription: false, // User has a subscription record
    };
  }),

  /**
   * Start free trial - creates Stripe customer and subscription record
   * Called on first dashboard visit
   * Uses upsert to handle race conditions from concurrent requests
   */
  startTrial: protectedProcedure.mutation(async ({ ctx }) => {
    // Check if subscription already exists first
    const existingSubscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    // If subscription already exists, return success with existing data
    if (existingSubscription) {
      const trialInfo = getTrialStatus(existingSubscription);
      return {
        success: true,
        trialEndsAt: existingSubscription.trialEndsAt,
        trialDaysRemaining: trialInfo.trialDaysRemaining,
      };
    }

    // Get user details for Stripe customer
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Korisnik nije pronađen.",
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: String(ctx.session.user.id),
        salonName: user.salonName || "",
      },
    });

    // Calculate trial end date using minutes for precision
    const trialEndsAt = new Date(Date.now() + TRIAL_PERIOD_MINUTES * 60 * 1000);

    try {
      // Create subscription record
      const subscription = await ctx.prisma.subscription.create({
        data: {
          userId: ctx.session.user.id,
          stripeCustomerId: customer.id,
          status: "TRIALING",
          trialStartedAt: new Date(),
          trialEndsAt,
        },
      });

      return {
        success: true,
        trialEndsAt: subscription.trialEndsAt,
        trialDaysRemaining: TRIAL_DAYS,
      };
    } catch (error) {
      // Handle race condition - if another request created the subscription
      // while we were creating the Stripe customer, return the existing one
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint failed")
      ) {
        const existingSub = await ctx.prisma.subscription.findUnique({
          where: { userId: ctx.session.user.id },
        });
        if (existingSub) {
          const trialInfo = getTrialStatus(existingSub);
          return {
            success: true,
            trialEndsAt: existingSub.trialEndsAt,
            trialDaysRemaining: trialInfo.trialDaysRemaining,
          };
        }
      }
      throw error;
    }
  }),

  /**
   * Create Stripe Checkout session for subscription
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        interval: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting check (async for distributed rate limiting)
      const isAllowed = await checkCheckoutRateLimit(ctx.session.user.id);
      if (!isAllowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Previše zahteva. Pokušajte ponovo za sat vremena.",
        });
      }

      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Morate prvo započeti probni period.",
        });
      }

      // Calculate trial end for Stripe
      // Monthly: If user is in trial, delay billing until trial ends
      // Yearly: Charge immediately (discount of 2 months is already applied in price)
      // If trial expired, omit trial_end to charge immediately
      const trialInfo = getTrialStatus(subscription);
      let trialEndTimestamp: number | null = null;

      // Only apply remaining trial for monthly subscriptions
      if (
        input.interval === "monthly" &&
        trialInfo.isInTrial &&
        subscription.trialEndsAt
      ) {
        trialEndTimestamp = Math.floor(
          subscription.trialEndsAt.getTime() / 1000
        );
      }
      // Yearly subscriptions charge immediately (no trial_end)

      const session = await stripe.checkout.sessions.create({
        customer: subscription.stripeCustomerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: PRICES[input.interval],
            quantity: 1,
          },
        ],
        subscription_data: {
          // Include trial_end only if user is in trial, otherwise omit to charge immediately
          ...(trialEndTimestamp !== null && { trial_end: trialEndTimestamp }),
          metadata: {
            userId: String(ctx.session.user.id),
          },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
        metadata: {
          userId: String(ctx.session.user.id),
        },
      });

      return { url: session.url };
    }),

  /**
   * Create Stripe billing portal session for managing subscription
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nemate aktivnu pretplatu.",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });

    return { url: session.url };
  }),

  /**
   * Cancel subscription at period end
   * Uses rollback pattern to ensure Stripe and DB stay in sync
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            salonName: true,
          },
        },
      },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nemate aktivnu pretplatu za otkazivanje.",
      });
    }

    // Cancel at period end in Stripe first
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record - if this fails, rollback Stripe change
    try {
      await ctx.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
        },
      });
    } catch (dbError) {
      // Rollback Stripe change to maintain consistency
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Došlo je do greške. Pokušajte ponovo.",
      });
    }

    // Send cancellation confirmation email (don't block on failure)
    if (subscription.currentPeriodEnd) {
      emailService
        .sendSubscriptionCanceledEmail({
          userEmail: subscription.user.email,
          userName: subscription.user.name || "Korisniče",
          salonName: subscription.user.salonName,
          currentPeriodEnd: subscription.currentPeriodEnd,
          resumeUrl: `${APP_URL}/dashboard/settings/billing`,
        })
        .catch((err) => {
          // Log but don't fail the mutation
          console.error("Failed to send subscription canceled email", err);
        });
    }

    return { success: true };
  }),

  /**
   * Resume a canceled subscription
   * Uses rollback pattern to ensure Stripe and DB stay in sync
   */
  resume: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (
      !subscription?.stripeSubscriptionId ||
      !subscription.cancelAtPeriodEnd
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nema pretplate za nastavak.",
      });
    }

    // Resume in Stripe first
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update local record - if this fails, rollback Stripe change
    try {
      await ctx.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });
    } catch (dbError) {
      // Rollback Stripe change to maintain consistency
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Došlo je do greške. Pokušajte ponovo.",
      });
    }

    return { success: true };
  }),

  /**
   * Get invoice history from Stripe
   */
  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return { invoices: [] };
    }

    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 24,
    });

    return {
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        created: inv.created,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
        periodStart: inv.lines.data[0]?.period?.start ?? null,
        periodEnd: inv.lines.data[0]?.period?.end ?? null,
      })),
    };
  }),
});
