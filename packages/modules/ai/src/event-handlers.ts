/**
 * AI Module Event Handlers
 *
 * This file contains event handlers that allow the AI module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The AI module listens for:
 * - Subscription changes (to update AI feature access)
 * - Credit balance changes (to enable/disable AI features)
 * - Flag changes (to enable/disable AI models)
 *
 * Usage:
 * ```typescript
 * import { registerAiEventHandlers } from '@unisane/ai';
 *
 * // In bootstrap.ts
 * registerAiEventHandlers();
 * ```
 */

import { logger, onTyped, cacheDelete } from '@unisane/kernel';

const log = logger.child({ module: 'ai', component: 'event-handlers' });

// Cache key prefix for AI
const AI_CACHE_PREFIX = 'ai:';

/**
 * Handle subscription changes.
 * Updates AI model access based on plan changes.
 */
async function handleSubscriptionUpdated(payload: {
  tenantId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  const { tenantId, planId, previousPlanId } = payload;

  log.info('handling subscription update for AI access', {
    tenantId,
    planId,
    previousPlanId,
  });

  try {
    // Invalidate cached AI configuration for the tenant
    await cacheDelete(`${AI_CACHE_PREFIX}config:${tenantId}`);
    await cacheDelete(`${AI_CACHE_PREFIX}models:${tenantId}`);

    log.info('AI configuration cache invalidated for plan change', {
      tenantId,
      planId,
    });
  } catch (error) {
    log.error('failed to invalidate AI cache for plan change', {
      tenantId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle credit balance changes.
 * Updates AI availability based on credit status.
 */
async function handleCreditsConsumed(payload: {
  tenantId: string;
  amount: number;
  reason: string;
  feature?: string;
  remaining?: number;
}): Promise<void> {
  const { tenantId, remaining, feature } = payload;

  // Only care about AI-related credit consumption
  if (feature && !feature.startsWith('ai.')) {
    return;
  }

  log.debug('handling credit consumption for AI', {
    tenantId,
    remaining,
    feature,
  });

  try {
    // If credits are depleted, we may need to restrict AI access
    if (remaining !== undefined && remaining <= 0) {
      log.info('credits depleted - AI access may be restricted', { tenantId });
      // The actual restriction is handled during AI request processing
      // by checking credit balance before making API calls
    }
  } catch (error) {
    log.error('failed to process credit consumption for AI', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle credits granted.
 * May re-enable AI features when credits are added.
 */
async function handleCreditsGranted(payload: {
  tenantId: string;
  amount: number;
  reason: string;
  source?: 'subscription' | 'topup' | 'promo' | 'manual';
  expiresAt?: string;
}): Promise<void> {
  const { tenantId, amount, source } = payload;

  log.info('handling credits granted for AI', {
    tenantId,
    amount,
    source,
  });

  try {
    // When credits are granted, AI features may become available
    // Invalidate any cached "disabled" status
    await cacheDelete(`${AI_CACHE_PREFIX}disabled:${tenantId}`);

    log.debug('AI availability updated after credits granted', { tenantId });
  } catch (error) {
    log.error('failed to update AI availability after credits granted', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle tenant deletion.
 * Cleans up AI-related data for deleted tenant.
 */
async function handleTenantDeleted(payload: {
  tenantId: string;
  actorId: string;
  cascade: {
    memberships: number;
    files: number;
    settings: number;
    credentials: number;
  };
}): Promise<void> {
  const { tenantId } = payload;

  log.info('handling tenant deletion for AI cleanup', { tenantId });

  try {
    // Clean up cached AI configuration
    await cacheDelete(`${AI_CACHE_PREFIX}config:${tenantId}`);
    await cacheDelete(`${AI_CACHE_PREFIX}models:${tenantId}`);
    await cacheDelete(`${AI_CACHE_PREFIX}disabled:${tenantId}`);

    log.info('AI cleanup completed for deleted tenant', { tenantId });
  } catch (error) {
    log.error('failed to clean up AI data for deleted tenant', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Register all AI event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerAiEventHandlers(): () => void {
  log.info('registering AI event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle subscription updates
  unsubscribers.push(
    onTyped('billing.subscription.updated', async (event) => {
      await handleSubscriptionUpdated(event.payload);
    })
  );

  // Handle credits consumed
  unsubscribers.push(
    onTyped('credits.consumed', async (event) => {
      await handleCreditsConsumed(event.payload);
    })
  );

  // Handle credits granted
  unsubscribers.push(
    onTyped('credits.granted', async (event) => {
      await handleCreditsGranted(event.payload);
    })
  );

  // Handle tenant deletion
  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  log.info('AI event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering AI event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
