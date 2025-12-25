import { type Dayjs, dayjs } from "@zakazi-termin/config";

export type DateRange = {
  start: Dayjs;
  end: Dayjs;
};

export type WorkingHours = {
  days: number[];
  startTime: Date;
  endTime: Date;
};

export type DateOverride = {
  date: Date;
  startTime: Date;
  endTime: Date;
};

/**
 * Process working hours into date ranges for a given date range
 */
export function processWorkingHours(
  results: Record<number, DateRange>,
  {
    item,
    timeZone,
    dateFrom,
    dateTo,
  }: {
    item: WorkingHours;
    timeZone: string;
    dateFrom: Dayjs;
    dateTo: Dayjs;
  }
): Record<number, DateRange> {
  const utcDateTo = dateTo.utc();

  for (let date = dateFrom.startOf("day"); utcDateTo.isAfter(date); date = date.add(1, "day")) {
    const fromOffset = dateFrom.startOf("day").utcOffset();
    const offset = date.tz(timeZone).utcOffset();

    // Always start at midnight in the target timezone
    const dateInTz = date.add(fromOffset - offset, "minutes").tz(timeZone);

    if (!item.days.includes(dateInTz.day())) {
      continue;
    }

    let start = dateInTz
      .add(item.startTime.getUTCHours(), "hours")
      .add(item.startTime.getUTCMinutes(), "minutes");

    let end = dateInTz
      .add(item.endTime.getUTCHours(), "hours")
      .add(item.endTime.getUTCMinutes(), "minutes");

    // Handle DST offset differences
    const offsetBeginningOfDay = dayjs(start.format("YYYY-MM-DD hh:mm")).tz(timeZone).utcOffset();
    const offsetDiff = start.utcOffset() - offsetBeginningOfDay;

    start = start.add(offsetDiff, "minute");
    end = end.add(offsetDiff, "minute");

    const startResult = dayjs.max(start, dateFrom)!;
    let endResult = dayjs.min(end, dateTo.tz(timeZone))!;

    // Handle 11:59 PM as midnight
    if (endResult.hour() === 23 && endResult.minute() === 59) {
      endResult = endResult.add(1, "minute");
    }

    if (endResult.isBefore(startResult)) {
      continue;
    }

    const key = endResult.valueOf();

    if (results[startResult.valueOf()]) {
      // Merge with existing range
      const oldKey = startResult.valueOf();
      results[key] = {
        start: results[oldKey].start,
        end: dayjs.max(results[oldKey].end, endResult)!,
      };
      delete results[oldKey];
    } else {
      results[key] = {
        start: startResult,
        end: endResult,
      };
    }
  }

  return results;
}

/**
 * Process a date override (specific date with custom hours)
 */
export function processDateOverride({
  item,
  timeZone,
}: {
  item: DateOverride;
  timeZone: string;
}): DateRange {
  const itemDate = dayjs.utc(item.date);
  const itemDateStartOfDay = itemDate.startOf("day");

  const startDate = itemDateStartOfDay
    .add(item.startTime.getUTCHours(), "hours")
    .add(item.startTime.getUTCMinutes(), "minutes")
    .second(0)
    .tz(timeZone, true);

  let endDate: Dayjs;
  const endTimeHours = item.endTime.getUTCHours();
  const endTimeMinutes = item.endTime.getUTCMinutes();

  if (endTimeHours === 23 && endTimeMinutes === 59) {
    endDate = itemDateStartOfDay.add(1, "day").tz(timeZone, true);
  } else {
    endDate = itemDateStartOfDay
      .add(endTimeHours, "hours")
      .add(endTimeMinutes, "minutes")
      .second(0)
      .tz(timeZone, true);
  }

  return { start: startDate, end: endDate };
}

/**
 * Build date ranges from availability (working hours + overrides)
 */
