import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import type { Subscription } from "@salonko/prisma";
import { protectedProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import Stripe from "stripe";
import { z } from "zod";

import { assertValidSubscriptionData } from "../lib/subscription-validation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://salonko.rs";

// Environment variable validation
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
} as const;

/**
 * Verifies that all required Stripe environment variables are set and throws if any are missing.
 *
 * @throws TRPCError with code `"INTERNAL_SERVER_ERROR"` and message `"Stripe not configured: missing <VAR_NAME>"` when a required environment variable is not defined.
 */
function validateStripeConfig() {
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Stripe not configured: missing ${key}`,
      });
    }
  }
}

const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Lock Stripe API version to prevent breaking changes
  maxNetworkRetries: 2, // Add retry logic for transient network issues
});

const TRIAL_PERIOD_MINUTES = Number.parseInt(process.env.TRIAL_PERIOD_MINUTES || "43200", 10); // Default 30 days
const TRIAL_DAYS = Math.ceil(TRIAL_PERIOD_MINUTES / (60 * 24));
const PRICES = {
  monthly: requiredEnvVars.STRIPE_PRICE_MONTHLY,
  yearly: requiredEnvVars.STRIPE_PRICE_YEARLY,
};

// Distributed rate limiting using Upstash Redis (serverless-compatible)
// Falls back to allowing requests if Redis is not configured (development)
let checkoutRateLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  checkoutRateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 checkout sessions per hour
    prefix: "@salonko/checkout-ratelimit",
    ephemeralCache: new Map(), // Local cache for better performance
  });
}

/**
 * Checks whether the user is allowed to initiate a checkout according to the configured rate limiter.
 *
 * @param userId - The user ID to use as the rate-limit key
 * @returns `true` if the user is within the allowed rate (checkout permitted), `false` otherwise.
 */
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
 * Determine trial progress and remaining time for a subscription.
 *
 * @param subscription - The subscription record to evaluate, or `null` if none exists.
 * @returns An object with:
 *  - `isInTrial`: `true` if the subscription is currently in a trial period, `false` otherwise.
 *  - `trialDaysRemaining`: Whole days remaining until the trial end (0 when not in trial or if expired).
 *  - `trialExpired`: `true` if the subscription had a trial that has ended or has no trial end timestamp, `false` otherwise.
 *  - `totalTrialDays`: Total trial length in days; calculated from `trialStartedAt` and `trialEndsAt` when available, otherwise falls back to the configured `TRIAL_DAYS`.
 */
function getTrialStatus(subscription: Subscription | null): {
  isInTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  totalTrialDays: number;
} {
  if (!subscription) {
    return { isInTrial: false, trialDaysRemaining: 0, trialExpired: false, totalTrialDays: 0 };
  }

  if (subscription.status !== "TRIALING") {
    return { isInTrial: false, trialDaysRemaining: 0, trialExpired: false, totalTrialDays: 0 };
  }

  const now = new Date();
  const trialEnd = subscription.trialEndsAt;
  const trialStart = subscription.trialStartedAt;

  // Calculate total trial days from start/end timestamps
  let totalTrialDays = TRIAL_DAYS; // Default fallback
  if (trialStart && trialEnd) {
    totalTrialDays = Math.ceil((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  if (!trialEnd || now > trialEnd) {
    return { isInTrial: false, trialDaysRemaining: 0, trialExpired: true, totalTrialDays };
  }

  // Use Math.floor to match Stripe's calculation (days until trial_end timestamp)
  const daysRemaining = Math.floor((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return {
    isInTrial: true,
    trialDaysRemaining: daysRemaining,
    trialExpired: false,
    totalTrialDays,
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
        totalTrialDays: 0,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingInterval: null,
        needsSubscription: true, // User has never subscribed
      };
    }

    const trialInfo = getTrialStatus(subscription);
    const isActive =
      ["TRIALING", "ACTIVE"].includes(subscription.status) && !trialInfo.trialExpired;
    // User has paid subscription if they have a Stripe subscription ID
    const hasPaidSubscription = !!subscription.stripeSubscriptionId;

    return {
      hasSubscription: true,
      hasPaidSubscription,
      status: subscription.status,
      isActive,
      isInTrial: trialInfo.isInTrial,
      trialDaysRemaining: trialInfo.trialDaysRemaining,
      totalTrialDays: trialInfo.totalTrialDays,
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
   * Uses transaction to atomically check and create subscription.
   * If a race condition causes unique constraint violation, the orphaned
   * Stripe customer is deleted to prevent orphans.
   */
  startTrial: protectedProcedure.mutation(async ({ ctx }) => {
    // Use a transaction to atomically check and create
    // Note: Stripe customer creation happens inside transaction, but if the
    // transaction fails (unique constraint), we must clean up the Stripe customer
    let createdCustomerId: string | null = null;

    try {
      return await ctx.prisma.$transaction(async (tx) => {
        // Check if subscription already exists
        const existing = await tx.subscription.findUnique({
          where: { userId: ctx.session.user.id },
        });

        if (existing) {
          const trialInfo = getTrialStatus(existing);
          return {
            success: true,
            trialEndsAt: existing.trialEndsAt,
            trialDaysRemaining: trialInfo.trialDaysRemaining,
          };
        }

        // Get user details for Stripe customer
        const user = await tx.user.findUnique({
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
        // Track the created customer ID for cleanup if transaction fails
        createdCustomerId = customer.id;

        // Calculate trial end date using minutes for precision
        const trialStartedAt = new Date();
        const trialEndsAt = new Date(Date.now() + TRIAL_PERIOD_MINUTES * 60 * 1000);

        // Validate subscription data before creating
        const subscriptionData = {
          status: "TRIALING" as const,
          trialStartedAt,
          trialEndsAt,
        };
        assertValidSubscriptionData(subscriptionData, "startTrial");

        // Create subscription record
        const subscription = await tx.subscription.create({
          data: {
            userId: ctx.session.user.id,
            stripeCustomerId: customer.id,
            status: "TRIALING",
            trialStartedAt,
            trialEndsAt,
          },
        });

        // Transaction succeeded, clear the cleanup marker
        createdCustomerId = null;

        return {
          success: true,
          trialEndsAt: subscription.trialEndsAt,
          trialDaysRemaining: TRIAL_DAYS,
        };
      });
    } catch (error) {
      // Clean up orphaned Stripe customer if one was created before transaction failed
      if (createdCustomerId) {
        try {
          await stripe.customers.del(createdCustomerId);
          logger.info("Cleaned up orphaned Stripe customer after transaction failure", {
            customerId: createdCustomerId,
          });
        } catch (cleanupError) {
          logger.error("Failed to clean up orphaned Stripe customer", {
            customerId: createdCustomerId,
            error: cleanupError,
          });
        }
      }

      // Handle race condition - if another request created the subscription
      if (error instanceof Error && error.message.includes("Unique constraint failed")) {
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
      if (input.interval === "monthly" && trialInfo.isInTrial && subscription.trialEndsAt) {
        trialEndTimestamp = Math.floor(subscription.trialEndsAt.getTime() / 1000);
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
          logger.error("Failed to send subscription canceled email", {
            error: err,
          });
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

    if (!subscription?.stripeSubscriptionId || !subscription.cancelAtPeriodEnd) {
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