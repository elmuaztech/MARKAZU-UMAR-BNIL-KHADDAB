import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Universal Cloudflare R2 / S3-Compatible Storage Service
 * Designed for Markazu Umar Bn Al-Khattab Centre and extensible for Swanford Academy.
 */

// Global cached client instance
let cachedS3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null;
  }

  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  return cachedS3Client;
}

export function isStorageConfigured(): boolean {
  return !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID)
  );
}

export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || 'school-files';
}

/**
 * Clean & sanitize object keys to prevent directory traversal or invalid characters.
 */
export function sanitizeStorageKey(rawKey: string): string {
  return rawKey
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9_\-\/\.]/g, '_');
}

/**
 * Generates a standard student passport photo object key.
 * Pattern: markazu/students/{student-id}/photo.webp
 */
export function getStudentPhotoKey(studentId: string): string {
  const safeId = studentId.toLowerCase().trim().replace(/[^a-z0-9_\-]/g, '_');
  return `markazu/students/${safeId}/photo.webp`;
}

/**
 * Generates standard document keys for future Markazu / Swanford school records.
 * Pattern: {school}/{category}/{document-id}.{extension}
 */
export function getSchoolDocumentKey(
  school: 'markazu' | 'swanford' | string,
  category: 'students' | 'staff' | 'admissions' | 'results' | 'documents' | string,
  documentId: string,
  extension = 'pdf'
): string {
  const safeSchool = school.toLowerCase().trim().replace(/[^a-z0-9_\-]/g, '_');
  const safeCategory = category.toLowerCase().trim().replace(/[^a-z0-9_\-]/g, '_');
  const safeDocId = documentId.toLowerCase().trim().replace(/[^a-z0-9_\-]/g, '_');
  const safeExt = extension.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return `${safeSchool}/${safeCategory}/${safeDocId}.${safeExt}`;
}

export interface UploadOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  key: string;
  sizeBytes: number;
  contentType: string;
}

/**
 * Uploads a buffer directly to private R2 storage.
 */
export async function uploadToStorage(options: UploadOptions): Promise<UploadResult> {
  const client = getS3Client();
  if (!client) {
    throw new Error('Cloudflare R2 storage credentials are not configured in environment variables.');
  }

  const cleanKey = sanitizeStorageKey(options.key);
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: cleanKey,
    Body: options.buffer,
    ContentType: options.contentType,
    Metadata: options.metadata,
  });

  await client.send(command);

  return {
    success: true,
    key: cleanKey,
    sizeBytes: options.buffer.length,
    contentType: options.contentType,
  };
}

/**
 * Generates a short-lived secure signed download URL for private R2 objects.
 */
export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new Error('Cloudflare R2 storage credentials are not configured in environment variables.');
  }

  const cleanKey = sanitizeStorageKey(key);
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: cleanKey,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Retrieves an object buffer and metadata from R2 storage.
 */
export async function getStorageObject(
  key: string
): Promise<{ buffer: Buffer; contentType: string; contentLength: number } | null> {
  const client = getS3Client();
  if (!client) {
    return null;
  }

  const cleanKey = sanitizeStorageKey(key);
  const bucket = getBucketName();

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    });

    const response = await client.send(command);
    if (!response.Body) return null;

    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };

    const buffer = await streamToBuffer(response.Body);
    return {
      buffer,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || buffer.length,
    };
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Checks whether an object exists in R2 storage.
 */
export async function storageObjectExists(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  const cleanKey = sanitizeStorageKey(key);
  const bucket = getBucketName();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    });
    await client.send(command);
    return true;
  } catch (err: any) {
    if (err.name === 'NotFound' || err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
}

/**
 * Deletes an object from R2 storage.
 */
export async function deleteFromStorage(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  const cleanKey = sanitizeStorageKey(key);
  const bucket = getBucketName();

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}
