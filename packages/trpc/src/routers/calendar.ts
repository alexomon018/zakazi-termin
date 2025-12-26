import {
  GoogleCalendarService,
  type GoogleCredential,
  googleCredentialSchema,
} from "@salonko/calendar";
import { logger } from "@salonko/config";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const calendarRouter = router({
  // List connected calendars (credentials)
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const credentials = await ctx.prisma.credential.findMany({
      where: {
        userId: ctx.session.user.id,
        type: "google_calendar",
        invalid: { not: true },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        selectedCalendars: {
          select: {
            externalId: true,
          },
        },
      },
    });

    return credentials.map((cred) => ({
      id: cred.id,
      type: cred.type,
      createdAt: cred.createdAt,
      calendarsCount: cred.selectedCalendars.length,
    }));
  }),

  // List calendars from a connected account
  listCalendars: protectedProcedure
    .input(z.object({ credentialId: z.number() }))
    .query(async ({ ctx, input }) => {
      const credential = await ctx.prisma.credential.findFirst({
        where: {
          id: input.credentialId,
          userId: ctx.session.user.id,
          type: "google_calendar",
        },
      });

      if (!credential) {
        throw new Error("Credential not found");
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error("Google Calendar not configured");
      }

      const key = googleCredentialSchema.parse(credential.key);

      const service = new GoogleCalendarService(
        { id: credential.id, userId: credential.userId, key },
        clientId,
        clientSecret
      );

      // Refresh token if needed
      const newKey = await service.refreshTokenIfNeeded();
      if (newKey) {
        await ctx.prisma.credential.update({
          where: { id: credential.id },
          data: { key: newKey as unknown as object },
        });
      }

      const calendars = await service.listCalendars();

      // Get selected calendars for this user
      const selectedCalendars = await ctx.prisma.selectedCalendar.findMany({
        where: {
          userId: ctx.session.user.id,
          integration: "google_calendar",
        },
      });

      const selectedIds = new Set(selectedCalendars.map((sc) => sc.externalId));

      return calendars.map((cal) => ({
        ...cal,
        selected: selectedIds.has(cal.externalId),
      }));
    }),

  // Toggle calendar selection
  toggleCalendarSelection: protectedProcedure
    .input(
      z.object({
        credentialId: z.number(),
        externalId: z.string(),
        selected: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify credential belongs to user
      const credential = await ctx.prisma.credential.findFirst({
        where: {
          id: input.credentialId,
          userId: ctx.session.user.id,
        },
      });

      if (!credential) {
        throw new Error("Credential not found");
      }

      if (input.selected) {
        await ctx.prisma.selectedCalendar.upsert({
          where: {
            userId_integration_externalId: {
              userId: ctx.session.user.id,
              integration: "google_calendar",
              externalId: input.externalId,
            },
          },
          update: {
            credentialId: input.credentialId,
          },
          create: {
            userId: ctx.session.user.id,
            integration: "google_calendar",
            externalId: input.externalId,
            credentialId: input.credentialId,
          },
        });
      } else {
        await ctx.prisma.selectedCalendar.delete({
          where: {
            userId_integration_externalId: {
              userId: ctx.session.user.id,
              integration: "google_calendar",
              externalId: input.externalId,
            },
          },
        });
      }

      return { success: true };
    }),

  // Disconnect calendar (delete credential)
  disconnect: protectedProcedure
    .input(z.object({ credentialId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.credential.delete({
        where: {
          id: input.credentialId,
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    }),

  // Get busy times from connected calendars
  getBusyTimes: protectedProcedure
    .input(
      z.object({
        dateFrom: z.date(),
        dateTo: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all google calendar credentials for user
      const credentials = await ctx.prisma.credential.findMany({
        where: {
          userId: ctx.session.user.id,
          type: "google_calendar",
          invalid: { not: true },
        },
        include: {
          selectedCalendars: true,
        },
      });

      if (credentials.length === 0) {
        return [];
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return [];
      }

      const allBusyTimes: { start: string; end: string }[] = [];

      for (const credential of credentials) {
        try {
          const key = googleCredentialSchema.parse(credential.key);
          const service = new GoogleCalendarService(
            { id: credential.id, userId: credential.userId, key },
            clientId,
            clientSecret
          );

          // Refresh token if needed
          const newKey = await service.refreshTokenIfNeeded();
          if (newKey) {
            await ctx.prisma.credential.update({
              where: { id: credential.id },
              data: { key: newKey as unknown as object },
            });
          }

          const selectedCalendarIds = credential.selectedCalendars.map((sc) => sc.externalId);

          const busyTimes = await service.getAvailability(
            input.dateFrom.toISOString(),
            input.dateTo.toISOString(),
            selectedCalendarIds
          );

          allBusyTimes.push(...busyTimes);
        } catch (error) {
          logger.error("Failed to get busy times from credential", {
            error,
            credentialId: credential.id,
          });
          // Mark credential as invalid
          await ctx.prisma.credential.update({
            where: { id: credential.id },
            data: { invalid: true },
          });
        }
      }

      return allBusyTimes;
    }),
});
