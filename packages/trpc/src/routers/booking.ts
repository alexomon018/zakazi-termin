import { logger } from "@salonko/config";
import { type BookingEmailData, emailService } from "@salonko/emails";
import type { Context } from "@salonko/trpc/context";
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

// Helper to build booking where clause based on user's role
// - OWNER/ADMIN: see all bookings in their organization
// - MEMBER or solo user: see only their own bookings + assigned bookings
async function buildBookingWhereClause(
  prisma: Context["prisma"],
  userId: string
): Promise<{ OR: Array<Record<string, unknown>> }> {
  // Check if user is OWNER or ADMIN of an organization
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      accepted: true,
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: {
      organizationId: true,
      role: true,
    },
  });

  if (membership) {
    // OWNER/ADMIN: see bookings from all organization members
    return {
      OR: [
        // Direct ownership
        { userId: userId },
        // Assigned as host
        { assignedHostId: userId },
        // Bookings from any organization member (event types owned by org members)
        {
          user: {
            memberships: {
              some: {
                organizationId: membership.organizationId,
                accepted: true,
              },
            },
          },
        },
      ],
    };
  }

  // Regular user or MEMBER: only their own bookings + assigned bookings
  return {
    OR: [{ userId: userId }, { assignedHostId: userId }],
  };
}

// Helper to build event type where clause based on user's role
async function buildEventTypeWhereClause(
  prisma: Context["prisma"],
  userId: string
): Promise<Record<string, unknown>> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      accepted: true,
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: {
      organizationId: true,
    },
  });

  if (membership) {
    return {
      user: {
        memberships: {
          some: {
            organizationId: membership.organizationId,
            accepted: true,
          },
        },
      },
    };
  }

  return { userId };
}

