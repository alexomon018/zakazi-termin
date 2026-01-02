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
        return NextResponse.json({ received: true, warning: "subscription_not_found" });
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

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscriptionId,
      status: "ACTIVE",
    },
  });
}

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
    logger.info("Payment failed email sent", { customerId, userEmail: subscription.user.email });
  } catch (emailError) {
    logger.error("Failed to send payment failed email", { error: emailError, customerId });
  }
}
