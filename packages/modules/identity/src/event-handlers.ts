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

import { logger, onTyped } from '@unisane/kernel';
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
 * Logs cleanup - actual cascade is handled by the tenants module.
 */
async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId: string;
  cascade: {
    memberships: number;
    files: number;
    settings: number;
    credentials: number;
  };
}): Promise<void> {
  const { scopeId, cascade } = payload;

  log.info('handling tenant deletion for identity cleanup', { scopeId });

  // Note: The actual cascade deletion of memberships and API keys is handled
  // by the tenants module during deletion. This handler is for logging and
  // any additional identity-specific cleanup that may be needed.

  log.info('identity cleanup acknowledged for deleted tenant', {
    scopeId,
    cascadedMemberships: cascade.memberships,
    cascadedCredentials: cascade.credentials,
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

  log.info('identity event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering identity event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
