import { getSession } from "@/lib/auth";
import {
  GoogleCalendarService,
  type GoogleCredential,
  exchangeCodeForTokens,
} from "@salonko/calendar";
import { getAppUrl, logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  // Parse state to get returnTo URL
  let returnTo = "/dashboard/settings";
  if (stateParam) {
    try {
      const state = JSON.parse(Buffer.from(stateParam, "base64").toString());
      returnTo = state.returnTo || returnTo;
    } catch {
      // Ignore parse errors
    }
  }

  if (error) {
    return NextResponse.redirect(new URL(`${returnTo}?error=google_auth_denied`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`${returnTo}?error=missing_code`, request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`${returnTo}?error=google_not_configured`, request.url));
  }

  const baseUrl = getAppUrl();
  const redirectUri = `${baseUrl}/api/integrations/google-calendar/callback`;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);

    // Check if user already has a Google Calendar credential
    const existingCredential = await prisma.credential.findFirst({
      where: {
        userId: session.user.id,
        type: "google_calendar",
      },
    });

    let credentialId: string;

    if (existingCredential) {
      // Update existing credential
      await prisma.credential.update({
        where: { id: existingCredential.id },
        data: {
          key: tokens as unknown as object,
          invalid: false,
          updatedAt: new Date(),
        },
      });
      credentialId = existingCredential.id;
    } else {
      // Create new credential
      const credential = await prisma.credential.create({
        data: {
          type: "google_calendar",
          key: tokens as unknown as object,
          userId: session.user.id,
          appId: "google-calendar",
        },
      });
      credentialId = credential.id;
    }

    // Get primary calendar and add to selected calendars
    const service = new GoogleCalendarService(
      {
        id: credentialId,
        userId: session.user.id,
        key: tokens,
      },
      clientId,
      clientSecret
    );

    const primaryCalendar = await service.getPrimaryCalendar();

    if (primaryCalendar) {
      // Upsert selected calendar
      await prisma.selectedCalendar.upsert({
        where: {
          userId_integration_externalId: {
            userId: session.user.id,
            integration: "google_calendar",
            externalId: primaryCalendar.id,
          },
        },
        update: {
          credentialId,
        },
        create: {
          userId: session.user.id,
          integration: "google_calendar",
          externalId: primaryCalendar.id,
          credentialId,
        },
      });
    }

    return NextResponse.redirect(
      new URL(`${returnTo}?success=google_calendar_connected`, request.url)
    );
  } catch (err) {
    logger.error("Google Calendar OAuth error", {
      error: err,
      userId: session.user.id,
    });
    return NextResponse.redirect(new URL(`${returnTo}?error=google_auth_failed`, request.url));
  }
}
