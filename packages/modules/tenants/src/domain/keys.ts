/**
 * Tenant Cache Keys
 *
 * Centralized cache key builders for consistent key naming.
 * Using a builder pattern prevents typos and ensures consistency.
 */

/**
 * Cache key builders for the tenants module.
 *
 * @example
 * ```typescript
 * import { tenantKeys } from '@unisane/tenants';
 *
 * // Get cache key for a tenant by ID
 * const key = tenantKeys.byId('tenant_123');
 * // Result: 'tenant:id:tenant_123'
 *
 * // Use with cacheGet/cacheSet
 * const cached = await cacheGet<TenantRow>(tenantKeys.byId(scopeId));
 * ```
 */
export const tenantKeys = {
  /** Cache key for tenant lookup by ID */
  byId: (scopeId: string) => `tenant:id:${scopeId}` as const,

  /** Cache key for tenant lookup by slug */
  bySlug: (slug: string) => `tenant:slug:${slug}` as const,

  /** Cache key for tenant members list */
  members: (scopeId: string) => `tenant:members:${scopeId}` as const,

  /** Cache key for tenant member count */
  memberCount: (scopeId: string) => `tenant:member_count:${scopeId}` as const,

  /** Cache key for user's tenant memberships */
  userMemberships: (userId: string) => `user:memberships:${userId}` as const,

  /** Cache key for pending invitations for a tenant */
  invitations: (scopeId: string) => `tenant:invitations:${scopeId}` as const,

  /** Cache key for a specific invitation */
  invitation: (invitationId: string) => `invitation:${invitationId}` as const,

  /** Cache key for tenant settings */
  settings: (scopeId: string) => `tenant:settings:${scopeId}` as const,

  /** Cache key for tenant plan info */
  plan: (scopeId: string) => `tenant:plan:${scopeId}` as const,
} as const;

/**
 * Type for cache key functions.
 */
export type TenantKeyBuilder = typeof tenantKeys;
