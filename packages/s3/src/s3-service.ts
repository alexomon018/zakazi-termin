import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@salonko/config";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { S3_CONFIG } from "./config";
import { ImageValidationError, S3ServiceError } from "./errors";
import type { ImageProcessingOptions, ImageUploadResult } from "./types";

/**
 * Create S3 client with credentials from environment
 */
function createS3Client(): S3Client {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new S3ServiceError(
      "AWS credentials not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables."
    );
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Get bucket name from environment
 */
function getBucketName(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new S3ServiceError("S3_BUCKET_NAME environment variable is not set");
  }
  return bucket;
}

// Lazy initialization of S3 client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

/**
 * Validate image buffer before processing
 */
export function validateImage(
  buffer: Buffer,
  mimeType: string,
  maxSize: number = S3_CONFIG.MAX_FILE_SIZE
): void {
  // Check MIME type
  const allowedTypes = S3_CONFIG.ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedTypes.includes(mimeType)) {
    throw new ImageValidationError(
      `Nevažeći tip slike. Dozvoljeni formati: ${S3_CONFIG.ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Check file size
  if (buffer.length > maxSize) {
    throw new ImageValidationError(
      `Slika je prevelika (${(buffer.length / 1024 / 1024).toFixed(2)}MB). Maksimalna veličina: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    );
  }
}

/**
 * Upload an image to S3 with processing (resize, convert to WebP)
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string = S3_CONFIG.SALON_ICON_PREFIX,
  options: ImageProcessingOptions = {}
): Promise<ImageUploadResult> {
  const client = getS3Client();
  const bucket = getBucketName();

  const {
    maxWidth = S3_CONFIG.SALON_ICON_SIZE,
    maxHeight = S3_CONFIG.SALON_ICON_SIZE,
    quality = S3_CONFIG.IMAGE_QUALITY,
  } = options;

  try {
    // Process image with sharp
    const processedImage = sharp(buffer);
    const metadata = await processedImage.metadata();

    // Resize if image is larger than max dimensions
    let finalImage = processedImage;
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > maxWidth || metadata.height > maxHeight)
    ) {
      finalImage = processedImage.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to WebP for optimal size
    const finalBuffer = await finalImage.webp({ quality }).toBuffer();

    // Get final dimensions
    const finalMetadata = await sharp(finalBuffer).metadata();

    // Generate unique filename
    const filename = `${uuidv4()}.webp`;
    const key = `${folder}/${filename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: finalBuffer,
      ContentType: "image/webp",
      CacheControl: "max-age=31536000", // Cache for 1 year
      Metadata: {
        originalMimeType: mimeType,
        uploadedAt: new Date().toISOString(),
      },
    });

    await client.send(command);

    // Generate presigned URL for access
    const url = await generatePresignedUrl(key);

    return {
      url,
      key,
      size: finalBuffer.length,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
    };
  } catch (error) {
    // Re-throw validation errors as-is
    if (error instanceof ImageValidationError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error uploading image to S3", { error });
    throw new S3ServiceError(`Greška pri uploadu slike: ${errorMessage}`, error);
  }
}

/**
 * Delete an image from S3 by key
 */
export async function deleteImage(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucketName();

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error deleting image from S3", { error, key });
    throw new S3ServiceError(`Greška pri brisanju slike: ${errorMessage}`, error);
  }
}

/**
 * Generate a presigned URL for accessing an S3 object
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = S3_CONFIG.DOWNLOAD_URL_EXPIRY
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucketName();

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error generating presigned URL", { error, key });
    throw new S3ServiceError(`Greška pri generisanju URL-a: ${errorMessage}`, error);
  }
}

/**
 * Check if an image exists in S3
 */
export async function imageExists(key: string): Promise<boolean> {
  const client = getS3Client();
  const bucket = getBucketName();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract S3 key from a full URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const bucket = getBucketName();

    // Handle path-style URL: https://s3.region.amazonaws.com/bucket/key
    if (pathname.startsWith(`/${bucket}/`)) {
      return pathname.substring(`/${bucket}/`.length);
    }

    // Handle virtual-hosted-style URL: https://bucket.s3.region.amazonaws.com/key
    if (pathname.startsWith("/")) {
      return pathname.substring(1);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a string is an S3 key (not a full URL)
 */
export function isS3Key(str: string): boolean {
  return !str.startsWith("http://") && !str.startsWith("https://");
}
