import { protectedProcedure, publicProcedure, router } from "@salonko/trpc/trpc";
import { z } from "zod";

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
