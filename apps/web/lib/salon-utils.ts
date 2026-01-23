import { normalizeToSlug } from "@salonko/config";

/**
 * Generates a URL-safe slug from a salon name.
 * Ensures the result is always non-empty with a deterministic fallback.
 *
 * @param salonName - The salon name to convert to a slug
 * @returns A non-empty slug (max 30 characters)
 */
export function generateSalonSlug(salonName: string): string {
  const slug = normalizeToSlug(salonName).slice(0, 30);

  // Ensure non-empty slug with deterministic fallback
  if (!slug) {
    // Create a more lenient sanitized version of the original name
    const fallbackBase = normalizeToSlug(salonName)
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20);

    // If still empty, use "salon" as base and append a deterministic suffix
    const base = fallbackBase || "salon";
    // Create a short deterministic suffix from the original name
    // Simple hash-like approach: sum character codes and take modulo
    const hashSuffix = salonName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(36)
      .slice(0, 6);
    return `${base}-${hashSuffix}`.slice(0, 30);
  }

  return slug;
}
