/**
 * MongoDB Type Re-exports
 *
 * This file re-exports MongoDB types so modules can import from @unisane/kernel
 * instead of directly from 'mongodb'. This centralizes the MongoDB dependency
 * and will make future database migrations easier.
 *
 * @example
 * ```typescript
 * // Instead of:
 * import type { Collection, Document } from 'mongodb';
 *
 * // Use:
 * import type { Collection, Document } from '@unisane/kernel';
 * ```
 */

// Re-export common MongoDB types
export type {
  Collection,
  Document,
  Filter,
  FindCursor,
  WithId,
  OptionalId,
  UpdateFilter,
  InsertOneResult,
  UpdateResult,
  DeleteResult,
  FindOptions,
  AggregationCursor,
  BulkWriteOptions,
  CountDocumentsOptions,
  CreateIndexesOptions,
  IndexDescription,
  MongoClient,
  Db,
  ClientSession,
  AggregateOptions,
  Sort,
  SortDirection as MongoSortDirection,
} from 'mongodb';
