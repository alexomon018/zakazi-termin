import { type calendar_v3, calendar as googleCalendar } from "@googleapis/calendar";
import { OAuth2Client } from "googleapis-common";
import { z } from "zod";

// Credential schema for Google Calendar OAuth tokens
export const googleCredentialSchema = z.object({
  scope: z.string(),
  token_type: z.literal("Bearer"),
  expiry_date: z.number(),
  access_token: z.string(),
  refresh_token: z.string(),
});

export type GoogleCredential = z.infer<typeof googleCredentialSchema>;

export type EventBusyDate = {
  start: string;
  end: string;
};

export type IntegrationCalendar = {
  externalId: string;
  integration: string;
  name: string;
  primary: boolean;
  readOnly: boolean;
  email: string;
};

type CredentialWithKey = {
  id: number;
  userId: number;
  key: GoogleCredential;
};

const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export class GoogleCalendarService {
  private credential: CredentialWithKey;
  private oAuth2Client: OAuth2Client;

  constructor(credential: CredentialWithKey, clientId: string, clientSecret: string) {
    this.credential = credential;
    this.oAuth2Client = new OAuth2Client(clientId, clientSecret);
    this.oAuth2Client.setCredentials({
      access_token: credential.key.access_token,
      refresh_token: credential.key.refresh_token,
      expiry_date: credential.key.expiry_date,
    });
  }

  /**
   * Get authenticated Google Calendar API client
   */
  private async getCalendar(): Promise<calendar_v3.Calendar> {
    return googleCalendar({ version: "v3", auth: this.oAuth2Client });
  }

  /**
   * Refresh access token if expired
   */
  async refreshTokenIfNeeded(): Promise<GoogleCredential | null> {
    const now = Date.now();
    const expiryDate = this.credential.key.expiry_date;

    // Refresh if token expires in less than 5 minutes
    if (expiryDate - now < 5 * 60 * 1000) {
      try {
        const { credentials } = await this.oAuth2Client.refreshAccessToken();
        const newKey: GoogleCredential = {
          ...this.credential.key,
          access_token: credentials.access_token!,
          expiry_date: credentials.expiry_date!,
        };
        this.oAuth2Client.setCredentials(credentials);
        return newKey;
      } catch (error) {
        console.error("Failed to refresh Google Calendar token:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get busy times from Google Calendar
   */
  async getAvailability(
    dateFrom: string,
    dateTo: string,
    selectedCalendarIds: string[]
  ): Promise<EventBusyDate[]> {
    const calendar = await this.getCalendar();

    // If no calendars selected, get primary calendar
    const calendarIds =
      selectedCalendarIds.length > 0 ? selectedCalendarIds : await this.getPrimaryCalendarId();

    if (calendarIds.length === 0) {
      return [];
    }

    try {
      // Google API only allows 90 days at a time
      const busyTimes: EventBusyDate[] = [];
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 90) {
        const result = await this.fetchFreeBusy(calendar, dateFrom, dateTo, calendarIds);
        busyTimes.push(...result);
      } else {
        // Chunk into 90-day periods
        let currentStart = fromDate;
        while (currentStart < toDate) {
          const chunkEnd = new Date(currentStart);
          chunkEnd.setDate(chunkEnd.getDate() + 90);
          const endDate = chunkEnd > toDate ? toDate : chunkEnd;

          const result = await this.fetchFreeBusy(
            calendar,
            currentStart.toISOString(),
            endDate.toISOString(),
            calendarIds
          );
          busyTimes.push(...result);

          currentStart = endDate;
        }
      }

      return busyTimes;
    } catch (error) {
      console.error("Error fetching Google Calendar availability:", error);
      throw error;
    }
  }

  private async fetchFreeBusy(
    calendar: calendar_v3.Calendar,
    timeMin: string,
    timeMax: string,
    calendarIds: string[]
  ): Promise<EventBusyDate[]> {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: calendarIds.map((id) => ({ id })),
      },
    });

    const busyTimes: EventBusyDate[] = [];
    if (response.data.calendars) {
      for (const calendarData of Object.values(response.data.calendars)) {
        if (calendarData.busy) {
          for (const busy of calendarData.busy) {
            if (busy.start && busy.end) {
              busyTimes.push({
                start: busy.start,
                end: busy.end,
              });
            }
          }
        }
      }
    }

    return busyTimes;
  }

  private async getPrimaryCalendarId(): Promise<string[]> {
    const calendar = await this.getCalendar();
    try {
      const response = await calendar.calendars.get({ calendarId: "primary" });
      return response.data.id ? [response.data.id] : [];
    } catch {
      return [];
    }
  }

  /**
   * List all calendars
   */
  async listCalendars(): Promise<IntegrationCalendar[]> {
    const calendar = await this.getCalendar();

    try {
      const response = await calendar.calendarList.list({
        fields: "items(id,summary,primary,accessRole)",
      });

      if (!response.data.items) return [];

      return response.data.items.map((cal) => ({
        externalId: cal.id ?? "",
        integration: "google_calendar",
        name: cal.summary ?? "No name",
        primary: cal.primary ?? false,
        readOnly: !(cal.accessRole === "writer" || cal.accessRole === "owner"),
        email: cal.id ?? "",
      }));
    } catch (error) {
      console.error("Error listing Google Calendars:", error);
      throw error;
    }
  }

  /**
   * Get primary calendar info
   */
  async getPrimaryCalendar(): Promise<{ id: string; timeZone: string } | null> {
    const calendar = await this.getCalendar();

    try {
      const response = await calendar.calendars.get({ calendarId: "primary" });
      if (!response.data.id) return null;

      return {
        id: response.data.id,
        timeZone: response.data.timeZone || "UTC",
      };
    } catch (error) {
      console.error("Error getting primary calendar:", error);
      return null;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees?: { email: string; displayName?: string }[];
    calendarId?: string;
  }): Promise<{ id: string; htmlLink: string } | null> {
    const calendar = await this.getCalendar();

    try {
      const response = await calendar.events.insert({
        calendarId: event.calendarId || "primary",
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
        },
        sendUpdates: "all",
      });

      return {
        id: response.data.id || "",
        htmlLink: response.data.htmlLink || "",
      };
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string, calendarId?: string): Promise<void> {
    const calendar = await this.getCalendar();

    try {
      await calendar.events.delete({
        calendarId: calendarId || "primary",
        eventId,
        sendUpdates: "all",
      });
    } catch (error) {
      // Ignore 404/410 errors (event already deleted)
      const err = error as { code?: number };
      if (err.code === 404 || err.code === 410) return;
      console.error("Error deleting Google Calendar event:", error);
      throw error;
    }
  }
}

/**
 * Generate Google OAuth URL
 */
export function getGoogleAuthUrl(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  state?: string
): string {
  const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_CALENDAR_SCOPES,
    prompt: "consent",
    state,
  });
}

/**
 * Exchange auth code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleCredential> {
  const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
  const { tokens } = await oAuth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error("Failed to get complete tokens from Google");
  }

  return {
    scope: tokens.scope || GOOGLE_CALENDAR_SCOPES.join(" "),
    token_type: "Bearer",
    expiry_date: tokens.expiry_date,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  };
}

export { GOOGLE_CALENDAR_SCOPES };
