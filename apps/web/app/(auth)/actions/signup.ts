"use server";

import {
  generateOTP,
  getEmailProviderError,
  getOTPExpiryDate,
  hashPassword,
  isAllowedEmailProvider,
} from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { z } from "zod";
import type { ActionResult } from "./types";

const signupSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  email: z
    .string()
    .email("Nevažeća email adresa")
    .refine(isAllowedEmailProvider, { message: getEmailProviderError() }),
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

    // Check if email already exists in User table
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: "Email adresa je već registrovana" };
    }

    // Check if salonName already exists in User table
    const existingSalonName = await prisma.user.findUnique({
      where: { salonName: normalizedSalonName },
    });

    if (existingSalonName) {
      return { success: false, error: "Naziv salona je zauzet" };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const verificationCode = generateOTP();

    // Delete any existing pending registration for this email or salonName
    // and create new pending registration in a transaction
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
