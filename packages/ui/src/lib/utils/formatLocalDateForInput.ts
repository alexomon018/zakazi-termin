/**
 * Formats a Date to a local "YYYY-MM-DD" string for HTML date inputs.
 * Uses local date components to avoid UTC timezone shifts that occur with toISOString().
 *
 * @param date - Date object or date string to format
 * @returns A string in "YYYY-MM-DD" format based on the local timezone
 */
export function formatLocalDateForInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
