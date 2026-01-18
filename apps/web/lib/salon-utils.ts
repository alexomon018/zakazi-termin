/**
 * Sanitizes characters by converting to lowercase, removing diacritics,
 * and replacing Serbian-specific characters with ASCII equivalents.
 *
 * @param str - The string to sanitize
 * @returns A sanitized string with normalized characters
 */
function sanitizeCharacters(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[čć]/g, "c")
    .replace(/[šś]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/đ/g, "dj");
}

/**
 * Generates a URL-safe slug from a salon name.
 * Ensures the result is always non-empty with a deterministic fallback.
 *
 * @param salonName - The salon name to convert to a slug
 * @returns A non-empty slug (max 30 characters)
 */
export function generateSalonSlug(salonName: string): string {
  const slug = sanitizeCharacters(salonName)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

  // Ensure non-empty slug with deterministic fallback
  if (!slug) {
    // Create a more lenient sanitized version of the original name
    const fallbackBase = sanitizeCharacters(salonName)
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
