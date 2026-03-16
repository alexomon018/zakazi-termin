import { createHmac, timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/auth";
import { GoogleCalendarService, exchangeCodeForTokens } from "@salonko/calendar";
import { getAppUrl, logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

const ALLOWED_REDIRECT_SCHEMES = ["exp:", "salonko:", "myapp:"];

function mobileRedirectResponse(redirectUrl: string, result: string) {
  try {
    const url = new URL(redirectUrl);
    if (!ALLOWED_REDIRECT_SCHEMES.some((scheme) => url.protocol === scheme)) {
      return new NextResponse("Invalid redirect scheme", { status: 400 });
    }

    url.searchParams.set("result", result);
    const safeRedirectUrl = url.toString();
    return new NextResponse(
      `<html><body><script>window.location.href=${JSON.stringify(safeRedirectUrl)};</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch {
    return new NextResponse("Invalid redirect URL", { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  // Parse state and verify HMAC signature to prevent tampering
  let returnTo = "/dashboard/settings";
  let stateUserId: string | undefined;
  let mobileRedirect: string | undefined;
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString());
      const { sig, ...payload } = decoded;

      const stateSecret = process.env.STATE_SECRET;
      if (!stateSecret) {
        logger.error("STATE_SECRET environment variable is not configured");
        return NextResponse.redirect(new URL("/login?error=server_config", request.url));
      }

      const expectedSig = createHmac("sha256", stateSecret)
        .update(JSON.stringify(payload))
        .digest("hex");

      if (!sig || !timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
        logger.error("Google Calendar OAuth state signature mismatch");
        return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
      }

      // Validate returnTo is a relative path and mobileRedirect uses an allowed scheme
      if (payload.returnTo && /^\/(?!\/)/.test(payload.returnTo)) {
        returnTo = payload.returnTo;
      }
      stateUserId = payload.userId;
      if (payload.mobileRedirect && /^(salonko|exp):\/\//.test(payload.mobileRedirect)) {
        mobileRedirect = payload.mobileRedirect;
      }
    } catch {
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
    }
  }

  // Support both cookie-based (web) and userId-in-state (mobile) auth
  // When stateUserId is present (HMAC-signed), it is the authoritative identity
  const session = await getSession();
  const sessionUserId = session?.user?.id;

  if (stateUserId && sessionUserId && sessionUserId !== stateUserId) {
    logger.error("Google Calendar OAuth state/session user mismatch", {
      sessionUserId,
      stateUserId,
    });
    return new NextResponse("User mismatch", { status: 403 });
  }

  const userId = stateUserId ?? sessionUserId;

  if (!userId) {
    if (mobileRedirect) return mobileRedirectResponse(mobileRedirect, "no_session");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (error) {
    if (mobileRedirect) return mobileRedirectResponse(mobileRedirect, "denied");
    return NextResponse.redirect(new URL(`${returnTo}?error=google_auth_denied`, request.url));
  }

  if (!code) {
    if (mobileRedirect) return mobileRedirectResponse(mobileRedirect, "missing_code");
    return NextResponse.redirect(new URL(`${returnTo}?error=missing_code`, request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`${returnTo}?error=google_not_configured`, request.url));
  }

  const baseUrl = getAppUrl();
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const redirectUri = `${normalizedBaseUrl}/api/integrations/google-calendar/callback`;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);

    // Check if user already has a Google Calendar credential
    const existingCredential = await prisma.credential.findFirst({
      where: {
        userId,
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
          userId,
          appId: "google-calendar",
        },
      });
      credentialId = credential.id;
    }

    // Get primary calendar and add to selected calendars
    const service = new GoogleCalendarService(
      {
        id: credentialId,
        userId,
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
            userId,
            integration: "google_calendar",
            externalId: primaryCalendar.id,
          },
        },
        update: {
          credentialId,
        },
        create: {
          userId,
          integration: "google_calendar",
          externalId: primaryCalendar.id,
          credentialId,
        },
      });
    }

    if (mobileRedirect) return mobileRedirectResponse(mobileRedirect, "success");
    return NextResponse.redirect(
      new URL(`${returnTo}?success=google_calendar_connected`, request.url)
    );
  } catch (err) {
    logger.error("Google Calendar OAuth error", {
      error: err,
      userId,
    });
    if (mobileRedirect) return mobileRedirectResponse(mobileRedirect, "auth_failed");
    return NextResponse.redirect(new URL(`${returnTo}?error=google_auth_failed`, request.url));
  }
}
