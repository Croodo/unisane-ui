/**
 * Local Filesystem Storage Adapter
 *
 * Implements the StorageProvider interface using the local filesystem.
 * Useful for development and single-server deployments.
 *
 * The adapter automatically persists a signing secret to ensure presigned URLs
 * remain valid across application restarts. For production, configure
 * LOCAL_STORAGE_SIGNING_SECRET environment variable.
 *
 * @example
 * ```typescript
 * import { createLocalStorageAdapter } from '@unisane/storage-local';
 *
 * const adapter = await createLocalStorageAdapter({
 *   basePath: '/var/data/uploads',
 *   baseUrl: 'http://localhost:3000/files',
 *   // Optional: provide explicit secret for stability
 *   signingSecret: process.env.LOCAL_STORAGE_SIGNING_SECRET,
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
import { ConfigurationError } from '@unisane/kernel';
import { z } from 'zod';

/**
 * Zod schema for validating Local storage adapter configuration.
 * Validates at construction time to catch configuration errors early.
 */
export const ZLocalAdapterConfig = z.object({
  basePath: z
    .string()
    .min(1, 'Base path is required')
    .refine(
      (val: string) => path.isAbsolute(val),
      'Base path must be an absolute path'
    ),
  baseUrl: z
    .string()
    .min(1, 'Base URL is required')
    .refine(
      (val: string) => val.startsWith('http://') || val.startsWith('https://'),
      'Base URL must start with http:// or https://'
    ),
  signingSecret: z
    .string()
    .min(32, 'Signing secret must be at least 32 characters for security')
    .describe('Secret for signing URLs. Must be stable across restarts.')
    .optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  retryDelayMs: z.number().int().min(0).max(10000).optional(),
});

export interface LocalAdapterConfig {
  /** Base directory for storing files (must be absolute path) */
  basePath: string;
  /** Base URL for generating download URLs */
  baseUrl: string;
  /**
   * Secret key for signing URLs (min 32 chars).
   * Must be stable across restarts for presigned URLs to remain valid.
   * If not provided, a secret will be generated and persisted to basePath/.signing-secret
   */
  signingSecret?: string;
  /** Max retries for transient filesystem errors (default: 3) */
  maxRetries?: number;
  /** Base delay between retries in ms (default: 100) */
  retryDelayMs?: number;
}

/** Transient filesystem error codes that are worth retrying */
const TRANSIENT_ERRORS = new Set(['EAGAIN', 'EMFILE', 'ENFILE', 'EBUSY', 'ETIMEDOUT']);

/** Helper to determine if an error is retryable */
function isTransientError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return !!code && TRANSIENT_ERRORS.has(code);
}

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** File name for persisted signing secret */
const SIGNING_SECRET_FILE = '.signing-secret';

/**
 * Get or create a persistent signing secret.
 * If the secret file exists, read it. Otherwise, generate a new one and persist it.
 * This ensures presigned URLs remain valid across application restarts.
 */
