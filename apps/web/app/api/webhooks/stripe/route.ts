import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { PrismaClientKnownRequestError } from "@salonko/prisma/generated/client/runtime/library";
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

/**
 * Handle incoming Stripe webhook requests related to subscriptions and invoices.
 *
 * Processes and verifies the webhook signature, records events idempotently, updates local subscription state (status, billing interval, periods, cancellation), and triggers side effects such as sending payment-failed notifications when applicable.
 *
 * @returns A JSON response acknowledging processing. Possible responses:
 * - `{ received: true }` when processed successfully
 * - `{ received: true, skipped: true }` when the event was already handled (duplicate)
 * - `{ received: true, warning: "subscription_not_found" }` when no matching subscription was found
 * - `{ error: string }` with an appropriate HTTP status for missing/invalid signature or server errors
 */
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

    // Find the related subscription first (needed for event storage)
    const eventData = event.data.object as { customer?: string; id?: string };
    const subscription = await prisma.subscription.findFirst({
      where: {
        OR: [
          { stripeCustomerId: eventData.customer ?? "" },
          { stripeSubscriptionId: eventData.id ?? "" },
        ],
      },
    });

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

/**
 * Update the local subscription record when a Stripe Checkout session completed for a subscription.
 *
 * Retrieves the Stripe subscription referenced by the session and updates the corresponding
 * local subscription (matched by `stripeCustomerId`) with the Stripe subscription ID, price ID,
 * billing interval, mapped status, and current period start/end timestamps.
 *
 * @param session - The Stripe Checkout Session object for a completed subscription checkout
 */
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

  // Access period dates from the subscription object
  const subscriptionData = stripeSubscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const periodStart = subscriptionData.current_period_start;
  const periodEnd = subscriptionData.current_period_end;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      billingInterval: interval === "year" ? "YEAR" : "MONTH",
      status: statusMap[stripeSubscription.status] || "ACTIVE",
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

/**
 * Apply a newly created Stripe subscription to the corresponding local subscription record.
 *
 * Updates the local subscription identified by the Stripe customer ID with the Stripe subscription ID, price ID, billing interval (`YEAR` or `MONTH`), mapped status (`TRIALING` when Stripe status is `"trialing"`, otherwise `ACTIVE`), and current period start/end converted from epoch seconds when present.
 *
 * @param stripeSubscription - The Stripe subscription object received from the webhook
 */
async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const interval = stripeSubscription.items.data[0]?.price.recurring?.interval;

  // Access period dates from the subscription object
  // In Stripe SDK v20+, these are accessed via type assertion
  const subscriptionData = stripeSubscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const periodStart = subscriptionData.current_period_start;
  const periodEnd = subscriptionData.current_period_end;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      billingInterval: interval === "year" ? "YEAR" : "MONTH",
      status: stripeSubscription.status === "trialing" ? "TRIALING" : "ACTIVE",
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

/**
 * Update the local subscription record to reflect changes from a Stripe subscription update.
 *
 * If the local subscription cannot be found the function logs a warning and returns (handles out-of-order events).
 * Maps Stripe status values to internal status enums and updates fields including `stripeSubscriptionId`, `stripePriceId`,
 * `billingInterval`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, and `canceledAt`.
 *
 * @param stripeSubscription - The Stripe.Subscription object containing the updated subscription data
 */
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

  // Access period dates from the subscription object
  // In Stripe SDK v20+, these are accessed via type assertion
  const subscriptionData = stripeSubscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const periodStart = subscriptionData.current_period_start;
  const periodEnd = subscriptionData.current_period_end;

  // Also update billing interval in case of plan change
  const interval = stripeSubscription.items.data[0]?.price.recurring?.interval;
  const priceId = stripeSubscription.items.data[0]?.price.id;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: stripeSubscription.id, // Set in case of out-of-order
      stripePriceId: priceId,
      billingInterval: interval === "year" ? "YEAR" : "MONTH",
      status: statusMap[stripeSubscription.status] || "ACTIVE",
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
    },
  });
}

/**
 * Mark the local subscription for the Stripe customer as expired and clear its Stripe subscription ID.
 *
 * @param stripeSubscription - The Stripe Subscription object from the webhook; its `customer` field is used as the Stripe customer ID to locate the local subscription
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      status: "EXPIRED",
      stripeSubscriptionId: null,
    },
  });
}

/**
 * Marks the local subscription tied to the given Stripe invoice as ACTIVE.
 *
 * If the invoice is not associated with a Stripe subscription, no action is taken.
 *
 * @param invoice - The Stripe invoice object containing the customer and, if present, the subscription id.
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Check if this is a subscription invoice
  // In Stripe SDK v20+, subscription is accessed via type assertion
  const invoiceData = invoice as unknown as { subscription?: string | null };
  const subscriptionId = invoiceData.subscription;
  if (!subscriptionId) return;

  const customerId = invoice.customer as string;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: { status: "ACTIVE" },
  });
}

/**
 * Handle a failed invoice payment by marking the related subscription as past due and notifying the subscriber.
 *
 * If the invoice is tied to a subscription, update the local subscription (looked up by the invoice's customer ID) to status `PAST_DUE` and send a payment-failed email to the subscription's user; if the invoice has no subscription, the function returns without action.
 *
 * @param invoice - The Stripe invoice object for which payment failed; used to extract the subscription and customer identifiers
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Check if this is a subscription invoice
  // In Stripe SDK v20+, subscription is accessed via type assertion
  const invoiceData = invoice as unknown as { subscription?: string | null };
  const subscriptionId = invoiceData.subscription;
  if (!subscriptionId) return;

  const customerId = invoice.customer as string;

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
      userEmail: subscription.user.email,
    });
  } catch (emailError) {
    logger.error("Failed to send payment failed email", {
      error: emailError,
      customerId,
    });
  }
}