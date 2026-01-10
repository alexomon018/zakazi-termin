import { logger } from "@salonko/config";
import { protectedProcedure, publicProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getStripe, isTestStripeId } from "../lib/stripe";

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
    return user;
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
          timeZone: true,
        },
      });
      return user;
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
      return user;
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
