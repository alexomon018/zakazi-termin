import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const bookingRouter = router({
  // List bookings for current user
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "CANCELLED", "REJECTED"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.status && { status: input.status }),
          ...(input?.dateFrom && { startTime: { gte: input.dateFrom } }),
          ...(input?.dateTo && { endTime: { lte: input.dateTo } }),
        },
        include: {
          eventType: true,
          attendees: true,
        },
        orderBy: { startTime: "asc" },
      });
      return bookings;
    }),

  // Get single booking
  byUid: publicProcedure
    .input(z.object({ uid: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { uid: input.uid },
        include: {
          eventType: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              timeZone: true,
            },
          },
          attendees: true,
        },
      });
      return booking;
    }),

  // Create a new booking (public - for attendees)
  create: publicProcedure
    .input(
      z.object({
        eventTypeId: z.number(),
        startTime: z.date(),
        endTime: z.date(),
        name: z.string().min(1),
        email: z.string().email(),
        phoneNumber: z.string().optional(),
        notes: z.string().optional(),
        timeZone: z.string().default("Europe/Belgrade"),
        locale: z.string().default("sr"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get event type with user
      const eventType = await ctx.prisma.eventType.findUnique({
        where: { id: input.eventTypeId },
        include: { user: true },
      });

      if (!eventType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tip događaja nije pronađen.",
        });
      }

      // Check for conflicts
      const conflictingBooking = await ctx.prisma.booking.findFirst({
        where: {
          userId: eventType.userId,
          status: { in: ["PENDING", "ACCEPTED"] },
          OR: [
            {
              startTime: { lt: input.endTime },
              endTime: { gt: input.startTime },
            },
          ],
        },
      });

      if (conflictingBooking) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Izabrani termin više nije dostupan.",
        });
      }

      // Determine initial status
      const status = eventType.requiresConfirmation ? "PENDING" : "ACCEPTED";

      // Create booking with attendee
      const booking = await ctx.prisma.booking.create({
        data: {
          title: `${eventType.title} sa ${input.name}`,
          description: input.notes,
          startTime: input.startTime,
          endTime: input.endTime,
          location: eventType.locations ? JSON.stringify(eventType.locations) : null,
          status,
          userId: eventType.userId,
          eventTypeId: eventType.id,
          attendees: {
            create: {
              name: input.name,
              email: input.email,
              phoneNumber: input.phoneNumber,
              timeZone: input.timeZone,
              locale: input.locale,
            },
          },
        },
        include: {
          attendees: true,
          eventType: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // TODO: Send email notifications

      return booking;
    }),

  // Confirm a pending booking
  confirm: protectedProcedure
    .input(z.object({ uid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.update({
        where: {
          uid: input.uid,
          userId: ctx.session.user.id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      // TODO: Send confirmation email

      return booking;
    }),

  // Reject a pending booking
  reject: protectedProcedure
    .input(
      z.object({
        uid: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.update({
        where: {
          uid: input.uid,
          userId: ctx.session.user.id,
        },
        data: {
          status: "REJECTED",
          rejectionReason: input.reason,
        },
      });

      // TODO: Send rejection email

      return booking;
    }),

  // Cancel a booking (can be done by organizer or attendee via uid)
  cancel: publicProcedure
    .input(
      z.object({
        uid: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.update({
        where: { uid: input.uid },
        data: {
          status: "CANCELLED",
          cancellationReason: input.reason,
        },
      });

      // TODO: Send cancellation email

      return booking;
    }),
});
