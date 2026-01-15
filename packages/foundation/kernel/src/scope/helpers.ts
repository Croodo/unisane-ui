/**
 * Scope Helpers
 *
 * Utility functions for working with scoped data in database operations.
 * These functions automatically use the current scope from AsyncLocalStorage context.
 */

import type { Filter } from 'mongodb';
import type { Scope, ScopeType, Scoped, ScopeFilter } from './types';
import {
  getScope,
  getScopeOrNull,
  getScopeContext,
  tryGetScopeContext,
  ScopeNotInitializedError,
} from './context';

/**
 * Error thrown when scope isolation check fails.
 */
export class ScopeIsolationError extends Error {
  constructor(expectedScopeId: string, actualScopeId: string | undefined) {
    super(
      `Scope isolation violation: expected '${expectedScopeId}', got '${actualScopeId ?? 'undefined'}'`
    );
    this.name = 'ScopeIsolationError';
  }
}

/**
 * Adds scope fields (scopeType, scopeId) to a document for insertion.
 * Automatically uses the scope from the current context.
 *
 * @example
 * ```typescript
 * // In a service function (within runWithScope())
 * const newFile = withScope({
 *   key: 'uploads/avatar.png',
 *   size: 1024,
 *   mimeType: 'image/png',
 * });
 * // Result: { scopeType: 'tenant', scopeId: 'team_123', key: ..., size: ..., mimeType: ... }
 * await col('files').insertOne(newFile);
 * ```
 *
 * @param data - The document data to enhance
 * @returns Document with scopeType and scopeId added
 * @throws ScopeNotInitializedError if not within a scope context
 */
export function withScope<T extends object>(data: T): T & Scoped {
  const scope = getScope();
  return {
    scopeType: scope.type,
    scopeId: scope.id,
    ...data,
  };
}

/**
 * Creates a scope filter for database queries.
 * Use this to automatically scope queries to the current scope.
 *
 * @example
 * ```typescript
 * // In a service function
 * const filter = scopeFilter();
 * // Result: { scopeType: 'tenant', scopeId: 'team_123' }
 * const files = await col('files').find(filter).toArray();
 * ```
 *
 * @returns Filter object with scopeType and scopeId
 * @throws ScopeNotInitializedError if not within a scope context or if scope is anonymous
 */
export function scopeFilter(): ScopeFilter {
  const scope = getScope();
  // Guard against anonymous scope to prevent accidental data leaks
  if (scope.id === '__anonymous__') {
    throw new ScopeNotInitializedError();
  }
  return {
    scopeType: scope.type,
    scopeId: scope.id,
  };
}

/**
 * Creates a MongoDB filter that includes the current scope.
 * Use this to automatically scope queries to the current scope with additional filters.
 *
 * @example
 * ```typescript
 * // In a service function
 * const filter = scopedFilter({ status: 'active' });
 * // Result: { scopeType: 'tenant', scopeId: 'team_123', status: 'active' }
 * const users = await col('users').find(filter).toArray();
 * ```
 *
 * @param additionalFilter - Additional filter conditions to merge
 * @returns Filter with scope fields added
 * @throws ScopeNotInitializedError if not within a scope context
 */
export function scopedFilter<T extends Scoped>(
  additionalFilter: Partial<Omit<Filter<T>, 'scopeType' | 'scopeId'>> = {}
): Filter<T> {
  const scope = getScope();
  return {
    scopeType: scope.type,
    scopeId: scope.id,
    ...additionalFilter,
  } as Filter<T>;
}

/**
 * Creates a scoped filter that also excludes soft-deleted documents.
 * Combines scope filtering with soft delete filtering.
 *
 * @example
 * ```typescript
 * const filter = scopedFilterActive({ role: 'admin' });
 * // Result: { scopeType: 'tenant', scopeId: 'team_123', role: 'admin', $or: [...deletedAt checks] }
 * ```
 *
 * @note For optimal performance, ensure collections have a compound index including `deletedAt`:
 * ```javascript
 * db.collection.createIndex({ scopeType: 1, scopeId: 1, deletedAt: 1 })
 * ```
 */
