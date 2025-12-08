import { NextResponse } from "next/server";
import { prisma } from "@zakazi-termin/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Nevažeća email adresa" },
        { status: 400 }
      );
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

    // TODO: Send email with reset link
    // For now, just log the token (remove in production)
    console.log(`Password reset token for ${email}: ${token}`);

    // In production, send email:
    // await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Došlo je do greške" },
      { status: 500 }
    );
  }
}
