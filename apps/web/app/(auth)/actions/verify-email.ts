"use server";

import {
  OTP_CONFIG,
  generateAutoLoginToken,
  getAutoLoginTokenExpiryDate,
} from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { z } from "zod";
import type { ActionResult } from "./types";

const verifyEmailSchema = z.object({
  email: z.string().email("Nevažeća email adresa"),
  code: z
    .string()
    .length(6, "Kod mora imati 6 cifara")
    .regex(/^\d+$/, "Kod mora sadržati samo cifre"),
});

/**
 * Verify email with OTP code - creates user and returns auto-login token
 */
export async function verifyEmailAction(
  formData: FormData
): Promise<ActionResult<{ email: string; autoLoginToken: string }>> {
  try {
    const rawData = {
      email: formData.get("email") as string,
      code: formData.get("code") as string,
    };

    const result = verifyEmailSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message };
    }

    const { email, code } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Find pending registration
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pending) {
      return {
        success: false,
        error: "Registracija nije pronađena. Pokušajte ponovo.",
      };
    }

    // Check if code has expired
    if (pending.expires < new Date()) {
      return { success: false, error: "Kod je istekao. Zatražite novi kod." };
    }

    // Check attempts
    if (pending.attempts >= OTP_CONFIG.maxAttempts) {
      return {
        success: false,
        error: "Previše neuspešnih pokušaja. Zatražite novi kod.",
      };
    }

    // Check if code matches
    if (pending.verificationCode !== code) {
      // Increment attempts
      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { attempts: { increment: 1 } },
      });
      return { success: false, error: "Nevažeći kod" };
    }

    // Generate auto-login token
    const autoLoginToken = generateAutoLoginToken();
    const autoLoginTokenExpires = getAutoLoginTokenExpiryDate();

    // Check if this is a team member signup (has invite token)
    const isTeamMemberSignup = !!pending.inviteToken;

    // Code is valid - create user with all data from pending registration
    const user = await prisma.$transaction(async (tx) => {
      // For team member signups, we create a minimal user without salon info
      // For regular signups, we create user with full salon info
      const newUser = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          salonName: isTeamMemberSignup ? null : pending.salonName,
          salonSlug: isTeamMemberSignup ? null : pending.salonSlug,
          identityProvider: "EMAIL",
          emailVerified: new Date(),
          autoLoginToken,
          autoLoginTokenExpires,
          // Salon info from registration (only for salon owners)
          salonTypes: isTeamMemberSignup ? [] : pending.salonTypes,
          salonPhone: isTeamMemberSignup ? null : pending.salonPhone,
          salonEmail: isTeamMemberSignup ? null : pending.salonEmail,
          salonCity: isTeamMemberSignup ? null : pending.salonCity,
          salonAddress: isTeamMemberSignup ? null : pending.salonAddress,
          googlePlaceId: isTeamMemberSignup ? null : pending.googlePlaceId,
          // Owner info
          ownerFirstName: pending.ownerFirstName,
          ownerLastName: pending.ownerLastName,
          ownerPhone: isTeamMemberSignup ? null : pending.ownerPhone,
          password: {
            create: {
              hash: pending.hashedPassword,
            },
          },
          // Create default schedule (for all users - team members also need availability)
          schedules: {
            create: {
              name: "Radno vreme",
              timeZone: "Europe/Belgrade",
              availability: {
                create: [
                  // Monday to Friday, 9am to 5pm
                  {
                    days: [1, 2, 3, 4, 5],
                    startTime: new Date("1970-01-01T09:00:00"),
                    endTime: new Date("1970-01-01T17:00:00"),
                  },
                ],
              },
            },
          },
        },
        include: {
          schedules: true,
        },
      });

      // Set default schedule
      if (newUser.schedules[0]) {
        await tx.user.update({
          where: { id: newUser.id },
          data: { defaultScheduleId: newUser.schedules[0].id },
        });
      }

      // Handle team invitation if this is a team member signup
      if (isTeamMemberSignup && pending.inviteToken) {
        // Find the verification token for the invitation
        const verificationToken = await tx.verificationToken.findFirst({
          where: {
            token: pending.inviteToken,
            expires: { gte: new Date() },
            organizationId: { not: null },
          },
        });

        // Token must exist - if not, it was already used (race condition)
        if (!verificationToken || !verificationToken.organizationId) {
          throw new Error("INVITE_TOKEN_USED");
        }

        // Create membership for the team
        await tx.membership.create({
          data: {
            userId: newUser.id,
            organizationId: verificationToken.organizationId,
            role: verificationToken.invitedRole || "MEMBER",
            accepted: true,
          },
        });

        // Delete the token after use (all tokens are single-use for security)
        await tx.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: verificationToken.identifier,
              token: verificationToken.token,
            },
          },
        });
      }

      // Create organization if specified (for regular salon owner signup)
      if (!isTeamMemberSignup && pending.organizationName && pending.organizationSlug) {
        await tx.organization.create({
          data: {
            name: pending.organizationName,
            slug: pending.organizationSlug,
            members: {
              create: {
                userId: newUser.id,
                role: "OWNER",
                accepted: true,
              },
            },
          },
        });
      }

      // Delete pending registration
      await tx.pendingRegistration.delete({
        where: { id: pending.id },
      });

      return newUser;
    });

    return {
      success: true,
      data: {
        email: user.email,
        autoLoginToken,
      },
    };
  } catch (error) {
    // Handle invite token already used (race condition)
    if (error instanceof Error && error.message === "INVITE_TOKEN_USED") {
      return {
        success: false,
        error: "Pozivnica je već iskorišćena ili je istekla. Zatražite novu pozivnicu.",
      };
    }
    logger.error("Email verification error", { error });
    return { success: false, error: "Došlo je do greške" };
  }
}
