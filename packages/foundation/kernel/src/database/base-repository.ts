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
import { scopedFilter, scopedFilterActive } from '../scope/helpers';
import type { Scoped } from '../scope/types';

/**
 * KERN-021 FIX: Maximum number of fields allowed in a projection.
 * Prevents DoS via excessively large projection objects.
 */
const MAX_PROJECTION_FIELDS = 100;

/**
 * KERN-021 FIX: Validate a MongoDB projection object.
 * Ensures projections are safe and well-formed.
 *
 * @param projection - The projection object to validate
 * @param location - Description of where this projection is used (for error messages)
 * @throws Error if projection is invalid
 */
function validateProjection(projection: Document, location: string): void {
  if (typeof projection !== 'object' || projection === null || Array.isArray(projection)) {
    throw new Error(`Invalid projection at ${location}: must be a plain object`);
  }

  const keys = Object.keys(projection);

  // Check for excessive number of fields (DoS prevention)
  if (keys.length > MAX_PROJECTION_FIELDS) {
    throw new Error(
      `Invalid projection at ${location}: too many fields (${keys.length} > ${MAX_PROJECTION_FIELDS})`
    );
  }

  // Validate each projection field
  for (const key of keys) {
    // Check for MongoDB operators in keys (potential injection)
    if (key.startsWith('$')) {
      throw new Error(
        `Invalid projection at ${location}: field "${key}" cannot start with $`
      );
    }

    // Check for null bytes (path traversal/injection)
    if (key.includes('\0')) {
      throw new Error(
        `Invalid projection at ${location}: field "${key}" contains null byte`
      );
    }

    const value = projection[key];

    // Projection values must be 0, 1, or specific MongoDB projection operators
    if (typeof value === 'number') {
      if (value !== 0 && value !== 1) {
        throw new Error(
          `Invalid projection at ${location}: field "${key}" has invalid value ${value} (must be 0 or 1)`
        );
      }
    } else if (typeof value === 'boolean') {
      // Boolean true/false are allowed (equivalent to 1/0)
      continue;
    } else if (typeof value === 'object' && value !== null) {
      // Allow limited projection operators like $slice, $elemMatch, $meta
      const objKeys = Object.keys(value);
      const allowedOperators = ['$slice', '$elemMatch', '$meta'];
      for (const opKey of objKeys) {
        if (opKey.startsWith('$') && !allowedOperators.includes(opKey)) {
          throw new Error(
            `Invalid projection at ${location}: field "${key}" uses unsupported operator "${opKey}"`
          );
        }
      }
    } else {
      throw new Error(
        `Invalid projection at ${location}: field "${key}" has invalid value type`
      );
    }
  }
}

/**
 * KERN-006 FIX: Runtime validation helper for MongoDB documents.
 * Ensures documents have basic expected structure before mapping.
 */
function assertValidDocument<T>(doc: unknown, context: string): asserts doc is T {
  if (doc === null || doc === undefined) {
    throw new Error(`${context}: document is null or undefined`);
  }
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error(`${context}: expected object, got ${Array.isArray(doc) ? 'array' : typeof doc}`);
  }
}

/**
 * KERN-006 FIX: Safe document mapper with runtime validation.
 * Wraps the user-provided mapDocToView with a validation check.
 *
 * H-006 FIX: Also wraps mapper in try-catch to provide better error context
 * when mapper functions throw exceptions.
 */
function safeMapDocToView<Doc extends BaseDocument, View>(
  mapDocToView: (doc: WithId<Doc>) => View,
  doc: unknown,
  context: string
): View {
  assertValidDocument<WithId<Doc>>(doc, context);

  // H-006 FIX: Wrap mapper in try-catch to provide better error context
  try {
    return mapDocToView(doc);
  } catch (mapperError) {
    const errorMessage = mapperError instanceof Error ? mapperError.message : String(mapperError);
    const docId = (doc as { _id?: unknown })?._id;
    throw new Error(
      `${context}: mapper function threw an error for document ${docId ? String(docId) : 'unknown'}: ${errorMessage}`
    );
  }
}

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
 * Scope-aware repository operations.
 * Automatically adds scope fields from request context to all queries.
 *
 * KERN-017 NOTE: This interface extends BaseMongoRepository which exposes unscoped methods.
 * For tenant-isolated data, prefer using the scope-aware methods:
 * - findByIdForScope() instead of findById()
 * - softDeleteByScope() instead of softDelete()
 * - countByScope() instead of count()
 *
 * For stricter enforcement, use StrictScopedRepository which only exposes scope-aware methods.
 */
