import type { MembershipRole, PrismaClient } from "@salonko/prisma";
import { TRPCError } from "@trpc/server";

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
 * Require user to be OWNER or ADMIN of an organization.
 * Throws FORBIDDEN error if not authorized.
 */
export async function requireOrganizationAdmin(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
  errorMessage = "Nemate dozvolu za ovu akciju."
): Promise<TeamPermission> {
  const membership = await getUserMembership(prisma, userId, organizationId);

  if (
    !membership ||
    !membership.accepted ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    throw new TRPCError({ code: "FORBIDDEN", message: errorMessage });
  }

  return membership;
}

/**
 * Require user to be the OWNER of an organization.
 * Throws FORBIDDEN error if not authorized.
 */
export async function requireOrganizationOwner(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
  errorMessage = "Samo vlasnik može izvršiti ovu akciju."
): Promise<TeamPermission> {
  const membership = await getUserMembership(prisma, userId, organizationId);

  if (!membership || !membership.accepted || membership.role !== "OWNER") {
    throw new TRPCError({ code: "FORBIDDEN", message: errorMessage });
  }

  return membership;
}

/**
 * Require user to be a member (any role) of an organization.
 * Throws FORBIDDEN error if not authorized.
 */
export async function requireOrganizationMember(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
  errorMessage = "Niste član ove organizacije."
): Promise<TeamPermission> {
  const membership = await getUserMembership(prisma, userId, organizationId);

  if (!membership || !membership.accepted) {
    throw new TRPCError({ code: "FORBIDDEN", message: errorMessage });
  }

  return membership;
}

/**
 * Check if user can manage event types (create, edit, delete).
 * OWNER and ADMIN can manage all; MEMBER can only manage event types they own or host.
 * When eventTypeId is provided, MEMBER is allowed only for that specific event type.
 */
export async function canManageEventTypes(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
  eventTypeId?: string
): Promise<boolean> {
  // Allow organization OWNERs and ADMINs to manage all event types
  const isOwner = await isOrganizationOwner(prisma, userId, organizationId);
  if (isOwner) return true;

  const isAdmin = await isOrganizationAdmin(prisma, userId, organizationId);
  if (isAdmin) return true;

  // For MEMBERs, only allow management of event types they are explicitly assigned to
  const membership = await getUserMembership(prisma, userId, organizationId);
  if (!membership || !membership.accepted || membership.role !== "MEMBER") {
    return false;
  }

  // If checking a specific event type, verify assignment (owner or host of that event type)
  const whereClause = eventTypeId
    ? {
        id: eventTypeId,
        organizationId,
        OR: [{ userId }, { hosts: { some: { userId } } }],
      }
    : {
        organizationId,
        OR: [{ userId }, { hosts: { some: { userId } } }],
      };

  const assignedEventType = await prisma.eventType.findFirst({
    where: whereClause,
    select: { id: true },
  });

  return !!assignedEventType;
}
