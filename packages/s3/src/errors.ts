/**
 * Custom error for S3 operations
 */
export class S3ServiceError extends Error {
  originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = "S3ServiceError";
    this.originalError = originalError;
  }
}

/**
 * Custom error for image validation
 */
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}
