/**
 * Flags Module Event Handlers
 *
 * This file contains event handlers that allow the flags module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The flags module listens for:
 * - Subscription changes (to update plan-based feature flags)
 * - Tenant creation (to set default flags)
 * - Settings changes (to sync flag configurations)
 *
 * Usage:
 * ```typescript
 * import { registerFlagsEventHandlers } from '@unisane/flags';
 *
 * // In bootstrap.ts
 * registerFlagsEventHandlers();
 * ```
 */

import { logger, onTyped, cacheDelete } from '@unisane/kernel';

const log = logger.child({ module: 'flags', component: 'event-handlers' });

// Cache key prefix for flags
const FLAGS_CACHE_PREFIX = 'flags:';

/**
 * Handle subscription changes.
 * Updates plan-based feature flags when subscription changes.
 */
async function handleSubscriptionUpdated(payload: {
  scopeId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  const { scopeId, planId, previousPlanId } = payload;

  log.info('handling subscription update for flags', {
    scopeId,
    planId,
    previousPlanId,
  });

  try {
    // Invalidate cached flags for the tenant since plan changed
    await cacheDelete(`${FLAGS_CACHE_PREFIX}tenant:${scopeId}`);

    log.info('flags cache invalidated for plan change', {
      scopeId,
      planId,
      previousPlanId,
    });
  } catch (error) {
    log.error('failed to invalidate flags cache for plan change', {
      scopeId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - cache invalidation failures shouldn't block subscription updates
  }
}

/**
 * Handle tenant creation.
 * Sets up default flags for new tenants.
 */
async function handleTenantCreated(payload: {
  scopeId: string;
  slug: string;
  name: string;
  ownerId: string;
}): Promise<void> {
  const { scopeId } = payload;

  log.info('handling tenant creation for flags setup', { scopeId });

  try {
    // New tenants start with default flags from their plan
    // No explicit setup needed - flags are evaluated on-demand
    log.debug('flags ready for new tenant', { scopeId });
  } catch (error) {
    log.error('failed to setup flags for new tenant', {
      scopeId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle tenant deletion.
 * Cleans up flag overrides for deleted tenant.
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
  const { scopeId } = payload;

  log.info('handling tenant deletion for flags cleanup', { scopeId });

  try {
    // Invalidate cached flags
    await cacheDelete(`${FLAGS_CACHE_PREFIX}tenant:${scopeId}`);

    // Flag overrides are stored in the database and will be cleaned up
    // by the normal tenant cascade deletion

    log.info('flags cleanup completed for deleted tenant', { scopeId });
  } catch (error) {
    log.error('failed to clean up flags for deleted tenant', {
      scopeId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle settings changes.
 * Invalidates flag cache when relevant settings change.
 */
async function handleSettingsUpdated(payload: {
  scopeId: string;
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  const { scopeId, key } = payload;

  // Only care about flag-related settings
  if (!key.startsWith('flags.') && !key.startsWith('features.')) {
    return;
  }

  log.info('handling settings update for flags', { scopeId, key });

  try {
    // Invalidate cached flags since settings changed
    await cacheDelete(`${FLAGS_CACHE_PREFIX}tenant:${scopeId}`);

    log.debug('flags cache invalidated for settings change', { scopeId, key });
  } catch (error) {
    log.error('failed to invalidate flags cache for settings change', {
      scopeId,
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Register all flags event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerFlagsEventHandlers(): () => void {
  log.info('registering flags event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle subscription updates
  unsubscribers.push(
    onTyped('billing.subscription.updated', async (event) => {
      await handleSubscriptionUpdated(event.payload);
    })
  );

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

  // Handle settings updates
  unsubscribers.push(
    onTyped('settings.updated', async (event) => {
      await handleSettingsUpdated(event.payload);
    })
  );

  log.info('flags event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering flags event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
