/**
 * Storage Module — SSOT Constants
 *
 * All storage-related constants in one place.
 * Used by: domain schemas, services, contracts, UI
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Storage Folders (SSOT)
// ---------------------------------------------------------------------------
export const STORAGE_FOLDER = {
  AVATARS: "avatars",
  EXPORTS: "exports",
  ATTACHMENTS: "attachments",
  DOCUMENTS: "documents",
  IMPORTS: "imports",
} as const;

export type StorageFolder =
  (typeof STORAGE_FOLDER)[keyof typeof STORAGE_FOLDER];

export const STORAGE_FOLDERS = Object.values(STORAGE_FOLDER) as StorageFolder[];

export const ZStorageFolder = z.enum([
  STORAGE_FOLDER.AVATARS,
  STORAGE_FOLDER.EXPORTS,
  STORAGE_FOLDER.ATTACHMENTS,
  STORAGE_FOLDER.DOCUMENTS,
  STORAGE_FOLDER.IMPORTS,
]);

// ---------------------------------------------------------------------------
// File Status
// ---------------------------------------------------------------------------
export const FILE_STATUS = {
  PENDING: "pending", // Upload requested but not confirmed
  ACTIVE: "active", // Upload confirmed, file exists
  DELETED: "deleted", // Soft deleted, awaiting cleanup
} as const;

export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

export const ZFileStatus = z.enum([
  FILE_STATUS.PENDING,
  FILE_STATUS.ACTIVE,
  FILE_STATUS.DELETED,
]);

// ---------------------------------------------------------------------------
// Allowed Content Types
// ---------------------------------------------------------------------------
export const ALLOWED_CONTENT_TYPES = {
  // Images
  "image/jpeg": { maxBytes: 10 * 1024 * 1024, ext: "jpg" },
  "image/png": { maxBytes: 10 * 1024 * 1024, ext: "png" },
  "image/gif": { maxBytes: 5 * 1024 * 1024, ext: "gif" },
  "image/webp": { maxBytes: 10 * 1024 * 1024, ext: "webp" },
  "image/svg+xml": { maxBytes: 1 * 1024 * 1024, ext: "svg" },
  "image/heic": { maxBytes: 20 * 1024 * 1024, ext: "heic" },
  "image/heif": { maxBytes: 20 * 1024 * 1024, ext: "heif" },
  "image/avif": { maxBytes: 10 * 1024 * 1024, ext: "avif" },
  "image/tiff": { maxBytes: 50 * 1024 * 1024, ext: "tiff" },
  "image/bmp": { maxBytes: 10 * 1024 * 1024, ext: "bmp" },
  // Documents
  "application/pdf": { maxBytes: 50 * 1024 * 1024, ext: "pdf" },
  "application/json": { maxBytes: 100 * 1024 * 1024, ext: "json" },
  "text/csv": { maxBytes: 100 * 1024 * 1024, ext: "csv" },
  "text/plain": { maxBytes: 10 * 1024 * 1024, ext: "txt" },
  // Archives
  "application/zip": { maxBytes: 100 * 1024 * 1024, ext: "zip" },
} as const;

export type AllowedContentType = keyof typeof ALLOWED_CONTENT_TYPES;

export const ZContentType = z.enum(
  Object.keys(ALLOWED_CONTENT_TYPES) as [
    AllowedContentType,
    ...AllowedContentType[],
  ]
);

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------
export const STORAGE_LIMITS = {
  /** Default max file size in bytes (50 MB) */
  DEFAULT_MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** Max filename length */
  MAX_FILENAME_LENGTH: 255,
  /** Pending upload expiry (24 hours) */
  PENDING_EXPIRY_MS: 24 * 60 * 60 * 1000,
  /** Presigned URL expiry (seconds) */
  PRESIGN_EXPIRY_SEC: 600,
  /** Soft delete retention before hard delete (7 days) */
  SOFT_DELETE_RETENTION_MS: 7 * 24 * 60 * 60 * 1000,
} as const;

// ---------------------------------------------------------------------------
// Key Path Helpers
// ---------------------------------------------------------------------------

/**
 * Generate S3 object key path
 * Format: {scopeId}/{folder}/{year}/{month}/{uuid}_{safeFilename}.{ext}
 */
export function generateStorageKey(params: {
  scopeId: string;
  folder: StorageFolder;
  uuid: string;
  filename: string;
  contentType: AllowedContentType;
}): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = ALLOWED_CONTENT_TYPES[params.contentType]?.ext ?? "bin";
  const safeFilename = params.filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 50);
  return `${params.scopeId}/${params.folder}/${year}/${month}/${params.uuid}_${safeFilename}.${ext}`;
}

/**
 * Parse scope ID from storage key
 */
export function parseScopeFromKey(key: string): string | null {
  const parts = key.split("/");
  return parts.length > 0 ? parts[0]! : null;
}
