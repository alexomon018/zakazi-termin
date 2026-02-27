import { createAccessToken, createRefreshToken } from "@/lib/mobile-auth/jwt";
import { generateSalonSlug } from "@/lib/salon-utils";
import { hashPassword } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { Prisma, type User, prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  salonName: z.string().min(3, "Naziv salona mora imati najmanje 3 karaktera"),
  email: z.string().email("Nevažeća email adresa"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { name, salonName, email, password } = result.data;
    const normalizedEmail = email.toLowerCase();
    const salonSlug = generateSalonSlug(salonName);
    const hashedPassword = await hashPassword(password);

    let user: User;
    try {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          salonName,
          salonSlug,
          emailVerified: new Date(),
          identityProvider: "EMAIL",
          password: {
            create: { hash: hashedPassword },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json(
          { error: "Email adresa ili naziv salona je već zauzet." },
          { status: 409 }
        );
      }
      throw error;
    }

    // Send welcome email (non-blocking)
    emailService
      .sendWelcomeEmail({
        userName: name,
        userEmail: normalizedEmail,
        salonName,
      })
      .catch((emailError: unknown) => {
        logger.error("Failed to send welcome email from mobile register", {
          error: emailError,
          email: normalizedEmail,
        });
      });

    const token = createAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      salonName: user.salonName,
    });
    const refreshToken = createRefreshToken(user.id);

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        salonName: user.salonName,
      },
    });
  } catch (error) {
    logger.error("Mobile register error", { error });
    return NextResponse.json({ error: "Greška pri registraciji." }, { status: 500 });
  }
}
