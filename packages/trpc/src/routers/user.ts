import { generateSalonSlug } from "@/lib/salon-utils";
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
  // Get current user profile with membership info
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        salonName: true,
        salonSlug: true,
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
        memberships: {
          where: { accepted: true },
          select: {
            id: true,
            role: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Generate pre-signed URL for salon icon
    let salonIconUrl = await getSalonIconUrl(user.salonIconKey);

    // Get the primary membership (if any)
    const primaryMembership = user.memberships[0] || null;

    // For team members (ADMIN/MEMBER), fetch the organization owner's salon icon if user doesn't have one
    if (
      !salonIconUrl &&
      primaryMembership &&
      (primaryMembership.role === "ADMIN" || primaryMembership.role === "MEMBER")
    ) {
      // Find the organization owner and get their salon icon
      const ownerMembership = await ctx.prisma.membership.findFirst({
        where: {
          organizationId: primaryMembership.organizationId,
          role: "OWNER",
          accepted: true,
        },
        select: {
          user: {
            select: {
              salonIconKey: true,
              salonName: true,
            },
          },
        },
      });

      if (ownerMembership?.user?.salonIconKey) {
        salonIconUrl = await getSalonIconUrl(ownerMembership.user.salonIconKey);
      }
    }

    return {
      ...user,
      salonIconUrl,
      membership: primaryMembership,
    };
  }),

  // Get user by salonName (public profile) - deprecated, use getPublicProfile with salonSlug instead
  // Kept for backward compatibility but uses findFirst since salonName is not unique
  bySalonName: publicProcedure
    .input(z.object({ salonName: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
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
  // Supports both salonSlug (user) and organization slug
  // When accessed via organization owner, returns all members' event types
  getPublicProfile: publicProcedure
    .input(z.object({ salonSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      // First try to find by user salonSlug
      const user = await ctx.prisma.user.findUnique({
        where: { salonSlug: input.salonSlug },
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
          memberships: {
            where: { accepted: true },
            select: {
              role: true,
              organizationId: true,
            },
          },
        },
      });

      // If not found by salonSlug, try to find by organization slug
      let organization = null;
      if (!user) {
        organization = await ctx.prisma.organization.findUnique({
          where: { slug: input.salonSlug },
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            timeZone: true,
            members: {
              where: { accepted: true, role: "OWNER" },
              select: {
                user: {
                  select: {
                    id: true,
                    salonIconKey: true,
                    avatarUrl: true,
                    theme: true,
                    brandColor: true,
                    darkBrandColor: true,
                  },
                },
              },
            },
          },
        });

        if (!organization) return null;
      }

      // Determine if we should fetch org-wide event types
      let organizationId: string | null = null;
      if (organization) {
        organizationId = organization.id;
      } else if (user) {
        // Check if user is an OWNER of an organization
        const ownerMembership = user.memberships.find((m) => m.role === "OWNER");
        if (ownerMembership) {
          organizationId = ownerMembership.organizationId;
        }
      }

      // Fetch event types - either org-wide or user-specific
      type EventTypeWithUser = {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        length: number;
        hidden: boolean;
        locations: unknown;
        requiresConfirmation: boolean;
        user: {
          id: string;
          name: string | null;
          salonName: string | null;
        } | null;
      };
      let eventTypes: EventTypeWithUser[];
      if (organizationId) {
        // Fetch all event types from organization members
        eventTypes = await ctx.prisma.eventType.findMany({
          where: {
            hidden: false,
            user: {
              memberships: {
                some: {
                  organizationId: organizationId,
                  accepted: true,
                },
              },
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            length: true,
            hidden: true,
            locations: true,
            requiresConfirmation: true,
            user: {
              select: {
                id: true,
                name: true,
                salonName: true,
              },
            },
          },
          orderBy: { position: "asc" },
        });
      } else if (user) {
        // Fetch only this user's event types
        eventTypes = await ctx.prisma.eventType.findMany({
          where: {
            userId: user.id,
            hidden: false,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            length: true,
            hidden: true,
            locations: true,
            requiresConfirmation: true,
            user: {
              select: {
                id: true,
                name: true,
                salonName: true,
              },
            },
          },
          orderBy: { position: "asc" },
        });
      } else {
        eventTypes = [];
      }

      // Build the response based on whether we found user or organization
      if (organization) {
        const owner = organization.members[0]?.user;
        const salonIconUrl = owner?.salonIconKey ? await getSalonIconUrl(owner.salonIconKey) : null;

        return {
          id: organization.id,
          name: organization.name,
          salonName: organization.slug,
          avatarUrl: owner?.avatarUrl || null,
          salonIconKey: owner?.salonIconKey || null,
          salonIconUrl: salonIconUrl || organization.logoUrl,
          timeZone: organization.timeZone,
          theme: owner?.theme || null,
          brandColor: owner?.brandColor || null,
          darkBrandColor: owner?.darkBrandColor || null,
          eventTypes,
          isOrganization: true,
        };
      }

      // User response
      const salonIconUrl = await getSalonIconUrl(user!.salonIconKey);

      return {
        id: user!.id,
        name: user!.name,
        salonName: user!.salonName,
        avatarUrl: user!.avatarUrl,
        salonIconKey: user!.salonIconKey,
        salonIconUrl,
        timeZone: user!.timeZone,
        theme: user!.theme,
        brandColor: user!.brandColor,
        darkBrandColor: user!.darkBrandColor,
        eventTypes,
        isOrganization: !!organizationId,
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
      // Generate slug if salonName is being updated
      const salonSlug = input.salonName ? generateSalonSlug(input.salonName) : undefined;

      // Check if salonSlug is already taken (if changing)
      if (salonSlug) {
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            salonSlug,
            NOT: { id: ctx.session.user.id },
          },
        });
        if (existingUser) {
          throw new Error("Naziv salona je već zauzet.");
        }
      }

      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...input,
          salonSlug,
        },
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
        name: true,
        salonTypes: true,
        salonCity: true,
        salonAddress: true,
        memberships: {
          where: { accepted: true },
          select: {
            role: true,
          },
        },
      },
    });

    if (!user) return { complete: false };

    // Team members (ADMIN/MEMBER) don't need to complete salon onboarding
    // They're joining someone else's salon, not creating their own
    // However, they must still have their name set
    const isTeamMember = user.memberships.some((m) => m.role === "ADMIN" || m.role === "MEMBER");

    if (isTeamMember && Boolean(user.name)) {
      return { complete: true };
    }

    // For owners or users without memberships, check if they have salon info
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
      // Generate slug from display name
      const salonSlug = generateSalonSlug(input.salonName);

      return await ctx.prisma.$transaction(async (tx) => {
        // Check if salonSlug is already taken
        const existingUser = await tx.user.findFirst({
          where: {
            salonSlug,
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
        const user = await tx.user
          .update({
            where: { id: ctx.session.user.id },
            data: {
              salonName: input.salonName,
              salonSlug,
              salonTypes: input.salonTypes,
              salonPhone: input.salonPhone,
              salonEmail: input.salonEmail || null,
              salonCity: input.salonCity,
              salonAddress: input.salonAddress,
              googlePlaceId: input.googlePlaceId || null,
            },
          })
          .catch((error) => {
            // Convert unique constraint failures to CONFLICT error
            if (error.code === "P2002" && error.meta?.target?.includes("salonSlug")) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Naziv salona je već zauzet.",
              });
            }
            throw error;
          });

        // Create default schedule if user doesn't have one
        const existingSchedule = await tx.schedule.findFirst({
          where: { userId: ctx.session.user.id },
        });

        if (!existingSchedule) {
          const schedule = await tx.schedule.create({
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

          await tx.user.update({
            where: { id: ctx.session.user.id },
            data: { defaultScheduleId: schedule.id },
          });
        }

        return { success: true, salonName: user.salonName };
      });
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
