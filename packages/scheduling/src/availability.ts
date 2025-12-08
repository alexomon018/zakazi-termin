import { dayjs, type Dayjs } from "@zakazi-termin/config";
import { buildDateRanges, subtract, type DateRange, type WorkingHours, type DateOverride } from "./date-ranges";
import { getSlots, type Slot } from "./slots";

export type AvailabilityInput = {
  availability: (WorkingHours | DateOverride)[];
  timeZone: string;
  dateFrom: Date;
  dateTo: Date;
  eventLength: number;
  slotInterval?: number;
  minimumBookingNotice?: number;
  busyTimes?: { start: Date; end: Date }[];
};

export type AvailabilityOutput = {
  slots: Slot[];
  dateRanges: DateRange[];
};

/**
 * Convert busy times (existing bookings) to DateRange format
 */
function busyTimesToDateRanges(busyTimes: { start: Date; end: Date }[]): DateRange[] {
  return busyTimes.map((busy) => ({
    start: dayjs(busy.start),
    end: dayjs(busy.end),
  }));
}

/**
 * Get available slots for a user based on their availability and existing bookings
 */
export function getAvailability({
  availability,
  timeZone,
  dateFrom,
  dateTo,
  eventLength,
  slotInterval,
  minimumBookingNotice = 120,
  busyTimes = [],
}: AvailabilityInput): AvailabilityOutput {
  const dateFromDayjs = dayjs(dateFrom).tz(timeZone);
  const dateToDayjs = dayjs(dateTo).tz(timeZone);

  // Build date ranges from working hours and overrides
  const dateRanges = buildDateRanges({
    availability,
    timeZone,
    dateFrom: dateFromDayjs,
    dateTo: dateToDayjs,
  });

  // Subtract busy times (existing bookings)
  const busyDateRanges = busyTimesToDateRanges(busyTimes);
  const availableRanges = subtract(dateRanges, busyDateRanges);

  // Generate slots from available ranges
  const frequency = slotInterval || eventLength;
  const slots = getSlots({
    inviteeDate: dateFromDayjs,
    frequency,
    dateRanges: availableRanges,
    eventLength,
    minimumBookingNotice,
  });

  return {
    slots,
    dateRanges: availableRanges,
  };
}

/**
 * Check if a specific time slot is available
 */
export function isSlotAvailable({
  slotStart,
  slotEnd,
  availability,
  timeZone,
  busyTimes = [],
}: {
  slotStart: Date;
  slotEnd: Date;
  availability: (WorkingHours | DateOverride)[];
  timeZone: string;
  busyTimes?: { start: Date; end: Date }[];
}): boolean {
  const slotStartDayjs = dayjs(slotStart);
  const slotEndDayjs = dayjs(slotEnd);

  // Build date ranges for just this day
  const dateRanges = buildDateRanges({
    availability,
    timeZone,
    dateFrom: slotStartDayjs.startOf("day"),
    dateTo: slotEndDayjs.endOf("day"),
  });

  // Subtract busy times
  const busyDateRanges = busyTimesToDateRanges(busyTimes);
  const availableRanges = subtract(dateRanges, busyDateRanges);

  // Check if the slot fits within any available range
  for (const range of availableRanges) {
    if (
      slotStartDayjs.valueOf() >= range.start.valueOf() &&
      slotEndDayjs.valueOf() <= range.end.valueOf()
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get busy times from bookings
 */
export function getBookingBusyTimes(
  bookings: { startTime: Date; endTime: Date; status: string }[]
): { start: Date; end: Date }[] {
  return bookings
    .filter((booking) => booking.status !== "CANCELLED" && booking.status !== "REJECTED")
    .map((booking) => ({
      start: booking.startTime,
      end: booking.endTime,
    }));
}
