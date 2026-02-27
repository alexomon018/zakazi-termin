/**
 * Normalizes a string to a URL-friendly slug.
 * Handles Serbian characters and spaces, converting them to ASCII equivalents.
 * Converts "Berbernica Langobard" to "berbernica-langobard"
 */
export function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[čć]/g, "c")
    .replace(/[šś]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

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
    const fallbackBase = normalizeToSlug(salonName)
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20);

    const base = fallbackBase || "salon";
    const hashSuffix = salonName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(36)
      .slice(0, 6);
    return `${base}-${hashSuffix}`.slice(0, 30);
  }

  return slug;
}
