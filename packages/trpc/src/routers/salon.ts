import { dayjs } from "@salonko/config";
import type { Prisma } from "@salonko/prisma";
import { generatePresignedUrl } from "@salonko/s3";
import { publicProcedure, router } from "@salonko/trpc/trpc";
import { z } from "zod";

/**
 * Helper to generate a salon icon URL from S3 key
 * Returns null if no key is provided
 */
async function getSalonIconUrl(salonIconKey: string | null): Promise<string | null> {
  if (!salonIconKey) return null;
  try {
    return await generatePresignedUrl(salonIconKey);
  } catch {
    return null;
  }
}

export const salonRouter = router({
  /**
   * Search and list salons with filters.
   * Only returns salons with active subscriptions and at least one visible event type.
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        salonType: z.string().optional(),
        city: z.string().optional(),
        openNow: z.boolean().optional(),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).default(8),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, salonType, city, openNow, cursor, limit } = input;

      // Build where conditions
      const conditions: Prisma.UserWhereInput[] = [];

      // Must have a salon name and slug (i.e., is a salon owner)
      conditions.push({
        salonName: { not: null },
        salonSlug: { not: null },
      });

      // Must have at least one visible event type
      conditions.push({
        eventTypes: { some: { hidden: false } },
      });

      // Must have an active subscription (ACTIVE or TRIALING with valid trial)
      conditions.push({
        subscription: {
          OR: [
            { status: "ACTIVE" },
            {
              status: "TRIALING",
              trialEndsAt: { gt: new Date() },
            },
          ],
        },
      });

      // Text search across salon name, city, and event type titles
      if (query) {
        conditions.push({
          OR: [
            { salonName: { contains: query, mode: "insensitive" } },
            { salonCity: { contains: query, mode: "insensitive" } },
            {
              eventTypes: {
                some: {
                  hidden: false,
                  title: { contains: query, mode: "insensitive" },
                },
              },
            },
          ],
        });
      }

      // Filter by salon type
      if (salonType) {
        conditions.push({
          salonTypes: { has: salonType },
        });
      }

      // Filter by city
      if (city) {
        conditions.push({
          salonCity: { equals: city, mode: "insensitive" },
        });
      }

      // Filter by "open now" — check if any schedule has availability for today
      if (openNow) {
        const now = dayjs().tz("Europe/Belgrade");
        const todayDayOfWeek = now.day(); // 0=Sun, 1=Mon, ...
        const currentTime = new Date(`1970-01-01T${now.format("HH:mm")}:00.000Z`);

        conditions.push({
          schedules: {
            some: {
              availability: {
                some: {
                  days: { has: todayDayOfWeek },
                  startTime: { lte: currentTime },
                  endTime: { gt: currentTime },
                },
              },
            },
          },
        });
      }

      // Cursor-based pagination
      const cursorClause = cursor ? { id: cursor } : undefined;

      const users = await ctx.prisma.user.findMany({
        where: { AND: conditions },
        select: {
          id: true,
          salonName: true,
          salonSlug: true,
          salonCity: true,
          salonTypes: true,
          salonIconKey: true,
          _count: {
            select: {
              eventTypes: { where: { hidden: false } },
            },
          },
          schedules: {
            select: {
              availability: {
                select: { days: true, startTime: true, endTime: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursorClause,
        ...(cursor ? { skip: 1 } : {}),
      });

      // Check if there are more results
      let nextCursor: string | undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      // Compute "open now" status and generate presigned URLs
      const now = dayjs().tz("Europe/Belgrade");
      const todayDayOfWeek = now.day();
      const currentTime = new Date(`1970-01-01T${now.format("HH:mm")}:00.000Z`);

      const items = await Promise.all(
        users.map(async (user) => {
          const salonIconUrl = await getSalonIconUrl(user.salonIconKey);

          // Determine if salon is currently open
          const isOpenNow = user.schedules.some((schedule) =>
            schedule.availability.some(
              (avail) =>
                avail.days.includes(todayDayOfWeek) &&
                avail.startTime <= currentTime &&
                avail.endTime > currentTime
            )
          );

          return {
            id: user.id,
            salonName: user.salonName!,
            salonSlug: user.salonSlug!,
            salonCity: user.salonCity,
            salonTypes: user.salonTypes,
            salonIconUrl,
            serviceCount: user._count.eventTypes,
            isOpenNow,
          };
        })
      );

      return { items, nextCursor };
    }),

  /**
   * Get distinct cities that have active salons.
   * Used for the city filter dropdown.
   */
  cities: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.prisma.user.findMany({
      where: {
        salonCity: { not: null },
        salonName: { not: null },
        salonSlug: { not: null },
        eventTypes: { some: { hidden: false } },
        subscription: {
          OR: [{ status: "ACTIVE" }, { status: "TRIALING", trialEndsAt: { gt: new Date() } }],
        },
      },
      select: { salonCity: true },
      distinct: ["salonCity"],
      orderBy: { salonCity: "asc" },
    });

    return results.map((r) => r.salonCity!).filter(Boolean);
  }),
});