export const bookingRouter = router({
  // Dashboard stats for the current user
  // Returns counts for today's bookings, upcoming bookings, and event types
  dashboardStats: subscriptionProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [bookingWhere, eventTypeWhere] = await Promise.all([
      buildBookingWhereClause(ctx.prisma, userId),
      buildEventTypeWhereClause(ctx.prisma, userId),
    ]);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [upcomingBookings, eventTypes, todayBookings] = await Promise.all([
      ctx.prisma.booking.count({
        where: {
          ...bookingWhere,
          startTime: { gte: now },
          status: { in: ["ACCEPTED", "PENDING"] },
        },
      }),
      ctx.prisma.eventType.count({
        where: eventTypeWhere,
      }),
      ctx.prisma.booking.count({
        where: {
          ...bookingWhere,
          startTime: { gte: todayStart, lt: todayEnd },
          status: { in: ["ACCEPTED", "PENDING"] },
        },
      }),
    ]);

    return {
      upcomingBookings,
      eventTypes,
      todayBookings,
    };
  }),

  // Get upcoming bookings with pagination
  // Shows bookings where user is owner OR assigned host (for team members)
  // For OWNER/ADMIN: shows all bookings from organization members
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
      const userId = ctx.session.user.id;

      // Build where clause based on user's role
      const roleBasedWhere = await buildBookingWhereClause(ctx.prisma, userId);

      // Include bookings where user is owner OR assigned host OR organization member (for owners/admins)
      const baseWhere = {
        startTime: { gte: new Date() },
        status: { in: ["ACCEPTED", "PENDING"] as ("ACCEPTED" | "PENDING")[] },
        ...roleBasedWhere,
      };

      const [bookings, total] = await Promise.all([
        ctx.prisma.booking.findMany({
          where: baseWhere,
          include: {
            eventType: true,
            attendees: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedHost: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { startTime: "asc" },
          skip,
          take,
        }),
        ctx.prisma.booking.count({
          where: baseWhere,
        }),
      ]);

      return {
        bookings,
        total,
        hasMore: skip + bookings.length < total,
      };
    }),

  // List bookings for current user
  // Shows bookings where user is owner OR assigned host (for team members)
  // For OWNER/ADMIN: shows all bookings from organization members
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
      const userId = ctx.session.user.id;

      // Build where clause based on user's role
      const roleBasedWhere = await buildBookingWhereClause(ctx.prisma, userId);

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          ...roleBasedWhere,
          ...(input?.status && { status: input.status }),
          ...(input?.dateFrom && { startTime: { gte: input.dateFrom } }),
          ...(input?.dateTo && { endTime: { lte: input.dateTo } }),
        },
        include: {
          eventType: true,
          attendees: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedHost: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
      });
      return bookings;
    }),

  // List bookings with pagination
  // Shows bookings where user is owner OR assigned host (for team members)
  // For OWNER/ADMIN: shows all bookings from organization members
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
      const userId = ctx.session.user.id;

      // Build where clause based on user's role
      const roleBasedWhere = await buildBookingWhereClause(ctx.prisma, userId);

      const where = {
        ...roleBasedWhere,
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
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedHost: {
              select: {
                id: true,
                name: true,
              },
            },
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
            memberships: {
              where: { accepted: true },
              select: {
                organization: {
                  select: { slug: true },
                },
              },
              take: 1,
            },
          },
        },
        attendees: true,
      },
    });

    if (!booking) return null;

    // Compute the booking slug for URL construction
    const bookingSlug =
      booking.user?.salonName || booking.user?.memberships?.[0]?.organization?.slug || null;

    return {
      ...booking,
      bookingSlug,
    };
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
        hostUserId: z.string().optional(), // Optional: specific staff member for team bookings
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use transaction with serializable isolation to prevent race conditions
      const booking = await ctx.prisma.$transaction(
        async (tx) => {
          // Get event type with user and hosts
          const eventType = await tx.eventType.findUnique({
            where: { id: input.eventTypeId },
            include: {
              user: true,
              hosts: true,
            },
          });

          if (!eventType) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Tip događaja nije pronađen.",
            });
          }

          // Validate hostUserId if provided
          let assignedHostId: string | null = null;
          if (input.hostUserId) {
            // Check if the host is valid for this event type
            const validHost = eventType.hosts.find((h) => h.userId === input.hostUserId);
            if (!validHost) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Izabrani zaposleni nije dostupan za ovu uslugu.",
              });
            }
            assignedHostId = input.hostUserId;
          }

          // Determine which user's bookings to check for conflicts
          const conflictUserId = assignedHostId || eventType.userId;

          // Check for conflicts within transaction
          // For team bookings, check the assigned host's schedule
          const conflictingBooking = await tx.booking.findFirst({
            where: {
              status: { in: ["PENDING", "ACCEPTED"] },
              OR: [
                {
                  startTime: { lt: input.endTime },
                  endTime: { gt: input.startTime },
                },
              ],
              // Check conflicts for the specific host or owner
              ...(assignedHostId
                ? { assignedHostId: assignedHostId }
                : { userId: conflictUserId, assignedHostId: null }),
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
              assignedHostId: assignedHostId,
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
              assignedHost: {
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
  // Can be done by owner OR assigned host
  confirm: protectedProcedure
    .input(z.object({ uid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // First check if user has permission (owner or assigned host)
      const existingBooking = await ctx.prisma.booking.findFirst({
        where: {
          uid: input.uid,
          OR: [{ userId: userId }, { assignedHostId: userId }],
        },
      });

      if (!existingBooking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Termin nije pronađen ili nemate dozvolu za ovu akciju.",
        });
      }

      const booking = await ctx.prisma.booking.update({
        where: { uid: input.uid },
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
  // Can be done by owner OR assigned host
  reject: protectedProcedure
    .input(
      z.object({
        uid: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // First check if user has permission (owner or assigned host)
      const existingBooking = await ctx.prisma.booking.findFirst({
        where: {
          uid: input.uid,
          OR: [{ userId: userId }, { assignedHostId: userId }],
        },
      });

      if (!existingBooking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Termin nije pronađen ili nemate dozvolu za ovu akciju.",
        });
      }

      const booking = await ctx.prisma.booking.update({
        where: { uid: input.uid },
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
          user: {
            include: {
              memberships: {
                where: { accepted: true },
                include: {
                  organization: {
                    select: { slug: true },
                  },
                },
                take: 1,
              },
            },
          },
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

      // Get booking slug: use salonName for owners, or organization slug for team members
      const bookingSlug =
        booking.user?.salonName || booking.user?.memberships?.[0]?.organization?.slug;

      // For now, just return the booking URL for the user to reschedule
      // In a full implementation, this would send an email to organizer
      return {
        success: true,
        message: "Zahtev za promenu termina je poslat.",
        rescheduleUrl: `/${bookingSlug}/${booking.eventType?.slug}?rescheduleUid=${booking.uid}`,
      };
    }),
});
