import { logger } from "@salonko/config";
import { generatePresignedUrl } from "@salonko/s3";
import { protectedProcedure, publicProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getStripe, isTestStripeId } from "../lib/stripe";

/**
 * Helper to generate a salon icon URL from S3 key
 * Returns null if no key is provided
 */
async function getSalonIconUrl(salonIconKey: string | null): Promise<string | null> {
  if (!salonIconKey) return null;
  try {
    return await generatePresignedUrl(salonIconKey);
  } catch {
    // If S3 is not configured or key is invalid, return null
    return null;
  }
}

export const userRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        salonName: true,
        avatarUrl: true,
        salonIconKey: true,
        bio: true,
        timeZone: true,
        weekStart: true,
        locale: true,
        theme: true,
        brandColor: true,
        darkBrandColor: true,
        defaultScheduleId: true,
        identityProvider: true,
      },
    });

    if (!user) return null;

    // Generate pre-signed URL for salon icon
    const salonIconUrl = await getSalonIconUrl(user.salonIconKey);

    return {
      ...user,
      salonIconUrl,
    };
  }),

  // Get user by salonName (public profile)
  bySalonName: publicProcedure
    .input(z.object({ salonName: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { salonName: input.salonName },
        select: {
          id: true,
          name: true,
          salonName: true,
          avatarUrl: true,
          salonIconKey: true,
          timeZone: true,
        },
      });

      if (!user) return null;

      const salonIconUrl = await getSalonIconUrl(user.salonIconKey);

      return {
        ...user,
        salonIconUrl,
      };
    }),

  // Get public profile with event types
  getPublicProfile: publicProcedure
    .input(z.object({ salonName: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { salonName: input.salonName },
        select: {
          id: true,
          name: true,
          salonName: true,
          avatarUrl: true,
          salonIconKey: true,
          timeZone: true,
          theme: true,
          brandColor: true,
          darkBrandColor: true,
          eventTypes: {
            where: { hidden: false },
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              length: true,
              hidden: true,
              locations: true,
              requiresConfirmation: true,
            },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!user) return null;

      const salonIconUrl = await getSalonIconUrl(user.salonIconKey);

      return {
        ...user,
        salonIconUrl,
      };
    }),

  // Update user profile
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        salonName: z.string().min(3).optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().nullable().optional(),
        timeZone: z.string().optional(),
        weekStart: z.string().optional(),
        locale: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if salonName is already taken (if changing)
      if (input.salonName) {
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            salonName: input.salonName,
            NOT: { id: ctx.session.user.id },
          },
        });
        if (existingUser) {
          throw new Error("Naziv salona je već zauzet.");
        }
      }

      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
      return user;
    }),

  // Update appearance settings
  updateAppearance: protectedProcedure
    .input(
      z.object({
        theme: z.enum(["light", "dark"]).nullable().optional(),
        brandColor: z.string().optional(),
        darkBrandColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
      return user;
    }),

  // Check salonName availability
  checkSalonName: protectedProcedure
    .input(z.object({ salonName: z.string().min(3) }))
    .query(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          salonName: input.salonName,
          NOT: { id: ctx.session.user.id },
        },
      });
      return { available: !existingUser };
    }),

  // Set default schedule
  setDefaultSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify schedule belongs to user
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.scheduleId,
          userId: ctx.session.user.id,
        },
      });

      if (!schedule) {
        throw new Error("Raspored nije pronađen.");
      }

      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { defaultScheduleId: input.scheduleId },
      });

      return user;
    }),

  // Delete user account (GDPR compliance)
  deleteAccount: protectedProcedure
    .input(z.object({ confirmText: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate confirmation text
      if (input.confirmText !== "DELETE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Morate uneti 'DELETE' da biste potvrdili brisanje naloga.",
        });
      }

      // Get user with subscription
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { subscription: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Korisnik nije pronađen.",
        });
      }

      // Cancel Stripe subscription if exists
      if (user.subscription?.stripeSubscriptionId) {
        if (!isTestStripeId(user.subscription.stripeSubscriptionId)) {
          try {
            const stripe = getStripe();
            await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
          } catch (error) {
            logger.error("Failed to cancel Stripe subscription during account deletion", {
              error,
              userId: ctx.session.user.id,
            });
            // Continue with deletion - subscription will be orphaned but user data removed
          }
        }

        // Delete Stripe customer
        if (
          user.subscription.stripeCustomerId &&
          !isTestStripeId(user.subscription.stripeCustomerId)
        ) {
          try {
            const stripe = getStripe();
            await stripe.customers.del(user.subscription.stripeCustomerId);
          } catch (error) {
            logger.error("Failed to delete Stripe customer during account deletion", {
              error,
              userId: ctx.session.user.id,
            });
          }
        }
      }

      // Delete user (cascades handle all related data)
      await ctx.prisma.user.delete({
        where: { id: ctx.session.user.id },
      });

      return { success: true };
    }),

  // Check if user profile is complete (for onboarding redirect)
  isProfileComplete: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        salonTypes: true,
        salonCity: true,
        salonAddress: true,
      },
    });

    if (!user) return { complete: false };

    // Profile is complete if user has salon types, city, and address
    const complete = user.salonTypes.length > 0 && !!user.salonCity && !!user.salonAddress;

    return { complete };
  }),

  // Complete onboarding for OAuth users
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        salonName: z.string().min(3).max(50),
        salonTypes: z.array(z.string()).min(1),
        salonPhone: z.string().min(1),
        salonEmail: z.string().email().optional().or(z.literal("")),
        salonCity: z.string().min(1),
        salonAddress: z.string().min(1),
        googlePlaceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if salonName is already taken (if changing)
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          salonName: input.salonName,
          NOT: { id: ctx.session.user.id },
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Naziv salona je već zauzet.",
        });
      }

      // Update user with onboarding data
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          salonName: input.salonName,
          salonTypes: input.salonTypes,
          salonPhone: input.salonPhone,
          salonEmail: input.salonEmail || null,
          salonCity: input.salonCity,
          salonAddress: input.salonAddress,
          googlePlaceId: input.googlePlaceId || null,
        },
      });

      // Create default schedule if user doesn't have one
      const existingSchedule = await ctx.prisma.schedule.findFirst({
        where: { userId: ctx.session.user.id },
      });

      if (!existingSchedule) {
        const schedule = await ctx.prisma.schedule.create({
          data: {
            userId: ctx.session.user.id,
            name: "Radno vreme",
            timeZone: "Europe/Belgrade",
            availability: {
              create: [
                {
                  days: [1, 2, 3, 4, 5],
                  startTime: new Date("1970-01-01T09:00:00"),
                  endTime: new Date("1970-01-01T17:00:00"),
                },
              ],
            },
          },
        });

        await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { defaultScheduleId: schedule.id },
        });
      }

      return { success: true, salonName: user.salonName };
    }),

  // Get user's default schedule with availability
  getDefaultSchedule: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { defaultScheduleId: true },
    });

    if (!user?.defaultScheduleId) {
      return null;
    }

    const schedule = await ctx.prisma.schedule.findUnique({
      where: { id: user.defaultScheduleId },
      include: { availability: true },
    });

    return schedule;
  }),
});
