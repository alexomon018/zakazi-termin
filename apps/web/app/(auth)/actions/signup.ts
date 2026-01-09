"use server";

import { generateOTP, getOTPExpiryDate, hashPassword } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { Prisma, prisma } from "@salonko/prisma";
import { z } from "zod";
import type { ActionResult } from "./types";

const signupSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  email: z.string().email("Nevažeća email adresa"),
  salonName: z
    .string()
    .min(3, "Naziv salona mora imati najmanje 3 karaktera")
    .max(20, "Naziv salona može imati najviše 20 karaktera")
    .regex(/^[a-z0-9_-]+$/, "Naziv salona može sadržati samo mala slova, brojeve, _ i -"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
});

/**
 * Sign up a new user - creates pending registration and sends OTP
 */
export async function signupAction(formData: FormData): Promise<ActionResult<{ email: string }>> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      salonName: formData.get("salonName") as string,
      password: formData.get("password") as string,
    };

    const result = signupSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message };
    }

    const { name, email, salonName, password } = result.data;
    const normalizedEmail = email.toLowerCase();
    const normalizedSalonName = salonName.toLowerCase();

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const verificationCode = generateOTP();

    // Delete any existing pending registration for this email or salonName
    // and create new pending registration in a transaction
    try {
      await prisma.$transaction([
        prisma.pendingRegistration.deleteMany({
          where: {
            OR: [{ email: normalizedEmail }, { salonName: normalizedSalonName }],
          },
        }),
        prisma.pendingRegistration.create({
          data: {
            email: normalizedEmail,
            name,
            salonName: normalizedSalonName,
            hashedPassword,
            verificationCode,
            expires: getOTPExpiryDate(),
          },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = (error.meta as { target?: unknown } | undefined)?.target;
        const targets = Array.isArray(target) ? target.map(String) : target ? [String(target)] : [];

        if (targets.some((t) => t.includes("email"))) {
          return { success: false, error: "Email adresa je već registrovana" };
        }
        if (targets.some((t) => t.includes("salonName"))) {
          return { success: false, error: "Naziv salona je zauzet" };
        }

        // Fallback for unexpected unique constraint targets
        return { success: false, error: "Email adresa je već registrovana" };
      }

      throw error;
    }

    // Send verification email
    try {
      await emailService.sendEmailVerification({
        userName: name,
        userEmail: normalizedEmail,
        verificationCode,
      });
    } catch (error) {
      logger.error("Failed to send verification email", {
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
    logger.error("Signup error", { error });
    return { success: false, error: "Došlo je do greške pri registraciji" };
  }
}
