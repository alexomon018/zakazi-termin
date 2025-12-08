import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const userRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        timeZone: true,
        weekStart: true,
        locale: true,
        defaultScheduleId: true,
      },
    });
    return user;
  }),

  // Get user by username (public profile)
  byUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username },
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          timeZone: true,
        },
      });
      return user;
    }),

  // Update user profile
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        username: z.string().min(3).optional(),
        timeZone: z.string().optional(),
        weekStart: z.string().optional(),
        locale: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
      return user;
    }),

  // Set default schedule
  setDefaultSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
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
