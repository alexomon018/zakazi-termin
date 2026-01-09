import { invalidateSubscriptionCache } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { PrismaClientKnownRequestError } from "@salonko/prisma/generated/client/runtime/library";
import { validateSubscriptionData } from "@salonko/trpc";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://salonko.rs";

// Environment variables - validated at runtime, not module load
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Create Stripe client only if env vars are available
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      maxNetworkRetries: 2,
    })
  : null;

export async function POST(req: Request) {
  // Validate environment variables at runtime - return 500 instead of crashing
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    logger.error("Missing Stripe configuration", {
      hasSecretKey: !!STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
    });
    return NextResponse.json({ error: "Payment service not configured" }, { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("Webhook signature verification failed", { error: err });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Log event for debugging
    logger.info("Stripe webhook received", { type: event.type, id: event.id });

    // Extract customer and subscription IDs from event data
    // Different event types have different structures:
    // - customer.subscription.*: event.data.object.id IS the subscription ID
    // - checkout.session.completed: id is session ID, subscription field has subscription ID
    // - invoice.*: id is invoice ID, subscription field has subscription ID
    const eventData = event.data.object as {
      customer?: string;
      id?: string;
      subscription?: string;
    };
    const customerId = eventData.customer;

    // Correctly extract subscription ID based on event type
    let stripeSubscriptionId: string | null = null;
    if (event.type.startsWith("customer.subscription.")) {
      // For subscription events, the object ID is the subscription ID
      stripeSubscriptionId = eventData.id || null;
    } else if (eventData.subscription) {
      // For checkout/invoice events, use the subscription field
      stripeSubscriptionId = eventData.subscription;
    }

    // Find the related subscription with improved lookup logic:
    // 1. First prefer exact match by stripeSubscriptionId when available
    // 2. Otherwise fall back to matching by stripeCustomerId only
    let subscription = null;
    if (stripeSubscriptionId) {
      subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
      });
    }
    if (!subscription && customerId) {
      subscription = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });
    }

    // If no subscription record exists (e.g., first checkout.session.completed),
    // create or upsert a minimal subscription/idempotency record
    if (!subscription && customerId) {
      try {
        // Retrieve customer from Stripe to get userId from metadata
        const stripeCustomer = await stripe.customers.retrieve(customerId);
        if (stripeCustomer.deleted) {
          logger.warn("Stripe customer is deleted, cannot create subscription record", {
            customerId,
            eventId: event.id,
          });
        } else {
          const userId = (stripeCustomer as Stripe.Customer).metadata?.userId;
          if (!userId) {
            logger.warn(
              "Stripe customer missing userId in metadata, cannot create subscription record",
              {
                customerId,
                eventId: event.id,
              }
            );
          } else {
            // Create minimal subscription record for idempotency and event tracking
            // Note: Initial status is set to "TRIALING" as a placeholder. The actual status
            // will be updated by handleCheckoutCompleted or other event handlers based on
            // the actual Stripe subscription status (e.g., "trialing" vs "active").
            subscription = await prisma.subscription.upsert({
              where: { stripeCustomerId: customerId },
              create: {
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: stripeSubscriptionId,
                status: "TRIALING",
              },
              update: {
                // If record exists but we're here, ensure subscriptionId is set if provided
                ...(stripeSubscriptionId && { stripeSubscriptionId }),
              },
            });
            logger.info("Created minimal subscription record for webhook event", {
              customerId,
              stripeSubscriptionId,
              eventId: event.id,
            });
          }
        }
      } catch (stripeErr) {
        logger.error("Failed to retrieve Stripe customer for subscription creation", {
          error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
          customerId,
          eventId: event.id,
        });
        // Continue without subscription - event handlers may still work
      }
    }

    // IDEMPOTENCY: Try to insert the event FIRST using a transaction
    // This prevents race conditions where two webhook deliveries both pass the check
    if (subscription) {
      try {
        await prisma.subscriptionEvent.create({
          data: {
            subscriptionId: subscription.id,
            stripeEventId: event.id,
            eventType: event.type,
            eventData: event.data.object as object,
          },
        });
      } catch (createErr) {
        // If unique constraint violation, event was already processed
        if (createErr instanceof PrismaClientKnownRequestError && createErr.code === "P2002") {
          logger.info("Event already processed (duplicate), skipping", {
            eventId: event.id,
            eventType: event.type,
          });
          return NextResponse.json({ received: true, skipped: true });
        }
        // Re-throw other errors
        throw createErr;
      }
    } else {
      logger.warn("No subscription record found or created for webhook event", {
        eventType: event.type,
        eventId: event.id,
        customerId,
        stripeSubscriptionId,
      });
    }

    // Process the event (we've already claimed it via the insert above)
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info("Unhandled webhook event", { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Distinguish between retriable and non-retriable errors
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        // Record not found - don't retry, acknowledge the event
        logger.warn("Subscription not found for webhook event, acknowledging", {
          eventType: event.type,
          eventId: event.id,
          error: err.message,
        });
        return NextResponse.json({
          received: true,
          warning: "subscription_not_found",
        });
      }
      if (err.code === "P2002") {
        // Unique constraint violation (duplicate event) - don't retry
        logger.warn("Duplicate event detected", { eventId: event.id });
        return NextResponse.json({ received: true, skipped: true });
      }
    }

    // For all other errors, return 500 to allow Stripe to retry
    logger.error("Webhook processing failed", {
      error: err instanceof Error ? err.message : String(err),
      eventType: event.type,
      eventId: event.id,
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Fetch the actual subscription from Stripe to get its status
  // (it might be "trialing" if user subscribed during their free trial)
  const stripeSubscription = await stripe!.subscriptions.retrieve(subscriptionId);

  // Map Stripe status to our status
  const statusMap: Record<string, "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED"> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "EXPIRED",
    incomplete_expired: "EXPIRED",
    unpaid: "PAST_DUE",
  };

  const interval = stripeSubscription.items.data[0]?.price.recurring?.interval;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const status = statusMap[stripeSubscription.status] || "ACTIVE";
  const billingInterval = interval === "year" ? "YEAR" : "MONTH";

  // Access period dates from the subscription item (Stripe SDK v20+)
  const subscriptionItem = stripeSubscription.items.data[0];
  const periodStart = subscriptionItem?.current_period_start;
  const periodEnd = subscriptionItem?.current_period_end;

  // Extract trial dates from Stripe subscription (if in trial)
  const trialStart = stripeSubscription.trial_start;
  const trialEnd = stripeSubscription.trial_end;
  const trialStartedAt = trialStart ? new Date(trialStart * 1000) : null;
  const trialEndsAt = trialEnd ? new Date(trialEnd * 1000) : null;

  // Validate subscription data before updating
  const validation = validateSubscriptionData({
    status,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    billingInterval,
    trialStartedAt,
    trialEndsAt,
  });

  if (!validation.valid) {
    logger.error("Invalid subscription data in checkout.completed", {
      customerId,
      subscriptionId,
      status,
      errors: validation.errors,
    });
    throw new Error(`Invalid subscription data: ${validation.errors.join(", ")}`);
  }

  const updatedSub = await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      billingInterval,
      status,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      trialStartedAt,
      trialEndsAt,
    },
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

  // Invalidate subscription cache to ensure fresh status on next auth check
  await invalidateSubscriptionCache(updatedSub.userId);

  // Send subscription success email (only for ACTIVE status, not TRIALING)
  if (status === "ACTIVE") {
    try {
      const planName = billingInterval === "YEAR" ? "Godišnji Pro" : "Mesečni Pro";
      await emailService.sendSubscriptionSuccessEmail({
        userEmail: updatedSub.user.email,
        userName: updatedSub.user.name || "Korisniče",
        salonName: updatedSub.user.salonName,
        planName,
        dashboardUrl: `${APP_URL}/dashboard`,
      });
      logger.info("Subscription success email sent", {
        customerId,
        userId: updatedSub.userId,
      });
    } catch (emailError) {
      logger.error("Failed to send subscription success email", {
        error: emailError,
        customerId,
      });
    }
  }
}

