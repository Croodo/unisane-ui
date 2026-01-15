/**
 * Scope Types
 *
 * Universal scope system that supports ANY platform type:
 * - SaaS: tenant-scoped (teams, workspaces)
 * - E-commerce: user-scoped (individual customers)
 * - Marketplace: merchant-scoped (sellers, stores)
 * - Enterprise: organization-scoped (companies, departments)
 *
 * This replaces the hard-coded tenantId pattern to enable building
 * any platform type with the same codebase.
 */

/**
 * Supported scope types.
 * Each type represents a different isolation boundary:
 *
 * - `tenant`: Traditional SaaS multi-tenancy (teams, workspaces)
 * - `user`: Individual user isolation (e-commerce, consumer apps)
 * - `merchant`: Seller/store isolation (marketplaces)
 * - `organization`: Enterprise organization hierarchy
 */
export type ScopeType = 'tenant' | 'user' | 'merchant' | 'organization';

/**
 * Universal scope that identifies the isolation boundary for data and operations.
 *
 * @example
 * ```typescript
 * // SaaS tenant
 * const scope: Scope = { type: 'tenant', id: 'team_abc123' };
 *
 * // E-commerce user
 * const scope: Scope = { type: 'user', id: 'user_xyz789' };
 *
 * // Marketplace merchant
 * const scope: Scope = { type: 'merchant', id: 'shop_def456' };
 * ```
 */
export interface Scope {
  /** The type of scope (tenant, user, merchant, organization) */
  type: ScopeType;

  /** The unique identifier for this scope */
  id: string;

  /**
   * Optional parent scope for hierarchical relationships.
   * For example, a user scope within a tenant scope.
   */
  parentScope?: Scope;

  /** Optional metadata associated with the scope */
  metadata?: Record<string, unknown>;
}

/**
 * Full scope context including request-scoped data.
 * This is what gets stored in AsyncLocalStorage.
 */
export interface ScopeContext {
  /** The current scope */
  scope: Scope;

  /** Unique request identifier for tracing/logging */
  requestId: string;

  /** User ID of the authenticated user (if any) */
  userId?: string;

  /** Request start time for duration tracking */
  startTime: number;

  /** Cached plan for the current scope (lazy-loaded) */
  plan?: string;

  /** Cached feature flags for the current scope (lazy-loaded) */
  flags?: Record<string, boolean>;

  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options for creating a new scope context.
 */
export interface CreateScopeContextOptions {
  /** The scope to use */
  scope: Scope;

  /** Optional request ID (auto-generated if not provided) */
  requestId?: string;

  /** Optional user ID */
  userId?: string;

  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for documents that have scope isolation.
 * All scoped documents must include scopeType and scopeId.
 */
export interface Scoped {
  /** The type of scope for this document */
  scopeType: ScopeType;

  /** The scope identifier */
  scopeId: string;
}

/**
 * Helper type for functions that require a scope context.
 */
export type WithScopeContext<T> = T & { __scopeContextRequired: true };

/**
 * Scope filter type for database queries.
 */
export interface ScopeFilter {
  scopeType: ScopeType;
  scopeId: string;
}
