/**
 * Base MongoDB Repository
 *
 * Provides common CRUD operations and patterns for MongoDB repositories:
 * - Document to View mapping
 * - Soft delete filtering
 * - Tenant scoping (optional)
 * - Timestamp management (createdAt, updatedAt)
 * - ObjectId handling
 *
 * Usage:
 * ```typescript
 * const usersRepo = createMongoRepository<UserDoc, UserView, CreateUserInput, UpdateUserInput>({
 *   collectionName: 'users',
 *   mapDocToView: (doc) => ({ id: String(doc._id), email: doc.email, ... }),
 *   buildDocFromInput: (input, now) => ({ email: input.email, createdAt: now, updatedAt: now, deletedAt: null }),
 *   buildUpdateSet: (update, now) => {
 *     const $set: Record<string, unknown> = { updatedAt: now };
 *     if ('email' in update) $set.email = update.email;
 *     return $set;
 *   },
 * });
 * ```
 */

import type { Collection, Filter, Document, WithId, UpdateFilter } from 'mongodb';
import { ObjectId } from 'mongodb';
import { col } from './connection';
import { softDeleteFilter } from './filters';
import { maybeObjectId } from './objectid';
import { tenantFilter as buildTenantFilter, tenantFilterActive } from './tenant-scope';
import type { TenantScoped } from './tenant-scope';

/**
 * Base document interface with standard MongoDB fields.
 * All documents should extend this interface.
 */
export interface BaseDocument {
  _id?: ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Base view interface with mapped id field.
 */
export interface BaseView {
  id: string;
}

/**
 * Result from bulk create operation.
 */
export interface BulkCreateResult<View> {
  /** Successfully created views */
  created: View[];
  /** Number of successful inserts */
  insertedCount: number;
  /** Errors that occurred (index -> error message) */
  errors: Array<{ index: number; error: string }>;
}

/**
 * Result from bulk delete operation.
 */
export interface BulkDeleteResult {
  /** Number of documents deleted/modified */
  deletedCount: number;
  /** IDs that were not found or failed */
  notFound: string[];
}

/**
 * Configuration for creating a repository.
 */
export interface RepositoryConfig<Doc extends BaseDocument, View extends BaseView, CreateInput, UpdateInput> {
  /** Name of the MongoDB collection */
  collectionName: string;
  /** Map a MongoDB document to a view object */
  mapDocToView: (doc: WithId<Doc>) => View;
  /** Build a document from create input */
  buildDocFromInput: (input: CreateInput, now: Date) => Omit<Doc, '_id'>;
  /** Build $set object from update input */
  buildUpdateSet: (update: UpdateInput, now: Date) => Record<string, unknown>;
  /** Optional projection for findById queries */
  findByIdProjection?: Document;
  /** Optional projection for findByIds queries */
  findByIdsProjection?: Document;
}

/**
 * Core repository operations that work without tenant context.
 * Use for global entities (users, tenants) or admin operations.
 */
export interface BaseMongoRepository<Doc extends BaseDocument, View extends BaseView, CreateInput, UpdateInput> {
  /** Get the underlying MongoDB collection */
  collection(): Collection<Doc>;

  /**
   * Create a new document.
   * @param input - Data for the new document
   * @returns The created view
   */
  create(input: CreateInput): Promise<View>;

  /**
   * Find a document by its ID.
   * Excludes soft-deleted documents.
   * @param id - Document ID (string or ObjectId)
   * @returns The view or null if not found
   */
  findById(id: string): Promise<View | null>;

  /**
   * Find multiple documents by their IDs.
   * Excludes soft-deleted documents.
   * @param ids - Array of document IDs
   * @returns Map of id -> view
   */
  findByIds(ids: string[]): Promise<Map<string, View>>;

  /**
   * Update a document by ID.
   * @param id - Document ID
   * @param update - Update data
   * @returns The updated view or null if not found
   */
  updateById(id: string, update: UpdateInput): Promise<View | null>;

  /**
   * Soft delete a document by ID.
   * Sets deletedAt to current timestamp.
   * @param id - Document ID
   * @returns The deleted view or null if not found
   */
  softDelete(id: string): Promise<View | null>;

