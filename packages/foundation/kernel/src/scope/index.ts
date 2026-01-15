/**
 * Scope Module
 *
 * Universal scope system for multi-tenant, multi-user, and multi-merchant applications.
 * This module enables building ANY platform type with the same codebase.
 *
 * ## Core Concepts
 *
 * - **Scope**: A universal isolation boundary (tenant, user, merchant, organization)
 * - **ScopeContext**: Request-scoped context stored in AsyncLocalStorage
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   runWithScope,
 *   getScope,
 *   getScopeId,
 *   withScope,
 *   scopeFilter,
 * } from '@unisane/kernel';
 *
 * // SaaS tenant scope
 * await runWithScope({ type: 'tenant', id: 'team_123' }, async () => {
 *   const scope = getScope();
 *   const newDoc = withScope({ name: 'Example' });
 *   await col('items').insertOne(newDoc);
 * });
 *
 * // E-commerce user scope
 * await runWithScope({ type: 'user', id: 'user_456' }, async () => {
 *   const orders = await col('orders').find(scopeFilter()).toArray();
 * });
 *
 * // Marketplace merchant scope
 * await runWithScope({ type: 'merchant', id: 'merchant_789' }, async () => {
 *   const products = await col('products').find(scopeFilter()).toArray();
 * });
 * ```
 *
 * @module scope
 */

// Types
export type {
  ScopeType,
  Scope,
  ScopeContext,
  CreateScopeContextOptions,
  Scoped,
  WithScopeContext,
  ScopeFilter,
} from './types';

// Context functions
export {
  // Core scope access
  getScope,
  getScopeOrNull,
  getScopeId,
  getScopeType,
  getScopeContext,
  tryGetScopeContext,

  // Running code within scope
  runWithScope,
  runWithScopeContext,
  runWithFullScopeContext,

  // Scope context data
  getScopeUserId,
  getScopeRequestId,
  getScopePlan,
  getScopeFlags,

  // Scope type checking
  isScopeType,
  assertScopeType,

  // Errors
  ScopeNotInitializedError,
  ScopeTypeMismatchError,
  ScopeFieldRequiredError,

  // Loader setters (for bootstrap)
  setScopePlanLoader,
  setScopeFlagsLoader,
} from './context';

// Helper functions
export {
  // Document helpers
  withScope,
  withExplicitScope,

  // Filter helpers
  scopeFilter,
  scopedFilter,
  scopedFilterActive,
  explicitScopeFilter,
  explicitScopeFilterActive,

  // Ownership helpers
  assertScopeOwnership,
  isScopeOwned,
  filterByScope,

  // Errors
  ScopeIsolationError,
} from './helpers';
