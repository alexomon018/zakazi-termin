import { buildUnsubscribeUrl } from "@/app/api/email/unsubscribe/route";
import { getAppUrl, logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

// Secret to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = getAppUrl();

// Dunning schedule: days after first payment failure to send follow-up emails
const DUNNING_SCHEDULE_DAYS = [3, 7, 14]; // Day 1 is sent immediately via webhook

// Inactivity threshold: days since last login before sending re-engagement email
const INACTIVITY_THRESHOLD_DAYS = 7;

// Education drip sequence: spaced across ~1 month
const EDUCATION_SEQUENCE = [
  {
    emailKey: "education_services",
    daysAfterSignup: 3,
    subject: "Kreirajte svoju prvu uslugu",
    featureTitle: "Kreirajte svoju prvu uslugu",
    featureDescription:
      "Definišite usluge koje nudite u svom salonu — od šišanja do farbanja. Svaka usluga ima svoj naziv, trajanje i opis koji klijenti vide pri zakazivanju.",
    helpPath: "/help/pocetak/prvi-tip-dogadjaja",
    ctaText: "Kreirajte uslugu",
    ctaPath: "/dashboard/event-types",
    skipCheck: "hasEventTypes" as const,
  },
  {
    emailKey: "education_availability",
    daysAfterSignup: 8,
    subject: "Podesite radno vreme",
    featureTitle: "Podesite radno vreme salona",
    featureDescription:
      "Odredite kada ste dostupni za zakazivanje — podesite radne dane, sate i pauze. Klijenti će moći da zakažu termine samo u okviru Vašeg radnog vremena.",
    helpPath: "/help/raspolozivost/radno-vreme",
    ctaText: "Podesite raspored",
    ctaPath: "/dashboard/availability",
    skipCheck: "hasCustomSchedule" as const,
  },
  {
    emailKey: "education_bookings",
    daysAfterSignup: 13,
    subject: "Kako klijenti zakazuju termine",
    featureTitle: "Kako klijenti zakazuju termine",
    featureDescription:
      "Saznajte kako izgleda proces zakazivanja iz perspektive klijenta i kako da upravljate dolazećim rezervacijama u kontrolnoj tabli.",
    helpPath: "/help/zakazivanje/kako-klijenti-zakazuju",
    ctaText: "Pregledajte rezervacije",
    ctaPath: "/dashboard/bookings",
    skipCheck: "hasBookings" as const,
  },
  {
    emailKey: "education_customization",
    daysAfterSignup: 18,
    subject: "Personalizujte stranicu za zakazivanje",
    featureTitle: "Personalizujte stranicu za zakazivanje",
    featureDescription:
      "Prilagodite izgled stranice za zakazivanje Vašem brendu — promenite boju, dodajte informacije o salonu i učinite je profesionalnom.",
    helpPath: "/help/personalizacija/prilagodjena-stranica",
    ctaText: "Personalizujte stranicu",
    ctaPath: "/dashboard/settings/appearance",
    skipCheck: "hasCustomBrand" as const,
  },
  {
    emailKey: "education_team",
    daysAfterSignup: 23,
    subject: "Dodajte članove tima",
    featureTitle: "Dodajte članove tima u salon",
    featureDescription:
      "Pozovite zaposlene da koriste Salonko — svaki član tima može imati sopstveni raspored, usluge i pristup kontrolnoj tabli.",
    helpPath: "/help/tim/dodavanje-clanova",
    ctaText: "Dodajte članove",
    ctaPath: "/dashboard/settings/team",
    skipCheck: "hasTeamMembers" as const,
  },
  {
    emailKey: "education_billing",
    daysAfterSignup: 28,
    subject: "Upravljanje pretplatom",
    featureTitle: "Upravljanje pretplatom i plaćanjem",
    featureDescription:
      "Pregledajte planove pretplate, upravljajte plaćanjem i pristupite fakturama. Saznajte sve o opcijama koje su Vam dostupne.",
    helpPath: "/help/placanje/planovi-i-cene",
    ctaText: "Pregledajte pretplatu",
    ctaPath: "/dashboard/settings/billing",
    skipCheck: "hasActiveSubscription" as const,
  },
] as const;

type SkipCheck = (typeof EDUCATION_SEQUENCE)[number]["skipCheck"];

const DEFAULT_BRAND_COLOR = "#292929";

interface DripUserData {
  brandColor: string | null;
  _count: { eventTypes: number; bookings: number; memberships: number };
  schedules: { id: string }[];
  subscription: { status: string } | null;
}

function checkSkipCondition(check: SkipCheck, user: DripUserData): boolean {
  switch (check) {
    case "hasEventTypes":
      return user._count.eventTypes > 0;
    case "hasCustomSchedule":
      return user.schedules.length > 1;
    case "hasBookings":
      return user._count.bookings > 0;
    case "hasCustomBrand":
      return user.brandColor !== null && user.brandColor !== DEFAULT_BRAND_COLOR;
    case "hasTeamMembers":
      return user._count.memberships > 0;
    case "hasActiveSubscription":
      return user.subscription?.status === "ACTIVE";
  }
}

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
    inactivityEmails: 0,
    educationEmails: 0,
    educationSkipped: 0,
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

      try {
        await emailService.sendTrialEndingEmail({
          userEmail: subscription.user.email,
          userName: subscription.user.name || "Korisniče",
          salonName: subscription.user.salonName,
          daysRemaining,
          billingUrl: `${APP_URL}/dashboard/settings/billing`,
        });

        // Only mark as sent after successful email delivery
        // Use conditional update to guard against duplicate reminders if DB update fails
        try {
          await prisma.subscription.update({
            where: { id: subscription.id, lastReminderSentAt: null },
            data: { lastReminderSentAt: now },
          });
        } catch (updateError) {
          logger.error("Failed to mark trial reminder as sent", {
            error: updateError instanceof Error ? updateError.message : String(updateError),
            subscriptionId: subscription.id,
          });
          // Email was sent successfully, but we couldn't mark it - continue to avoid blocking
          // The conditional update (lastReminderSentAt: null) prevents duplicate sends
          continue;
        }

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

    // =========================================================================
    // 4. INACTIVITY RE-ENGAGEMENT EMAILS
    // Send to users who haven't been active for 7+ days (once per inactivity cycle).
    // Uses lastActiveAt (updated on every session use, rate-limited to 1h)
    // with lastLoginAt as fallback for users who signed up before the field existed.
    // =========================================================================
    const inactivityThreshold = new Date(
      now.getTime() - INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
    );

    const inactiveUsers = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        inactivityEmailSentAt: null,
        OR: [
          {
            lastActiveAt: { not: null, lt: inactivityThreshold },
          },
          {
            lastActiveAt: null,
            lastLoginAt: { not: null, lt: inactivityThreshold },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        salonName: true,
      },
    });

    logger.info("Inactive users for re-engagement", { count: inactiveUsers.length });

    for (const user of inactiveUsers) {
      try {
        // Claim delivery atomically before sending — conditional update ensures
        // only one concurrent run can claim a given user.
        const claimed = await prisma.user.updateMany({
          where: { id: user.id, inactivityEmailSentAt: null },
          data: { inactivityEmailSentAt: now },
        });

        if (claimed.count === 0) {
          // Another run already claimed this user — skip to avoid duplicate email
          continue;
        }

        await emailService.sendInactivityEmail({
          userEmail: user.email,
          userName: user.name || "Korisniče",
          salonName: user.salonName,
          dashboardUrl: `${APP_URL}/dashboard`,
        });

        results.emailsSent++;
        results.inactivityEmails++;
        logger.info("Inactivity email sent", { userId: user.id });
      } catch (emailError) {
        results.emailsFailed++;
        logger.error("Failed to send inactivity email", {
          error: emailError instanceof Error ? emailError.message : String(emailError),
          userId: user.id,
        });
      }
    }

    // =========================================================================
    // 5. FEATURE EDUCATION DRIP CAMPAIGN
    // Send educational emails spread across ~1 month after signup
    // =========================================================================
    const oldestDripDay = EDUCATION_SEQUENCE[EDUCATION_SEQUENCE.length - 1].daysAfterSignup;
    const earliestSignup = new Date(now.getTime() - (oldestDripDay + 1) * 24 * 60 * 60 * 1000);
    const minimumAge = new Date(
      now.getTime() - EDUCATION_SEQUENCE[0].daysAfterSignup * 24 * 60 * 60 * 1000
    );

    const dripCandidates = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        educationEmailsOptOut: false,
        createdAt: {
          gte: earliestSignup,
          lte: minimumAge,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        salonName: true,
        createdAt: true,
        brandColor: true,
        _count: {
          select: {
            eventTypes: true,
            bookings: true,
            memberships: true,
          },
        },
        schedules: { select: { id: true } },
        subscription: { select: { status: true } },
        emailDripRecords: { select: { emailKey: true } },
      },
    });

    logger.info("Education drip candidates", { count: dripCandidates.length });

    for (const user of dripCandidates) {
      const daysSinceSignup = Math.floor(
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const sentKeys = new Set(user.emailDripRecords.map((r) => r.emailKey));

      // Find the next unsent email in the sequence
      for (const step of EDUCATION_SEQUENCE) {
        if (sentKeys.has(step.emailKey)) continue;
        if (daysSinceSignup < step.daysAfterSignup) break;

        // Check if user already adopted this feature (smart skip)
        const shouldSkip = checkSkipCondition(step.skipCheck, user);

        // Atomically verify opt-out status and claim delivery in one transaction.
        // Guards against the user opting out after dripCandidates was fetched.
        let claimed = false;
        try {
          await prisma.$transaction(async (tx) => {
            const freshUser = await tx.user.findUniqueOrThrow({
              where: { id: user.id },
              select: { educationEmailsOptOut: true },
            });
            if (freshUser.educationEmailsOptOut) {
              throw new Error("USER_OPTED_OUT");
            }
            await tx.emailDripRecord.create({
              data: { userId: user.id, emailKey: step.emailKey },
            });
          });
          claimed = true;
        } catch (err) {
          if (err instanceof Error && err.message === "USER_OPTED_OUT") {
            logger.info("Education email skipped (user opted out)", {
              userId: user.id,
              emailKey: step.emailKey,
            });
            break;
          }
          // Unique constraint violation — already claimed by another run
          continue;
        }

        if (!claimed) continue;

        if (shouldSkip) {
          results.educationSkipped++;
          logger.info("Education email skipped (feature already adopted)", {
            userId: user.id,
            emailKey: step.emailKey,
          });
          continue;
        }

        try {
          await emailService.sendFeatureEducationEmail({
            userName: user.name || "Korisniče",
            userEmail: user.email,
            salonName: user.salonName,
            featureTitle: step.featureTitle,
            featureDescription: step.featureDescription,
            helpArticleUrl: `${APP_URL}${step.helpPath}`,
            ctaText: step.ctaText,
            ctaUrl: `${APP_URL}${step.ctaPath}`,
            stepNumber: EDUCATION_SEQUENCE.indexOf(step) + 1,
            totalSteps: EDUCATION_SEQUENCE.length,
            unsubscribeUrl: buildUnsubscribeUrl(user.id, "education"),
          });

          results.emailsSent++;
          results.educationEmails++;
          logger.info("Education email sent", {
            userId: user.id,
            emailKey: step.emailKey,
            stepNumber: EDUCATION_SEQUENCE.indexOf(step) + 1,
          });
        } catch (emailError) {
          results.emailsFailed++;
          logger.error("Failed to send education email", {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            userId: user.id,
            emailKey: step.emailKey,
          });
        }

        // Only send one email per user per cron run
        break;
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
