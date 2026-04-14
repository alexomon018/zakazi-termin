import type { MockedTools } from "../types";

/**
 * Default mocked tool responses that match the shape returned by callTool
 * in apps/web/app/api/messaging/agent/route.ts. All responses are JSON strings.
 */
export const defaultMockedTools: MockedTools = {
  get_salon_info: JSON.stringify({
    salonName: "Test Salon",
    salonSlug: "test-salon",
    salonCity: "Beograd",
    salonAddress: "Knez Mihailova 1",
    salonTypes: ["HAIR_SALON"],
    timeZone: "Europe/Belgrade",
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
      slots: [
        "2026-04-15T09:00:00+02:00",
        "2026-04-15T10:00:00+02:00",
        "2026-04-15T11:00:00+02:00",
        "2026-04-15T14:00:00+02:00",
      ],
      timeZone: "Europe/Belgrade",
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
    timeZone: "Europe/Belgrade",
    eventType: { id: "et-sisanje", title: "Šišanje", length: 30 },
  }),
};
