import type { MembershipRole, PrismaClient } from "@salonko/prisma";

export type TeamPermission = {
  organizationId: string;
  role: MembershipRole;
  accepted: boolean;
};

/**
 * Get user's membership in an organization
 */
export async function getUserMembership(
  prisma: PrismaClient,
  userId: string,
  organizationId: string
): Promise<TeamPermission | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) return null;

  return {
    organizationId: membership.organizationId,
    role: membership.role,
    accepted: membership.accepted,
  };
}

/**
 * Check if user has one of the allowed roles in an organization
 */
export async function hasOrganizationRole(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
  allowedRoles: MembershipRole[]
): Promise<boolean> {
  const membership = await getUserMembership(prisma, userId, organizationId);
  if (!membership || !membership.accepted) return false;
  return allowedRoles.includes(membership.role);
}

/**
 * Check if user is OWNER or ADMIN of an organization
 */
export async function isOrganizationAdmin(
  prisma: PrismaClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  return hasOrganizationRole(prisma, userId, organizationId, ["OWNER", "ADMIN"]);
}

/**
 * Check if user is the OWNER of an organization
 */
export async function isOrganizationOwner(
  prisma: PrismaClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  return hasOrganizationRole(prisma, userId, organizationId, ["OWNER"]);
}

/**
 * Get all organizations where user has the specified roles
 */
export async function getOrganizationsWithRoles(
  prisma: PrismaClient,
  userId: string,
  roles: MembershipRole[]
): Promise<string[]> {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      accepted: true,
      role: { in: roles },
    },
    select: {
      organizationId: true,
    },
  });

  return memberships.map((m) => m.organizationId);
}

/**
 * Check if user can view all bookings in an organization
 * OWNER and ADMIN can view all bookings, MEMBER can only view their own
 */
export async function canViewAllBookings(
  prisma: PrismaClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  return isOrganizationAdmin(prisma, userId, organizationId);
}

/**
 * Check if user can manage event types (create, edit, delete)
 * OWNER and ADMIN can manage all, MEMBER can only manage their own assignments
 */
export async function canManageEventTypes(
  prisma: PrismaClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  return isOrganizationAdmin(prisma, userId, organizationId);
}
