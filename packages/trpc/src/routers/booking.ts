import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { emailService, type BookingEmailData } from "@zakazi-termin/emails";

// Helper to extract location from event type
function getLocationString(locations: unknown): string | null {
  if (!locations) return null;
  try {
    const locs = Array.isArray(locations) ? locations : JSON.parse(String(locations));
    if (Array.isArray(locs) && locs[0]?.address) {
      return locs[0].address;
    }
  } catch {
    // If it's already a string
    if (typeof locations === "string") return locations;
  }
  return null;
}

// Helper to build email data from booking
function buildEmailData(
  booking: {
    uid: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    location: string | null;
    cancellationReason?: string | null;
    rejectionReason?: string | null;
    eventType: {
      title: string;
      length: number;
      locations: unknown;
    } | null;
    user: {
      name: string | null;
      email: string;
    } | null;
    attendees: Array<{
      name: string;
      email: string;
      phoneNumber: string | null;
    }>;
  },
  rescheduledFromDate?: Date | null
): BookingEmailData {
  const attendee = booking.attendees[0];
  return {
    bookingUid: booking.uid,
    bookingTitle: booking.title,
    bookingDescription: booking.description,
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: booking.location || getLocationString(booking.eventType?.locations),
    eventTypeTitle: booking.eventType?.title || booking.title,
    eventTypeDuration: booking.eventType?.length || 30,
    organizerName: booking.user?.name || "Organizator",
    organizerEmail: booking.user?.email || "",
    attendeeName: attendee?.name || "Klijent",
    attendeeEmail: attendee?.email || "",
    attendeePhone: attendee?.phoneNumber,
    attendeeNotes: booking.description,
    cancellationReason: booking.cancellationReason,
    rejectionReason: booking.rejectionReason,
    rescheduledFromDate,
  };
}

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
          location: getLocationString(eventType.locations),
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

      // Send email notifications
      try {
        const emailData = buildEmailData(booking);
        await emailService.sendNewBookingEmails(emailData, status === "PENDING");
      } catch (error) {
        console.error("Failed to send booking emails:", error);
        // Don't throw - booking was created successfully
      }

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

      // Send confirmation email to attendee
      try {
        const emailData = buildEmailData(booking);
        await emailService.sendBookingConfirmed(emailData);
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      }

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

      // Send rejection email
      try {
        const emailData = buildEmailData(booking);
        await emailService.sendBookingRejected(emailData);
      } catch (error) {
        console.error("Failed to send rejection email:", error);
      }

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

      // Send cancellation emails
      try {
        const emailData = buildEmailData(booking);
        await emailService.sendBookingCancellationEmails(emailData);
      } catch (error) {
        console.error("Failed to send cancellation emails:", error);
      }

      return booking;
    }),

  // Reschedule a booking
  reschedule: publicProcedure
    .input(
      z.object({
        uid: z.string(),
        newStartTime: z.date(),
        newEndTime: z.date(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get original booking
      const originalBooking = await ctx.prisma.booking.findUnique({
        where: { uid: input.uid },
        include: {
          eventType: true,
          user: true,
          attendees: true,
        },
      });

      if (!originalBooking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Termin nije pronađen.",
        });
      }

      if (originalBooking.status === "CANCELLED" || originalBooking.status === "REJECTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nije moguće promeniti otkazani ili odbijeni termin.",
        });
      }

      // Check for conflicts with new time
      const conflictingBooking = await ctx.prisma.booking.findFirst({
        where: {
          userId: originalBooking.userId,
          status: { in: ["PENDING", "ACCEPTED"] },
          id: { not: originalBooking.id },
          OR: [
            {
              startTime: { lt: input.newEndTime },
              endTime: { gt: input.newStartTime },
            },
          ],
        },
      });

      if (conflictingBooking) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Novi termin nije dostupan.",
        });
      }

      const originalStartTime = originalBooking.startTime;

      // Update booking with new time
      const updatedBooking = await ctx.prisma.booking.update({
        where: { uid: input.uid },
        data: {
          startTime: input.newStartTime,
          endTime: input.newEndTime,
          rescheduled: true,
          fromReschedule: originalBooking.uid,
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

      // Send reschedule emails
      try {
        const emailData = buildEmailData(updatedBooking, originalStartTime);
        await emailService.sendBookingRescheduleEmails(emailData);
      } catch (error) {
        console.error("Failed to send reschedule emails:", error);
      }

      return updatedBooking;
    }),

  // Request reschedule (for attendees to request a new time)
  requestReschedule: publicProcedure
    .input(
      z.object({
        uid: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { uid: input.uid },
        include: {
          user: true,
          attendees: true,
          eventType: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Termin nije pronađen.",
        });
      }

      // For now, just return the booking URL for the user to reschedule
      // In a full implementation, this would send an email to organizer
      return {
        success: true,
        message: "Zahtev za promenu termina je poslat.",
        rescheduleUrl: `/${booking.user?.username}/${booking.eventType?.slug}?rescheduleUid=${booking.uid}`,
      };
    }),
});
