import { createAccessToken, createRefreshToken, verifyRefreshToken } from "@/lib/mobile-auth/jwt";
import { logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token je obavezan." },
        { status: 400 },
      );
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: "Nevažeći ili istekao refresh token." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen." },
        { status: 401 },
      );
    }

    const newToken = createAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      salonName: user.salonName,
    });
    const newRefreshToken = createRefreshToken(user.id);

    return NextResponse.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        salonName: user.salonName,
      },
    });
  } catch (error) {
    logger.error("Mobile refresh error", { error });
    return NextResponse.json(
      { error: "Greška pri osvežavanju tokena." },
      { status: 500 },
    );
  }
}
