import { MembershipRole, Prisma } from "@salonko/prisma";
import { protectedProcedure, router } from "@salonko/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[šś]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
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

      // Check if user already has an organization
      const existingMembership = await ctx.prisma.membership.findFirst({
        where: {
          userId,
          role: MembershipRole.OWNER,
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Već imate organizaciju.",
        });
      }

      // Generate slug if not provided
      const slug = input.slug || generateSlug(input.name);

      // Handle empty slug (e.g., name contains only punctuation/special characters)
      if (!slug || slug.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Naziv organizacije ne može da generiše validan slug. Naziv mora sadržati slova ili brojeve, ili unesite slug ručno.",
        });
      }

      try {
        // Create organization and membership in a transaction
        const organization = await ctx.prisma.$transaction(async (tx) => {
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
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ovaj slug je već zauzet. Izaberite drugi.",
          });
        }

        throw error;
      }
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
          message: "Nemate dozvolu za izmenu postavki organizacije.",
        });
      }

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
    .input(z.object({ slug: z.string().min(3) }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.organization.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });

      return { available: !existing };
    }),

  /**
   * Get organization by ID (for members only)
   */
  getById: protectedProcedure
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
