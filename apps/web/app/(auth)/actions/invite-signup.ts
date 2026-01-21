"use server";

import { generateOTP, getOTPExpiryDate, hashPassword } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { Prisma, prisma } from "@salonko/prisma";
import { z } from "zod";

import type { ActionResult } from "./types";

const inviteSignupSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  lastName: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
  email: z.string().email("Nevažeća email adresa"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
});

type InviteSignupInput = z.infer<typeof inviteSignupSchema>;

/**
 * Validate an invite token and return organization info
 */
export async function validateInviteTokenAction(token: string): Promise<{
  valid: boolean;
  organizationName?: string;
  invitedEmail?: string;
  error?: string;
}> {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: { gte: new Date() },
        organizationId: { not: null },
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!verificationToken || !verificationToken.organization) {
      return { valid: false, error: "Pozivnica nije pronađena ili je istekla." };
    }

    return {
      valid: true,
      organizationName: verificationToken.organization.name,
      invitedEmail: verificationToken.invitedEmail || undefined,
    };
  } catch (error) {
    logger.error("Failed to validate invite token", { error, token });
    return { valid: false, error: "Došlo je do greške pri proveri pozivnice." };
  }
}

/**
 * Sign up a new user with an invite token
 * Creates a pending registration that includes the invite token
 */
export async function inviteSignupAction(
  input: InviteSignupInput
): Promise<ActionResult<{ email: string }>> {
  try {
    const result = inviteSignupSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message };
    }

    const { token, firstName, lastName, email, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Validate the invite token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: { gte: new Date() },
        organizationId: { not: null },
      },
    });

    if (!verificationToken) {
      return { success: false, error: "Pozivnica nije pronađena ili je istekla." };
    }

    // If this is an email-specific invite, verify the email matches
    if (verificationToken.invitedEmail && verificationToken.invitedEmail !== normalizedEmail) {
      return {
        success: false,
        error:
          "Email adresa se ne poklapa sa pozivnicom. Koristite email na koji je pozivnica poslata.",
      };
    }

    // Check for existing user with same email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email adresa je već registrovana. Prijavite se da biste prihvatili pozivnicu.",
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const verificationCode = generateOTP();

    // Create pending registration with invite token
    try {
      await prisma.$transaction([
        // Delete any existing pending registration for this email
        prisma.pendingRegistration.deleteMany({
          where: { email: normalizedEmail },
        }),
        // Create new pending registration
        prisma.pendingRegistration.create({
          data: {
            email: normalizedEmail,
            name: `${firstName} ${lastName}`,
            hashedPassword,
            ownerFirstName: firstName,
            ownerLastName: lastName,
            ownerPhone: "", // Not required for team members
            verificationCode,
            expires: getOTPExpiryDate(),
            lastSentAt: new Date(),
            // Store invite token in a field we'll use during verification
            // We'll use salonName field to store the token temporarily
            // (team members don't need salonName)
            inviteToken: token,
          },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { success: false, error: "Email adresa je već registrovana" };
      }
      throw error;
    }

    // Send verification email
    try {
      await emailService.sendEmailVerification({
        userName: `${firstName} ${lastName}`,
        userEmail: normalizedEmail,
        verificationCode,
      });
    } catch (error) {
      logger.error("Failed to send verification email for invite signup", {
        error,
        email: normalizedEmail,
      });
      // Don't block signup if email fails - user can resend
    }

    return {
      success: true,
      data: { email: normalizedEmail },
    };
  } catch (error) {
    logger.error("Invite signup error", { error });
    return { success: false, error: "Došlo je do greške pri registraciji" };
  }
}
