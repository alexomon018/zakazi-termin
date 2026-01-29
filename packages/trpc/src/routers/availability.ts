import { GoogleCalendarService, googleCredentialSchema } from "@salonko/calendar";
import { logger } from "@salonko/config";
import { getAvailability, getBookingBusyTimes } from "@salonko/scheduling";
import {
  protectedProcedure,
  publicProcedure,
  router,
  subscriptionProtectedProcedure,
} from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const availabilityRouter = router({
  // List user's schedules
  listSchedules: subscriptionProtectedProcedure.query(async ({ ctx }) => {
    const schedules = await ctx.prisma.schedule.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        availability: true,
      },
    });
    return schedules;
  }),

  // Get schedule by ID
  getSchedule: subscriptionProtectedProcedure
    .input(z.object({ id: z.string() }))
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
  createSchedule: subscriptionProtectedProcedure
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
  updateSchedule: subscriptionProtectedProcedure
    .input(
      z.object({
        id: z.string(),
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
  deleteSchedule: subscriptionProtectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.schedule.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
      return { success: true };
    }),

  // Duplicate a schedule (copy name + availability)
  duplicateSchedule: subscriptionProtectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { availability: true },
      });
      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Raspored nije pronađen.",
        });
      }

      const newSchedule = await ctx.prisma.schedule.create({
        data: {
          name: `${original.name} (kopija)`,
          timeZone: original.timeZone,
          userId: ctx.session.user.id,
          availability: {
            create: original.availability.map((a) => ({
              days: a.days,
              startTime: a.startTime,
              endTime: a.endTime,
              date: a.date,
            })),
          },
        },
        include: { availability: true },
      });
      return newSchedule;
    }),

  // Set availability for a schedule
  setAvailability: subscriptionProtectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
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
  addDateOverride: subscriptionProtectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
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
  removeDateOverride: subscriptionProtectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
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
  blockDate: subscriptionProtectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
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
  getDateOverrides: subscriptionProtectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
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
        eventTypeId: z.string(),
        dateFrom: z.date(),
        dateTo: z.date(),
        timeZone: z.string().default("Europe/Belgrade"),
        hostUserId: z.string().optional(), // Optional: filter by specific host/staff member
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
          hosts: {
            include: {
              user: true,
              schedule: {
                include: {
                  availability: true,
                },
              },
            },
          },
        },
      });

      if (!eventType) {
        return { slots: [] };
      }

      // Determine which user's schedule and bookings to use
      let targetUserId = eventType.userId;
      let targetSchedule = eventType.schedule;
      let targetUserTimeZone = eventType.user.timeZone;

      // If a specific host is requested, use their schedule instead
      if (input.hostUserId && eventType.hosts.length > 0) {
        const host = eventType.hosts.find((h) => h.userId === input.hostUserId);
        if (host) {
          targetUserId = host.userId;
          // Use host's custom schedule if available, otherwise fall back to event type schedule
          if (host.schedule) {
            targetSchedule = host.schedule;
          }
          targetUserTimeZone = host.user.timeZone;
        }
      }

      // Get existing bookings in the date range for the target user
      // For team bookings, check both assignedHostId AND userId (for owner's own bookings)
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          status: { in: ["PENDING", "ACCEPTED"] },
          startTime: { gte: input.dateFrom },
          endTime: { lte: input.dateTo },
          OR: [{ assignedHostId: targetUserId }, { userId: targetUserId, assignedHostId: null }],
        },
        select: {
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      // Convert availability to working hours and date overrides format
      const scheduleAvailability = targetSchedule?.availability || [];
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

      // Get busy times from connected calendars for the target user
      const calendarBusyTimes: { start: Date; end: Date }[] = [];

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        const credentials = await ctx.prisma.credential.findMany({
          where: {
            userId: targetUserId,
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
      const timeZone = targetSchedule?.timeZone || targetUserTimeZone;
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
