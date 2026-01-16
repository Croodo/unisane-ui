/**
 * Google Cloud Storage Adapter
 *
 * Implements the StorageProvider interface using Google Cloud Storage.
 *
 * @example
 * ```typescript
 * import { GCSStorageAdapter } from '@unisane/storage-gcs';
 *
 * const adapter = new GCSStorageAdapter({
 *   bucket: 'my-bucket',
 *   projectId: 'my-project',
 *   keyFilename: '/path/to/service-account.json',
 * });
 *
 * // Upload a file
 * await adapter.putBuffer('uploads/file.pdf', buffer);
 *
 * // Get signed download URL
 * const { url } = await adapter.getSignedDownloadUrl('uploads/file.pdf');
 * ```
 */

import { Storage, Bucket, File } from '@google-cloud/storage';
import type {
  StorageProvider,
  SignedUrl,
  SignedUrlOptions,
  ObjectMetadata,
  UploadOptions,
} from '@unisane/kernel';
import { CIRCUIT_BREAKER_DEFAULTS, ConfigurationError } from '@unisane/kernel';
import { z } from 'zod';

/**
 * Zod schema for validating GCS adapter configuration.
 * Validates at construction time to catch configuration errors early.
 *
 * Either `credentials` (inline) or `keyFilename` (file path) is required,
 * or environment-based authentication can be used (GOOGLE_APPLICATION_CREDENTIALS).
 */
export const ZGCSAdapterConfig = z
  .object({
    bucket: z.string().min(1, 'Bucket name is required'),
    projectId: z.string().min(1).optional(),
    keyFilename: z.string().min(1).optional(),
    credentials: z
      .object({
        client_email: z.string().email('Invalid service account email format'),
        private_key: z
          .string()
          .min(1, 'Private key is required')
          .refine(
            (val: string) => val.includes('-----BEGIN') && val.includes('PRIVATE KEY'),
            'Private key must be in PEM format'
          ),
      })
      .optional(),
  })
  .refine(
    (data: { credentials?: unknown; keyFilename?: string }) =>
      data.credentials || data.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS,
    'Either credentials, keyFilename, or GOOGLE_APPLICATION_CREDENTIALS environment variable is required'
  );

export interface GCSAdapterConfig {
  /** GCS bucket name */
  bucket: string;
  /** GCP project ID (optional if using service account) */
  projectId?: string;
  /** Path to service account key file */
  keyFilename?: string;
  /** Inline service account credentials */
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

/**
 * Google Cloud Storage implementation of the StorageProvider interface.
 */
export class GCSStorageAdapter implements StorageProvider {
  readonly name = 'storage-gcs' as const;
  private readonly storage: Storage;
  private readonly bucket: Bucket;

  constructor(config: GCSAdapterConfig) {
    // Validate configuration at construction time
    const result = ZGCSAdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('storage-gcs', result.error.issues);
    }