export function buildDateRanges({
  availability,
  timeZone,
  dateFrom,
  dateTo,
}: {
  timeZone: string;
  availability: (DateOverride | WorkingHours)[];
  dateFrom: Dayjs;
  dateTo: Dayjs;
}): DateRange[] {
  const dateFromOrganizerTZ = dateFrom.tz(timeZone);

  // Process working hours
  const workingHoursRanges = Object.values(
    availability.reduce((processed: Record<number, DateRange>, item) => {
      if (!("days" in item)) {
        return processed;
      }
      return processWorkingHours(processed, {
        item,
        timeZone,
        dateFrom: dateFromOrganizerTZ,
        dateTo,
      });
    }, {})
  );

  // Process date overrides
  const dateOverrideRanges = availability
    .filter((item): item is DateOverride => "date" in item && !!item.date)
    .filter((item) => {
      const itemDate = dayjs.utc(item.date);
      return itemDate.isBetween(
        dateFrom.subtract(1, "day").startOf("day"),
        dateTo.add(1, "day").endOf("day"),
        null,
        "[]"
      );
    })
    .map((item) => processDateOverride({ item, timeZone }));

  // Group by date and merge
  const groupedWorkingHours = groupByDate(workingHoursRanges);
  const groupedOverrides = groupByDate(dateOverrideRanges);

  // Overrides replace working hours for the same date
  const merged = { ...groupedWorkingHours, ...groupedOverrides };

  return Object.values(merged)
    .flat()
    .filter((range) => range.start.valueOf() !== range.end.valueOf());
}

/**
 * Group date ranges by date string
 */
export function groupByDate(ranges: DateRange[]): Record<string, DateRange[]> {
  return ranges.reduce(
    (acc, range) => {
      const dateString = dayjs(range.start).format("YYYY-MM-DD");
      acc[dateString] = acc[dateString] ? [...acc[dateString], range] : [range];
      return acc;
    },
    {} as Record<string, DateRange[]>
  );
}

/**
 * Find intersection of multiple date range arrays
 */
export function intersect(ranges: DateRange[][]): DateRange[] {
  if (!ranges.length) return [];

  let commonAvailability = ranges[0].sort((a, b) => a.start.valueOf() - b.start.valueOf());

  for (let i = 1; i < ranges.length; i++) {
    if (commonAvailability.length === 0) return [];

    const userRanges = ranges[i].sort((a, b) => a.start.valueOf() - b.start.valueOf());
    const intersectedRanges: DateRange[] = [];

    let commonIndex = 0;
    let userIndex = 0;

    while (commonIndex < commonAvailability.length && userIndex < userRanges.length) {
      const commonRange = commonAvailability[commonIndex];
      const userRange = userRanges[userIndex];

      const intersectStart = dayjs.max(commonRange.start, userRange.start)!;
      const intersectEnd = dayjs.min(commonRange.end, userRange.end)!;

      if (intersectStart.isBefore(intersectEnd)) {
        intersectedRanges.push({ start: intersectStart, end: intersectEnd });
      }

      if (commonRange.end.valueOf() <= userRange.end.valueOf()) {
        commonIndex++;
      } else {
        userIndex++;
      }
    }
    commonAvailability = intersectedRanges;
  }

  return commonAvailability;
}

/**
 * Subtract excluded ranges from source ranges
 */
export function subtract(sourceRanges: DateRange[], excludedRanges: DateRange[]): DateRange[] {
  const result: DateRange[] = [];
  const sortedExcluded = [...excludedRanges].sort((a, b) => a.start.valueOf() - b.start.valueOf());

  for (const { start: sourceStart, end: sourceEnd } of sourceRanges) {
    let currentStart = sourceStart;

    for (const excluded of sortedExcluded) {
      if (excluded.start.valueOf() >= sourceEnd.valueOf()) break;
      if (excluded.end.valueOf() <= currentStart.valueOf()) continue;

      if (excluded.start.valueOf() > currentStart.valueOf()) {
        result.push({ start: currentStart, end: excluded.start });
      }

      if (excluded.end.valueOf() > currentStart.valueOf()) {
        currentStart = excluded.end;
      }
    }

    if (sourceEnd.valueOf() > currentStart.valueOf()) {
      result.push({ start: currentStart, end: sourceEnd });
    }
  }

  return result;
}