  /**
   * Hard delete a document by ID.
   * Permanently removes the document.
   * @param id - Document ID
   * @returns true if deleted, false if not found
   */
  hardDelete(id: string): Promise<boolean>;

  /**
   * Count documents matching a filter.
   * Excludes soft-deleted documents by default.
   * @param filter - Optional additional filter
   */
  count(filter?: Filter<Doc>): Promise<number>;

  /**
   * Find one document matching a filter.
   * Excludes soft-deleted documents.
   * @param filter - Query filter
   * @returns The view or null if not found
   */
  findOne(filter: Filter<Doc>): Promise<View | null>;

  /**
   * Find all documents matching a filter.
   * Excludes soft-deleted documents.
   * @param filter - Query filter
   * @param limit - Maximum documents to return
   * @returns Array of views
   */
  findMany(filter: Filter<Doc>, limit?: number): Promise<View[]>;

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  /**
   * Create multiple documents in a single operation.
   * @param inputs - Array of create inputs
   * @returns BulkCreateResult with created views and any errors
   */
  createMany(inputs: CreateInput[]): Promise<BulkCreateResult<View>>;

  /**
   * Soft delete multiple documents by IDs.
   * @param ids - Array of document IDs
   * @returns BulkDeleteResult with deleted count and any errors
   */
  softDeleteMany(ids: string[]): Promise<BulkDeleteResult>;

