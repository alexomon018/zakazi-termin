import { logger } from "@salonko/config";
import { type BookingEmailData, emailService } from "@salonko/emails";
import {
  protectedProcedure,
  publicProcedure,
  router,
  subscriptionProtectedProcedure,
} from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
  // Get upcoming bookings with pagination
  upcoming: subscriptionProtectedProcedure
    .input(
      z
        .object({
          skip: z.number().default(0),
          take: z.number().default(5),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const skip = input?.skip ?? 0;
      const take = input?.take ?? 5;

      const [bookings, total] = await Promise.all([
        ctx.prisma.booking.findMany({
          where: {
            userId: ctx.session.user.id,
            startTime: { gte: new Date() },
            status: { in: ["ACCEPTED", "PENDING"] },
          },
          include: {
            eventType: true,
            attendees: true,
          },
          orderBy: { startTime: "asc" },
          skip,
          take,
        }),
        ctx.prisma.booking.count({
          where: {
            userId: ctx.session.user.id,
            startTime: { gte: new Date() },
            status: { in: ["ACCEPTED", "PENDING"] },
          },
        }),
      ]);

      return {
        bookings,
        total,
        hasMore: skip + bookings.length < total,
      };
    }),

  // List bookings for current user
  list: subscriptionProtectedProcedure
    .input(
      z
        .object({
          status: z.enum(["PENDING", "ACCEPTED", "CANCELLED", "REJECTED"]).optional(),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
        })
        .optional()
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

  // List bookings with pagination
  listPaginated: subscriptionProtectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "CANCELLED", "REJECTED"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        skip: z.number().default(0),
        take: z.number().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        userId: ctx.session.user.id,
        ...(input.status && { status: input.status }),
        ...(input.dateFrom && { startTime: { gte: input.dateFrom } }),
        ...(input.dateTo && { endTime: { lte: input.dateTo } }),
      };

      const [bookings, total] = await Promise.all([
        ctx.prisma.booking.findMany({
          where,
          include: {
            eventType: true,
            attendees: true,
          },
          orderBy: { startTime: input.dateTo ? "desc" : "asc" },
          skip: input.skip,
          take: input.take,
        }),
        ctx.prisma.booking.count({ where }),
      ]);

      return {
        bookings,
        total,
        hasMore: input.skip + bookings.length < total,
      };
    }),

  // Get single booking
  byUid: publicProcedure.input(z.object({ uid: z.string() })).query(async ({ ctx, input }) => {
    const booking = await ctx.prisma.booking.findUnique({
      where: { uid: input.uid },
      include: {
        eventType: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            salonName: true,
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
        eventTypeId: z.string(),
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
      // Use transaction with serializable isolation to prevent race conditions
      const booking = await ctx.prisma.$transaction(
        async (tx) => {
          // Get event type with user
          const eventType = await tx.eventType.findUnique({
            where: { id: input.eventTypeId },
            include: { user: true },
          });

          if (!eventType) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Tip događaja nije pronađen.",
            });
          }

          // Check for conflicts within transaction
          const conflictingBooking = await tx.booking.findFirst({
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
          return tx.booking.create({
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
        },
        {
          isolationLevel: "Serializable",
        }
      );

      // Send email notifications outside transaction
      try {
        const emailData = buildEmailData(booking);
        const status = booking.status === "PENDING";
        await emailService.sendNewBookingEmails(emailData, status);
      } catch (error) {
        logger.error("Failed to send booking emails", { error, bookingUid: booking.uid });
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
        logger.error("Failed to send confirmation email", { error, bookingUid: booking.uid });
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
        logger.error("Failed to send rejection email", { error, bookingUid: booking.uid });
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
        logger.error("Failed to send cancellation emails", { error, bookingUid: booking.uid });
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
      // Use transaction with serializable isolation to prevent race conditions
      const { updatedBooking, originalStartTime } = await ctx.prisma.$transaction(
        async (tx) => {
          // Get original booking
          const originalBooking = await tx.booking.findUnique({
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

          // Check for conflicts with new time within transaction
          const conflictingBooking = await tx.booking.findFirst({
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

          // Update booking with new time
          const updated = await tx.booking.update({
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

          return { updatedBooking: updated, originalStartTime: originalBooking.startTime };
        },
        {
          isolationLevel: "Serializable",
        }
      );

      // Send reschedule emails outside transaction
      try {
        const emailData = buildEmailData(updatedBooking, originalStartTime);
        await emailService.sendBookingRescheduleEmails(emailData);
      } catch (error) {
        logger.error("Failed to send reschedule emails", { error, bookingUid: updatedBooking.uid });
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
        rescheduleUrl: `/${booking.user?.salonName}/${booking.eventType?.slug}?rescheduleUid=${booking.uid}`,
      };
    }),
});
