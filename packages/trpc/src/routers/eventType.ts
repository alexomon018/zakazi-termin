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
  list: subscriptionProtectedProcedure.query(async ({ ctx }) => {
    const eventTypes = await ctx.prisma.eventType.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { position: "asc" },
    });
    return eventTypes;
  }),

  // Get single event type by ID
  byId: subscriptionProtectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const eventType = await ctx.prisma.eventType.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          schedule: {
            include: {
              availability: true,
            },
          },
        },
      });
      return eventType;
    }),

  // Get public event type by salonName and slug
  getPublic: publicProcedure
    .input(z.object({ salonName: z.string(), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { salonName: input.salonName },
      });

      if (!user) return null;

      const eventType = await ctx.prisma.eventType.findFirst({
        where: {
          userId: user.id,
          slug: input.slug,
          hidden: false,
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

      return {
        ...eventType,
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
