import { randomBytes } from "node:crypto";
import { emailService } from "@salonko/emails";
import { MembershipRole } from "@salonko/prisma";
import { protectedProcedure, publicProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const MAX_BULK_INVITES = 50;

export const teamRouter = router({
  /**
   * Invite member(s) by email
   * Creates a verification token and should trigger an email send
   */
  inviteMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        emails: z.union([
          z.string().email("Email adresa nije validna"),
          z
            .array(z.string().email("Email adresa nije validna"))
            .max(MAX_BULK_INVITES, `Možete pozvati najviše ${MAX_BULK_INVITES} korisnika odjednom`),
        ]),
        role: z.nativeEnum(MembershipRole).default(MembershipRole.MEMBER),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is OWNER or ADMIN
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
        include: {
          organization: {
            select: { name: true },
          },
          user: {
            select: { name: true },
          },
        },
      });

      if (
        !membership ||
        !membership.accepted ||
        (membership.role !== MembershipRole.OWNER && membership.role !== MembershipRole.ADMIN)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nemate dozvolu za pozivanje članova.",
        });
      }

      // ADMINs cannot invite OWNERs or other ADMINs
      if (
        membership.role === MembershipRole.ADMIN &&
        (input.role === MembershipRole.OWNER || input.role === MembershipRole.ADMIN)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Administratori mogu pozivati samo članove.",
        });
      }

      const emails = Array.isArray(input.emails) ? input.emails : [input.emails];
      const results: { email: string; status: "invited" | "already_member" | "already_invited" }[] =
        [];

      for (const email of emails) {
        // Check if user with this email already exists and is a member
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingUser) {
          const existingMembership = await ctx.prisma.membership.findUnique({
            where: {
              userId_organizationId: {
                userId: existingUser.id,
                organizationId: input.organizationId,
              },
            },
          });

          if (existingMembership) {
            results.push({ email, status: "already_member" });
            continue;
          }
        }

        // Check if there's already a pending invitation for this email
        const existingInvite = await ctx.prisma.verificationToken.findFirst({
          where: {
            organizationId: input.organizationId,
            invitedEmail: email,
            expires: { gte: new Date() },
          },
        });

        if (existingInvite) {
          results.push({ email, status: "already_invited" });
          continue;
        }

        // Create invitation token
        const token = randomBytes(32).toString("hex");
        const expiresInDays = 7;

        await ctx.prisma.verificationToken.create({
          data: {
            identifier: email,
            token,
            expires: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
            expiresInDays,
            organizationId: input.organizationId,
            invitedEmail: email,
            invitedRole: input.role,
          },
        });

        // Send email invitation - rollback token on failure
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        try {
          await emailService.sendTeamInviteEmail({
            recipientEmail: email,
            organizationName: membership.organization.name,
            inviterName: membership.user.name || "Član tima",
            inviteUrl: `${baseUrl}/signup?token=${token}`,
            role: input.role,
          });
        } catch (emailError) {
          // Rollback: delete the created token since email failed
          await ctx.prisma.verificationToken.delete({
            where: {
              identifier_token: {
                identifier: email,
                token,
              },
            },
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Neuspešno slanje pozivnice na ${email}. Pokušajte ponovo.`,
            cause: emailError,
          });
        }

        results.push({ email, status: "invited" });
      }

      return {
        results,
        organizationName: membership.organization.name,
      };
    }),

  /**
   * Generate a shareable invite link (not tied to specific email)
   */
  createInviteLink: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        expiresInDays: z.number().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is OWNER or ADMIN
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (
        !membership ||
        !membership.accepted ||
        (membership.role !== MembershipRole.OWNER && membership.role !== MembershipRole.ADMIN)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nemate dozvolu za kreiranje pozivnica.",
        });
      }

      const token = randomBytes(32).toString("hex");

      await ctx.prisma.verificationToken.create({
        data: {
          identifier: `invite-link-for-org-${input.organizationId}`,
          token,
          expires: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
          expiresInDays: input.expiresInDays,
          organizationId: input.organizationId,
          // No invitedEmail - this is a general invite link
          invitedRole: MembershipRole.MEMBER,
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return {
        token,
        inviteLink: `${baseUrl}/signup?token=${token}`,
        expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
      };
    }),

  /**
   * Accept an invitation by token
   */
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userEmail = ctx.session.user.email;

      // Find the verification token
      const verificationToken = await ctx.prisma.verificationToken.findFirst({
        where: {
          token: input.token,
          expires: { gte: new Date() },
        },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      });

      if (!verificationToken || !verificationToken.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pozivnica nije pronađena ili je istekla.",
        });
      }

      // If this is an email-specific invite, verify the email matches
      if (verificationToken.invitedEmail && verificationToken.invitedEmail !== userEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ova pozivnica je namenjena drugom korisniku.",
        });
      }

      // Check if user is already a member
      const existingMembership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: verificationToken.organizationId,
          },
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Već ste član ove organizacije.",
        });
      }

      // Create membership
      await ctx.prisma.membership.create({
        data: {
          userId,
          organizationId: verificationToken.organizationId,
          role: verificationToken.invitedRole || MembershipRole.MEMBER,
          accepted: true,
        },
      });

      // Only delete email-specific invites after use
      // General invite links (without invitedEmail) remain reusable
      if (verificationToken.invitedEmail) {
        await ctx.prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: verificationToken.identifier,
              token: verificationToken.token,
            },
          },
        });
      }

      return {
        organizationId: verificationToken.organizationId,
        organizationName: verificationToken.organization?.name || "Organizacija",
      };
    }),

  /**
   * List organization members
   */
  listMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is a member of this organization
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership || !membership.accepted) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Niste član ove organizacije.",
        });
      }

      const members = await ctx.prisma.membership.findMany({
        where: {
          organizationId: input.organizationId,
          accepted: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              salonName: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      });

      return members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        salonName: m.user.salonName,
        role: m.role,
        joinedAt: m.createdAt,
      }));
    }),

  /**
   * Change member's role (OWNER only)
   */
  changeMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        memberId: z.string(),
        role: z.nativeEnum(MembershipRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is OWNER
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership || !membership.accepted || membership.role !== MembershipRole.OWNER) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Samo vlasnik može menjati uloge članova.",
        });
      }

      // Cannot change own role
      if (input.memberId === membership.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ne možete promeniti sopstvenu ulogu.",
        });
      }

      // Get target membership
      const targetMembership = await ctx.prisma.membership.findUnique({
        where: { id: input.memberId },
      });

      if (!targetMembership || targetMembership.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Član nije pronađen.",
        });
      }

      // Cannot have multiple owners
      if (input.role === MembershipRole.OWNER) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organizacija može imati samo jednog vlasnika.",
        });
      }

      const updated = await ctx.prisma.membership.update({
        where: { id: input.memberId },
        data: { role: input.role },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      return {
        id: updated.id,
        role: updated.role,
        userName: updated.user.name,
        userEmail: updated.user.email,
      };
    }),

  /**
   * Remove a member from organization (OWNER/ADMIN only)
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is OWNER or ADMIN
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (
        !membership ||
        !membership.accepted ||
        (membership.role !== MembershipRole.OWNER && membership.role !== MembershipRole.ADMIN)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nemate dozvolu za uklanjanje članova.",
        });
      }

      // Get target membership
      const targetMembership = await ctx.prisma.membership.findUnique({
        where: { id: input.memberId },
      });

      if (!targetMembership || targetMembership.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Član nije pronađen.",
        });
      }

      // Cannot remove self
      if (targetMembership.userId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ne možete ukloniti sebe. Koristite opciju za napuštanje organizacije.",
        });
      }

      // Cannot remove OWNER
      if (targetMembership.role === MembershipRole.OWNER) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ne možete ukloniti vlasnika organizacije.",
        });
      }

      // ADMINs can only remove MEMBERs
      if (
        membership.role === MembershipRole.ADMIN &&
        targetMembership.role !== MembershipRole.MEMBER
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Administratori mogu ukloniti samo članove.",
        });
      }

      await ctx.prisma.membership.delete({
        where: { id: input.memberId },
      });

      return { success: true };
    }),

  /**
   * Leave organization (for members who aren't OWNER)
   */
  leave: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Niste član ove organizacije.",
        });
      }

      // OWNER cannot leave (must transfer ownership first)
      if (membership.role === MembershipRole.OWNER) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vlasnik ne može napustiti organizaciju. Prenesite vlasništvo na drugog člana.",
        });
      }

      await ctx.prisma.membership.delete({
        where: { id: membership.id },
      });

      return { success: true };
    }),

  /**
   * List pending invitations (OWNER/ADMIN only)
   */
  listInvites: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is OWNER or ADMIN
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (
        !membership ||
        !membership.accepted ||
        (membership.role !== MembershipRole.OWNER && membership.role !== MembershipRole.ADMIN)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nemate dozvolu za pregled pozivnica.",
        });
      }

      const invites = await ctx.prisma.verificationToken.findMany({
        where: {
          organizationId: input.organizationId,
          expires: { gte: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      return invites.map((invite) => ({
        token: invite.token,
        email: invite.invitedEmail,
        role: invite.invitedRole,
        expiresAt: invite.expires,
        createdAt: invite.createdAt,
        isGeneralLink: !invite.invitedEmail,
      }));
    }),

  /**
   * Resend invitation email
   */
  resendInvite: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is OWNER or ADMIN
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
        include: {
          organization: { select: { name: true } },
          user: { select: { name: true } },
        },
      });

      if (
        !membership ||
        !membership.accepted ||
        (membership.role !== MembershipRole.OWNER && membership.role !== MembershipRole.ADMIN)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nemate dozvolu za slanje pozivnica.",
        });
      }

      // Find the existing invite
      const existingInvite = await ctx.prisma.verificationToken.findFirst({
        where: {
          organizationId: input.organizationId,
          invitedEmail: input.email,
          expires: { gte: new Date() },
        },
      });

      if (!existingInvite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pozivnica nije pronađena ili je istekla.",
        });
      }

      // Send email invitation
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await emailService.sendTeamInviteEmail({
        recipientEmail: input.email,
        organizationName: membership.organization.name,
        inviterName: membership.user.name || "Član tima",
        inviteUrl: `${baseUrl}/signup?token=${existingInvite.token}`,
        role: existingInvite.invitedRole || MembershipRole.MEMBER,
      });

      return { success: true };
    }),

  /**
   * Delete/cancel a pending invite
   */
  deleteInvite: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is OWNER or ADMIN
      const membership = await ctx.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (
        !membership ||
        !membership.accepted ||
        (membership.role !== MembershipRole.OWNER && membership.role !== MembershipRole.ADMIN)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nemate dozvolu za brisanje pozivnica.",
        });
      }

      // Find and delete the invite
      const invite = await ctx.prisma.verificationToken.findFirst({
        where: {
          token: input.token,
          organizationId: input.organizationId,
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pozivnica nije pronađena.",
        });
      }

      await ctx.prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: invite.identifier,
            token: invite.token,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Get invitation info by token (public, for signup page)
   */
  getInviteInfo: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.prisma.verificationToken.findFirst({
        where: {
          token: input.token,
          expires: { gte: new Date() },
        },
        include: {
          organization: {
            select: { name: true, slug: true },
          },
        },
      });

      if (!invite || !invite.organizationId) {
        return null;
      }

      return {
        organizationName: invite.organization?.name,
        organizationSlug: invite.organization?.slug,
        email: invite.invitedEmail,
        role: invite.invitedRole,
        expiresAt: invite.expires,
      };
    }),
});
