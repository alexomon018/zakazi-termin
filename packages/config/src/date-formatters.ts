import { dayjs } from "./dayjs";

/**
 * Predefined date/time formats for Serbian locale
 * All formats produce Serbian localized output (e.g., "ponedeljak", "decembar")
 */
export const DATE_FORMATS = {
  /** Full date: "ponedeljak, 25. decembar 2024." */
  fullDate: "dddd, D. MMMM YYYY.",
  /** Short date: "pon, 25. dec" */
  shortDate: "ddd, D. MMM",
  /** Date only: "25. decembar 2024." */
  dateOnly: "D. MMMM YYYY.",
  /** Time only: "10:00" */
  timeOnly: "HH:mm",
  /** Short date and time: "pon, 25. dec, 10:00" */
  shortDateTime: "ddd, D. MMM, HH:mm",
} as const;

export type DateFormatKey = keyof typeof DATE_FORMATS;

/**
 * Format a date using predefined Serbian locale formats
 *
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @param format - Format key from DATE_FORMATS (default: "fullDate")
 * @returns Formatted date string in Serbian locale
 *
 * @example
 * formatDate(new Date("2024-12-25T10:00:00")) // "sreda, 25. decembar 2024."
 * formatDate("2024-12-25", "shortDate") // "sre, 25. dec"
 */
export function formatDate(
  date: Date | string | number,
  format: DateFormatKey = "fullDate"
): string {
  return dayjs(date).format(DATE_FORMATS[format]);
}

/**
 * Format a date to time only (HH:mm) in local timezone
 *
 * @param date - Date to format
 * @returns Time string in "HH:mm" format
 *
 * @example
 * formatTime(new Date("2024-12-25T10:30:00")) // "10:30"
 */
export function formatTime(date: Date | string | number): string {
  return dayjs(date).format(DATE_FORMATS.timeOnly);
}

/**
 * Format a date to time only (HH:mm) in UTC.
 * Use for availability/schedule times stored as UTC.
 *
 * @param date - Date to format
 * @returns Time string in "HH:mm" format (UTC)
 *
 * @example
 * formatTimeUTC(new Date("2024-12-25T10:30:00Z")) // "10:30"
 */
export function formatTimeUTC(date: Date | string | number): string {
  const d = new Date(date);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

/**
 * Format a date to short date and time
 *
 * @param date - Date to format
 * @returns Formatted date and time string
 *
 * @example
 * formatDateTime(new Date("2024-12-25T10:30:00")) // "sre, 25. dec, 10:30"
 */
export function formatDateTime(date: Date | string | number): string {
  return dayjs(date).format(DATE_FORMATS.shortDateTime);
}
