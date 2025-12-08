import { dayjs, type Dayjs } from "@zakazi-termin/config";
import type { DateRange } from "./date-ranges";

export type GetSlotsInput = {
  inviteeDate: Dayjs;
  frequency: number; // slot interval in minutes
  dateRanges: DateRange[];
  minimumBookingNotice: number; // minutes
  eventLength: number; // minutes
  offsetStart?: number;
};

export type Slot = {
  time: Dayjs;
};

const minimumOfOne = (input: number) => (input < 1 ? 1 : input);

/**
 * Get the timezone from a dayjs object
 */
function getTimeZone(date: Dayjs): string {
  // @ts-expect-error - accessing internal timezone
  return date.$x?.$timezone || "UTC";
}

/**
 * Correct slot start time to align with hour/15min/5min boundaries
 */
function getCorrectedSlotStartTime({
  slotStartTime,
  range,
  interval,
}: {
  interval: number;
  slotStartTime: Dayjs;
  range: DateRange;
}): Dayjs {
  // Try to align to cleaner time boundaries if possible
  const minutesRequiredToMoveToNextSlot = interval - (slotStartTime.minute() % interval);
  const minutesRequiredToMoveTo15MinSlot = 15 - (slotStartTime.minute() % 15);
  const minutesRequiredToMoveTo5MinSlot = 5 - (slotStartTime.minute() % 5);
  const extraMinutesAvailable = range.end.diff(slotStartTime, "minutes") % interval;

  if (extraMinutesAvailable >= minutesRequiredToMoveToNextSlot) {
    return slotStartTime.add(minutesRequiredToMoveToNextSlot, "minute");
  } else if (extraMinutesAvailable >= minutesRequiredToMoveTo15MinSlot) {
    return slotStartTime.add(minutesRequiredToMoveTo15MinSlot, "minute");
  } else if (extraMinutesAvailable >= minutesRequiredToMoveTo5MinSlot) {
    return slotStartTime.add(minutesRequiredToMoveTo5MinSlot, "minute");
  }

  return slotStartTime.startOf("hour").add(Math.ceil(slotStartTime.minute() / interval) * interval, "minute");
}

/**
 * Build slots from date ranges
 */
function buildSlotsWithDateRanges({
  dateRanges,
  frequency,
  eventLength,
  timeZone,
  minimumBookingNotice,
  offsetStart = 0,
}: {
  dateRanges: DateRange[];
  frequency: number;
  eventLength: number;
  timeZone: string;
  minimumBookingNotice: number;
  offsetStart?: number;
}): Slot[] {
  // Ensure minimum values
  frequency = minimumOfOne(frequency);
  eventLength = minimumOfOne(eventLength);
  offsetStart = offsetStart ? minimumOfOne(offsetStart) : 0;

  const orderedDateRanges = dateRanges.sort((a, b) => a.start.valueOf() - b.start.valueOf());

  // Map to track unique slots
  const slots = new Map<string, Slot>();

  // Determine the slot interval based on frequency
  let interval = 1;
  const intervalsWithDefinedStartTimes = [60, 30, 20, 15, 10, 5];
  for (const definedInterval of intervalsWithDefinedStartTimes) {
    if (frequency % definedInterval === 0) {
      interval = definedInterval;
      break;
    }
  }

  const startTimeWithMinNotice = dayjs.utc().add(minimumBookingNotice, "minute");
  const slotBoundaries = new Map<number, true>();

  for (const range of orderedDateRanges) {
    let slotStartTime = range.start.utc().isAfter(startTimeWithMinNotice)
      ? range.start
      : startTimeWithMinNotice;

    // Normalize seconds to zero
    slotStartTime = slotStartTime.set("second", 0).set("millisecond", 0);

    // Convert to target timezone before checking alignment
    slotStartTime = slotStartTime.tz(timeZone);

    // Align to interval boundaries if needed
    if (slotStartTime.minute() % interval !== 0) {
      slotStartTime = getCorrectedSlotStartTime({
        interval,
        slotStartTime,
        range,
      });
    }

    slotStartTime = slotStartTime.add(offsetStart, "minutes");

    // Find nearest appropriate slot boundary
    const slotBoundariesArray = Array.from(slotBoundaries.keys()).sort((a, b) => a - b);
    if (slotBoundariesArray.length > 0) {
      let prevBoundary: number | null = null;
      for (let i = slotBoundariesArray.length - 1; i >= 0; i--) {
        if (slotBoundariesArray[i] < slotStartTime.valueOf()) {
          prevBoundary = slotBoundariesArray[i];
          break;
        }
      }

      if (prevBoundary) {
        const prevBoundaryEnd = dayjs(prevBoundary).add(frequency + offsetStart, "minutes");
        if (prevBoundaryEnd.isAfter(slotStartTime)) {
          const dayjsPrevBoundary = dayjs(prevBoundary);
          if (!dayjsPrevBoundary.isBefore(range.start)) {
            slotStartTime = dayjsPrevBoundary;
          } else {
            slotStartTime = prevBoundaryEnd;
          }
          slotStartTime = slotStartTime.tz(timeZone);
        }
      }
    }

    // Generate slots within this range
    while (!slotStartTime.add(eventLength, "minutes").subtract(1, "second").utc().isAfter(range.end)) {
      const slotKey = slotStartTime.toISOString();

      if (slots.has(slotKey)) {
        slotStartTime = slotStartTime.add(frequency + offsetStart, "minutes");
        continue;
      }

      slotBoundaries.set(slotStartTime.valueOf(), true);
      slots.set(slotKey, { time: slotStartTime });
      slotStartTime = slotStartTime.add(frequency + offsetStart, "minutes");
    }
  }

  return Array.from(slots.values());
}

/**
 * Get available time slots for booking
 */
export function getSlots({
  inviteeDate,
  frequency,
  minimumBookingNotice,
  dateRanges,
  eventLength,
  offsetStart = 0,
}: GetSlotsInput): Slot[] {
  return buildSlotsWithDateRanges({
    dateRanges,
    frequency,
    eventLength,
    timeZone: getTimeZone(inviteeDate),
    minimumBookingNotice,
    offsetStart,
  });
}

export default getSlots;
