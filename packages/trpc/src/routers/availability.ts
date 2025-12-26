import { GoogleCalendarService, googleCredentialSchema } from "@salonko/calendar";
import { logger } from "@salonko/config";
import { getAvailability, getBookingBusyTimes } from "@salonko/scheduling";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const availabilityRouter = router({
  // List user's schedules
  listSchedules: protectedProcedure.query(async ({ ctx }) => {
    const schedules = await ctx.prisma.schedule.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        availability: true,
      },
    });
    return schedules;
  }),

  // Get schedule by ID
  getSchedule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          availability: true,
        },
      });
      return schedule;
    }),

  // Create a new schedule
  createSchedule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        timeZone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.create({
        data: {
          name: input.name,
          timeZone: input.timeZone,
          userId: ctx.session.user.id,
        },
      });
      return schedule;
    }),

  // Update schedule
  updateSchedule: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        timeZone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const schedule = await ctx.prisma.schedule.update({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data,
      });
      return schedule;
    }),

  // Delete schedule
  deleteSchedule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.schedule.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
      return { success: true };
    }),

  // Set availability for a schedule
  setAvailability: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        availability: z.array(
          z.object({
            days: z.array(z.number().min(0).max(6)),
            startTime: z.string(), // HH:mm format
            endTime: z.string(),
          })
        ),
      })
    )
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

      // Delete existing availability
      await ctx.prisma.availability.deleteMany({
        where: { scheduleId: input.scheduleId },
      });

      // Create new availability entries
      const availabilityData = input.availability.map((a) => ({
        scheduleId: input.scheduleId,
        days: a.days,
        startTime: new Date(`1970-01-01T${a.startTime}:00Z`),
        endTime: new Date(`1970-01-01T${a.endTime}:00Z`),
      }));

      await ctx.prisma.availability.createMany({
        data: availabilityData,
      });

      return { success: true };
    }),

  // Add a date override (specific date with custom hours)
  addDateOverride: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        date: z.date(),
        startTime: z.string(), // HH:mm format
        endTime: z.string(),
      })
    )
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

      // Delete any existing override for this date
      await ctx.prisma.availability.deleteMany({
        where: {
          scheduleId: input.scheduleId,
          date: input.date,
        },
      });

      // Create the date override
      const override = await ctx.prisma.availability.create({
        data: {
          scheduleId: input.scheduleId,
          date: input.date,
          days: [],
          startTime: new Date(`1970-01-01T${input.startTime}:00Z`),
          endTime: new Date(`1970-01-01T${input.endTime}:00Z`),
        },
      });

      return override;
    }),

  // Remove a date override
  removeDateOverride: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        date: z.date(),
      })
    )
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

      await ctx.prisma.availability.deleteMany({
        where: {
          scheduleId: input.scheduleId,
          date: input.date,
        },
      });

      return { success: true };
    }),

  // Block a specific date (no availability)
  blockDate: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        date: z.date(),
      })
    )
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

      // Delete any existing override for this date
      await ctx.prisma.availability.deleteMany({
        where: {
          scheduleId: input.scheduleId,
          date: input.date,
        },
      });

      // Create a zero-length override to block the date
      const override = await ctx.prisma.availability.create({
        data: {
          scheduleId: input.scheduleId,
          date: input.date,
          days: [],
          startTime: new Date("1970-01-01T00:00:00Z"),
          endTime: new Date("1970-01-01T00:00:00Z"),
        },
      });

      return override;
    }),

  // Get date overrides for a schedule
  getDateOverrides: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const overrides = await ctx.prisma.availability.findMany({
        where: {
          scheduleId: input.scheduleId,
          date: {
            not: null,
            ...(input.dateFrom && { gte: input.dateFrom }),
            ...(input.dateTo && { lte: input.dateTo }),
          },
          schedule: {
            userId: ctx.session.user.id,
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return overrides;
    }),

  // Get available slots for a public event type
  getSlots: publicProcedure
    .input(
      z.object({
        eventTypeId: z.number(),
        dateFrom: z.date(),
        dateTo: z.date(),
        timeZone: z.string().default("Europe/Belgrade"),
      })
    )
    .query(async ({ ctx, input }) => {
      const eventType = await ctx.prisma.eventType.findUnique({
        where: { id: input.eventTypeId },
        include: {
          user: true,
          schedule: {
            include: {
              availability: true,
            },
          },
        },
      });

      if (!eventType) {
        return { slots: [] };
      }

      // Get existing bookings in the date range
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          userId: eventType.userId,
          status: { in: ["PENDING", "ACCEPTED"] },
          startTime: { gte: input.dateFrom },
          endTime: { lte: input.dateTo },
        },
        select: {
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      // Convert availability to working hours and date overrides format
      const scheduleAvailability = eventType.schedule?.availability || [];
      const availability = scheduleAvailability.map((a) => {
        if (a.date) {
          // Date override
          return {
            date: a.date,
            startTime: a.startTime,
            endTime: a.endTime,
          };
        }
        // Working hours
        return {
          days: a.days,
          startTime: a.startTime,
          endTime: a.endTime,
        };
      });

      // Get busy times from bookings
      const bookingBusyTimes = getBookingBusyTimes(bookings);

      // Get busy times from connected calendars
      const calendarBusyTimes: { start: Date; end: Date }[] = [];

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        const credentials = await ctx.prisma.credential.findMany({
          where: {
            userId: eventType.userId,
            type: "google_calendar",
            invalid: { not: true },
          },
          include: {
            selectedCalendars: true,
          },
        });

        for (const credential of credentials) {
          try {
            const key = googleCredentialSchema.parse(credential.key);
            const service = new GoogleCalendarService(
              { id: credential.id, userId: credential.userId, key },
              clientId,
              clientSecret
            );

            const selectedCalendarIds = credential.selectedCalendars.map(
              (sc: { externalId: string }) => sc.externalId
            );

            const gcalBusyTimes = await service.getAvailability(
              input.dateFrom.toISOString(),
              input.dateTo.toISOString(),
              selectedCalendarIds
            );

            calendarBusyTimes.push(
              ...gcalBusyTimes.map((bt: { start: string; end: string }) => ({
                start: new Date(bt.start),
                end: new Date(bt.end),
              }))
            );
          } catch (error) {
            logger.error("Failed to get calendar busy times", {
              error,
              credentialId: credential.id,
            });
          }
        }
      }

      // Combine all busy times
      const busyTimes = [...bookingBusyTimes, ...calendarBusyTimes];

      // Use scheduling package to calculate available slots
      const timeZone = eventType.schedule?.timeZone || eventType.user.timeZone;
      const { slots, dateRanges } = getAvailability({
        availability,
        timeZone,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        eventLength: eventType.length,
        slotInterval: eventType.slotInterval || undefined,
        minimumBookingNotice: eventType.minimumBookingNotice,
        busyTimes,
      });

      return {
        slots: slots.map((slot) => ({
          time: slot.time.toISOString(),
        })),
        eventType: {
          id: eventType.id,
          title: eventType.title,
          length: eventType.length,
          slotInterval: eventType.slotInterval,
          minimumBookingNotice: eventType.minimumBookingNotice,
        },
        dateRanges: dateRanges.map((range) => ({
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        })),
        timeZone,
      };
    }),
});
