/**
 * Cache Invalidation Event Handlers
 *
 * Subscribes to domain events and invalidates relevant caches.
 * This provides automatic cache coherence when data changes.
 *
 * @example
 * ```typescript
 * // In bootstrap.ts or init.ts
 * import { initCacheInvalidation } from './platform/cache-invalidation';
 * initCacheInvalidation();
 * ```
 */

import { events, cacheDelete, logger } from '@unisane/kernel';
import { CREDITS_EVENTS } from '@unisane/credits';
import { IDENTITY_EVENTS, identityKeys } from '@unisane/identity';

let initialized = false;

/**
 * Initialize cache invalidation event handlers.
 * Safe to call multiple times - only registers handlers once.
 */
export function initCacheInvalidation(): void {
  if (initialized) return;
  initialized = true;

  // ─── CREDITS EVENTS ──────────────────────────────────────────────────────────
  // Note: Balance cache is already invalidated in grant.ts and consume.ts
  // These handlers are for additional cross-cutting cache invalidation

  events.on(CREDITS_EVENTS.GRANTED, async (event) => {
    const { tenantId } = event.payload as { tenantId: string };
    logger.debug('cache-invalidation: credits.granted', { tenantId });
    // Balance cache is already invalidated in the grant function
    // Add any additional cache keys here if needed
  });

  events.on(CREDITS_EVENTS.CONSUMED, async (event) => {
    const { tenantId } = event.payload as { tenantId: string };
    logger.debug('cache-invalidation: credits.consumed', { tenantId });
    // Balance cache is already invalidated in the consume function
    // Add any additional cache keys here if needed
  });

  // ─── IDENTITY EVENTS ─────────────────────────────────────────────────────────

  events.on(IDENTITY_EVENTS.USER_UPDATED, async (event) => {
    const { userId, email, username, phone } = event.payload as {
      userId: string;
      email?: string;
      username?: string | null;
      phone?: string | null;
    };

    logger.debug('cache-invalidation: identity.user.updated', { userId });

    // Invalidate user caches
    await Promise.all([
      cacheDelete(identityKeys.userById(userId)),
      cacheDelete(identityKeys.userProfile(userId)),
      email ? cacheDelete(identityKeys.userByEmail(email)) : Promise.resolve(),
      username ? cacheDelete(identityKeys.userByUsername(username)) : Promise.resolve(),
      phone ? cacheDelete(identityKeys.userByPhone(phone)) : Promise.resolve(),
    ]);
  });

  events.on(IDENTITY_EVENTS.USER_DELETED, async (event) => {
    const { userId } = event.payload as { userId: string };

    logger.debug('cache-invalidation: identity.user.deleted', { userId });

    // Invalidate all user-related caches
    await Promise.all([
      cacheDelete(identityKeys.userById(userId)),
      cacheDelete(identityKeys.userProfile(userId)),
      cacheDelete(identityKeys.userMemberships(userId)),
      cacheDelete(identityKeys.userSessions(userId)),
    ]);
  });

  events.on(IDENTITY_EVENTS.API_KEY_CREATED, async (event) => {
    const { tenantId, userId, keyId } = event.payload as {
      tenantId: string;
      userId: string;
      keyId: string;
    };

    logger.debug('cache-invalidation: identity.api_key.created', { tenantId, userId, keyId });

    // Invalidate API key list cache
    await cacheDelete(identityKeys.userApiKeys(tenantId, userId));
  });

  events.on(IDENTITY_EVENTS.API_KEY_REVOKED, async (event) => {
    const { tenantId, userId, keyId, keyHash } = event.payload as {
      tenantId: string;
      userId: string;
      keyId: string;
      keyHash?: string;
    };

    logger.debug('cache-invalidation: identity.api_key.revoked', { tenantId, userId, keyId });

    // Invalidate API key caches
    await Promise.all([
      cacheDelete(identityKeys.userApiKeys(tenantId, userId)),
      cacheDelete(identityKeys.apiKeyById(keyId)),
      keyHash ? cacheDelete(identityKeys.apiKeyByHash(keyHash)) : Promise.resolve(),
    ]);
  });

  events.on(IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED, async (event) => {
    const { tenantId, userId } = event.payload as {
      tenantId: string;
      userId: string;
    };

    logger.debug('cache-invalidation: identity.membership.role_changed', { tenantId, userId });

    // Invalidate membership caches
    await Promise.all([
      cacheDelete(identityKeys.membership(tenantId, userId)),
      cacheDelete(identityKeys.userMemberships(userId)),
      cacheDelete(identityKeys.tenantMembers(tenantId)),
      cacheDelete(identityKeys.tenantMemberCount(tenantId)),
    ]);
  });

  logger.info('cache-invalidation: Event handlers registered');
}

/**
 * Manually invalidate user cache (for use in edge cases).
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    cacheDelete(identityKeys.userById(userId)),
    cacheDelete(identityKeys.userProfile(userId)),
    cacheDelete(identityKeys.userMemberships(userId)),
  ]);
  logger.debug('cache-invalidation: user cache manually invalidated', { userId });
}

/**
 * Manually invalidate tenant member cache (for use in edge cases).
 */
export async function invalidateTenantMemberCache(tenantId: string): Promise<void> {
  await Promise.all([
    cacheDelete(identityKeys.tenantMembers(tenantId)),
    cacheDelete(identityKeys.tenantMemberCount(tenantId)),
  ]);
  logger.debug('cache-invalidation: tenant member cache manually invalidated', { tenantId });
}
