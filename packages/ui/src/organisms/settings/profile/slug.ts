export function toSalonNameSlug(value: string): string {
  // Keep this in sync with the profile schema transform.
  return value.toLowerCase().replace(/\s+/g, "-");
}
