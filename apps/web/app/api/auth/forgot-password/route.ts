import { randomBytes } from "node:crypto";
import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Nevažeća email adresa" }, { status: 400 });
    }

    const { email } = result.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "OK" });
    }

    // Check if user signed up with OAuth only
    if (user.identityProvider !== "EMAIL") {
      return NextResponse.json({ message: "OK" });
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token: "password-reset",
        },
      },
      update: {
        token,
        expires,
      },
      create: {
        identifier: email.toLowerCase(),
        token,
        expires,
      },
    });

    // Send password reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

    try {
      await emailService.sendPasswordResetEmail({
        userName: user.name || "Korisnik",
        userEmail: email.toLowerCase(),
        resetUrl,
      });
    } catch (error) {
      logger.error("Failed to send password reset email", { error, email: email.toLowerCase() });
      // Don't expose email sending failures to prevent enumeration
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    logger.error("Forgot password error", { error });
    return NextResponse.json({ message: "Došlo je do greške" }, { status: 500 });
  }
}
