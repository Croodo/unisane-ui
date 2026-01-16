/**
 * S3 Storage Adapter
 *
 * Implements the StorageProvider interface using AWS S3 or S3-compatible storage.
 * Supports AWS S3, MinIO, DigitalOcean Spaces, and other S3-compatible services.
 *
 * @example
 * ```typescript
 * import { S3StorageAdapter } from '@unisane/storage-s3';
 *
 * const adapter = new S3StorageAdapter({
 *   bucket: 'my-bucket',
 *   region: 'us-east-1',
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 * });
 *
 * // Upload a file
 * await adapter.putBuffer('uploads/file.pdf', buffer);
 *
 * // Get signed download URL
 * const { url } = await adapter.getSignedDownloadUrl('uploads/file.pdf');
 * ```
 */

import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
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
 * Zod schema for validating S3 adapter configuration.
 */
export const ZS3AdapterConfig = z.object({
  bucket: z.string().min(1, 'S3 bucket name is required'),
  region: z.string().min(1, 'AWS region is required'),
  accessKeyId: z.string().min(1, 'AWS access key ID is required'),
  secretAccessKey: z.string().min(1, 'AWS secret access key is required'),
  endpoint: z.string().url('endpoint must be a valid URL').optional(),
  forcePathStyle: z.boolean().optional(),
});

/**
 * S3-001 FIX: Convert S3 response body to Buffer with proper resource cleanup.
 *
 * This function ensures streams are properly released even on error,
 * preventing resource leaks in long-running processes.
 */
async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (body == null) return Buffer.from([]);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === 'string') return Buffer.from(body);

  // S3-001 FIX: Handle Node.js Readable stream with proper cleanup
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      // S3-001 FIX: Destroy the stream on error to release resources
      body.destroy();
      throw error;
    }
  }

  // AWS SDK may return a web ReadableStream in some runtimes.
  const maybeStream = body as { getReader?: () => unknown };
  if (typeof maybeStream?.getReader === 'function') {
    const reader = maybeStream.getReader() as {
      read: () => Promise<{ done: boolean; value?: Uint8Array }>;
      releaseLock: () => void;
      cancel: (reason?: unknown) => Promise<void>;
    };
    const chunks: Uint8Array[] = [];

    // S3-001 FIX: Use try-finally to ensure reader is released
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      return Buffer.concat(chunks.map((c) => Buffer.from(c)));
    } catch (error) {
      // S3-001 FIX: Cancel and release reader on error
      try {
        await reader.cancel(error);
      } catch {
        // Ignore cancel errors - already in error state
      }
      throw error;
    } finally {
      // S3-001 FIX: Always release the lock
      try {
        reader.releaseLock();
      } catch {
        // Ignore release errors - may already be released
      }
    }
  }

  throw new Error('Unsupported S3 body type');
}

export interface S3AdapterConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

/**
 * S3 implementation of the StorageProvider interface.
 */
export class S3StorageAdapter implements StorageProvider {
  readonly name = 'storage-s3' as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3AdapterConfig) {
    // Validate configuration at construction time
    const result = ZS3AdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('storage-s3', result.error.issues);
    }

    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      ...(config.forcePathStyle ? { forcePathStyle: true } : {}),
    });
  }

  async getSignedDownloadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const validatedKey = this.validateAndNormalizeKey(key);
    const expiresInSec = options.expiresInSec ?? 600;
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: validatedKey });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSec,
    });
    const expiresAt = Date.now() + expiresInSec * 1000;
    return { url, key: validatedKey, expiresAt };
  }

  async getSignedUploadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const validatedKey = this.validateAndNormalizeKey(key);
    const expiresInSec = options.expiresInSec ?? 600;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: validatedKey,
      ...(options.contentType ? { ContentType: options.contentType } : {}),
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSec,
    });
    const expiresAt = Date.now() + expiresInSec * 1000;
    return { url, key: validatedKey, expiresAt };
  }

  async putBuffer(
    key: string,
    body: Buffer,
    options: UploadOptions = {}
  ): Promise<void> {
    const validatedKey = this.validateAndNormalizeKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: validatedKey,
        Body: body,
        ...(options.contentType ? { ContentType: options.contentType } : {}),
        ...(options.cacheControl
          ? { CacheControl: options.cacheControl }
          : {}),
        ...(options.metadata ? { Metadata: options.metadata } : {}),
      })
    );
  }

  async putJson(
    key: string,
    value: unknown,
    options: Omit<UploadOptions, 'contentType'> = {}
  ): Promise<void> {
    // Key validation happens in putBuffer
    const body = JSON.stringify(value);
    await this.putBuffer(key, Buffer.from(body), {
      ...options,
      contentType: 'application/json',
    });
  }

  async getBuffer(key: string): Promise<Buffer> {
    const validatedKey = this.validateAndNormalizeKey(key);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: validatedKey });
    const res = await this.client.send(command);
    return streamToBuffer(res.Body);
  }

  async getJson<T = unknown>(key: string): Promise<T> {
    // Key validation happens in getBuffer
    const buf = await this.getBuffer(key);
    const text = buf.toString('utf8');
    return JSON.parse(text) as T;
  }

  async delete(key: string): Promise<void> {
    const validatedKey = this.validateAndNormalizeKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: validatedKey }));
  }

  async head(key: string): Promise<ObjectMetadata | null> {
    const validatedKey = this.validateAndNormalizeKey(key);
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: validatedKey })
      );
      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType ?? 'application/octet-stream',
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      };
    } catch (err: unknown) {
      // S3-002 FIX: Use S3ServiceException and check $metadata.httpStatusCode
      // instead of relying on error.name which is fragile across SDK versions
      if (err instanceof S3ServiceException) {
        // 404 status code indicates object not found
        if (err.$metadata?.httpStatusCode === 404) {
          return null;
        }
      }
      // Fallback: also check error name for backwards compatibility
      const e = err as { name?: string };
      if (e.name === 'NotFound' || e.name === 'NoSuchKey') {
        return null;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    // Key validation happens in head
    const metadata = await this.head(key);
    return metadata !== null;
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    // Validate source key to prevent path traversal attacks
    const normalizedSource = this.validateAndNormalizeKey(sourceKey);
    const normalizedDest = this.validateAndNormalizeKey(destKey);

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        // CopySource requires URL encoding for special characters
        CopySource: `${this.bucket}/${encodeURIComponent(normalizedSource)}`,
        Key: normalizedDest,
      })
    );
  }

  /**
   * Validate and normalize a storage key to prevent path traversal attacks.
   * Rejects keys containing path traversal sequences.
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

  async list(
    prefix: string,
    options: { maxKeys?: number; continuationToken?: string } = {}
  ): Promise<{ keys: string[]; continuationToken?: string; isTruncated: boolean }> {
    const result = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: options.maxKeys ?? 1000,
        ContinuationToken: options.continuationToken,
      })
    );

    return {
      keys: (result.Contents ?? [])
        .map((obj) => obj.Key)
        .filter((k): k is string => !!k),
      continuationToken: result.NextContinuationToken,
      isTruncated: result.IsTruncated ?? false,
    };
  }
}

/**
 * Create a new S3 storage adapter.
 */
/**
 * Create a new S3 storage adapter.
 * Wrapped with resilience (circuit breaker, retry).
 */
import { createResilientProxy } from '@unisane/kernel';

export function createS3StorageAdapter(config: S3AdapterConfig): StorageProvider {
  return createResilientProxy({
    name: 'storage-s3',
    primary: new S3StorageAdapter(config),
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
