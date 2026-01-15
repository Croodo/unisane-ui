/**
 * Storage Cache Keys
 *
 * Centralized cache key builders for consistent key naming.
 */

/**
 * Cache key builders for the storage module.
 *
 * @example
 * ```typescript
 * import { storageKeys } from '@unisane/storage';
 *
 * const cached = await cacheGet(storageKeys.fileById(fileId));
 * ```
 */
export const storageKeys = {
  // ════════════════════════════════════════════════════════════════════════════
  // File Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for file lookup by ID */
  fileById: (fileId: string) => `storage:file:id:${fileId}` as const,

  /** Cache key for file lookup by S3 key */
  fileByKey: (key: string) => `storage:file:key:${key}` as const,

  // ════════════════════════════════════════════════════════════════════════════
  // Scope Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for scope's file list in a folder */
  scopeFiles: (scopeId: string, folder?: string) =>
    `storage:scope:${scopeId}:files${folder ? `:${folder}` : ''}` as const,

  /** Cache key for scope's storage usage */
  scopeUsage: (scopeId: string) => `storage:scope:${scopeId}:usage` as const,

  // ════════════════════════════════════════════════════════════════════════════
  // Presigned URL Keys (short-lived cache)
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for presigned download URL */
  downloadUrl: (fileId: string) => `storage:url:download:${fileId}` as const,
} as const;

/**
 * Type for cache key functions.
 */
export type StorageKeyBuilder = typeof storageKeys;