export function scopedFilterActive<T extends Scoped>(
  additionalFilter: Partial<Omit<Filter<T>, 'scopeType' | 'scopeId'>> = {}
): Filter<T> {
  const scope = getScope();
  return {
    scopeType: scope.type,
    scopeId: scope.id,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    ...additionalFilter,
  } as Filter<T>;
}

/**
 * Asserts that a document belongs to the current scope.
 * Use this to verify ownership before performing operations on a document.
 *
 * @example
 * ```typescript
 * const document = await col('files').findOne({ _id: fileId });
 * if (document) {
 *   assertScopeOwnership(document); // Throws if not owned by current scope
 *   // Safe to proceed with operations
 * }
 * ```
 *
 * @param document - The document to check
 * @throws ScopeNotInitializedError if not within a scope context
 * @throws ScopeIsolationError if document belongs to a different scope
 */
export function assertScopeOwnership<T extends Scoped>(document: T): void {
  const scope = getScope();
  if (document.scopeId !== scope.id || document.scopeType !== scope.type) {
    throw new ScopeIsolationError(scope.id, document.scopeId);
  }
}

/**
 * Checks if a document belongs to the current scope without throwing.
 * Returns false if not in a context or if scope doesn't match.
 *
 * @example
 * ```typescript
 * if (isScopeOwned(document)) {
 *   // Safe to access
 * } else {
 *   // Handle unauthorized access
 * }
 * ```
 */
export function isScopeOwned<T extends Scoped>(document: T): boolean {
  const scope = getScopeOrNull();
  if (!scope) {
    return false;
  }
  return document.scopeId === scope.id && document.scopeType === scope.type;
}

/**
 * Filters an array of documents, keeping only those that belong to the current scope.
 * Useful for defensive programming when processing results.
 *
 * @example
 * ```typescript
 * const allDocs = await col('files').find({}).toArray();
 * const scopedDocs = filterByScope(allDocs);
 * // Only documents belonging to current scope
 * ```
 */
export function filterByScope<T extends Scoped>(documents: T[]): T[] {
  const scope = getScopeOrNull();
  if (!scope) {
    return [];
  }
  return documents.filter(
    (doc) => doc.scopeId === scope.id && doc.scopeType === scope.type
  );
}

// ============================================================================
// EXPLICIT SCOPE FILTERS (for operations before context is initialized)
// ============================================================================

/**
 * Creates a filter with explicit scope parameters.
 * Use this for operations that occur BEFORE context is initialized (e.g., auth).
 *
 * @example
 * ```typescript
 * // In auth middleware (before runWithScope())
 * const filter = explicitScopeFilter('tenant', tenantId, { userId });
 * const membership = await col('memberships').findOne(filter);
 * ```
 */
export function explicitScopeFilter<T extends Scoped>(
  scopeType: ScopeType,
  scopeId: string,
  additionalFilter: Partial<Omit<Filter<T>, 'scopeType' | 'scopeId'>> = {}
): Filter<T> {
  return {
    scopeType,
    scopeId,
    ...additionalFilter,
  } as Filter<T>;
}

/**
 * Creates an explicit scope filter that also excludes soft-deleted documents.
 * Use this for auth-time lookups that need soft-delete filtering.
 *
 * @example
 * ```typescript
 * // In auth middleware
 * const filter = explicitScopeFilterActive('tenant', tenantId, { userId });
 * const membership = await col('memberships').findOne(filter);
 * ```
 */
export function explicitScopeFilterActive<T extends Scoped>(
  scopeType: ScopeType,
  scopeId: string,
  additionalFilter: Partial<Omit<Filter<T>, 'scopeType' | 'scopeId'>> = {}
): Filter<T> {
  return {
    scopeType,
    scopeId,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    ...additionalFilter,
  } as Filter<T>;
}

/**
 * Adds explicit scope fields to a document.
 * Use this when you need to specify the scope explicitly (e.g., during tenant creation).
 *
 * @example
 * ```typescript
 * const newDoc = withExplicitScope('tenant', 'team_123', {
 *   name: 'Example',
 * });
 * // Result: { scopeType: 'tenant', scopeId: 'team_123', name: 'Example' }
 * ```
 */
export function withExplicitScope<T extends object>(
  scopeType: ScopeType,
  scopeId: string,
  data: T
): T & Scoped {
  return {
    scopeType,
    scopeId,
    ...data,
  };
}
