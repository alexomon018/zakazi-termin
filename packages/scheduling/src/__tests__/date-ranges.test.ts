import { dayjs } from "@salonko/config";
import { describe, expect, it } from "vitest";
import {
  type DateRange,
  type WorkingHours,
  buildDateRanges,
  groupByDate,
  processDateOverride,
  processWorkingHours,
} from "../date-ranges";

const BELGRADE_TZ = "Europe/Belgrade";

// Belgrade DST transitions:
// Spring-forward 2026: Sunday March 29, 02:00→03:00 (UTC+1 → UTC+2)
// Fall-back 2026: Sunday October 25, 03:00→02:00 (UTC+2 → UTC+1)

/** Create a working hours item for the given days (0=Sun..6=Sat), startHour, endHour */
function makeWorkingHours(days: number[], startHour: number, endHour: number): WorkingHours {
  return {
    days,
    startTime: new Date(Date.UTC(1970, 0, 1, startHour, 0)),
    endTime: new Date(Date.UTC(1970, 0, 1, endHour, 0)),
  };
}

describe("processWorkingHours", () => {
  it("produces valid ranges on a normal weekday (no DST)", () => {
    // Wednesday 2026-01-07, 09:00-17:00 Belgrade (UTC+1)
    const dateFrom = dayjs.tz("2026-01-07", BELGRADE_TZ);
    const dateTo = dayjs.tz("2026-01-08", BELGRADE_TZ);
    const item = makeWorkingHours([3], 9, 17); // Wednesday

    const results = processWorkingHours({}, { item, timeZone: BELGRADE_TZ, dateFrom, dateTo });
    const ranges = Object.values(results);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].start.tz(BELGRADE_TZ).hour()).toBe(9);
    expect(ranges[0].end.tz(BELGRADE_TZ).hour()).toBe(17);
  });

  it("produces correct ranges on spring-forward day (March 29 2026)", () => {
    // March 29 2026 is a Sunday, clocks skip 02:00→03:00
    const dateFrom = dayjs.tz("2026-03-29", BELGRADE_TZ);
    const dateTo = dayjs.tz("2026-03-30", BELGRADE_TZ);
    const item = makeWorkingHours([0], 9, 17); // Sunday

    const results = processWorkingHours({}, { item, timeZone: BELGRADE_TZ, dateFrom, dateTo });
    const ranges = Object.values(results);

    expect(ranges).toHaveLength(1);
    const range = ranges[0];

    // Start and end should be correct wall-clock times in Belgrade
    expect(range.start.tz(BELGRADE_TZ).hour()).toBe(9);
    expect(range.end.tz(BELGRADE_TZ).hour()).toBe(17);

    // Duration should be 8 hours in wall-clock but 8 hours in real time
    // (DST transition is at 02:00, working hours are 09:00-17:00 which is after the transition)
    const durationMinutes = range.end.diff(range.start, "minutes");
    expect(durationMinutes).toBe(480); // 8 hours
  });

  it("produces correct ranges on fall-back day (October 25 2026)", () => {
    // October 25 2026 is a Sunday, clocks repeat 02:00→03:00
    const dateFrom = dayjs.tz("2026-10-25", BELGRADE_TZ);
    const dateTo = dayjs.tz("2026-10-26", BELGRADE_TZ);
    const item = makeWorkingHours([0], 9, 17); // Sunday

    const results = processWorkingHours({}, { item, timeZone: BELGRADE_TZ, dateFrom, dateTo });
    const ranges = Object.values(results);

    expect(ranges).toHaveLength(1);
    const range = ranges[0];

    expect(range.start.tz(BELGRADE_TZ).hour()).toBe(9);
    expect(range.end.tz(BELGRADE_TZ).hour()).toBe(17);

    const durationMinutes = range.end.diff(range.start, "minutes");
    expect(durationMinutes).toBe(480); // 8 hours
  });

  it("handles multi-day range spanning spring-forward transition", () => {
    // March 28 (Saturday, UTC+1) to March 30 (Monday, UTC+2)
    const dateFrom = dayjs.tz("2026-03-28", BELGRADE_TZ);
    const dateTo = dayjs.tz("2026-03-31", BELGRADE_TZ);
    // Mon-Sat = days [1,2,3,4,5,6], 09:00-17:00
    const item = makeWorkingHours([1, 2, 3, 4, 5, 6], 9, 17);

    const results = processWorkingHours({}, { item, timeZone: BELGRADE_TZ, dateFrom, dateTo });
    const ranges = Object.values(results);

    // Should have ranges for Saturday March 28 and Monday March 30
    expect(ranges.length).toBeGreaterThanOrEqual(2);

    for (const range of ranges) {
      expect(range.start.tz(BELGRADE_TZ).hour()).toBe(9);
      expect(range.end.tz(BELGRADE_TZ).hour()).toBe(17);
    }
  });

  it("handles multi-day range spanning fall-back transition", () => {
    // October 24 (Saturday, UTC+2) to October 27 (Tuesday, UTC+1)
    const dateFrom = dayjs.tz("2026-10-24", BELGRADE_TZ);
    const dateTo = dayjs.tz("2026-10-28", BELGRADE_TZ);
    const item = makeWorkingHours([1, 2, 3, 4, 5, 6], 9, 17);

    const results = processWorkingHours({}, { item, timeZone: BELGRADE_TZ, dateFrom, dateTo });
    const ranges = Object.values(results);

    expect(ranges.length).toBeGreaterThanOrEqual(2);

    for (const range of ranges) {
      expect(range.start.tz(BELGRADE_TZ).hour()).toBe(9);
      expect(range.end.tz(BELGRADE_TZ).hour()).toBe(17);
    }
  });
});