export interface ScopedRepository<Doc extends BaseDocument & Scoped, View extends BaseView, CreateInput, UpdateInput>
  extends BaseMongoRepository<Doc, View, CreateInput, UpdateInput> {
  /**
   * Find a document by ID within the current scope.
   * Uses scopedFilter from context.
   * @param id - Document ID
   * @returns The view or null if not found or wrong scope
   */
  findByIdForScope(id: string): Promise<View | null>;

  /**
   * Soft delete a document by ID within the current scope.
   * @param id - Document ID
   * @returns The deleted view or null
   */
  softDeleteByScope(id: string): Promise<View | null>;

  /**
   * Count documents for the current scope.
   * @param filter - Optional additional filter
   */
  countByScope(filter?: Partial<Filter<Doc>>): Promise<number>;
}

/**
 * KERN-017 FIX: Strict scoped repository that ONLY exposes scope-aware methods.
 *
 * Use this interface when you want to enforce that all operations go through
 * scope filtering. Unlike ScopedRepository, this does NOT extend BaseMongoRepository,
 * so unscoped methods like findById() are not available.
 *
 * This prevents accidental scope leakage when working with tenant-isolated data.
 *
 * @example
 * ```typescript
 * // In your module, export the strict type
 * export type FilesRepo = StrictScopedRepository<FileDoc, FileView, CreateFileInput, UpdateFileInput>;
 *
 * // Create using createStrictScopedRepository
 * export const filesRepo = createStrictScopedRepository<...>(config);
 *
 * // Now callers can only use scope-safe methods
 * filesRepo.findByIdForScope(id); // OK
 * filesRepo.findById(id); // TypeScript error - method doesn't exist
 * ```
 */
export interface StrictScopedRepository<Doc extends BaseDocument & Scoped, View extends BaseView, CreateInput, UpdateInput> {
  /**
   * Create a new document (inherits scope from context).
   */
  create(input: CreateInput): Promise<View>;

  /**
   * Find a document by ID within the current scope.
   */
  findByIdForScope(id: string): Promise<View | null>;

  /**
   * Soft delete a document by ID within the current scope.
   */
  softDeleteByScope(id: string): Promise<View | null>;

  /**
   * Count documents for the current scope.
   */
  countByScope(filter?: Partial<Filter<Doc>>): Promise<number>;

  /**
   * KERN-017 FIX: Access the underlying full repository for admin operations.
   * This is intentionally verbose to discourage casual use.
   *
   * Use this ONLY when you need unscoped access (e.g., admin panels, migrations).
   * For normal tenant operations, use the scope-aware methods above.
   */
  __unscopedAdmin(): BaseMongoRepository<Doc, View, CreateInput, UpdateInput>;
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

  // KERN-021 FIX: Validate projections at repository creation time
  // This catches configuration errors early rather than at query time
  if (findByIdProjection) {
    validateProjection(findByIdProjection, `${collectionName}.findByIdProjection`);
  }
  if (findByIdsProjection) {
    validateProjection(findByIdsProjection, `${collectionName}.findByIdsProjection`);
  }

  const getCollection = () => col<Doc>(collectionName);

