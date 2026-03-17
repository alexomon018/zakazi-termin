import { normalizeToSlug } from "@salonko/config";
import { MembershipRole, Prisma } from "@salonko/prisma";
import { protectedProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { requireOrganizationAdmin, requireOrganizationMember } from "../lib/permissions";

type SlugLookup = {
  organization: {
    findUnique: (args: { where: { slug: string }; select: { id: boolean } }) => Promise<{
      id: string;
    } | null>;
  };
};

async function findUniqueSlug(
  prisma: SlugLookup,
  baseSlug: string,
  maxAttempts = 10
): Promise<string> {
  const existing = await prisma.organization.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) return baseSlug;

  for (let i = 2; i <= maxAttempts + 1; i++) {
    const candidate = `${baseSlug}-${i}`;
    const found = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!found) return candidate;
  }

  // Fallback: append timestamp fragment
  return `${baseSlug}-${Date.now().toString(36).slice(-6)}`;
}

export const organizationRouter = router({
  /**
   * Create a new organization (user becomes OWNER)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Naziv je obavezan"),
        slug: z
          .string()
          .min(3, "Slug mora imati najmanje 3 karaktera")
          .regex(/^[a-z0-9-]+$/, "Slug može sadržati samo mala slova, brojeve i crtice")
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const baseSlug = input.slug || normalizeToSlug(input.name);

      if (!baseSlug || baseSlug.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Naziv organizacije ne može da generiše validan slug. Naziv mora sadržati slova ili brojeve, ili unesite slug ručno.",
        });
      }

      // Retry loop handles race conditions: slug check + insert run inside the
      // same transaction, and if a concurrent request grabs the slug between
      // findUniqueSlug and create, we retry with fresh lookup.
      const MAX_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const organization = await ctx.prisma.$transaction(async (tx) => {
            const slug = await findUniqueSlug(tx, baseSlug);

            const org = await tx.organization.create({
              data: {
                name: input.name,
                slug,
              },
            });

            await tx.membership.create({
              data: {
                userId,
                organizationId: org.id,
                role: MembershipRole.OWNER,
                accepted: true,
              },
            });

            return org;
          });

          return organization;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const target = error.meta?.target as string[] | string | undefined;
            const targets = Array.isArray(target) ? target : target ? [target] : [];

            // Membership duplicate (userId + organizationId) — user is already a member
            if (targets.includes("userId") && targets.includes("organizationId")) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Već ste član ove organizacije.",
              });
            }

            // Owner duplicate (ownerId field) — user already owns an organization
            if (targets.some((t) => t.includes("owner") || t.includes("ownerId"))) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Već imate organizaciju.",
              });
            }

            // Slug collision from race condition — retry
            if (targets.some((t) => t.includes("slug"))) {
              if (attempt < MAX_RETRIES - 1) continue;

              throw new TRPCError({
                code: "CONFLICT",
                message: "Nije moguće kreirati organizaciju. Pokušajte ponovo.",
              });
            }

            // Unknown P2002 — do not retry
            throw error;
          }

          throw error;
        }
      }

      // Unreachable, but satisfies TypeScript
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Neočekivana greška." });
    }),

  /**
   * Get current user's organization (as owner or member)
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const membership = await ctx.prisma.membership.findFirst({
      where: {
        userId,
        accepted: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            timeZone: true,
            createdAt: true,
          },
        },
      },
    });

    if (!membership) {
      return null;
    }

    return {
      ...membership.organization,
      role: membership.role,
    };
  }),

  /**
   * Update organization settings (OWNER/ADMIN only)
   */
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).optional(),
        logoUrl: z.string().url().nullable().optional(),
        timeZone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await requireOrganizationAdmin(
        ctx.prisma,
        userId,
        input.organizationId,
        "Nemate dozvolu za izmenu postavki organizacije."
      );

      const organization = await ctx.prisma.organization.update({
        where: { id: input.organizationId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
          ...(input.timeZone && { timeZone: input.timeZone }),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          timeZone: true,
        },
      });

      return organization;
    }),

  /**
   * Check if a slug is available
   */
  checkSlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const normalizedSlug = normalizeToSlug(input.slug);

      if (!normalizedSlug || normalizedSlug.length < 3) {
        return { available: false, normalizedSlug: null };
      }

      const existing = await ctx.prisma.organization.findUnique({
        where: { slug: normalizedSlug },
        select: { id: true },
      });

      return { available: !existing, normalizedSlug };
    }),

  /**
   * Get organization by ID (for members only)
   */
  getById: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await requireOrganizationMember(ctx.prisma, userId, input.organizationId);

      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          timeZone: true,
          createdAt: true,
          _count: {
            select: {
              members: {
                where: { accepted: true },
              },
              eventTypes: true,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organizacija nije pronađena.",
        });
      }

      return {
        ...organization,
        memberCount: organization._count.members,
        eventTypeCount: organization._count.eventTypes,
        role: membership.role,
      };
    }),
});
