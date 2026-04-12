import { createHmac } from "node:crypto";
import { getAppUrl, logger } from "@salonko/config";
import { prisma } from "@salonko/prisma";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = getAppUrl();

/**
 * Generate an HMAC token for email unsubscribe links.
 * Uses CRON_SECRET as the signing key so no extra env var is needed.
 */
export function generateUnsubscribeToken(userId: string, type: string): string {
  if (!CRON_SECRET) {
    throw new Error("CRON_SECRET not configured");
  }
  return createHmac("sha256", CRON_SECRET).update(`${userId}:${type}`).digest("hex");
}

/**
 * Build a full unsubscribe URL for embedding in emails.
 */
export function buildUnsubscribeUrl(userId: string, type: string): string {
  const token = generateUnsubscribeToken(userId, type);
  return `${APP_URL}/api/email/unsubscribe?userId=${userId}&type=${type}&token=${token}`;
}

/**
 * GET /api/email/unsubscribe?userId=...&type=education&token=...
 *
 * One-click unsubscribe from education drip emails.
 * No login required — HMAC token proves ownership.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");
  const token = searchParams.get("token");

  if (!userId || !type || !token) {
    return new NextResponse(renderHtml("Nevažeći link za odjavu."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!CRON_SECRET) {
    logger.error("CRON_SECRET not configured for unsubscribe endpoint");
    return new NextResponse(renderHtml("Greška servera. Pokušajte ponovo kasnije."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Validate HMAC token
  const expectedToken = createHmac("sha256", CRON_SECRET).update(`${userId}:${type}`).digest("hex");

  if (token !== expectedToken) {
    return new NextResponse(renderHtml("Nevažeći link za odjavu."), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (type === "education") {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { educationEmailsOptOut: true },
      });

      logger.info("User unsubscribed from education emails", { userId });

      return new NextResponse(
        renderHtml("Uspešno ste se odjavili od edukativnih emailova.", `${APP_URL}/dashboard`),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    } catch (err) {
      logger.error("Failed to process unsubscribe", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
      return new NextResponse(renderHtml("Greška pri obradi zahteva. Pokušajte ponovo."), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  return new NextResponse(renderHtml("Nepoznat tip odjave."), {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function renderHtml(message: string, dashboardUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salonko - Odjava od emailova</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f4f8; color: #374151; }
    .card { background: white; border-radius: 12px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .logo { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 24px; }
    .message { font-size: 16px; line-height: 24px; margin-bottom: 24px; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📅 Salonko</div>
    <p class="message">${message}</p>
    ${dashboardUrl ? `<a href="${dashboardUrl}" class="btn">Nazad na kontrolnu tablu</a>` : ""}
  </div>
</body>
</html>`;
}
