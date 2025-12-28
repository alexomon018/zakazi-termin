import { protectedProcedure, publicProcedure, router } from "@salonko/trpc/trpc";
import { z } from "zod";

export const eventTypeRouter = router({
  // List user's event types
  list: protectedProcedure.query(async ({ ctx }) => {
    const eventTypes = await ctx.prisma.eventType.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { position: "asc" },
    });
    return eventTypes;
  }),

  // Get single event type by ID
  byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
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

  // Get public event type by username and slug
  getPublic: publicProcedure
    .input(z.object({ username: z.string(), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username },
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
              username: true,
              avatarUrl: true,
              timeZone: true,
            },
          },
          schedule: {
            include: {
              availability: true,
            },
          },
        },
      });
      return eventType;
    }),

  // Create event type
  create: protectedProcedure
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
        scheduleId: z.number().optional(),
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
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
        scheduleId: z.number().optional(),
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
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
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
