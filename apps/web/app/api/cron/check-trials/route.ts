import { getAppUrl, logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

// Secret to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = getAppUrl();

// Dunning schedule: days after first payment failure to send follow-up emails
const DUNNING_SCHEDULE_DAYS = [3, 7, 14]; // Day 1 is sent immediately via webhook

/**
 * Trial Expiration & Dunning Cron Job
 *
 * This endpoint should be called daily (e.g., via Vercel Cron or external cron service)
 * to:
 * 1. Expire stale trials (status: TRIALING but trialEndsAt has passed)
 * 2. Send reminder emails (3 days before trial ends)
 * 3. Handle multi-touch dunning for past_due subscriptions
 *
 * To set up with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-trials",
 *     "schedule": "0 9 * * *"  // Daily at 9 AM UTC
 *   }]
 * }
 *
 * Or call externally with:
 * curl -X POST https://yourdomain.com/api/cron/check-trials \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(req: Request) {
  // Verify authorization - FAIL CLOSED if secret not configured
  if (!CRON_SECRET) {
    logger.error("CRON_SECRET not configured - cron endpoint disabled for security");
    return NextResponse.json({ error: "Cron endpoint not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  // Extract Bearer token more explicitly to handle malformed headers
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token || token !== CRON_SECRET) {
    logger.warn("Unauthorized cron attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const results = {
    expiredTrials: 0,
    trialReminders: 0,
    dunningEmails: 0,
    emailsSent: 0,
    emailsFailed: 0,
  };

  try {
    // =========================================================================
    // 1. EXPIRE TRIALS - Update status first, then send email (non-blocking)
    // Note: Email is sent after status update. If email fails, status is still updated.
    // =========================================================================
    const justExpiredTrials = await prisma.subscription.findMany({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          lt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            salonName: true,
          },
        },
      },
    });

    // Process each expired trial in a transaction
    for (const subscription of justExpiredTrials) {
      try {
        // Update status first, then send email
        // If email fails, we still want the status updated
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "EXPIRED" },
        });

        results.expiredTrials++;

        // Send email after status update (non-blocking)
        try {
          await emailService.sendSubscriptionExpiredEmail({
            userEmail: subscription.user.email,
            userName: subscription.user.name || "Korisniče",
            salonName: subscription.user.salonName,
            billingUrl: `${APP_URL}/dashboard/settings/billing`,
          });
          results.emailsSent++;
          logger.info("Subscription expired email sent", {
            userId: subscription.user.id,
          });
        } catch (emailError) {
          results.emailsFailed++;
          logger.error("Failed to send subscription expired email", {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            userId: subscription.user.id,
          });
        }
      } catch (updateError) {
        logger.error("Failed to expire trial", {
          error: updateError instanceof Error ? updateError.message : String(updateError),
          subscriptionId: subscription.id,
        });
      }
    }

    logger.info("Expired stale trials", { count: results.expiredTrials });

    // =========================================================================
    // 2. TRIAL ENDING REMINDERS - Only send if not already sent
    // =========================================================================
    const threeDaysFromNowStart = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);
    const threeDaysFromNowEnd = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);

    const trialsEndingSoon = await prisma.subscription.findMany({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: threeDaysFromNowStart,
          lte: threeDaysFromNowEnd,
        },
        // Only get subscriptions that haven't received a reminder
        lastReminderSentAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            salonName: true,
          },
        },
      },
    });

    logger.info("Trials ending in ~3 days (sending reminder)", {
      count: trialsEndingSoon.length,
    });

    for (const subscription of trialsEndingSoon) {
      // Defensive check: trialEndsAt should be non-null based on query filter, but verify
      if (!subscription.trialEndsAt) {
        logger.warn("Subscription has null trialEndsAt despite query filter", {
          subscriptionId: subscription.id,
        });
        continue;
      }

      const daysRemaining = Math.ceil(
        (subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { lastReminderSentAt: now },
      });

      try {
        await emailService.sendTrialEndingEmail({
          userEmail: subscription.user.email,
          userName: subscription.user.name || "Korisniče",
          salonName: subscription.user.salonName,
          daysRemaining,
          billingUrl: `${APP_URL}/dashboard/settings/billing`,
        });

        results.emailsSent++;
        results.trialReminders++;
        logger.info("Trial ending reminder email sent", {
          userId: subscription.user.id,
          daysRemaining,
        });
      } catch (emailError) {
        results.emailsFailed++;
        logger.error("Failed to send trial ending email", {
          error: emailError instanceof Error ? emailError.message : String(emailError),
          userId: subscription.user.id,
        });
      }
    }

    // =========================================================================
    // 3. MULTI-TOUCH DUNNING SEQUENCE for past_due subscriptions
    // =========================================================================
    // Find subscriptions that need dunning emails based on schedule
    const pastDueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "PAST_DUE",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            salonName: true,
          },
        },
      },
    });

    logger.info("Checking dunning for past_due subscriptions", {
      count: pastDueSubscriptions.length,
    });

    for (const subscription of pastDueSubscriptions) {
      // Calculate days since last dunning email (or since status became PAST_DUE)
      const lastEmailDate = subscription.lastDunningEmailAt || subscription.updatedAt;
      const daysSinceLastEmail = Math.floor(
        (now.getTime() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if we should send the next dunning email
      const emailCount = subscription.dunningEmailCount || 0;

      // Day 1 email is sent immediately via webhook, so we start at index 0 for day 3
      const nextDunningDay = DUNNING_SCHEDULE_DAYS[emailCount];

      if (nextDunningDay && daysSinceLastEmail >= nextDunningDay) {
        try {
          // Send dunning email
          await emailService.sendPaymentFailedEmail({
            userEmail: subscription.user.email,
            userName: subscription.user.name || "Korisniče",
            salonName: subscription.user.salonName,
            billingPortalUrl: `${APP_URL}/dashboard/settings/billing`,
          });

          // Update dunning tracking
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              lastDunningEmailAt: now,
              dunningEmailCount: emailCount + 1,
            },
          });

          results.emailsSent++;
          results.dunningEmails++;
          logger.info("Dunning email sent", {
            userId: subscription.user.id,
            emailNumber: emailCount + 2, // +2 because first email is #1 via webhook
            daysSinceLastEmail,
          });
        } catch (emailError) {
          results.emailsFailed++;
          logger.error("Failed to send dunning email", {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            userId: subscription.user.id,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err) {
    logger.error("Cron job failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

// Also support GET for Vercel Cron (it uses GET by default)
export async function GET(req: Request) {
  return POST(req);
}
