import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { MockedTools } from "../types";

/**
 * Default mocked tool responses that match the shape returned by callTool
 * in apps/web/app/api/messaging/agent/route.ts. All responses are JSON strings.
 */
const BELGRADE_TZ = "Europe/Belgrade";

dayjs.extend(utc);
dayjs.extend(timezone);

function belgradeSlotISOsFromNow(offsetHours: number[]): string[] {
  const base = dayjs.tz(new Date(), BELGRADE_TZ);
  return offsetHours.map((h) => base.add(h, "hour").format("YYYY-MM-DDTHH:mm:ssZ"));
}

export const defaultMockedTools: MockedTools = {
  get_salon_info: JSON.stringify({
    salonName: "Test Salon",
    salonSlug: "test-salon",
    salonCity: "Beograd",
    salonAddress: "Knez Mihailova 1",
    salonTypes: ["HAIR_SALON"],
    timeZone: BELGRADE_TZ,
    services: [
      {
        id: "et-sisanje",
        title: "Šišanje",
        slug: "sisanje",
        length: 30,
        description: "Klasično muško/žensko šišanje",
        locations: [],
        minimumBookingNotice: 60,
      },
      {
        id: "et-manikir",
        title: "Manikir",
        slug: "manikir",
        length: 45,
        description: "Klasičan manikir",
        locations: [],
        minimumBookingNotice: 60,
      },
    ],
  }),

  check_availability: (args) => {
    const slug = (args.eventTypeSlug as string) ?? "sisanje";
    return JSON.stringify({
      slots: belgradeSlotISOsFromNow([1, 2, 3, 6]),
      timeZone: BELGRADE_TZ,
      eventType: { id: `et-${slug}`, title: slug, length: 30 },
    });
  },

  create_booking: (args) => {
    return JSON.stringify({
      uid: "booking-test-uid",
      startTime: args.startTime,
      endTime: args.endTime,
      status: "PENDING",
    });
  },
};

export const emptyAvailabilityMock: MockedTools = {
  ...defaultMockedTools,
  check_availability: JSON.stringify({
    slots: [],
    timeZone: BELGRADE_TZ,
    eventType: { id: "et-sisanje", title: "Šišanje", length: 30 },
  }),
};
