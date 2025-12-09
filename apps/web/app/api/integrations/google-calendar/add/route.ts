import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGoogleAuthUrl } from "@zakazi-termin/calendar";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google Calendar not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || "/dashboard/settings";

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/integrations/google-calendar/callback`;

  // Encode state with returnTo URL
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64");

  const authUrl = getGoogleAuthUrl(clientId, clientSecret, redirectUri, state);

  return NextResponse.json({ url: authUrl });
}
