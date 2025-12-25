import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const outOfOfficeRouter = router({
  // List out of office entries for current user
  list: protectedProcedure
    .input(
      z
        .object({
          cursor: z.number().optional(),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const entries = await ctx.prisma.outOfOffice.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          reason: true,
        },
        orderBy: { start: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (entries.length > limit) {
        const nextItem = entries.pop();
        nextCursor = nextItem!.id;
      }

      return {
        entries,
        nextCursor,
      };
    }),

  // Get upcoming out of office entries
  upcoming: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries = await ctx.prisma.outOfOffice.findMany({
      where: {
        userId: ctx.session.user.id,
        end: { gte: today },
      },
      include: {
        reason: true,
      },
      orderBy: { start: "asc" },
    });

    return entries;
  }),

  // Get a single entry
  get: protectedProcedure.input(z.object({ uuid: z.string() })).query(async ({ ctx, input }) => {
    const entry = await ctx.prisma.outOfOffice.findFirst({
      where: {
        uuid: input.uuid,
        userId: ctx.session.user.id,
      },
      include: {
        reason: true,
      },
    });

    if (!entry) {
      throw new Error("Unos nije pronađen.");
    }

    return entry;
  }),

  // Create or update an out of office entry
  createOrUpdate: protectedProcedure
    .input(
      z.object({
        uuid: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        reasonId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate dates
      if (input.endDate < input.startDate) {
        throw new Error("Datum završetka mora biti nakon datuma početka.");
      }

      // Check for overlapping entries
      const overlapping = await ctx.prisma.outOfOffice.findFirst({
        where: {
          userId: ctx.session.user.id,
          uuid: input.uuid ? { not: input.uuid } : undefined,
          OR: [
            {
              start: { lte: input.endDate },
              end: { gte: input.startDate },
            },
          ],
        },
      });

      if (overlapping) {
        throw new Error("Već imate unos za ovaj period.");
      }

      if (input.uuid) {
        // Update existing entry
        const entry = await ctx.prisma.outOfOffice.update({
          where: {
            uuid: input.uuid,
            userId: ctx.session.user.id,
          },
          data: {
            start: input.startDate,
            end: input.endDate,
            reasonId: input.reasonId,
            notes: input.notes,
          },
          include: {
            reason: true,
          },
        });
        return entry;
      }
      // Create new entry
      const entry = await ctx.prisma.outOfOffice.create({
        data: {
          userId: ctx.session.user.id,
          start: input.startDate,
          end: input.endDate,
          reasonId: input.reasonId,
          notes: input.notes,
        },
        include: {
          reason: true,
        },
      });
      return entry;
    }),

  // Delete an out of office entry
  delete: protectedProcedure
    .input(z.object({ uuid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.outOfOffice.findFirst({
        where: {
          uuid: input.uuid,
          userId: ctx.session.user.id,
        },
      });

      if (!entry) {
        throw new Error("Unos nije pronađen.");
      }

      await ctx.prisma.outOfOffice.delete({
        where: { id: entry.id },
      });

      return { success: true };
    }),

  // List available reasons
  reasons: protectedProcedure.query(async ({ ctx }) => {
    const reasons = await ctx.prisma.outOfOfficeReason.findMany({
      where: {
        enabled: true,
        OR: [
          { userId: null }, // Global reasons
          { userId: ctx.session.user.id }, // User's custom reasons
        ],
      },
      orderBy: { id: "asc" },
    });

    return reasons;
  }),
});