describe("processDateOverride", () => {
  it("handles date override on spring-forward day", () => {
    // March 29 2026, override 10:00-18:00
    const override = {
      date: new Date(Date.UTC(2026, 2, 29)), // March 29
      startTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 18, 0)),
    };

    const result = processDateOverride({ item: override, timeZone: BELGRADE_TZ });

    expect(result.start.tz(BELGRADE_TZ).hour()).toBe(10);
    expect(result.end.tz(BELGRADE_TZ).hour()).toBe(18);
    expect(result.end.diff(result.start, "minutes")).toBe(480);
  });

  it("handles date override on fall-back day", () => {
    // October 25 2026, override 10:00-18:00
    const override = {
      date: new Date(Date.UTC(2026, 9, 25)), // October 25
      startTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 18, 0)),
    };

    const result = processDateOverride({ item: override, timeZone: BELGRADE_TZ });

    expect(result.start.tz(BELGRADE_TZ).hour()).toBe(10);
    expect(result.end.tz(BELGRADE_TZ).hour()).toBe(18);
    expect(result.end.diff(result.start, "minutes")).toBe(480);
  });

  it("handles midnight (23:59) end time on spring-forward day", () => {
    const override = {
      date: new Date(Date.UTC(2026, 2, 29)),
      startTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 23, 59)),
    };

    const result = processDateOverride({ item: override, timeZone: BELGRADE_TZ });

    expect(result.start.tz(BELGRADE_TZ).hour()).toBe(8);
    // 23:59 should be treated as next day midnight
    expect(result.end.tz(BELGRADE_TZ).date()).toBe(30);
    expect(result.end.tz(BELGRADE_TZ).hour()).toBe(0);
  });
});

describe("groupByDate", () => {
  it("groups ranges by date string in the correct timezone", () => {
    // Two ranges on different days
    const ranges: DateRange[] = [
      {
        start: dayjs.tz("2026-03-29 09:00", BELGRADE_TZ),
        end: dayjs.tz("2026-03-29 17:00", BELGRADE_TZ),
      },
      {
        start: dayjs.tz("2026-03-30 09:00", BELGRADE_TZ),
        end: dayjs.tz("2026-03-30 17:00", BELGRADE_TZ),
      },
    ];

    const grouped = groupByDate(ranges);
    const dates = Object.keys(grouped);

    expect(dates).toHaveLength(2);
    expect(dates).toContain("2026-03-29");
    expect(dates).toContain("2026-03-30");
  });
});

describe("buildDateRanges", () => {
  it("overrides replace working hours on the same date", () => {
    const dateFrom = dayjs.tz("2026-03-29", BELGRADE_TZ);
    const dateTo = dayjs.tz("2026-03-30", BELGRADE_TZ);

    const workingHours = makeWorkingHours([0], 9, 17); // Sunday
    const override = {
      date: new Date(Date.UTC(2026, 2, 29)),
      startTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 14, 0)),
    };

    const ranges = buildDateRanges({
      availability: [workingHours, override],
      timeZone: BELGRADE_TZ,
      dateFrom,
      dateTo,
    });

    // Override should win over working hours for March 29
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start.tz(BELGRADE_TZ).hour()).toBe(10);
    expect(ranges[0].end.tz(BELGRADE_TZ).hour()).toBe(14);
  });

  it("returns correct ranges across a DST spring-forward week", () => {
    // March 27 (Fri) to April 1 (Wed), transition on March 29
    const dateFrom = dayjs.tz("2026-03-27", BELGRADE_TZ);
    const dateTo = dayjs.tz("2026-04-01", BELGRADE_TZ);
    const item = makeWorkingHours([1, 2, 3, 4, 5], 9, 17); // Mon-Fri

    const ranges = buildDateRanges({
      availability: [item],
      timeZone: BELGRADE_TZ,
      dateFrom,
      dateTo,
    });

    // Should have Friday March 27, Monday March 30, Tuesday March 31
    expect(ranges.length).toBeGreaterThanOrEqual(3);

    for (const range of ranges) {
      expect(range.start.tz(BELGRADE_TZ).hour()).toBe(9);
      expect(range.end.tz(BELGRADE_TZ).hour()).toBe(17);
    }
  });
});
