"use server";

import { generateOTP, getOTPExpiryDate, hashPassword } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { Prisma, prisma } from "@salonko/prisma";
import { z } from "zod";
import type { ActionResult } from "./types";

const signupSchema = z.object({
  // Salon basic info
  salonName: z.string().min(3, "Naziv salona mora imati najmanje 3 karaktera"),
  salonTypes: z.array(z.string()).min(1, "Izaberite bar jedan tip salona"),
  salonPhone: z.string().min(1, "Telefon salona je obavezan"),
  salonEmail: z.string().email().optional().or(z.literal("")),
  salonCity: z.string().min(1, "Grad je obavezan"),
  salonAddress: z.string().min(1, "Adresa je obavezna"),
  googlePlaceId: z.string().optional(),

  // Owner info
  ownerFirstName: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  ownerLastName: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
  email: z.string().email("Nevazeca email adresa"),
  ownerPhone: z.string().min(1, "Telefon je obavezan"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
});

function generateSalonSlug(salonName: string): string {
  return salonName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[čć]/g, "c")
    .replace(/[šś]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export async function signupAction(formData: FormData): Promise<ActionResult<{ email: string }>> {
  try {
    const salonTypesRaw = formData.get("salonTypes") as string;
    const rawData = {
      salonName: formData.get("salonName") as string,
      salonTypes: salonTypesRaw ? JSON.parse(salonTypesRaw) : [],
      salonPhone: formData.get("salonPhone") as string,
      salonEmail: (formData.get("salonEmail") as string) || "",
      salonCity: formData.get("salonCity") as string,
      salonAddress: formData.get("salonAddress") as string,
      googlePlaceId: (formData.get("googlePlaceId") as string) || undefined,
      ownerFirstName: formData.get("ownerFirstName") as string,
      ownerLastName: formData.get("ownerLastName") as string,
      email: formData.get("email") as string,
      ownerPhone: formData.get("ownerPhone") as string,
      password: formData.get("password") as string,
    };

    const result = signupSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message };
    }

    const {
      salonName,
      salonTypes,
      salonPhone,
      salonEmail,
      salonCity,
      salonAddress,
      googlePlaceId,
      ownerFirstName,
      ownerLastName,
      email,
      ownerPhone,
      password,
    } = result.data;

    const normalizedEmail = email.toLowerCase();
    const salonSlug = generateSalonSlug(salonName);

    // Check for existing user with same email or salonName (slug)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { salonName: salonSlug }],
      },
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return { success: false, error: "Email adresa je vec registrovana" };
      }
      if (existingUser.salonName === salonSlug) {
        return { success: false, error: "Naziv salona je zauzet" };
      }
    }

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
            OR: [{ email: normalizedEmail }, { salonName: salonSlug }],
          },
        }),
        prisma.pendingRegistration.create({
          data: {
            email: normalizedEmail,
            name: `${ownerFirstName} ${ownerLastName}`,
            salonName: salonSlug,
            hashedPassword,
            salonTypes,
            salonPhone,
            salonEmail: salonEmail || null,
            salonCity,
            salonAddress,
            googlePlaceId: googlePlaceId || null,
            ownerFirstName,
            ownerLastName,
            ownerPhone,
            verificationCode,
            expires: getOTPExpiryDate(),
            lastSentAt: new Date(),
          },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = (error.meta as { target?: unknown } | undefined)?.target;
        const targets = Array.isArray(target) ? target.map(String) : target ? [String(target)] : [];

        if (targets.some((t) => t.includes("email"))) {
          return { success: false, error: "Email adresa je vec registrovana" };
        }
        if (targets.some((t) => t.includes("salonName"))) {
          return { success: false, error: "Naziv salona je zauzet" };
        }

        // Fallback for unexpected unique constraint targets
        return { success: false, error: "Email adresa je vec registrovana" };
      }

      throw error;
    }

    // Send verification email
    try {
      await emailService.sendEmailVerification({
        userName: `${ownerFirstName} ${ownerLastName}`,
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
    return { success: false, error: "Doslo je do greske pri registraciji" };
  }
}
