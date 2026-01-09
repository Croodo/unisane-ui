import type { StorageFile, CreateFileInput } from "./types";

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
}
