/**
 * S3 Storage Adapter
 *
 * Implements the StorageProvider interface using AWS S3 or S3-compatible storage.
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
} from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err as Error;
      const isRetryable =
        err instanceof S3ServiceException &&
        (err.$retryable || err.name === 'ServiceUnavailable');
      if (!isRetryable || attempt === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

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
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3AdapterConfig) {
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
    await withRetry(() =>
      this.client.send(
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
      )
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
    const res = await withRetry(() => this.client.send(command));
    return streamToBuffer(res.Body);
  }

  async getJson<T = unknown>(key: string): Promise<T> {
    const buf = await this.getBuffer(key);
    const text = buf.toString('utf8');
    return JSON.parse(text) as T;
  }

  async delete(key: string): Promise<void> {
    await withRetry(() =>
      this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    );
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
    await withRetry(() =>
      this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destKey,
        })
      )
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
