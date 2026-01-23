import { generatePresignedUrl } from "@salonko/s3";
import {
  protectedProcedure,
  publicProcedure,
  router,
  subscriptionProtectedProcedure,
} from "@salonko/trpc/trpc";
import { z } from "zod";

export const eventTypeRouter = router({
  // List user's event types
  // Shows event types where user is owner OR is assigned as a host
  // For OWNER/ADMIN: shows all event types from organization members
  list: subscriptionProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Check if user is OWNER or ADMIN of an organization
    const membership = await ctx.prisma.membership.findFirst({
      where: {
        userId,
        accepted: true,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: {
        organizationId: true,
        role: true,
      },
    });

    if (membership) {
      // OWNER/ADMIN: show all event types from organization members
      const allEventTypes = await ctx.prisma.eventType.findMany({
        where: {
          user: {
            memberships: {
              some: {
                organizationId: membership.organizationId,
                accepted: true,
              },
            },
          },
        },
        orderBy: { position: "asc" },
        include: {
          hosts: {
            select: {
              userId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              salonName: true,
            },
          },
        },
      });

      // Mark which are owned by current user vs owned by team members
      return allEventTypes.map((et) => ({
        ...et,
        isOwner: et.userId === userId,
        ownerName: et.userId === userId ? null : et.user?.name || et.user?.salonName,
      }));
    }

    // Regular user or MEMBER: only their own event types + hosted event types
    // Get event types where user is owner
    const ownedEventTypes = await ctx.prisma.eventType.findMany({
      where: { userId: userId },
      orderBy: { position: "asc" },
      include: {
        hosts: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Get event types where user is assigned as a host (but not owner)
    const hostedEventTypes = await ctx.prisma.eventType.findMany({
      where: {
        hosts: {
          some: {
            userId: userId,
          },
        },
        userId: { not: userId }, // Exclude owned event types
      },
      orderBy: { position: "asc" },
      include: {
        hosts: {
          select: {
            userId: true,
          },
        },
        user: {
          select: {
            name: true,
            salonName: true,
          },
        },
      },
    });

    // Combine and mark which are owned vs hosted
    return [
      ...ownedEventTypes.map((et) => ({ ...et, isOwner: true, ownerName: null })),
      ...hostedEventTypes.map((et) => ({
        ...et,
        isOwner: false,
        ownerName: et.user?.salonName || et.user?.name,
      })),
    ];
  }),

  // Get single event type by ID
  // Allows access if user is owner OR is assigned as a host
  byId: subscriptionProtectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const eventType = await ctx.prisma.eventType.findFirst({
        where: {
          id: input.id,
          OR: [{ userId: userId }, { hosts: { some: { userId: userId } } }],
        },
        include: {
          schedule: {
            include: {
              availability: true,
            },
          },
          hosts: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      return eventType;
    }),

  // Get public event type by salonSlug/orgSlug and eventType slug
  // Supports both individual salon owners (by salonSlug) and team event types (by organization slug)
  // When a salon owner has a team, the salonSlug and org slug are the same, so we need to check both
  getPublic: publicProcedure
    .input(z.object({ salonSlug: z.string(), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Try to find a user with this salonSlug (salon owners)
      const user = await ctx.prisma.user.findUnique({
        where: { salonSlug: input.salonSlug },
      });

      // Also try to find an organization with this slug
      const organization = await ctx.prisma.organization.findUnique({
        where: { slug: input.salonSlug },
        select: { id: true },
      });

      // If neither exists, return null
      if (!user && !organization) return null;

      // Build the OR conditions for the query
      // We need to find event types that match EITHER:
      // 1. Owned by the user with this salonName, OR
      // 2. Owned by any member of the organization with this slug
      const orConditions: Array<Record<string, unknown>> = [];

      if (user) {
        // Event types owned directly by the salon owner
        orConditions.push({ userId: user.id });
      }

      if (organization) {
        // Event types owned by any accepted member of the organization
        orConditions.push({
          user: {
            memberships: {
              some: {
                organizationId: organization.id,
                accepted: true,
              },
            },
          },
        });
      }

      const eventType = await ctx.prisma.eventType.findFirst({
        where: {
          slug: input.slug,
          hidden: false,
          OR: orConditions,
        },
        include: {
          user: {
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
            },
          },
          schedule: {
            include: {
              availability: true,
            },
          },
          hosts: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  salonIconKey: true,
                },
              },
              schedule: {
                include: {
                  availability: true,
                },
              },
            },
          },
        },
      });

      if (!eventType) return null;

      // Generate pre-signed URL for salon icon
      let salonIconUrl: string | null = null;
      if (eventType.user.salonIconKey) {
        try {
          salonIconUrl = await generatePresignedUrl(eventType.user.salonIconKey);
        } catch {
          // If S3 is not configured, continue without icon URL
        }
      }

      // Generate pre-signed URLs for host avatars (using salon icon as fallback)
      const hostsWithUrls = await Promise.all(
        eventType.hosts.map(async (host) => {
          let hostAvatarUrl: string | null = host.user.avatarUrl;
          if (!hostAvatarUrl && host.user.salonIconKey) {
            try {
              hostAvatarUrl = await generatePresignedUrl(host.user.salonIconKey);
            } catch {
              // If S3 is not configured, continue without icon URL
            }
          }
          return {
            ...host,
            user: {
              ...host.user,
              avatarUrl: hostAvatarUrl,
            },
          };
        })
      );

      return {
        ...eventType,
        hosts: hostsWithUrls,
        user: {
          ...eventType.user,
          salonIconUrl,
        },
      };
    }),

  // Create event type
  create: subscriptionProtectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        length: z.number().min(1),
        locations: z.any().optional(),
        minimumBookingNotice: z.number().optional(),
        beforeEventBuffer: z.number().optional(),
        afterEventBuffer: z.number().optional(),
        slotInterval: z.number().optional(),
        requiresConfirmation: z.boolean().optional(),
        scheduleId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const eventType = await ctx.prisma.eventType.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
      return eventType;
    }),

  // Update event type
  update: subscriptionProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        length: z.number().min(1).optional(),
        hidden: z.boolean().optional(),
        locations: z.any().optional(),
        minimumBookingNotice: z.number().optional(),
        beforeEventBuffer: z.number().optional(),
        afterEventBuffer: z.number().optional(),
        slotInterval: z.number().optional(),
        requiresConfirmation: z.boolean().optional(),
        scheduleId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const eventType = await ctx.prisma.eventType.update({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data,
      });
      return eventType;
    }),

  // Delete event type
  delete: subscriptionProtectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.eventType.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
      return { success: true };
    }),
});
