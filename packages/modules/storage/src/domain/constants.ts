/**
 * Storage Domain Constants
 *
 * Centralized constants for the storage module.
 * Note: Core storage constants (folders, content types, limits) are in @unisane/kernel.
 * This file contains module-specific constants like events and cache keys.
 */

/**
 * Event types emitted by the storage module.
 * Use these when calling events.emit() to ensure type safety.
 */
export const STORAGE_EVENTS = {
  /** Emitted when an upload is requested (file record created, URL generated) */
  UPLOAD_REQUESTED: 'storage.upload.requested',
  /** Emitted when an upload is confirmed (file marked as confirmed) */
  UPLOAD_CONFIRMED: 'storage.upload.confirmed',
  /** Emitted when a file is soft-deleted */
  FILE_DELETED: 'storage.file.deleted',
  /** Emitted when a file is permanently removed from storage */
  FILE_PURGED: 'storage.file.purged',
  /** Emitted when orphaned uploads are cleaned up */
  CLEANUP_ORPHANED: 'storage.cleanup.orphaned',
  /** Emitted when deleted files are purged */
  CLEANUP_DELETED: 'storage.cleanup.deleted',
} as const;

/**
 * Cleanup job configuration defaults.
 */
export const STORAGE_CLEANUP = {
  /** Time in ms after which pending uploads are considered orphaned (24 hours) */
  ORPHAN_THRESHOLD_MS: 24 * 60 * 60 * 1000,
  /** Time in ms after which soft-deleted files are purged (7 days) */
  DELETED_THRESHOLD_MS: 7 * 24 * 60 * 60 * 1000,
  /** Batch size for cleanup operations */
  BATCH_SIZE: 100,
} as const;

/**
 * Default pagination settings for storage operations.
 */
export const STORAGE_PAGINATION = {
  /** Default page size for file listings */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum page size for file listings */
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Collection names for the storage module.
 */
export const STORAGE_COLLECTIONS = {
  FILES: 'files',
} as const;