    this.storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
      credentials: config.credentials,
    });
    this.bucket = this.storage.bucket(config.bucket);
  }

  /**
   * GCS-001 FIX: Validate and normalize storage keys to prevent path traversal attacks.
   * Same implementation as the S3 adapter for consistency.
   */
  private validateAndNormalizeKey(key: string): string {
    // Reject empty keys
    if (!key || key.trim() === '') {
      throw new Error('Storage key cannot be empty');
    }

    // Decode any URL-encoded characters to check for traversal
    let decoded: string;
    try {
      decoded = decodeURIComponent(key);
    } catch {
      // If decoding fails, use original (might have invalid encoding)
      decoded = key;
    }

    // Check for path traversal patterns (before and after decoding)
    const traversalPatterns = [
      /\.\.\//g,      // ../
      /\.\.\\/g,      // ..\
      /^\.\.$/,       // just ..
      /^\/|^\\/,      // absolute paths starting with / or \
      /\0/,           // null bytes
    ];

    for (const pattern of traversalPatterns) {
      if (pattern.test(key) || pattern.test(decoded)) {
        throw new Error('Path traversal detected in storage key');
      }
    }

    // Normalize multiple slashes and trim leading/trailing slashes
    return decoded.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
  }

  private file(key: string): File {
    // GCS-001 FIX: Validate key before creating file reference
    const validatedKey = this.validateAndNormalizeKey(key);
    return this.bucket.file(validatedKey);
  }

  async getSignedDownloadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const expiresInSec = options.expiresInSec ?? 600;
    const expiresAt = Date.now() + expiresInSec * 1000;

    const [url] = await this.file(key).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt,
    });

    return { url, key, expiresAt };
  }

  async getSignedUploadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const expiresInSec = options.expiresInSec ?? 600;
    const expiresAt = Date.now() + expiresInSec * 1000;

    const [url] = await this.file(key).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType: options.contentType,
    });

    return { url, key, expiresAt };
  }

  async putBuffer(
    key: string,
    body: Buffer,
    options: UploadOptions = {}
  ): Promise<void> {
    const file = this.file(key);
    await file.save(body, {
      contentType: options.contentType,
      metadata: {
        cacheControl: options.cacheControl,
        metadata: options.metadata,
      },
    });
  }

  async putJson(
    key: string,
    value: unknown,
    options: Omit<UploadOptions, 'contentType'> = {}
  ): Promise<void> {
    const body = JSON.stringify(value);
    await this.putBuffer(key, Buffer.from(body), {
      ...options,
      contentType: 'application/json',
    });
  }

  async getBuffer(key: string): Promise<Buffer> {
    const [contents] = await this.file(key).download();
    return contents;
  }

  async getJson<T = unknown>(key: string): Promise<T> {
    const buf = await this.getBuffer(key);
    const text = buf.toString('utf8');
    return JSON.parse(text) as T;
  }

  async delete(key: string): Promise<void> {
    await this.file(key).delete({ ignoreNotFound: true });
  }

  async head(key: string): Promise<ObjectMetadata | null> {
    try {
      const [metadata] = await this.file(key).getMetadata();

      // GCS-002 FIX: Properly parse and validate size instead of silently defaulting to 0
      let contentLength = 0;
      if (metadata.size !== undefined && metadata.size !== null) {
        const parsed = typeof metadata.size === 'number'
          ? metadata.size
          : parseInt(String(metadata.size), 10);

        if (Number.isNaN(parsed) || parsed < 0) {
          console.warn(
            `[storage-gcs] Invalid size metadata for key "${key}": ${metadata.size}`
          );
          // Use 0 as fallback but warn about the issue
        } else {
          contentLength = parsed;
        }
      }

      return {
        contentLength,
        contentType: metadata.contentType ?? 'application/octet-stream',
        lastModified: metadata.updated ? new Date(metadata.updated) : undefined,
        etag: metadata.etag,
        metadata: metadata.metadata as Record<string, string> | undefined,
      };
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code === 404) {
        return null;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const [exists] = await this.file(key).exists();
    return exists;
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    await this.file(sourceKey).copy(this.file(destKey));
  }

  async list(
    prefix: string,
    options: { maxKeys?: number; continuationToken?: string } = {}
  ): Promise<{ keys: string[]; continuationToken?: string; isTruncated: boolean }> {
    const [files, , apiResponse] = await this.bucket.getFiles({
      prefix,
      maxResults: options.maxKeys ?? 1000,
      pageToken: options.continuationToken,
      autoPaginate: false,
    });

    const nextPageToken = (apiResponse as { nextPageToken?: string })?.nextPageToken;

    return {
      keys: files.map((f) => f.name),
      continuationToken: nextPageToken,
      isTruncated: !!nextPageToken,
    };
  }
}

/**
 * Create a new GCS storage adapter.
 * Wrapped with resilience (circuit breaker, retry).
 */
import { createResilientProxy } from '@unisane/kernel';

export function createGCSStorageAdapter(config: GCSAdapterConfig): StorageProvider {
  return createResilientProxy({
    name: 'storage-gcs',
    primary: new GCSStorageAdapter(config),
    circuitBreaker: {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200,
    },
  });
}
