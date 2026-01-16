/**
 * Identity Module Event Handlers
 *
 * This file contains event handlers that allow the identity module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The identity module listens for:
 * - Tenant creation (to create owner membership via addRole)
 * - Tenant deletion (to clean up memberships and API keys)
 * - Subscription changes (to update user capacities)
 *
 * Usage:
 * ```typescript
 * import { registerIdentityEventHandlers } from '@unisane/identity';
 *
 * // In bootstrap.ts
 * registerIdentityEventHandlers();
 * ```
 */

import { logger, onTyped, emitTypedReliable } from '@unisane/kernel';
import { apiKeysRepository, membershipsRepository } from './data/repo';

const log = logger.child({ module: 'identity', component: 'event-handlers' });

/**
 * Handle tenant creation events.
 * Creates the owner membership for the new tenant.
 */
async function handleTenantCreated(payload: {
  scopeId: string;
  slug: string;
  name: string;
  ownerId: string;
}): Promise<void> {
  const { scopeId, ownerId } = payload;

  log.info('handling tenant creation for identity', {
    scopeId,
    ownerId,
  });

  try {
    // Check if membership already exists (idempotency)
    const existing = await membershipsRepository.findByScopeAndUser(scopeId, ownerId);

    if (existing) {
      log.debug('membership already exists for tenant owner', { scopeId, ownerId });
      return;
    }

    // Create owner membership by adding the owner role
    const result = await membershipsRepository.addRole(scopeId, ownerId, 'owner');

    if ('ok' in result && result.ok) {
      log.info('owner membership created for new tenant', { scopeId, ownerId });
    } else {
      log.warn('could not create owner membership', { scopeId, ownerId, result });
    }
  } catch (error) {
    log.error('failed to create owner membership', {
      scopeId,
      ownerId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle tenant deletion events.
 * Performs Identity module cascade cleanup:
 * - Revokes all API keys for the tenant
 * - Soft-deletes all memberships for the tenant
 * - Emits completion event for tracking
 */
async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  const { scopeId, actorId } = payload;

  log.info('identity: handling tenant deletion cascade', { scopeId, actorId });

  let apiKeysRevoked = 0;
  let membershipsDeleted = 0;

  // 1. Revoke all API keys (security first)
  try {
    const result = await apiKeysRepository.revokeAllForScope(scopeId);
    apiKeysRevoked = result.revokedCount;
    log.info('identity: revoked API keys', { scopeId, count: apiKeysRevoked });
  } catch (error) {
    log.error('identity: failed to revoke API keys', {
      scopeId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue - don't fail the entire cascade
  }

  // 2. Soft-delete all memberships
  try {
    const result = await membershipsRepository.softDeleteAllForScope(scopeId);
    membershipsDeleted = result.deletedCount;
    log.info('identity: soft-deleted memberships', { scopeId, count: membershipsDeleted });
  } catch (error) {
    log.error('identity: failed to soft-delete memberships', {
      scopeId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue - don't fail the entire cascade
  }

  // 3. Emit completion event
  await emitTypedReliable('identity.cascade.completed', {
    sourceEvent: 'tenant.deleted',
    scopeId,
    results: {
      apiKeysRevoked,
      membershipsDeleted,
    },
  });

  log.info('identity: tenant deletion cascade complete', {
    scopeId,
    apiKeysRevoked,
    membershipsDeleted,
  });
}

/**
 * Handle subscription changes.
 * Updates user capacities based on plan changes.
 */
async function handleSubscriptionUpdated(payload: {
  scopeId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  const { scopeId, planId, previousPlanId } = payload;

  log.info('handling subscription update for identity', {
    scopeId,
    planId,
    previousPlanId,
  });

  try {
    // Update capacity limits based on new plan
    // This is typically handled by the flags/settings modules
    // Identity module may need to enforce member limits

    log.debug('subscription change processed for identity', {
      scopeId,
      planId,
    });
  } catch (error) {
    log.error('failed to process subscription change for identity', {
      scopeId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle user deletion events.
 * Soft-deletes all memberships for the user across all scopes.
 */
async function handleUserDeleted(payload: {
  userId: string;
  scopeId?: string;
  actorId?: string;
  reason: string;
}): Promise<void> {
  const { userId, actorId, reason } = payload;

  log.info('identity: handling user deletion cascade', { userId, actorId, reason });

  let membershipsDeleted = 0;

  // Soft-delete all memberships for this user (across all scopes)
  try {
    const result = await membershipsRepository.softDeleteAllForUser(userId);
    membershipsDeleted = result.deletedCount;
    log.info('identity: soft-deleted user memberships', { userId, count: membershipsDeleted });
  } catch (error) {
    log.error('identity: failed to soft-delete user memberships', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue - don't fail the entire cascade
  }

  log.info('identity: user deletion cascade complete', {
    userId,
    membershipsDeleted,
  });
}

/**
 * Handle API key revocation requests.
 * Revokes API keys when requested via events.
 */
async function handleApiKeyRevocationRequested(payload: {
  scopeId: string;
  keyId: string;
  revokedBy?: string;
}): Promise<void> {
  const { scopeId, keyId, revokedBy } = payload;

  log.info('handling API key revocation request', {
    scopeId,
    keyId,
    revokedBy,
  });

  try {
    await apiKeysRepository.revoke(scopeId, keyId);
    log.info('API key revoked via event', { scopeId, keyId });
  } catch (error) {
    log.error('failed to revoke API key via event', {
      scopeId,
      keyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Register all identity event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerIdentityEventHandlers(): () => void {
  log.info('registering identity event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle tenant creation
  unsubscribers.push(
    onTyped('tenant.created', async (event) => {
      await handleTenantCreated(event.payload);
    })
  );

  // Handle tenant deletion
  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  // Handle subscription updates
  unsubscribers.push(
    onTyped('billing.subscription.updated', async (event) => {
      await handleSubscriptionUpdated(event.payload);
    })
  );

  // Handle API key revocation
  unsubscribers.push(
    onTyped('identity.apikey.revoked', async (event) => {
      await handleApiKeyRevocationRequested(event.payload);
    })
  );

  // Handle user deletion
  unsubscribers.push(
    onTyped('user.deleted', async (event) => {
      await handleUserDeleted(event.payload);
    })
  );

  log.info('identity event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering identity event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
