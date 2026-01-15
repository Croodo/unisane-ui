/**
 * Identity Cache Keys
 *
 * Centralized cache key builders for consistent key naming.
 */

/**
 * Cache key builders for the identity module.
 *
 * @example
 * ```typescript
 * import { identityKeys } from '@unisane/identity';
 *
 * const cached = await cacheGet(identityKeys.userById(userId));
 * ```
 */
export const identityKeys = {
  // ════════════════════════════════════════════════════════════════════════════
  // User Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for user lookup by ID */
  userById: (userId: string) => `user:id:${userId}` as const,

  /** Cache key for user lookup by email */
  userByEmail: (email: string) => `user:email:${email.toLowerCase()}` as const,

  /** Cache key for user lookup by username */
  userByUsername: (username: string) => `user:username:${username.toLowerCase()}` as const,

  /** Cache key for user lookup by phone */
  userByPhone: (phone: string) => `user:phone:${phone}` as const,

  /** Cache key for user's profile (includes extended info) */
  userProfile: (userId: string) => `user:profile:${userId}` as const,

  // ════════════════════════════════════════════════════════════════════════════
  // Membership Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for user's memberships across all tenants */
  userMemberships: (userId: string) => `user:memberships:${userId}` as const,

  /** Cache key for specific membership */
  membership: (scopeId: string, userId: string) =>
    `membership:${scopeId}:${userId}` as const,

  /** Cache key for scope's member list */
  scopeMembers: (scopeId: string) => `scope:members:${scopeId}` as const,

  /** Cache key for scope's member count */
  scopeMemberCount: (scopeId: string) => `scope:member_count:${scopeId}` as const,

  // ════════════════════════════════════════════════════════════════════════════
  // API Key Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for API key lookup by key hash */
  apiKeyByHash: (keyHash: string) => `api_key:hash:${keyHash}` as const,

  /** Cache key for API key lookup by ID */
  apiKeyById: (keyId: string) => `api_key:id:${keyId}` as const,

  /** Cache key for user's API keys in a scope */
  userApiKeys: (scopeId: string, userId: string) =>
    `api_keys:${scopeId}:${userId}` as const,

  // ════════════════════════════════════════════════════════════════════════════
  // Session Keys
  // ════════════════════════════════════════════════════════════════════════════

  /** Cache key for session by ID */
  sessionById: (sessionId: string) => `session:${sessionId}` as const,

  /** Cache key for user's active sessions */
  userSessions: (userId: string) => `user:sessions:${userId}` as const,
} as const;

/**
 * Type for cache key functions.
 */
export type IdentityKeyBuilder = typeof identityKeys;
