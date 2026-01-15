import {
  col,
  COLLECTIONS,
  scopedFilter,
  getScopeId,
  withScope,
  getScope,
  FILE_STATUS,
  ObjectId,
  type Filter,
  type StorageFolder,
  type FileStatus,
  type AllowedContentType,
  type ScopeType,
} from "@unisane/kernel";
import type { StorageFile, CreateFileInput } from "../domain/types";
import type { StorageRepository } from "../domain/ports";

/**
 * MongoDB document type - internal to this adapter.
 * Not exported to domain layer.
 * Uses universal scope system for multi-scope support.
 */
interface StorageFileDoc {
  _id: ObjectId;
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
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const storageCol = () => col<StorageFileDoc>(COLLECTIONS.FILES);

function toDto(doc: StorageFileDoc): StorageFile {
  return {
    id: doc._id.toHexString(),
    scopeType: doc.scopeType,
    scopeId: doc.scopeId,
    uploaderId: doc.uploaderId,
    key: doc.key,
    folder: doc.folder,
    filename: doc.filename,
    contentType: doc.contentType,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    ...(doc.metadata ? { metadata: doc.metadata } : {}),
    ...(doc.expiresAt ? { expiresAt: doc.expiresAt.toISOString() } : {}),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(doc.deletedAt ? { deletedAt: doc.deletedAt.toISOString() } : {}),
  };
}

async function create(input: CreateFileInput): Promise<StorageFile> {
  const now = new Date();
  const scope = getScope();
  const doc: Omit<StorageFileDoc, "_id"> = {
    scopeType: scope.type,
    scopeId: input.scopeId,
    uploaderId: input.uploaderId,
    key: input.key,
    folder: input.folder,
    filename: input.filename,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    status: FILE_STATUS.PENDING,
    ...(input.metadata ? { metadata: input.metadata } : {}),
    createdAt: now,
    updatedAt: now,
  };
  const result = await storageCol().insertOne(doc as StorageFileDoc);
  return toDto({ ...doc, _id: result.insertedId } as StorageFileDoc);
}

async function findById(id: string): Promise<StorageFile | null> {
  if (!ObjectId.isValid(id)) return null;
  // Use scopedFilter for automatic tenant scoping
  const doc = await storageCol().findOne(scopedFilter({ _id: new ObjectId(id) }));
  return doc ? toDto(doc) : null;
}

async function findByKey(key: string): Promise<StorageFile | null> {
  // Use scopedFilter for automatic tenant scoping
  const doc = await storageCol().findOne(scopedFilter({ key }));
  return doc ? toDto(doc) : null;
}

async function confirmUpload(id: string): Promise<StorageFile | null> {
  if (!ObjectId.isValid(id)) return null;
  // Use scopedFilter for automatic tenant scoping
  const result = await storageCol().findOneAndUpdate(
    scopedFilter({ _id: new ObjectId(id), status: FILE_STATUS.PENDING }),
    { $set: { status: FILE_STATUS.ACTIVE, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? toDto(result) : null;
}

async function softDelete(id: string): Promise<StorageFile | null> {
  if (!ObjectId.isValid(id)) return null;
  const now = new Date();
  // Use scopedFilter for automatic tenant scoping
  const result = await storageCol().findOneAndUpdate(
    scopedFilter({ _id: new ObjectId(id), status: { $ne: FILE_STATUS.DELETED } }),
    { $set: { status: FILE_STATUS.DELETED, deletedAt: now, updatedAt: now } },
    { returnDocument: "after" }
  );
  return result ? toDto(result) : null;
}

async function hardDelete(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  // Use scopedFilter for automatic tenant scoping
  const result = await storageCol().deleteOne(scopedFilter({ _id: new ObjectId(id) }));
  return result.deletedCount > 0;
}

async function list(
  opts: {
    folder?: string;
    status?: string;
    cursor?: string;
    limit: number;
  }
): Promise<{ items: StorageFile[]; nextCursor: string | null }> {
  // Build base filter, scopedFilter will add scopeId from context
  const baseFilter: Record<string, unknown> = {};
  if (opts.folder) baseFilter.folder = opts.folder;
  if (opts.status) baseFilter.status = opts.status;
  if (opts.cursor && ObjectId.isValid(opts.cursor)) {
    baseFilter._id = { $gt: new ObjectId(opts.cursor) };
  }
  // Use scopedFilter for automatic tenant scoping
  const docs = await storageCol()
    .find(scopedFilter(baseFilter))
    .sort({ _id: 1 })
    .limit(opts.limit + 1)
    .toArray();
  const hasMore = docs.length > opts.limit;
  const items = hasMore ? docs.slice(0, opts.limit) : docs;
  const nextCursor = hasMore
    ? items[items.length - 1]!._id.toHexString()
    : null;
  return { items: items.map(toDto), nextCursor };
}

async function findPendingOlderThan(ms: number): Promise<StorageFile[]> {
  const cutoff = new Date(Date.now() - ms);
  const docs = await storageCol()
    .find({ status: FILE_STATUS.PENDING, createdAt: { $lt: cutoff } })
    .limit(500)
    .toArray();
  return docs.map(toDto);
}

async function findDeletedOlderThan(ms: number): Promise<StorageFile[]> {
  const cutoff = new Date(Date.now() - ms);
  const docs = await storageCol()
    .find({ status: FILE_STATUS.DELETED, deletedAt: { $lt: cutoff } })
    .limit(500)
    .toArray();
  return docs.map(toDto);
}

/**
 * MongoDB implementation of StorageRepository.
 * Implements the port interface defined in domain/ports.ts.
 */
export const StorageRepoMongo: StorageRepository = {
  create,
  findById,
  findByKey,
  confirmUpload,
  softDelete,
  hardDelete,
  list,
  findPendingOlderThan,
  findDeletedOlderThan,
};

// Alias for backward compatibility
export const StorageRepo = StorageRepoMongo;
