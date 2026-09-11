import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Universal Cloudflare R2 / S3-Compatible Storage Service
 * Designed for Markazu Umar Bn Al-Khattab Centre and extensible for Swanford Academy.
 */

// Helper to sanitize environment variables (trim whitespace & remove accidental quotes)
function cleanEnvVar(val: string | undefined): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function getCleanStorageConfig() {
  const accountId = cleanEnvVar(process.env.R2_ACCOUNT_ID);
  const accessKeyId = cleanEnvVar(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = cleanEnvVar(process.env.R2_SECRET_ACCESS_KEY);
  const rawEndpoint = cleanEnvVar(process.env.R2_ENDPOINT);
  const bucketName = cleanEnvVar(process.env.R2_BUCKET_NAME) || 'school-files';

  let endpoint = rawEndpoint;
  if (!endpoint && accountId) {
    endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  }
  if (endpoint) {
    // Strip trailing slashes
    endpoint = endpoint.replace(/\/+$/, '');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucketName,
  };
}

// Global cached client instance
let cachedS3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  const config = getCleanStorageConfig();

  if (!config.accessKeyId || !config.secretAccessKey || !config.endpoint) {
    return null;
  }

  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return cachedS3Client;
}

export function isStorageConfigured(): boolean {
  const config = getCleanStorageConfig();
  return !!(
    config.accessKeyId &&
    config.secretAccessKey &&
    config.endpoint
  );
}

export function getBucketName(): string {
  return getCleanStorageConfig().bucketName;
}

/**
 * Safe server-side error logger that never exposes credentials
 */
export function logSafeStorageError(action: string, err: any, keyPattern?: string) {
  const config = getCleanStorageConfig();
  let endpointHost = 'unconfigured';
  try {
    if (config.endpoint) {
      endpointHost = new URL(config.endpoint).hostname;
    }
  } catch {}

  console.error(`[R2_STORAGE_ERROR] Action: ${action}`, {
    errorName: err?.name || 'UnknownError',
    errorCode: err?.Code || err?.code || err?.$metadata?.httpStatusCode?.toString(),
    httpStatus: err?.$metadata?.httpStatusCode,
    requestId: err?.$metadata?.requestId,
    extendedRequestId: err?.$metadata?.extendedRequestId,
    endpointHost,
    bucket: config.bucketName,
    keyPattern: keyPattern || 'n/a',
    message: err instanceof Error ? err.message : String(err),
  });
}

/**
 * Safe, harmless R2 connectivity & authentication diagnostic check
 * Verifies bucket existence and credentials without modifying any student data.
 */
export async function testStorageConnection(): Promise<{
  configured: boolean;
  endpointHost: string;
  bucket: string;
  authenticated: boolean;
  error?: {
    name: string;
    code?: string;
    httpStatus?: number;
    requestId?: string;
    message: string;
  };
}> {
  const config = getCleanStorageConfig();
  let endpointHost = 'unconfigured';
  try {
    if (config.endpoint) {
      endpointHost = new URL(config.endpoint).hostname;
    }
  } catch {}

  if (!isStorageConfigured()) {
    return {
      configured: false,
      endpointHost,
      bucket: config.bucketName,
      authenticated: false,
      error: {
        name: 'UnconfiguredError',
        message: 'R2 environment variables are missing or incomplete in environment.',
      },
    };
  }

  const client = getS3Client();
  if (!client) {
    return {
      configured: false,
      endpointHost,
      bucket: config.bucketName,
      authenticated: false,
      error: {
        name: 'ClientInitError',
        message: 'Failed to initialize S3Client with provided credentials.',
      },
    };
  }

  try {
    const command = new HeadBucketCommand({ Bucket: config.bucketName });
    await client.send(command);
    return {
      configured: true,
      endpointHost,
      bucket: config.bucketName,
      authenticated: true,
    };
  } catch (err: any) {
    const errorDetails = {
      name: err?.name || 'UnknownS3Error',
      code: err?.Code || err?.code,
      httpStatus: err?.$metadata?.httpStatusCode,
      requestId: err?.$metadata?.requestId,
      message: err instanceof Error ? err.message : String(err),
    };

    logSafeStorageError('testStorageConnection', err);

    return {
      configured: true,
      endpointHost,
      bucket: config.bucketName,
      authenticated: false,
      error: errorDetails,
    };
  }
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

  try {
    await client.send(command);
  } catch (err: any) {
    logSafeStorageError('uploadToStorage', err, cleanKey);
    throw err;
  }

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
