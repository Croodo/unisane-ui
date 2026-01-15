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

export interface GCSAdapterConfig {
  bucket: string;
  projectId?: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

/**
 * Google Cloud Storage implementation of the StorageProvider interface.
 */
export class GCSStorageAdapter implements StorageProvider {
  private readonly storage: Storage;
  private readonly bucket: Bucket;

  constructor(config: GCSAdapterConfig) {
    this.storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
      credentials: config.credentials,
    });
    this.bucket = this.storage.bucket(config.bucket);
  }

  private file(key: string): File {
    return this.bucket.file(key);
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
      return {
        contentLength: parseInt(metadata.size as string, 10) || 0,
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
 */
export function createGCSStorageAdapter(config: GCSAdapterConfig): StorageProvider {
  return new GCSStorageAdapter(config);
}
