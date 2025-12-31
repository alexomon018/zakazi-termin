/**
 * Formats a salon name slug for display
 * Converts "moj-novi-salon" to "Moj Novi Salon"
 */
export function formatSalonName(salonName: string): string {
  return salonName.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
