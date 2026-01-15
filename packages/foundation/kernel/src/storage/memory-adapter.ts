/**
 * Memory Storage Adapter
 *
 * In-memory implementation of StorageProvider for testing and development.
 * Not for production use - data is lost on restart.
 */

import type {
  StorageProvider,
  SignedUrl,
  SignedUrlOptions,
  ObjectMetadata,
  UploadOptions,
} from './types';

interface StoredObject {
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

/**
 * Memory implementation of the StorageProvider interface.
 * Useful for testing and local development.
 */
export class MemoryStorageAdapter implements StorageProvider {
  private readonly storage = new Map<string, StoredObject>();
  private readonly baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000/storage') {
    this.baseUrl = baseUrl;
  }

  async getSignedDownloadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const expiresInSec = options.expiresInSec ?? 600;
    const expiresAt = Date.now() + expiresInSec * 1000;
    // In memory mode, the URL just points to a hypothetical endpoint
    // A real implementation would need a server to handle these URLs
    const url = `${this.baseUrl}/download/${encodeURIComponent(key)}?expires=${expiresAt}`;
    return { url, key, expiresAt };
  }

  async getSignedUploadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const expiresInSec = options.expiresInSec ?? 600;
    const expiresAt = Date.now() + expiresInSec * 1000;
    const url = `${this.baseUrl}/upload/${encodeURIComponent(key)}?expires=${expiresAt}`;
    return { url, key, expiresAt };
  }

  async putBuffer(
    key: string,
    body: Buffer,
    options: UploadOptions = {}
  ): Promise<void> {
    this.storage.set(key, {
      body,
      contentType: options.contentType ?? 'application/octet-stream',
      metadata: options.metadata,
      createdAt: new Date(),
    });
  }

  async putJson(
    key: string,
    value: unknown,
    options: Omit<UploadOptions, 'contentType'> = {}
  ): Promise<void> {
    await this.putBuffer(key, Buffer.from(JSON.stringify(value)), {
      ...options,
      contentType: 'application/json',
    });
  }

  async getBuffer(key: string): Promise<Buffer> {
    const obj = this.storage.get(key);
    if (!obj) {
      throw new Error(`Object not found: ${key}`);
    }
    return obj.body;
  }

  async getJson<T = unknown>(key: string): Promise<T> {
    const buf = await this.getBuffer(key);
    return JSON.parse(buf.toString('utf8')) as T;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async head(key: string): Promise<ObjectMetadata | null> {
    const obj = this.storage.get(key);
    if (!obj) return null;

    return {
      contentLength: obj.body.length,
      contentType: obj.contentType,
      lastModified: obj.createdAt,
      metadata: obj.metadata,
    };
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const obj = this.storage.get(sourceKey);
    if (!obj) {
      throw new Error(`Source object not found: ${sourceKey}`);
    }
    this.storage.set(destKey, { ...obj, createdAt: new Date() });
  }

  async list(
    prefix: string,
    options: { maxKeys?: number; continuationToken?: string } = {}
  ): Promise<{ keys: string[]; continuationToken?: string; isTruncated: boolean }> {
    const maxKeys = options.maxKeys ?? 1000;
    const startIndex = options.continuationToken
      ? parseInt(options.continuationToken, 10)
      : 0;

    const allKeys = Array.from(this.storage.keys())
      .filter((key) => key.startsWith(prefix))
      .sort();

    const keys = allKeys.slice(startIndex, startIndex + maxKeys);
    const isTruncated = startIndex + maxKeys < allKeys.length;

    return {
      keys,
      continuationToken: isTruncated
        ? String(startIndex + maxKeys)
        : undefined,
      isTruncated,
    };
  }

  /**
   * Clear all stored objects. Useful for testing.
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get the number of stored objects. Useful for testing.
   */
  size(): number {
    return this.storage.size;
  }
}
