/**
 * @module @unisane/storage
 * @description File storage with presigned URLs, lifecycle management, and cleanup
 * @layer 2
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas & Types
// ════════════════════════════════════════════════════════════════════════════

export * from "./domain/schemas";
export * from "./domain/types";
export * from "./domain/ports";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  FileNotFoundError,
  FileNotConfirmedError,
  FileAlreadyDeletedError,
  ContentTypeNotAllowedError,
  FileSizeExceededError,
  StorageQuotaExceededError,
  FileAccessDeniedError,
  PresignedUrlError,
} from "./domain/errors";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export {
  STORAGE_EVENTS,
  STORAGE_CLEANUP,
  STORAGE_PAGINATION,
  STORAGE_COLLECTIONS,
} from "./domain/constants";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { storageKeys } from "./domain/keys";
export type { StorageKeyBuilder } from "./domain/keys";

// ════════════════════════════════════════════════════════════════════════════
// Services - Upload Operations
// ════════════════════════════════════════════════════════════════════════════

export { requestUpload } from "./service/upload";
export { confirmUpload } from "./service/confirm";

// ════════════════════════════════════════════════════════════════════════════
// Services - Download & List
// ════════════════════════════════════════════════════════════════════════════

export { getDownloadUrl } from "./service/download";
export { listFiles } from "./service/list";

// ════════════════════════════════════════════════════════════════════════════
// Services - Usage & Quota
// ════════════════════════════════════════════════════════════════════════════

export { getStorageUsage, getStorageUsageWithQuota, formatBytes } from "./service/usage";
export type { StorageUsageWithQuota } from "./service/usage";

// ════════════════════════════════════════════════════════════════════════════
// Services - Delete & Cleanup
// ════════════════════════════════════════════════════════════════════════════

export { deleteFile } from "./service/delete";
export { cleanupOrphanedUploads, cleanupDeletedFiles } from "./service/cleanup";

// ════════════════════════════════════════════════════════════════════════════
// Data - Repository
// ════════════════════════════════════════════════════════════════════════════

export { StorageRepo } from "./data/storage.repository";

// ════════════════════════════════════════════════════════════════════════════
// Event Handlers
// ════════════════════════════════════════════════════════════════════════════

export { registerStorageEventHandlers } from "./event-handlers";
