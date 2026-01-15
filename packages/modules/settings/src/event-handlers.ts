/**
 * Settings Module Event Handlers
 *
 * This file contains event handlers that allow the settings module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * Usage:
 * ```typescript
 * import { registerSettingsEventHandlers } from '@unisane/settings';
 *
 * // In bootstrap.ts
 * registerSettingsEventHandlers();
 * ```
 */

import { logger, onTyped } from '@unisane/kernel';
import type { BillingEventPayload, SubscriptionStatus } from '@unisane/kernel';
import { patchSetting } from './service/patch';

// Subscription statuses considered "active" for seat capacity updates
// These are a subset of SUBSCRIPTION_STATUS from kernel/constants/billing.ts
const ACTIVE_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = ['active', 'trialing'] as const;

const log = logger.child({ module: 'settings', component: 'event-handlers' });

/**
 * Handle Stripe subscription changes.
 * Updates seat capacity when subscription quantity changes.
 *
 * NOTE: The webhook handler that emits this event should check billing mode
 * before emitting. We don't check billing mode here to avoid circular deps.
 */
async function handleStripeSubscriptionChanged(
  payload: BillingEventPayload<'webhook.stripe.subscription_changed'>
): Promise<void> {
  const { scopeId, quantity, eventType, status } = payload;

  // Only update on active subscriptions with a valid quantity
  if (typeof quantity !== 'number' || quantity <= 0) {
    log.debug('skipping seat capacity update - no valid quantity', { scopeId, quantity });
    return;
  }

  // Only update for active subscriptions
  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus)) {
    log.debug('skipping seat capacity update - subscription not active', { scopeId, status });
    return;
  }

  log.info('processing subscription quantity change', {
    scopeId,
    quantity,
    eventType,
  });

  try {
    await patchSetting({
      scopeId,
      namespace: 'plan',
      key: 'overrides',
      value: { capacities: { seats: quantity } },
    });

    log.info('seat capacity updated via event', {
      scopeId,
      seats: quantity,
    });
  } catch (error) {
    log.error('failed to update seat capacity', {
      scopeId,
      quantity,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - seat capacity update is not critical
  }
}

/**
 * Register all settings event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerSettingsEventHandlers(): () => void {
  log.info('registering settings event handlers');

  const unsubscribers: Array<() => void> = [];

  // Stripe subscription events for seat capacity
  unsubscribers.push(
    onTyped('webhook.stripe.subscription_changed', async (event) => {
      await handleStripeSubscriptionChanged(event.payload);
    })
  );

  log.info('settings event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering settings event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
