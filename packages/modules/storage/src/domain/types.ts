import type {
  StorageFolder,
  FileStatus,
  AllowedContentType,
  ScopeType,
} from "@unisane/kernel";

/**
 * Domain entity - DB-agnostic representation of a storage file.
 * Uses universal scope system for multi-tenant/multi-scope support.
 */
export interface StorageFile {
  id: string;
  scopeType: ScopeType;
  scopeId: string;
  uploaderId: string;
  key: string;
  folder: StorageFolder;
  filename: string;
  contentType: AllowedContentType;
  sizeBytes: number;
  status: FileStatus;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * Input for creating a new file record.
 */
export interface CreateFileInput {
  scopeId: string;
  uploaderId: string;
  key: string;
  folder: StorageFolder;
  filename: string;
  contentType: AllowedContentType;
  sizeBytes: number;
  metadata?: Record<string, unknown>;
}

/**
 * Upload request result (presigned URL + metadata)
 */
export interface UploadResult {
  fileId: string;
  uploadUrl: string;
  key: string;
  expiresAt: number;
}

/**
 * Download result (presigned URL)
 */
export interface DownloadResult {
  downloadUrl: string;
  contentType: string;
  filename: string;
  expiresAt: number;
}

/**
 * List result with pagination
 */
export interface ListResult {
  items: StorageFile[];
  nextCursor: string | null;
}
