import { randomUUID } from "node:crypto";
import { protectedProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { encryptToken } from "../lib/messaging-crypto";

const PLATFORMS = ["whatsapp", "viber"] as const;

export const messagingChannelRouter = router({
  /** List messaging channels owned by the current user. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const channels = await ctx.prisma.messagingChannel.findMany({
      where: { salonUserId: ctx.session.user.id },
      select: {
        id: true,
        platform: true,
        externalId: true,
        botName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return channels;
  }),

  /**
   * Link a WhatsApp phone_number_id to this salon. The access token (from the
   * salon owner's own Meta app) is encrypted at rest and used to send outgoing
   * replies, so each salon is self-serve.
   */
  createWhatsApp: protectedProcedure
    .input(
      z.object({
        phoneNumberId: z
          .string()
          .trim()
          .min(1, "Phone number ID je obavezan")
          .regex(/^\d+$/, "Phone number ID mora sadržati samo brojeve"),
        accessToken: z.string().trim().min(10, "Access token je obavezan"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.messagingChannel.findUnique({
        where: {
          platform_externalId: { platform: "whatsapp", externalId: input.phoneNumberId },
        },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ovaj WhatsApp broj je već povezan sa drugim salonom.",
        });
      }
      return ctx.prisma.messagingChannel.create({
        data: {
          platform: "whatsapp",
          externalId: input.phoneNumberId,
          salonUserId: ctx.session.user.id,
          authTokenEnc: encryptToken(input.accessToken),
        },
        select: { id: true, platform: true, externalId: true, botName: true, createdAt: true },
      });
    }),

  /**
   * Create a Viber channel. Server generates the channelId (URL segment the
   * salon owner pastes into Viber console) and encrypts the auth token at
   * rest.
   */
  createViber: protectedProcedure
    .input(
      z.object({
        authToken: z.string().trim().min(10, "Auth token je obavezan"),
        botName: z.string().trim().min(1).max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const channelId = randomUUID();
      const authTokenEnc = encryptToken(input.authToken);
      return ctx.prisma.messagingChannel.create({
        data: {
          platform: "viber",
          externalId: channelId,
          salonUserId: ctx.session.user.id,
          authTokenEnc,
          botName: input.botName,
        },
        select: { id: true, platform: true, externalId: true, botName: true, createdAt: true },
      });
    }),

  /** Delete a channel owned by the current user. */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.prisma.messagingChannel.findUnique({
        where: { id: input.id },
        select: { salonUserId: true },
      });
      if (!channel || channel.salonUserId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kanal nije pronađen." });
      }
      await ctx.prisma.messagingChannel.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

export type MessagingPlatform = (typeof PLATFORMS)[number];
