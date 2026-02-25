import { createAccessToken, createRefreshToken } from "@/lib/mobile-auth/jwt";
import { verifyPassword } from "@salonko/auth/server";
import { logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i lozinka su obavezni." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka." },
        { status: 401 },
      );
    }

    if (user.identityProvider !== "EMAIL" || !user.password?.hash) {
      return NextResponse.json(
        { error: "Ovaj nalog koristi Google za prijavu." },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, user.password.hash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka." },
        { status: 401 },
      );
    }

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
    logger.error("Mobile login error", { error });
    return NextResponse.json(
      { error: "Greška pri prijavi." },
      { status: 500 },
    );
  }
}
