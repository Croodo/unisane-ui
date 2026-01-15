/**
 * Local Filesystem Storage Adapter
 *
 * Implements the StorageProvider interface using the local filesystem.
 * Useful for development and single-server deployments.
 *
 * @example
 * ```typescript
 * import { LocalStorageAdapter } from '@unisane/storage-local';
 *
 * const adapter = new LocalStorageAdapter({
 *   basePath: '/var/data/uploads',
 *   baseUrl: 'http://localhost:3000/files',
 * });
 *
 * // Upload a file
 * await adapter.putBuffer('uploads/file.pdf', buffer);
 *
 * // Get signed download URL (token-based)
 * const { url } = await adapter.getSignedDownloadUrl('uploads/file.pdf');
 * ```
 */

import { promises as fs } from 'node:fs';
import { createReadStream, createWriteStream } from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type {
  StorageProvider,
  SignedUrl,
  SignedUrlOptions,
  ObjectMetadata,
  UploadOptions,
} from '@unisane/kernel';

export interface LocalAdapterConfig {
  /** Base directory for storing files */
  basePath: string;
  /** Base URL for generating download URLs */
  baseUrl: string;
  /** Secret key for signing URLs (defaults to random) */
  signingSecret?: string;
}

interface FileMetadata {
  contentType: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

/**
 * Local filesystem implementation of the StorageProvider interface.
 */
export class LocalStorageAdapter implements StorageProvider {
  private readonly basePath: string;
  private readonly baseUrl: string;
  private readonly signingSecret: string;

  constructor(config: LocalAdapterConfig) {
    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.signingSecret = config.signingSecret ?? crypto.randomBytes(32).toString('hex');
  }

  private getFilePath(key: string): string {
    // Prevent directory traversal
    const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.basePath, normalized);
  }

  private getMetadataPath(key: string): string {
    return `${this.getFilePath(key)}.meta.json`;
  }

  private async ensureDir(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private signUrl(key: string, expiresAt: number, action: 'read' | 'write'): string {
    const payload = `${key}:${expiresAt}:${action}`;
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(payload)
      .digest('hex');
    return signature;
  }

  async getSignedDownloadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const expiresInSec = options.expiresInSec ?? 600;
    const expiresAt = Date.now() + expiresInSec * 1000;
    const signature = this.signUrl(key, expiresAt, 'read');

    const encodedKey = encodeURIComponent(key);
    const url = `${this.baseUrl}/download/${encodedKey}?expires=${expiresAt}&sig=${signature}`;

    return { url, key, expiresAt };
  }

  async getSignedUploadUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<SignedUrl> {
    const expiresInSec = options.expiresInSec ?? 600;
    const expiresAt = Date.now() + expiresInSec * 1000;
    const signature = this.signUrl(key, expiresAt, 'write');

    const encodedKey = encodeURIComponent(key);
    const url = `${this.baseUrl}/upload/${encodedKey}?expires=${expiresAt}&sig=${signature}`;

    return { url, key, expiresAt };
  }

  async putBuffer(
    key: string,
    body: Buffer,
    options: UploadOptions = {}
  ): Promise<void> {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetadataPath(key);

    await this.ensureDir(filePath);

    // Write file
    await fs.writeFile(filePath, body);

    // Write metadata
    const metadata: FileMetadata = {
      contentType: options.contentType ?? 'application/octet-stream',
      metadata: options.metadata,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
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
    const filePath = this.getFilePath(key);
    return fs.readFile(filePath);
  }

  async getJson<T = unknown>(key: string): Promise<T> {
    const buf = await this.getBuffer(key);
    const text = buf.toString('utf8');
    return JSON.parse(text) as T;
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetadataPath(key);

    await fs.unlink(filePath).catch(() => {});
    await fs.unlink(metaPath).catch(() => {});
  }

  async head(key: string): Promise<ObjectMetadata | null> {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetadataPath(key);

    try {
      const stats = await fs.stat(filePath);

      let fileMetadata: FileMetadata = {
        contentType: 'application/octet-stream',
        createdAt: stats.birthtime.toISOString(),
      };

      try {
        const metaContent = await fs.readFile(metaPath, 'utf8');
        fileMetadata = JSON.parse(metaContent);
      } catch {
        // Metadata file doesn't exist, use defaults
      }

      return {
        contentLength: stats.size,
        contentType: fileMetadata.contentType,
        lastModified: stats.mtime,
        metadata: fileMetadata.metadata,
      };
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const sourcePath = this.getFilePath(sourceKey);
    const destPath = this.getFilePath(destKey);
    const sourceMetaPath = this.getMetadataPath(sourceKey);
    const destMetaPath = this.getMetadataPath(destKey);

    await this.ensureDir(destPath);
    await fs.copyFile(sourcePath, destPath);

    // Copy metadata if exists
    try {
      await fs.copyFile(sourceMetaPath, destMetaPath);
    } catch {
      // Metadata file doesn't exist, skip
    }
  }

  async list(
    prefix: string,
    options: { maxKeys?: number; continuationToken?: string } = {}
  ): Promise<{ keys: string[]; continuationToken?: string; isTruncated: boolean }> {
    const maxKeys = options.maxKeys ?? 1000;
    const startIndex = options.continuationToken
      ? parseInt(options.continuationToken, 10)
      : 0;

    const basePath = this.getFilePath(prefix);
    const allKeys: string[] = [];

    try {
      const entries = await this.walkDir(this.basePath);
      for (const entry of entries) {
        const relativePath = path.relative(this.basePath, entry);
        if (relativePath.startsWith(prefix) && !relativePath.endsWith('.meta.json')) {
          allKeys.push(relativePath);
        }
      }
    } catch {
      // Directory doesn't exist, return empty
      return { keys: [], isTruncated: false };
    }

    allKeys.sort();
    const keys = allKeys.slice(startIndex, startIndex + maxKeys);
    const isTruncated = startIndex + maxKeys < allKeys.length;

    return {
      keys,
      continuationToken: isTruncated ? String(startIndex + maxKeys) : undefined,
      isTruncated,
    };
  }

  private async walkDir(dir: string): Promise<string[]> {
    const results: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await this.walkDir(fullPath)));
        } else if (entry.isFile()) {
          results.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or not readable
    }

    return results;
  }

  /**
   * Verify a signed URL is valid.
   * Useful for implementing the download/upload routes.
   */
  verifySignature(
    key: string,
    expiresAt: number,
    signature: string,
    action: 'read' | 'write'
  ): boolean {
    if (Date.now() > expiresAt) {
      return false;
    }
    const expected = this.signUrl(key, expiresAt, action);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }
}

/**
 * Create a new Local storage adapter.
 */
export function createLocalStorageAdapter(config: LocalAdapterConfig): StorageProvider {
  return new LocalStorageAdapter(config);
}