async function getOrCreateSigningSecret(basePath: string): Promise<string> {
  const secretPath = path.join(basePath, SIGNING_SECRET_FILE);

  try {
    // Try to read existing secret
    const secret = await fs.readFile(secretPath, 'utf8');
    const trimmed = secret.trim();
    if (trimmed.length >= 32) {
      return trimmed;
    }
    // Secret exists but is too short (corrupted?), regenerate
  } catch (err) {
    const e = err as { code?: string };
    if (e.code !== 'ENOENT') {
      // Re-throw if error is not "file not found"
      throw err;
    }
    // File doesn't exist, will create below
  }

  // H-003 FIX: Ensure basePath directory exists with explicit error handling
  try {
    await fs.mkdir(basePath, { recursive: true });
  } catch (mkdirErr) {
    const e = mkdirErr as { code?: string };
    // EEXIST is fine (directory already exists), anything else is an error
    if (e.code !== 'EEXIST') {
      throw new Error(
        `[storage-local] Failed to create storage directory "${basePath}": ${
          mkdirErr instanceof Error ? mkdirErr.message : String(mkdirErr)
        }`
      );
    }
  }

  // Generate new secret
  const newSecret = crypto.randomBytes(32).toString('hex');

  // H-003 FIX: Write secret with explicit error handling
  try {
    // Write secret with restrictive permissions (owner read/write only)
    await fs.writeFile(secretPath, newSecret, { mode: 0o600 });
  } catch (writeErr) {
    throw new Error(
      `[storage-local] Failed to write signing secret to "${secretPath}": ${
        writeErr instanceof Error ? writeErr.message : String(writeErr)
      }`
    );
  }

  // Log warning that a new secret was generated
  console.warn(
    `[storage-local] Generated new signing secret. For stability, configure LOCAL_STORAGE_SIGNING_SECRET environment variable.`
  );

  return newSecret;
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
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  /**
   * Private constructor - use LocalStorageAdapter.create() for async initialization.
   */
  private constructor(
    basePath: string,
    baseUrl: string,
    signingSecret: string,
    maxRetries: number,
    retryDelayMs: number
  ) {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
    this.signingSecret = signingSecret;
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * Create a new LocalStorageAdapter with proper async initialization.
   * If signingSecret is not provided, it will be loaded from or created in basePath/.signing-secret
   */
  static async create(config: LocalAdapterConfig): Promise<LocalStorageAdapter> {
    // Validate configuration at construction time
    const result = ZLocalAdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('storage-local', result.error.issues);
    }

    const basePath = config.basePath;
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const maxRetries = config.maxRetries ?? 3;
    const retryDelayMs = config.retryDelayMs ?? 100;

    // Get signing secret: use provided, or get/create persistent one
    const signingSecret = config.signingSecret ?? await getOrCreateSigningSecret(basePath);

    return new LocalStorageAdapter(basePath, baseUrl, signingSecret, maxRetries, retryDelayMs);
  }

  /** Retry helper for transient filesystem errors */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (!isTransientError(err) || attempt === this.maxRetries) {
          throw err;
        }
        await sleep(this.retryDelayMs * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  /**
   * Validate and resolve a storage key to a safe file path.
   * Prevents path traversal attacks by ensuring the resolved path
   * is within the configured basePath.
   */
  private getFilePath(key: string): string {
    // Reject empty keys
    if (!key || key.trim() === '') {
      throw new Error('Storage key cannot be empty');
    }

    // Decode URL-encoded characters to catch encoded traversal attempts
    let decoded: string;
    try {
      decoded = decodeURIComponent(key);
    } catch {
      decoded = key;
    }

    // Check for obvious traversal patterns before path resolution
    const traversalPatterns = [
      /\.\.\//,       // ../
      /\.\.\\/,       // ..\
      /^\.\.$/,       // just ..
      /\0/,           // null bytes (can truncate paths in some systems)
    ];

    for (const pattern of traversalPatterns) {
      if (pattern.test(key) || pattern.test(decoded)) {
        throw new Error('Path traversal detected in storage key');
      }
    }

    // Resolve the full path and verify it's within basePath
    // Use path.resolve to handle any remaining edge cases
    const resolvedBase = path.resolve(this.basePath);
    const resolvedPath = path.resolve(this.basePath, decoded);

    // Critical: Ensure the resolved path starts with basePath
    // Adding path.sep ensures we don't match partial directory names
    // e.g., basePath="/data" should not allow "/data-other/file"
    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
      throw new Error('Path traversal detected: resolved path escapes base directory');
    }

    return resolvedPath;
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

    // LOC-002 FIX: Use atomic write (write-to-temp-then-rename) pattern
    // This prevents race conditions where concurrent writes could corrupt files
    // or leave inconsistent state between file and metadata
    const tempFilePath = `${filePath}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    const tempMetaPath = `${metaPath}.${crypto.randomBytes(8).toString('hex')}.tmp`;

    try {
      // Write file to temp location first
      await this.withRetry(() => fs.writeFile(tempFilePath, body));

      // Write metadata to temp location
      const metadata: FileMetadata = {
        contentType: options.contentType ?? 'application/octet-stream',
        metadata: options.metadata,
        createdAt: new Date().toISOString(),
      };
      await this.withRetry(() => fs.writeFile(tempMetaPath, JSON.stringify(metadata, null, 2)));

      // Atomic rename to final locations
      // On POSIX systems, rename is atomic when source and dest are on same filesystem
      await this.withRetry(() => fs.rename(tempFilePath, filePath));
      await this.withRetry(() => fs.rename(tempMetaPath, metaPath));
    } catch (error) {
      // Clean up temp files on error
      await fs.unlink(tempFilePath).catch(() => {});
      await fs.unlink(tempMetaPath).catch(() => {});
      throw error;
    }
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
    return this.withRetry(() => fs.readFile(filePath));
  }

  async getJson<T = unknown>(key: string): Promise<T> {
    const buf = await this.getBuffer(key);
    const text = buf.toString('utf8');
    return JSON.parse(text) as T;
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetadataPath(key);

    // LOC-003 FIX: Only catch ENOENT (file not found), propagate other errors
    // This prevents silently swallowing permission errors, disk full, etc.
    await fs.unlink(filePath).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // File doesn't exist, which is fine for delete operations
    });
    await fs.unlink(metaPath).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // Metadata file doesn't exist, which is fine
    });
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
    await this.withRetry(() => fs.copyFile(sourcePath, destPath));

    // Copy metadata if exists
    try {
      await this.withRetry(() => fs.copyFile(sourceMetaPath, destMetaPath));
    } catch (err) {
      // Metadata file doesn't exist, skip (but propagate other errors)
      if ((err as { code?: string })?.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async list(
    prefix: string,
    options: { maxKeys?: number; continuationToken?: string } = {}
  ): Promise<{ keys: string[]; continuationToken?: string; isTruncated: boolean }> {
    const maxKeys = Math.min(options.maxKeys ?? 1000, 10000); // LOC-001 FIX: Cap maxKeys

    // LOC-001 FIX: Use key-based cursor instead of index-based
    // The continuation token is the last key returned (base64 encoded for safety)
    let startAfterKey: string | null = null;
    if (options.continuationToken) {
      try {
        startAfterKey = Buffer.from(options.continuationToken, 'base64url').toString('utf8');
        // Validate the decoded key doesn't contain path traversal
        if (startAfterKey.includes('..') || startAfterKey.startsWith('/')) {
          console.warn('[storage-local] Invalid continuation token: path traversal detected');
          startAfterKey = null;
        }
      } catch {
        console.warn('[storage-local] Invalid continuation token: decode failed');
        startAfterKey = null;
      }
    }

    // C-001 FIX: Use streaming approach with immediate validation
    // Instead of collecting all entries then filtering, we collect and validate
    // in a single pass to minimize the race condition window
    const validKeys: string[] = [];

    try {
      // Get entries with timestamps for stable sorting
      const entriesWithStats = await this.walkDirWithStats(this.basePath, prefix);

      // Sort by key for consistent pagination (already filtered by prefix)
      entriesWithStats.sort((a, b) => a.key.localeCompare(b.key));

      // Filter to keys after cursor and validate existence
      for (const entry of entriesWithStats) {
        // Skip if before cursor
        if (startAfterKey !== null && entry.key <= startAfterKey) {
          continue;
        }

        // C-001 FIX: Verify file still exists before including
        // This reduces race condition by checking at collection time
        try {
          await fs.access(entry.fullPath);
          validKeys.push(entry.key);

          // Stop early once we have enough keys (+1 to check truncation)
          if (validKeys.length > maxKeys) {
            break;
          }
        } catch {
          // File was deleted between walk and access check - skip it
          continue;
        }
      }
    } catch {
      // Directory doesn't exist, return empty
      return { keys: [], isTruncated: false };
    }

    // Take maxKeys (we collected maxKeys+1 to check truncation)
    const isTruncated = validKeys.length > maxKeys;
    const keys = validKeys.slice(0, maxKeys);

    // LOC-001 FIX: Create stable continuation token from last key
    let continuationToken: string | undefined;
    if (isTruncated && keys.length > 0) {
      const lastKey = keys[keys.length - 1]!;
      continuationToken = Buffer.from(lastKey, 'utf8').toString('base64url');
    }

    return {
      keys,
      continuationToken,
      isTruncated,
    };
  }

  /**
   * C-001 FIX: Walk directory and return entries with stats for stable sorting.
   * Filters by prefix during walk to reduce memory usage.
   */
  private async walkDirWithStats(
    dir: string,
    prefix: string
  ): Promise<Array<{ key: string; fullPath: string }>> {
    const results: Array<{ key: string; fullPath: string }> = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files and metadata files
        if (entry.name.startsWith('.') || entry.name.endsWith('.meta.json')) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.basePath, fullPath);

        if (entry.isDirectory()) {
          // Only recurse if directory could contain matching keys
          if (prefix === '' || relativePath.startsWith(prefix) || prefix.startsWith(relativePath)) {
            results.push(...(await this.walkDirWithStats(fullPath, prefix)));
          }
        } else if (entry.isFile()) {
          // Only include files matching prefix
          if (relativePath.startsWith(prefix)) {
            results.push({ key: relativePath, fullPath });
          }
        }
      }
    } catch {
      // Directory doesn't exist or not readable - return empty
    }

    return results;
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
 *
 * This is an async factory function because the adapter may need to
 * read or create a persistent signing secret from the filesystem.
 *
 * @example
 * ```typescript
 * const adapter = await createLocalStorageAdapter({
 *   basePath: '/var/data/uploads',
 *   baseUrl: 'http://localhost:3000/files',
 *   // Optional: provide explicit secret for stability
 *   signingSecret: process.env.LOCAL_STORAGE_SIGNING_SECRET,
 * });
 * ```
 */
export async function createLocalStorageAdapter(
  config: LocalAdapterConfig
): Promise<StorageProvider> {
  return LocalStorageAdapter.create(config);
}
