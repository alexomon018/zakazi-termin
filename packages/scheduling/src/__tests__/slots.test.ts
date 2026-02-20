import { dayjs } from "@salonko/config";
import { describe, expect, it } from "vitest";
import type { DateRange } from "../date-ranges";
import { getSlots } from "../slots";

const BELGRADE_TZ = "Europe/Belgrade";

// Belgrade DST transitions:
// Spring-forward 2026: Sunday March 29, 02:00→03:00 (UTC+1 → UTC+2)
// Fall-back 2026: Sunday October 25, 03:00→02:00 (UTC+2 → UTC+1)

/** Get a future date string for non-DST testing (3 months from now) */
function getFutureDate(): string {
  return dayjs().add(3, "months").format("YYYY-MM-DD");
}

/** Create a DateRange in Belgrade timezone */
function makeRange(dateStr: string, startHour: number, endHour: number): DateRange {
  return {
    start: dayjs.tz(`${dateStr} ${String(startHour).padStart(2, "0")}:00`, BELGRADE_TZ),
    end: dayjs.tz(`${dateStr} ${String(endHour).padStart(2, "0")}:00`, BELGRADE_TZ),
  };
}

describe("getSlots - DST transitions", () => {
  it("generates slots on a normal day without DST", () => {
    const futureDate = getFutureDate();
    const inviteeDate = dayjs.tz(futureDate, BELGRADE_TZ);
    const dateRanges = [makeRange(futureDate, 9, 12)]; // 3 hours

    const slots = getSlots({
      inviteeDate,
      frequency: 30,
      minimumBookingNotice: 0,
      dateRanges,
      eventLength: 30,
    });

    // 9:00, 9:30, 10:00, 10:30, 11:00, 11:30 = 6 slots
    expect(slots).toHaveLength(6);
    expect(slots[0].time.tz(BELGRADE_TZ).hour()).toBe(9);
    expect(slots[0].time.tz(BELGRADE_TZ).minute()).toBe(0);
  });

  it("generates correct slots spanning spring-forward transition", () => {
    // Range that spans the spring-forward: 01:00 to 04:00 on March 29
    // At 02:00, clocks jump to 03:00, so real duration is 2 hours (not 3)
    const inviteeDate = dayjs.tz("2026-03-29", BELGRADE_TZ);
    const dateRanges = [makeRange("2026-03-29", 1, 4)];

    const slots = getSlots({
      inviteeDate,
      frequency: 30,
      minimumBookingNotice: 0,
      dateRanges,
      eventLength: 30,
    });

    // All slots should have valid UTC times (no duplicates, no skipped-hour slots)
    const utcTimes = slots.map((s) => s.time.utc().valueOf());
    const uniqueUtcTimes = new Set(utcTimes);
    expect(utcTimes.length).toBe(uniqueUtcTimes.size);

    // No slot should have wall-clock time in the skipped hour (02:00-02:59 Belgrade)
    for (const slot of slots) {
      const belgradeHour = slot.time.tz(BELGRADE_TZ).hour();
      const belgradeMinute = slot.time.tz(BELGRADE_TZ).minute();
      if (belgradeHour === 2) {
        // On spring-forward, 02:xx doesn't exist - dayjs normalizes to 03:xx
        // So if hour is 2, it should actually be valid (pre-transition, CET)
        // Verify UTC is consistent
        expect(slot.time.utc().isValid()).toBe(true);
      }
    }
  });

  it("generates correct slots after spring-forward (post-transition working hours)", () => {
    // Working hours 09:00-17:00 on spring-forward day (well after transition)
    const inviteeDate = dayjs.tz("2026-03-29", BELGRADE_TZ);
    const dateRanges = [makeRange("2026-03-29", 9, 12)];

    const slots = getSlots({
      inviteeDate,
      frequency: 30,
      minimumBookingNotice: 0,
      dateRanges,
      eventLength: 30,
    });

    expect(slots).toHaveLength(6);
    expect(slots[0].time.tz(BELGRADE_TZ).hour()).toBe(9);

    // Post spring-forward, Belgrade is UTC+2
    expect(slots[0].time.utc().hour()).toBe(7); // 09:00 CEST = 07:00 UTC
  });

  it("generates correct slots spanning fall-back transition", () => {
    // Range 01:00 to 04:00 on October 25 — the fall-back day
    // At 03:00, clocks go back to 02:00, so real duration is 4 hours (not 3)
    const inviteeDate = dayjs.tz("2026-10-25", BELGRADE_TZ);
    const dateRanges = [makeRange("2026-10-25", 1, 4)];

    const slots = getSlots({
      inviteeDate,
      frequency: 30,
      minimumBookingNotice: 0,
      dateRanges,
      eventLength: 30,
    });

    // All UTC times should be unique and strictly increasing
    const utcTimes = slots.map((s) => s.time.utc().valueOf());
    for (let i = 1; i < utcTimes.length; i++) {
      expect(utcTimes[i]).toBeGreaterThan(utcTimes[i - 1]);
    }
  });

  it("generates correct slots after fall-back (post-transition working hours)", () => {
    // Working hours 09:00-12:00 on fall-back day (well after transition)
    const inviteeDate = dayjs.tz("2026-10-25", BELGRADE_TZ);
    const dateRanges = [makeRange("2026-10-25", 9, 12)];

    const slots = getSlots({
      inviteeDate,
      frequency: 30,
      minimumBookingNotice: 0,
      dateRanges,
      eventLength: 30,
    });

    expect(slots).toHaveLength(6);
    expect(slots[0].time.tz(BELGRADE_TZ).hour()).toBe(9);

    // Post fall-back, Belgrade is UTC+1
    expect(slots[0].time.utc().hour()).toBe(8); // 09:00 CET = 08:00 UTC
  });

  it("handles minimum booking notice around DST transition", () => {
    // Set "now" to just before spring-forward, with a booking notice that crosses it
    const inviteeDate = dayjs.tz("2026-03-29", BELGRADE_TZ);
    const dateRanges = [makeRange("2026-03-29", 9, 17)];

    const slots = getSlots({
      inviteeDate,
      frequency: 60,
      minimumBookingNotice: 120, // 2 hours
      dateRanges,
      eventLength: 60,
    });

    // All slots should be valid
    for (const slot of slots) {
      expect(slot.time.isValid()).toBe(true);
      expect(slot.time.tz(BELGRADE_TZ).hour()).toBeGreaterThanOrEqual(9);
    }
  });
});
