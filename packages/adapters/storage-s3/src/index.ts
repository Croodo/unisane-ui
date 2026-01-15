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

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (body == null) return Buffer.from([]);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === 'string') return Buffer.from(body);
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  // AWS SDK may return a web ReadableStream in some runtimes.
  const maybeStream = body as { getReader?: () => unknown };
  if (typeof maybeStream?.getReader === 'function') {
    const reader = maybeStream.getReader() as {
      read: () => Promise<{ done: boolean; value?: Uint8Array }>;
    };
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
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
    const expiresInSec = options.expiresInSec ?? 600;
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSec,
    });
    const expiresAt = Date.now() + expiresInSec * 1000;
    return { url, key, expiresAt };
  }

  async getSignedUploadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const expiresInSec = options.expiresInSec ?? 600;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(options.contentType ? { ContentType: options.contentType } : {}),
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSec,
    });
    const expiresAt = Date.now() + expiresInSec * 1000;
    return { url, key, expiresAt };
  }

  async putBuffer(
    key: string,
    body: Buffer,
    options: UploadOptions = {}
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
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
    const body = JSON.stringify(value);
    await this.putBuffer(key, Buffer.from(body), {
      ...options,
      contentType: 'application/json',
    });
  }

  async getBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const res = await this.client.send(command);
    return streamToBuffer(res.Body);
  }

  async getJson<T = unknown>(key: string): Promise<T> {
    const buf = await this.getBuffer(key);
    const text = buf.toString('utf8');
    return JSON.parse(text) as T;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async head(key: string): Promise<ObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType ?? 'application/octet-stream',
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      };
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === 'NotFound' || e.name === 'NoSuchKey') {
        return null;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const metadata = await this.head(key);
    return metadata !== null;
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      })
    );
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
