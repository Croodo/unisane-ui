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
 * const cached = await cacheGet<TenantRow>(tenantKeys.byId(tenantId));
 * ```
 */
export const tenantKeys = {
  /** Cache key for tenant lookup by ID */
  byId: (tenantId: string) => `tenant:id:${tenantId}` as const,

  /** Cache key for tenant lookup by slug */
  bySlug: (slug: string) => `tenant:slug:${slug}` as const,

  /** Cache key for tenant members list */
  members: (tenantId: string) => `tenant:members:${tenantId}` as const,

  /** Cache key for tenant member count */
  memberCount: (tenantId: string) => `tenant:member_count:${tenantId}` as const,

  /** Cache key for user's tenant memberships */
  userMemberships: (userId: string) => `user:memberships:${userId}` as const,

  /** Cache key for pending invitations for a tenant */
  invitations: (tenantId: string) => `tenant:invitations:${tenantId}` as const,

  /** Cache key for a specific invitation */
  invitation: (invitationId: string) => `invitation:${invitationId}` as const,

  /** Cache key for tenant settings */
  settings: (tenantId: string) => `tenant:settings:${tenantId}` as const,

  /** Cache key for tenant plan info */
  plan: (tenantId: string) => `tenant:plan:${tenantId}` as const,
} as const;

/**
 * Type for cache key functions.
 */
export type TenantKeyBuilder = typeof tenantKeys;
