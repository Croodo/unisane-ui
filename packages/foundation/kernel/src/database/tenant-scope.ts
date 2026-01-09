/**
 * Tenant Scoping Utilities
 *
 * Provides automatic tenant scoping for database queries using the request context.
 * These utilities ensure data isolation in multi-tenant applications.
 */

import type { Filter } from 'mongodb';
import { ctx, getTenantId, ContextNotInitializedError } from '../context';

/**
 * Error thrown when tenant isolation check fails.
 */
export class TenantIsolationError extends Error {
  constructor(expectedTenantId: string, actualTenantId: string | undefined) {
    super(
      `Tenant isolation violation: expected ${expectedTenantId}, got ${actualTenantId || 'undefined'}`
    );
    this.name = 'TenantIsolationError';
  }
}

/**
 * Error thrown when tenant context is required but missing.
 */
export class TenantContextRequiredError extends Error {
  constructor(operation: string) {
    super(`Tenant context required for operation: ${operation}`);
    this.name = 'TenantContextRequiredError';
  }
}

/**
 * Interface for documents that have tenant scoping.
 */
export interface TenantScoped {
  tenantId: string;
}

/**
 * Creates a MongoDB filter that includes the current tenant ID from context.
 * Use this to automatically scope queries to the current tenant.
 *
 * @example
 * ```typescript
 * // In a service function (already within ctx.run())
 * const filter = tenantFilter({ status: 'active' });
 * // Result: { tenantId: 'tenant_123', status: 'active' }
 * const users = await col('users').find(filter).toArray();
 * ```
 *
 * @param additionalFilter - Additional filter conditions to merge
 * @returns Filter with tenantId added
 * @throws ContextNotInitializedError if not within a context scope
 * @throws TenantContextRequiredError if tenantId is not set in context
 */
export function tenantFilter<T extends TenantScoped>(
  additionalFilter: Partial<Omit<Filter<T>, 'tenantId'>> = {}
): Filter<T> {
  const tenantId = getTenantId(); // Throws if context/tenantId not available
  return {
    tenantId,
    ...additionalFilter,
  } as Filter<T>;
}

/**
 * Creates a tenant filter that also excludes soft-deleted documents.
 * Combines tenant scoping with soft delete filtering.
 *
 * @example
 * ```typescript
 * const filter = tenantFilterActive({ role: 'admin' });
 * // Result: { tenantId: 'tenant_123', role: 'admin', $or: [...deletedAt checks] }
 * ```
 */
export function tenantFilterActive<T extends TenantScoped>(
  additionalFilter: Partial<Omit<Filter<T>, 'tenantId'>> = {}
): Filter<T> {
  const tenantId = getTenantId();
  return {
    tenantId,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    ...additionalFilter,
  } as Filter<T>;
}

/**
 * Asserts that a document belongs to the current tenant.
 * Use this to verify ownership before performing operations on a document.
 *
 * @example
 * ```typescript
 * const document = await col('orders').findOne({ _id: orderId });
 * if (document) {
 *   assertTenantOwnership(document); // Throws if not owned by current tenant
 *   // Safe to proceed with operations
 * }
 * ```
 *
 * @param document - The document to check
 * @throws ContextNotInitializedError if not within a context scope
 * @throws TenantContextRequiredError if tenantId is not set in context
 * @throws TenantIsolationError if document belongs to a different tenant
 */
export function assertTenantOwnership<T extends TenantScoped>(document: T): void {
  const currentTenantId = getTenantId();
  if (document.tenantId !== currentTenantId) {
    throw new TenantIsolationError(currentTenantId, document.tenantId);
  }
}

/**
 * Checks if a document belongs to the current tenant without throwing.
 * Returns false if not in a context or if tenant doesn't match.
 *
 * @example
 * ```typescript
 * if (isTenantOwned(document)) {
 *   // Safe to access
 * } else {
 *   // Handle unauthorized access
 * }
 * ```
 */
export function isTenantOwned<T extends TenantScoped>(document: T): boolean {
  const context = ctx.tryGet();
  if (!context?.tenantId) {
    return false;
  }
  return document.tenantId === context.tenantId;
}

/**
 * Adds tenant ID to a document for insertion.
 * Automatically uses the tenant ID from the current context.
 *
 * @example
 * ```typescript
 * const newUser = withTenantId({
 *   name: 'John',
 *   email: 'john@example.com',
 * });
 * // Result: { tenantId: 'tenant_123', name: 'John', email: 'john@example.com' }
 * await col('users').insertOne(newUser);
 * ```
 *
 * @param data - The document data to enhance
 * @returns Document with tenantId added
 * @throws ContextNotInitializedError if not within a context scope
 * @throws TenantContextRequiredError if tenantId is not set in context
 */
export function withTenantId<T extends object>(data: T): T & TenantScoped {
  const tenantId = getTenantId();
  return {
    tenantId,
    ...data,
  };
}

/**
 * Wraps an array of documents, filtering out any that don't belong to the current tenant.
 * Useful for defensive programming when processing results from queries that might
 * have been constructed incorrectly.
 *
 * @example
 * ```typescript
 * const allDocs = await col('users').find({}).toArray();
 * const tenantDocs = filterByTenant(allDocs);
 * // Only documents belonging to current tenant
 * ```
 */
export function filterByTenant<T extends TenantScoped>(documents: T[]): T[] {
  const context = ctx.tryGet();
  if (!context?.tenantId) {
    return [];
  }
  return documents.filter((doc) => doc.tenantId === context.tenantId);
}

// ============================================================================
// EXPLICIT TENANT FILTERS (for auth-time operations before ctx.run())
// ============================================================================

/**
 * Creates a MongoDB filter with explicit tenant ID parameter.
 * Use this for operations that occur BEFORE context is initialized (e.g., auth).
 *
 * @example
 * ```typescript
 * // In auth middleware (before ctx.run())
 * const filter = explicitTenantFilter(tenantId, { userId });
 * const membership = await col('memberships').findOne(filter);
 * ```
 */
export function explicitTenantFilter<T extends TenantScoped>(
  tenantId: string,
  additionalFilter: Partial<Omit<Filter<T>, 'tenantId'>> = {}
): Filter<T> {
  return {
    tenantId,
    ...additionalFilter,
  } as Filter<T>;
}

/**
 * Creates a tenant filter with explicit ID that also excludes soft-deleted documents.
 * Use this for auth-time lookups that need soft-delete filtering.
 *
 * @example
 * ```typescript
 * // In auth middleware
 * const filter = explicitTenantFilterActive(tenantId, { userId });
 * const membership = await col('memberships').findOne(filter);
 * ```
 */
export function explicitTenantFilterActive<T extends TenantScoped>(
  tenantId: string,
  additionalFilter: Partial<Omit<Filter<T>, 'tenantId'>> = {}
): Filter<T> {
  return {
    tenantId,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    ...additionalFilter,
  } as Filter<T>;
}