  return {
    collection() {
      return getCollection();
    },

    async create(input: CreateInput): Promise<View> {
      const now = new Date();
      const doc = buildDocFromInput(input, now);
      const result = await getCollection().insertOne(doc as unknown as Parameters<Collection<Doc>['insertOne']>[0]);

      // H-005 FIX: Build the created document properly instead of unsafe type assertion
      // Construct the document with the inserted ID for mapping
      const createdDoc = {
        ...doc,
        _id: result.insertedId,
      };

      // Use safeMapDocToView for consistency and error handling
      return safeMapDocToView(mapDocToView, createdDoc, `${collectionName}.create`);
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
      // KERN-006 FIX: Use safe mapper with validation
      return doc ? safeMapDocToView(mapDocToView, doc, `${collectionName}.findById`) : null;
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
        // KERN-006 FIX: Use safe mapper with validation
        const view = safeMapDocToView(mapDocToView, doc, `${collectionName}.findByIds`);
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

      // KERN-006 FIX: Use safe mapper with validation
      return result ? safeMapDocToView(mapDocToView, result, `${collectionName}.updateById`) : null;
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

      // KERN-006 FIX: Use safe mapper with validation
      return result ? safeMapDocToView(mapDocToView, result, `${collectionName}.softDelete`) : null;
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
      // KERN-006 FIX: Use safe mapper with validation
      return doc ? safeMapDocToView(mapDocToView, doc, `${collectionName}.findOne`) : null;
    },

    async findMany(filter: Filter<Doc>, limit = 1000): Promise<View[]> {
      const finalFilter = {
        ...softDeleteFilter(),
        ...filter,
      } as Filter<Doc>;
      const docs = await getCollection().find(finalFilter).limit(limit).toArray();
      // KERN-006 FIX: Use safe mapper with validation
      return docs.map((doc) => safeMapDocToView(mapDocToView, doc, `${collectionName}.findMany`));
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

        // H-005 FIX: Map inserted documents to views using safeMapDocToView
        for (let i = 0; i < docs.length; i++) {
          const insertedId = result.insertedIds[i];
          if (insertedId) {
            const createdDoc = { ...docs[i], _id: insertedId };
            try {
              created.push(safeMapDocToView(mapDocToView, createdDoc, `${collectionName}.createMany[${i}]`));
            } catch (mapErr) {
              errors.push({ index: i, error: mapErr instanceof Error ? mapErr.message : 'Mapping error' });
            }
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

        // H-005 FIX: Try to get successfully inserted docs using safeMapDocToView
        const insertResult = e as { insertedCount?: number; insertedIds?: Record<number, unknown> };
        if (insertResult.insertedIds) {
          for (let i = 0; i < docs.length; i++) {
            const insertedId = insertResult.insertedIds[i];
            if (insertedId) {
              const createdDoc = { ...docs[i], _id: insertedId };
              try {
                created.push(safeMapDocToView(mapDocToView, createdDoc, `${collectionName}.createMany[${i}]`));
              } catch (mapErr) {
                errors.push({ index: i, error: mapErr instanceof Error ? mapErr.message : 'Mapping error' });
              }
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

      // KERN-001 FIX: Pre-query to find which IDs actually exist
      // This properly identifies notFound IDs instead of using incorrect slice
      const existingDocs = await getCollection()
        .find(
          {
            _id: { $in: objIds },
            ...softDeleteFilter(),
          } as Filter<Doc>,
          { projection: { _id: 1 } }
        )
        .toArray();

      const existingIdSet = new Set(existingDocs.map((d) => String(d._id)));
      const notFound = uniqueIds.filter((id) => !existingIdSet.has(id));

      const filter = {
        _id: { $in: objIds },
        ...softDeleteFilter(),
      } as Filter<Doc>;

      const result = await getCollection().updateMany(
        filter,
        { $set: { deletedAt: now, updatedAt: now } } as UpdateFilter<Doc>
      );

      return { deletedCount: result.modifiedCount, notFound };
    },

    async hardDeleteMany(ids: string[]): Promise<BulkDeleteResult> {
      if (!ids.length) {
        return { deletedCount: 0, notFound: [] };
      }

      const uniqueIds = [...new Set(ids)];
      const objIds = uniqueIds.map(maybeObjectId);

      // KERN-001 FIX: Pre-query to find which IDs actually exist
      const existingDocs = await getCollection()
        .find(
          { _id: { $in: objIds } } as Filter<Doc>,
          { projection: { _id: 1 } }
        )
        .toArray();

      const existingIdSet = new Set(existingDocs.map((d) => String(d._id)));
      const notFound = uniqueIds.filter((id) => !existingIdSet.has(id));

      const result = await getCollection().deleteMany({
        _id: { $in: objIds },
      } as Filter<Doc>);

      return { deletedCount: result.deletedCount, notFound };
    },
  };
}

/**
 * Create a scope-aware MongoDB repository.
 * All operations automatically include scope fields from request context.
 */
export function createScopedRepository<
  Doc extends BaseDocument & Scoped,
  View extends BaseView,
  CreateInput,
  UpdateInput,
>(
  config: RepositoryConfig<Doc, View, CreateInput, UpdateInput>
): ScopedRepository<Doc, View, CreateInput, UpdateInput> {
  // Get the base repository
  const base = createMongoRepository<Doc, View, CreateInput, UpdateInput>(config);

  return {
    // Spread all base operations
    ...base,

    async findByIdForScope(id: string): Promise<View | null> {
      if (!ObjectId.isValid(id)) return null;

      // scopedFilterActive combines scope filtering with soft delete filter
      const filter = scopedFilterActive<Doc>({
        _id: new ObjectId(id),
      } as Partial<Filter<Doc>>);

      const doc = await base.collection().findOne(filter);
      // KERN-006 FIX: Use safe mapper with validation
      return doc ? safeMapDocToView(config.mapDocToView, doc, `${config.collectionName}.findByIdForScope`) : null;
    },

    async softDeleteByScope(id: string): Promise<View | null> {
      if (!ObjectId.isValid(id)) return null;

      const now = new Date();

      // Use scope filter to ensure only deleting own documents
      const filter = scopedFilterActive<Doc>({
        _id: new ObjectId(id),
      } as Partial<Filter<Doc>>);

      const result = await base.collection().findOneAndUpdate(
        filter,
        { $set: { deletedAt: now, updatedAt: now } } as UpdateFilter<Doc>,
        { returnDocument: 'after' }
      );

      // KERN-006 FIX: Use safe mapper with validation
      return result ? safeMapDocToView(config.mapDocToView, result, `${config.collectionName}.softDeleteByScope`) : null;
    },

    async countByScope(filter?: Partial<Filter<Doc>>): Promise<number> {
      // scopedFilterActive adds scope filtering and soft delete filter
      const finalFilter = scopedFilterActive<Doc>(filter ?? {});
      return base.collection().countDocuments(finalFilter);
    },
  };
}

/**
 * KERN-017 FIX: Create a strict scope-aware MongoDB repository.
 *
 * Unlike createScopedRepository, this returns StrictScopedRepository which
 * does NOT expose unscoped methods. This prevents accidental scope leakage.
 *
 * Use this for tenant-isolated data where you want TypeScript to enforce
 * that all operations go through scope filtering.
 *
 * @example
 * ```typescript
 * const filesRepo = createStrictScopedRepository<FileDoc, FileView, CreateFileInput, UpdateFileInput>({
 *   collectionName: 'files',
 *   // ... config
 * });
 *
 * // These work:
 * await filesRepo.create(input);
 * await filesRepo.findByIdForScope(id);
 *
 * // This is a TypeScript error (method doesn't exist on type):
 * await filesRepo.findById(id); // Error!
 *
 * // For admin operations, explicitly access unscoped:
 * await filesRepo.__unscopedAdmin().findById(id);
 * ```
 */
export function createStrictScopedRepository<
  Doc extends BaseDocument & Scoped,
  View extends BaseView,
  CreateInput,
  UpdateInput,
>(
  config: RepositoryConfig<Doc, View, CreateInput, UpdateInput>
): StrictScopedRepository<Doc, View, CreateInput, UpdateInput> {
  // Create the full scoped repository internally
  const fullRepo = createScopedRepository<Doc, View, CreateInput, UpdateInput>(config);

  // Return only the strict interface
  return {
    create: fullRepo.create.bind(fullRepo),
    findByIdForScope: fullRepo.findByIdForScope.bind(fullRepo),
    softDeleteByScope: fullRepo.softDeleteByScope.bind(fullRepo),
    countByScope: fullRepo.countByScope.bind(fullRepo),

    __unscopedAdmin() {
      // Return the base repository for admin operations
      return fullRepo;
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
