"use server";

import { hashPassword } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { z } from "zod";
import type { ActionResult } from "./types";

const resetPasswordSchema = z.object({
  email: z.string().email("Nevažeća email adresa"),
  token: z.string().min(1, "Nevažeći token"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
});

/**
 * Reset password via emailed token
 */
export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  try {
    const rawData = {
      email: formData.get("email") as string,
      token: formData.get("token") as string,
      password: formData.get("password") as string,
    };

    const parsed = resetPasswordSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const { token, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        success: false,
        error: "Link za resetovanje lozinke je nevažeći ili je istekao.",
      };
    }

    if (user.identityProvider !== "EMAIL") {
      return {
        success: false,
        error: "Ovaj nalog koristi prijavu preko Google naloga. Lozinka ne može biti resetovana.",
      };
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token,
        },
      },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return {
        success: false,
        error: "Link za resetovanje lozinke je nevažeći ili je istekao.",
      };
    }

    const hashed = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: {
            upsert: {
              create: { hash: hashed },
              update: { hash: hashed },
            },
          },
        },
      }),
      // one-time use token
      prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }),
    ]);

    return { success: true, data: { message: "OK" } };
  } catch (error) {
    logger.error("Reset password error", { error });
    return { success: false, error: "Došlo je do greške" };
  }
}
