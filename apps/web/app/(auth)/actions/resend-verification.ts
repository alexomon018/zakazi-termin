"use server";

import { OTP_CONFIG, generateOTP, getOTPExpiryDate } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { z } from "zod";
import type { ActionResult } from "./types";

const resendVerificationSchema = z.object({
  email: z.string().email("Nevažeća email adresa"),
});

/**
 * Resend verification code
 */
export async function resendVerificationAction(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  try {
    const rawData = {
      email: formData.get("email") as string,
    };

    const result = resendVerificationSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message };
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Find pending registration
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pending) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        data: {
          message: "Ako postoji registracija, novi kod je poslat na vašu email adresu",
        },
      };
    }

    // Check cooldown based on lastSentAt
    const cooldownExpires = new Date(
      pending.lastSentAt.getTime() + OTP_CONFIG.resendCooldownSeconds * 1000
    );

    if (cooldownExpires > new Date()) {
      const secondsRemaining = Math.ceil((cooldownExpires.getTime() - Date.now()) / 1000);
      return {
        success: false,
        error: `Sačekajte ${secondsRemaining} sekundi pre ponovnog slanja`,
      };
    }

    // Generate new OTP and update pending registration
    const verificationCode = generateOTP();

    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: {
        verificationCode,
        expires: getOTPExpiryDate(),
        attempts: 0, // Reset attempts on resend
        lastSentAt: new Date(), // Update lastSentAt for cooldown tracking
      },
    });

    try {
      await emailService.sendEmailVerification({
        userName: pending.name,
        userEmail: pending.email,
        verificationCode,
      });
    } catch (error) {
      logger.error("Failed to send verification email", {
        error,
        pendingRegistrationId: pending.id,
      });
      // Don't expose email sending failures to prevent account enumeration
    }

    return {
      success: true,
      data: { message: "Novi kod je poslat na vašu email adresu" },
    };
  } catch (error) {
    logger.error("Resend verification error", { error });
    return { success: false, error: "Došlo je do greške" };
  }
}
