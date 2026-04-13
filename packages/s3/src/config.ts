/**
 * S3 configuration constants
 */
export const S3_CONFIG = {
  // Pre-signed URL expiration times (in seconds)
  UPLOAD_URL_EXPIRY: 15 * 60, // 15 minutes for upload
  DOWNLOAD_URL_EXPIRY: 7 * 24 * 60 * 60, // 7 days for download (supports SEO crawlers)

  // File validation
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,

  // Image processing
  SALON_ICON_SIZE: 256, // Resize to 256x256
  IMAGE_QUALITY: 85,

  // S3 key prefixes
  SALON_ICON_PREFIX: "salon-icons",
} as const;

export type AllowedMimeType = (typeof S3_CONFIG.ALLOWED_MIME_TYPES)[number];
