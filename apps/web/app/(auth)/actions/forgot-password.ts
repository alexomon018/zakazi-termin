"use server";

import { randomBytes } from "node:crypto";
import {
  checkoutRateLimiter,
  forgotPasswordEmailRateLimiter,
  forgotPasswordIpRateLimiter,
  getAppUrl,
  logger,
} from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "./types";

const forgotPasswordSchema = z.object({
  email: z.string().email("Nevažeća email adresa"),
});

/**
 * Send password reset email
 */
export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  try {
    const rawData = {
      email: formData.get("email") as string,
    };

    const result = forgotPasswordSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: "Nevažeća email adresa" };
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limit BEFORE DB lookups / email sends to reduce abuse and avoid email enumeration.
    // We reuse the same shared Upstash setup/prefix as checkout (see `checkoutRateLimiter`)
    // to keep keys/config consistent across the app.
    const h = await headers();
    const requestIp =
      h.get("x-forwarded-for")?.split(",")[0]?.trim()?.slice(0, 128) ||
      h.get("x-real-ip")?.trim()?.slice(0, 128) ||
      "unknown";

    const [ipLimitResult, emailLimitResult] = await Promise.all([
      forgotPasswordIpRateLimiter
        ? forgotPasswordIpRateLimiter.limit(`forgot-password:ip:${requestIp}`)
        : Promise.resolve({ success: true }),
      forgotPasswordEmailRateLimiter
        ? forgotPasswordEmailRateLimiter.limit(`forgot-password:email:${normalizedEmail}`)
        : Promise.resolve({ success: true }),
    ]);

    if (!ipLimitResult.success || !emailLimitResult.success) {
      logger.warn("forgotPasswordAction rate limited", {
        action: "forgotPasswordAction",
        normalizedEmail,
        requestIp,
        ipAllowed: ipLimitResult.success,
        emailAllowed: emailLimitResult.success,
        checkoutRateLimiterConfigured: Boolean(checkoutRateLimiter),
      });
      // Always return success to prevent email enumeration
      return { success: true, data: { message: "OK" } };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, data: { message: "OK" } };
    }

    // Check if user signed up with OAuth only
    if (user.identityProvider !== "EMAIL") {
      return { success: true, data: { message: "OK" } };
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token (one active reset token per email)
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token,
          expires,
        },
      }),
    ]);

    // Send password reset email
    const appUrl = getAppUrl();
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    try {
      await emailService.sendPasswordResetEmail({
        userName: user.name || "Korisnik",
        userEmail: normalizedEmail,
        resetUrl,
      });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error,
        userId: user.id,
      });
      // Don't expose email sending failures to prevent enumeration
    }

    return { success: true, data: { message: "OK" } };
  } catch (error) {
    logger.error("Forgot password error", { error });
    return { success: false, error: "Došlo je do greške" };
  }
}
