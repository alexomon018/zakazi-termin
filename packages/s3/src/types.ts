/**
 * Result from uploading an image
 */
export interface ImageUploadResult {
  /** Pre-signed URL to access the image (7-day expiry) */
  url: string;
  /** S3 object key (store this in database) */
  key: string;
  /** Final file size in bytes */
  size: number;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

/**
 * Options for image processing
 */
export interface ImageProcessingOptions {
  /** Maximum input file size in bytes (default: S3_CONFIG.MAX_FILE_SIZE) */
  maxFileSize?: number;
  /** Allowed input MIME types (default: S3_CONFIG.ALLOWED_MIME_TYPES) */
  allowedMimeTypes?: readonly string[];
  /** Maximum width (default: 256 for salon icons) */
  maxWidth?: number;
  /** Maximum height (default: 256 for salon icons) */
  maxHeight?: number;
  /** WebP quality 1-100 (default: 85) */
  quality?: number;
}
