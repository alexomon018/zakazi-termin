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