async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const interval = stripeSubscription.items.data[0]?.price.recurring?.interval;
  const status = stripeSubscription.status === "trialing" ? "TRIALING" : "ACTIVE";
  const billingInterval = interval === "year" ? "YEAR" : "MONTH";

  // Access period dates from the subscription item (Stripe SDK v20+)
  const subscriptionItem = stripeSubscription.items.data[0];
  const periodStart = subscriptionItem?.current_period_start;
  const periodEnd = subscriptionItem?.current_period_end;

  // Extract trial dates from Stripe subscription (if in trial)
  const trialStart = stripeSubscription.trial_start;
  const trialEnd = stripeSubscription.trial_end;
  const trialStartedAt = trialStart ? new Date(trialStart * 1000) : null;
  const trialEndsAt = trialEnd ? new Date(trialEnd * 1000) : null;

  // Validate subscription data before updating
  const validation = validateSubscriptionData({
    status,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: priceId,
    billingInterval,
    trialStartedAt,
    trialEndsAt,
  });

  if (!validation.valid) {
    logger.error("Invalid subscription data in subscription.created", {
      customerId,
      subscriptionId: stripeSubscription.id,
      status,
      errors: validation.errors,
    });
    throw new Error(`Invalid subscription data: ${validation.errors.join(", ")}`);
  }

  const updatedSub = await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      billingInterval,
      status,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      trialStartedAt,
      trialEndsAt,
    },
  });

  // Invalidate subscription cache to ensure fresh status on next auth check
  await invalidateSubscriptionCache(updatedSub.userId);
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string;

  // Check if subscription exists - handle out-of-order events
  const existing = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!existing) {
    logger.warn("Subscription not found for update, may be out-of-order event", { customerId });
    // If subscription doesn't exist, this might be an out-of-order event
    // We could call handleSubscriptionCreated here, but it's safer to just log and skip
    return;
  }

  // If we don't have a stripeSubscriptionId yet, this update event arrived before creation
  // Handle this case by setting the subscription ID
  if (!existing.stripeSubscriptionId) {
    logger.info("Setting subscription ID from update event (out-of-order)", {
      customerId,
      subscriptionId: stripeSubscription.id,
    });
  }

  const statusMap: Record<string, "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED"> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "EXPIRED",
    incomplete_expired: "EXPIRED",
    unpaid: "PAST_DUE",
  };

  // Access period dates from the subscription item (Stripe SDK v20+)
  const subscriptionItem = stripeSubscription.items.data[0];
  const periodStart = subscriptionItem?.current_period_start;
  const periodEnd = subscriptionItem?.current_period_end;

  // Also update billing interval in case of plan change
  const interval = stripeSubscription.items.data[0]?.price.recurring?.interval;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const status = statusMap[stripeSubscription.status] || "ACTIVE";
  const billingInterval = interval === "year" ? "YEAR" : "MONTH";

  // Extract trial dates from Stripe subscription (if in trial)
  // Use Stripe values if available, otherwise keep existing values
  const trialStart = stripeSubscription.trial_start;
  const trialEnd = stripeSubscription.trial_end;
  const trialStartedAt = trialStart ? new Date(trialStart * 1000) : existing.trialStartedAt;
  const trialEndsAt = trialEnd ? new Date(trialEnd * 1000) : existing.trialEndsAt;

  // Validate subscription data before updating
  const validation = validateSubscriptionData({
    status,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: priceId,
    billingInterval,
    trialStartedAt,
    trialEndsAt,
  });

  if (!validation.valid) {
    logger.error("Invalid subscription data in subscription.updated", {
      customerId,
      subscriptionId: stripeSubscription.id,
      status,
      errors: validation.errors,
    });
    throw new Error(`Invalid subscription data: ${validation.errors.join(", ")}`);
  }

  const updatedSub = await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: stripeSubscription.id, // Set in case of out-of-order
      stripePriceId: priceId,
      billingInterval,
      status,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      trialStartedAt,
      trialEndsAt,
    },
  });

  // Invalidate subscription cache to ensure fresh status on next auth check
  await invalidateSubscriptionCache(updatedSub.userId);
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string;

  const updatedSub = await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      status: "EXPIRED",
      stripeSubscriptionId: null,
    },
  });

  // Invalidate subscription cache to ensure fresh status on next auth check
  await invalidateSubscriptionCache(updatedSub.userId);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Check if this is a subscription invoice
  // In Stripe SDK v20+, subscription is accessed via invoice.parent.subscription_details
  const subscriptionId = invoice.parent?.subscription_details?.subscription ?? null;
  if (!subscriptionId) return;

  const customerId = invoice.customer as string;

  // Fetch existing subscription to validate transition to ACTIVE
  const existing = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!existing) {
    logger.warn("Subscription not found for invoice.payment_succeeded", {
      customerId,
    });
    return;
  }

  // Validate subscription data before updating to ACTIVE
  // ACTIVE status requires stripeSubscriptionId, stripePriceId, and billingInterval
  const validation = validateSubscriptionData({
    status: "ACTIVE",
    stripeSubscriptionId: existing.stripeSubscriptionId,
    stripePriceId: existing.stripePriceId,
    billingInterval: existing.billingInterval,
    trialStartedAt: existing.trialStartedAt,
    trialEndsAt: existing.trialEndsAt,
  });

  if (!validation.valid) {
    logger.error("Invalid subscription data in invoice.payment_succeeded", {
      customerId,
      subscriptionId: existing.stripeSubscriptionId,
      errors: validation.errors,
    });
    throw new Error(`Invalid subscription data: ${validation.errors.join(", ")}`);
  }

  // Check if transitioning from TRIALING to ACTIVE (first payment after trial)
  const wasTrialing = existing.status === "TRIALING";

  const updatedSub = await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: { status: "ACTIVE" },
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

  // Invalidate subscription cache to ensure fresh status on next auth check
  await invalidateSubscriptionCache(updatedSub.userId);

  // Send subscription success email when transitioning from trial to active
  if (wasTrialing) {
    try {
      const planName = existing.billingInterval === "YEAR" ? "Godišnji Pro" : "Mesečni Pro";
      await emailService.sendSubscriptionSuccessEmail({
        userEmail: updatedSub.user.email,
        userName: updatedSub.user.name || "Korisniče",
        salonName: updatedSub.user.salonName,
        planName,
        dashboardUrl: `${APP_URL}/dashboard`,
      });
      logger.info("Subscription success email sent (trial converted)", {
        customerId,
        userId: updatedSub.userId,
      });
    } catch (emailError) {
      logger.error("Failed to send subscription success email", {
        error: emailError,
        customerId,
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Check if this is a subscription invoice
  // In Stripe SDK v20+, subscription is accessed via invoice.parent.subscription_details
  const subscriptionId = invoice.parent?.subscription_details?.subscription ?? null;
  if (!subscriptionId) return;

  const customerId = invoice.customer as string;

  // Fetch existing subscription to validate transition to PAST_DUE
  const existing = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
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

  if (!existing) {
    logger.warn("Subscription not found for invoice.payment_failed", {
      customerId,
    });
    return;
  }

  // Validate subscription data before updating to PAST_DUE
  // PAST_DUE status requires stripeSubscriptionId, stripePriceId, and billingInterval
  const validation = validateSubscriptionData({
    status: "PAST_DUE",
    stripeSubscriptionId: existing.stripeSubscriptionId,
    stripePriceId: existing.stripePriceId,
    billingInterval: existing.billingInterval,
    trialStartedAt: existing.trialStartedAt,
    trialEndsAt: existing.trialEndsAt,
  });

  if (!validation.valid) {
    logger.error("Invalid subscription data in invoice.payment_failed", {
      customerId,
      subscriptionId: existing.stripeSubscriptionId,
      errors: validation.errors,
    });
    throw new Error(`Invalid subscription data: ${validation.errors.join(", ")}`);
  }

  const subscription = await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: { status: "PAST_DUE" },
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

  // Invalidate subscription cache to ensure fresh status on next auth check
  await invalidateSubscriptionCache(subscription.userId);

  // Send payment failed email
  try {
    await emailService.sendPaymentFailedEmail({
      userEmail: subscription.user.email,
      userName: subscription.user.name || "Korisniče",
      salonName: subscription.user.salonName,
      billingPortalUrl: `${APP_URL}/dashboard/settings/billing`,
    });
    logger.info("Payment failed email sent", {
      customerId,
      userId: subscription.userId,
    });
  } catch (emailError) {
    logger.error("Failed to send payment failed email", {
      error: emailError,
      customerId,
    });
  }
}
