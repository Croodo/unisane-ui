import type { StorageFile, CreateFileInput } from "./types";

/**
 * Storage usage summary for a scope (tenant).
 */
export interface StorageUsage {
  totalBytes: number;
  fileCount: number;
}

/**
 * Port interface for storage repository.
 * DB adapters must implement this interface.
 */
export interface StorageRepository {
  create(input: CreateFileInput): Promise<StorageFile>;
  findById(id: string): Promise<StorageFile | null>;
  findByKey(key: string): Promise<StorageFile | null>;
  confirmUpload(id: string): Promise<StorageFile | null>;
  softDelete(id: string): Promise<StorageFile | null>;
  hardDelete(id: string): Promise<boolean>;
  list(
    opts: {
      folder?: string;
      status?: string;
      cursor?: string;
      limit: number;
    }
  ): Promise<{ items: StorageFile[]; nextCursor: string | null }>;
  findPendingOlderThan(ms: number): Promise<StorageFile[]>;
  findDeletedOlderThan(ms: number): Promise<StorageFile[]>;
  /**
   * Get aggregate storage usage for the current scope.
   * Counts only ACTIVE files (excludes pending and deleted).
   */
  getStorageUsage(): Promise<StorageUsage>;
  /**
   * Mark all files as deleted for a scope (tenant).
   * Used during tenant deletion cascade.
   */
  markAllDeletedForScope(scopeId: string): Promise<{ markedCount: number }>;
}
