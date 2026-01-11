// Service functions
export {
  deleteImage,
  extractKeyFromUrl,
  generatePresignedUrl,
  imageExists,
  isS3Key,
  uploadImage,
  validateImage,
} from "./s3-service";

// Configuration
export { S3_CONFIG } from "./config";
export type { AllowedMimeType } from "./config";

// Errors
export { ImageValidationError, S3ServiceError } from "./errors";

// Types
export type { ImageProcessingOptions, ImageUploadResult } from "./types";