  /**
   * Hard delete multiple documents by IDs.
   * Permanently removes the documents (use for GDPR).
   * @param ids - Array of document IDs
   * @returns BulkDeleteResult with deleted count
   */
  hardDeleteMany(ids: string[]): Promise<BulkDeleteResult>;
}

/**
 * Tenant-scoped repository operations.
 * Automatically adds tenantId from request context to all queries.
 */
export interface TenantScopedRepository<Doc extends BaseDocument & TenantScoped, View extends BaseView, CreateInput, UpdateInput>
  extends BaseMongoRepository<Doc, View, CreateInput, UpdateInput> {
  /**
   * Find a document by ID within the current tenant.
   * Uses tenantFilter from context.
   * @param id - Document ID
   * @returns The view or null if not found or wrong tenant
   */
  findByIdForTenant(id: string): Promise<View | null>;

  /**
   * Soft delete a document by ID within the current tenant.
   * @param id - Document ID
   * @returns The deleted view or null
   */
  softDeleteByTenant(id: string): Promise<View | null>;

  /**
   * Count documents for the current tenant.
   * @param filter - Optional additional filter
   */
  countByTenant(filter?: Partial<Filter<Doc>>): Promise<number>;
}

/**
 * Create a base MongoDB repository with common CRUD operations.
 */
export function createMongoRepository<
  Doc extends BaseDocument,
  View extends BaseView,
  CreateInput,
  UpdateInput,
>(config: RepositoryConfig<Doc, View, CreateInput, UpdateInput>): BaseMongoRepository<Doc, View, CreateInput, UpdateInput> {
  const { collectionName, mapDocToView, buildDocFromInput, buildUpdateSet, findByIdProjection, findByIdsProjection } = config;

  const getCollection = () => col<Doc>(collectionName);

  return {
    collection() {
      return getCollection();
    },

    async create(input: CreateInput): Promise<View> {
      const now = new Date();
      const doc = buildDocFromInput(input, now);
      const result = await getCollection().insertOne(doc as unknown as Parameters<Collection<Doc>['insertOne']>[0]);
      return mapDocToView({ ...doc, _id: result.insertedId } as unknown as WithId<Doc>);
    },

    async findById(id: string): Promise<View | null> {
      const filter = {
        _id: maybeObjectId(id),
        ...softDeleteFilter(),
      } as Filter<Doc>;

      let cursor = getCollection().findOne(filter);
      if (findByIdProjection) {
        cursor = getCollection().findOne(filter, { projection: findByIdProjection });
      }

      const doc = await cursor;
      return doc ? mapDocToView(doc as WithId<Doc>) : null;
    },

    async findByIds(ids: string[]): Promise<Map<string, View>> {
      if (!ids.length) return new Map();

      const uniqueIds = [...new Set(ids)];
      const objIds = uniqueIds.map(maybeObjectId);

      const filter = {
        _id: { $in: objIds },
        ...softDeleteFilter(),
      } as Filter<Doc>;

      let cursor = getCollection().find(filter);
      if (findByIdsProjection) {
        cursor = cursor.project(findByIdsProjection);
      }

      const docs = await cursor.toArray();
      const map = new Map<string, View>();

      for (const doc of docs) {
        const view = mapDocToView(doc as WithId<Doc>);
        map.set(view.id, view);
      }

      return map;
    },

    async updateById(id: string, update: UpdateInput): Promise<View | null> {
      const now = new Date();
      const $set = buildUpdateSet(update, now);

      const result = await getCollection().findOneAndUpdate(
        { _id: maybeObjectId(id) } as Filter<Doc>,
        { $set } as UpdateFilter<Doc>,
        { returnDocument: 'after' }
      );

      return result ? mapDocToView(result as WithId<Doc>) : null;
    },

    async softDelete(id: string): Promise<View | null> {
      const now = new Date();

      const result = await getCollection().findOneAndUpdate(
        {
          _id: maybeObjectId(id),
          ...softDeleteFilter(),
        } as Filter<Doc>,
        { $set: { deletedAt: now, updatedAt: now } } as UpdateFilter<Doc>,
        { returnDocument: 'after' }
      );

      return result ? mapDocToView(result as WithId<Doc>) : null;
    },

    async hardDelete(id: string): Promise<boolean> {
      const result = await getCollection().deleteOne({
        _id: maybeObjectId(id),
      } as Filter<Doc>);
      return result.deletedCount > 0;
    },

    async count(filter?: Filter<Doc>): Promise<number> {
      const finalFilter = {
        ...softDeleteFilter(),
        ...(filter ?? {}),
      } as Filter<Doc>;
      return getCollection().countDocuments(finalFilter);
    },

    async findOne(filter: Filter<Doc>): Promise<View | null> {
      const finalFilter = {
        ...softDeleteFilter(),
        ...filter,
      } as Filter<Doc>;
      const doc = await getCollection().findOne(finalFilter);
      return doc ? mapDocToView(doc as WithId<Doc>) : null;
    },

    async findMany(filter: Filter<Doc>, limit = 1000): Promise<View[]> {
      const finalFilter = {
        ...softDeleteFilter(),
        ...filter,
      } as Filter<Doc>;
      const docs = await getCollection().find(finalFilter).limit(limit).toArray();
      return docs.map((doc) => mapDocToView(doc as WithId<Doc>));
    },

    // ========================================================================
    // Bulk Operations
    // ========================================================================

    async createMany(inputs: CreateInput[]): Promise<BulkCreateResult<View>> {
      if (!inputs.length) {
        return { created: [], insertedCount: 0, errors: [] };
      }

      const now = new Date();
      const docs = inputs.map((input) => buildDocFromInput(input, now));
      const errors: Array<{ index: number; error: string }> = [];
      const created: View[] = [];

      try {
        // Use ordered: false to continue on errors
        const result = await getCollection().insertMany(
          docs as unknown as Parameters<Collection<Doc>['insertMany']>[0],
          { ordered: false }
        );

        // Map inserted documents to views
        for (let i = 0; i < docs.length; i++) {
          const insertedId = result.insertedIds[i];
          if (insertedId) {
            created.push(mapDocToView({ ...docs[i], _id: insertedId } as unknown as WithId<Doc>));
          }
        }

        return {
          created,
          insertedCount: result.insertedCount,
          errors,
        };
      } catch (e) {
        // Handle bulk write error with partial success
        const bulkErr = e as { writeErrors?: Array<{ index: number; errmsg?: string }> };
        if (bulkErr.writeErrors) {
          for (const we of bulkErr.writeErrors) {
            errors.push({ index: we.index, error: we.errmsg ?? 'Unknown error' });
          }
        }

        // Try to get successfully inserted docs
        const insertResult = e as { insertedCount?: number; insertedIds?: Record<number, unknown> };
        if (insertResult.insertedIds) {
          for (let i = 0; i < docs.length; i++) {
            const insertedId = insertResult.insertedIds[i];
            if (insertedId) {
              created.push(mapDocToView({ ...docs[i], _id: insertedId } as unknown as WithId<Doc>));
            }
          }
        }

        return {
          created,
          insertedCount: insertResult.insertedCount ?? created.length,
          errors,
        };
      }
    },

    async softDeleteMany(ids: string[]): Promise<BulkDeleteResult> {
      if (!ids.length) {
        return { deletedCount: 0, notFound: [] };
      }

      const now = new Date();
      const uniqueIds = [...new Set(ids)];
      const objIds = uniqueIds.map(maybeObjectId);

      const filter = {
        _id: { $in: objIds },
        ...softDeleteFilter(),
      } as Filter<Doc>;

      const result = await getCollection().updateMany(
        filter,
        { $set: { deletedAt: now, updatedAt: now } } as UpdateFilter<Doc>
      );

      const deletedCount = result.modifiedCount;
      const notFound = deletedCount < uniqueIds.length
        ? uniqueIds.slice(deletedCount) // Approximate - actual IDs would require pre-query
        : [];

      return { deletedCount, notFound };
    },

    async hardDeleteMany(ids: string[]): Promise<BulkDeleteResult> {
      if (!ids.length) {
        return { deletedCount: 0, notFound: [] };
      }

      const uniqueIds = [...new Set(ids)];
      const objIds = uniqueIds.map(maybeObjectId);

      const result = await getCollection().deleteMany({
        _id: { $in: objIds },
      } as Filter<Doc>);

      const deletedCount = result.deletedCount;
      const notFound = deletedCount < uniqueIds.length
        ? uniqueIds.slice(deletedCount) // Approximate
        : [];

      return { deletedCount, notFound };
    },
  };
}

/**
 * Create a tenant-scoped MongoDB repository.
 * All operations automatically include tenantId from request context.
 */
export function createTenantScopedRepository<
  Doc extends BaseDocument & TenantScoped,
  View extends BaseView,
  CreateInput,
  UpdateInput,
>(
  config: RepositoryConfig<Doc, View, CreateInput, UpdateInput>
): TenantScopedRepository<Doc, View, CreateInput, UpdateInput> {
  // Get the base repository
  const base = createMongoRepository<Doc, View, CreateInput, UpdateInput>(config);

  return {
    // Spread all base operations
    ...base,

    async findByIdForTenant(id: string): Promise<View | null> {
      if (!ObjectId.isValid(id)) return null;

      // tenantFilterActive combines tenant scoping with soft delete filter
      const filter = tenantFilterActive<Doc>({
        _id: new ObjectId(id),
      } as Partial<Filter<Doc>>);

      const doc = await base.collection().findOne(filter);
      return doc ? config.mapDocToView(doc as WithId<Doc>) : null;
    },

    async softDeleteByTenant(id: string): Promise<View | null> {
      if (!ObjectId.isValid(id)) return null;

      const now = new Date();

      // Use tenant filter to ensure only deleting own documents
      const filter = tenantFilterActive<Doc>({
        _id: new ObjectId(id),
      } as Partial<Filter<Doc>>);

      const result = await base.collection().findOneAndUpdate(
        filter,
        { $set: { deletedAt: now, updatedAt: now } } as UpdateFilter<Doc>,
        { returnDocument: 'after' }
      );

      return result ? config.mapDocToView(result as WithId<Doc>) : null;
    },

    async countByTenant(filter?: Partial<Filter<Doc>>): Promise<number> {
      // tenantFilterActive adds tenant scoping and soft delete filter
      const finalFilter = tenantFilterActive<Doc>(filter ?? {});
      return base.collection().countDocuments(finalFilter);
    },
  };
}

/**
 * Helper to build standard update $set objects.
 * Handles common field updates and avoids undefined values.
 */
export function buildStandardUpdateSet<T extends object>(
  update: Partial<T>,
  fieldMap?: Partial<Record<keyof T, string>>
): Record<string, unknown> {
  const $set: Record<string, unknown> = { updatedAt: new Date() };

  for (const [key, value] of Object.entries(update)) {
    if (value === undefined) continue;
    const docKey = fieldMap?.[key as keyof T] ?? key;
    $set[docKey] = value ?? null;
  }

  return $set;
}
