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

    // Code is valid - create user with all data from pending registration
    const user = await prisma.$transaction(async (tx) => {
      // Create the user with email already verified and auto-login token
      const newUser = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          salonName: pending.salonName,
          identityProvider: "EMAIL",
          emailVerified: new Date(),
          autoLoginToken,
          autoLoginTokenExpires,
          password: {
            create: {
              hash: pending.hashedPassword,
            },
          },
          // Create default schedule
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

      // Create organization if specified
      if (pending.organizationName && pending.organizationSlug) {
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

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        userName: user.name || "Korisnik",
        userEmail: user.email,
        salonName: user.salonName || "",
      });
    } catch (error) {
      logger.error("Failed to send welcome email after verification", {
        error,
        userId: user.id,
      });
    }

    return {
      success: true,
      data: {
        email: user.email,
        autoLoginToken,
      },
    };
  } catch (error) {
    logger.error("Email verification error", { error });
    return { success: false, error: "Došlo je do greške" };
  }
}
