/**
 * Tenants Module Event Handlers
 *
 * This file contains event handlers that allow the tenants module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * Usage:
 * ```typescript
 * import { registerTenantEventHandlers } from '@unisane/tenants';
 *
 * // In bootstrap.ts
 * registerTenantEventHandlers();
 * ```
 */

import { logger, onTyped, invalidateEntitlements, reverseMapPlanIdFromProvider } from '@unisane/kernel';
import type { BillingEventPayload } from '@unisane/kernel';
import { TenantsRepo } from './data/tenants.repository';

const log = logger.child({ module: 'tenants', component: 'event-handlers' });

/**
 * Handle Stripe subscription changes.
 * Updates tenant plan when subscription changes.
 */
async function handleStripeSubscriptionChanged(
  payload: BillingEventPayload<'webhook.stripe.subscription_changed'>
): Promise<void> {
  const { scopeId, priceId, status, eventType } = payload;

  log.info('processing stripe subscription change', {
    scopeId,
    priceId,
    status,
    eventType,
  });

  // Only update plan on certain event types
  if (!priceId || (eventType !== 'created' && eventType !== 'updated')) {
    log.debug('skipping plan update for event type', { eventType, priceId });
    return;
  }

  try {
    // Map the Stripe price ID to our internal plan ID
    const friendlyPlanId = reverseMapPlanIdFromProvider('stripe', priceId);

    if (friendlyPlanId && typeof friendlyPlanId === 'string') {
      await TenantsRepo.setPlanId(scopeId, friendlyPlanId);

      // Invalidate entitlements cache so next request gets fresh data
      await invalidateEntitlements(scopeId).catch((err) => {
        log.warn('failed to invalidate entitlements', { scopeId, error: err?.message });
      });

      log.info('tenant plan updated via event', {
        scopeId,
        priceId,
        friendlyPlanId,
      });
    } else {
      log.warn('could not map price ID to plan', { scopeId, priceId });
    }
  } catch (error) {
    log.error('failed to update tenant plan', {
      scopeId,
      priceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle Razorpay subscription changes.
 * Updates tenant plan when subscription changes.
 */
async function handleRazorpaySubscriptionChanged(
  payload: BillingEventPayload<'webhook.razorpay.subscription_changed'>
): Promise<void> {
  const { scopeId, planId, status, eventType } = payload;

  log.info('processing razorpay subscription change', {
    scopeId,
    planId,
    status,
    eventType,
  });

  // Only update plan on activation
  if (!planId || eventType !== 'activated') {
    log.debug('skipping plan update for event type', { eventType, planId });
    return;
  }

  try {
    // Map the Razorpay plan ID to our internal plan ID
    const friendlyPlanId = reverseMapPlanIdFromProvider('razorpay', planId);

    if (friendlyPlanId && typeof friendlyPlanId === 'string') {
      await TenantsRepo.setPlanId(scopeId, friendlyPlanId);

      // Invalidate entitlements cache
      await invalidateEntitlements(scopeId).catch((err) => {
        log.warn('failed to invalidate entitlements', { scopeId, error: err?.message });
      });

      log.info('tenant plan updated via event', {
        scopeId,
        planId,
        friendlyPlanId,
      });
    } else {
      log.warn('could not map plan ID', { scopeId, planId });
    }
  } catch (error) {
    log.error('failed to update tenant plan', {
      scopeId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Register all tenant event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerTenantEventHandlers(): () => void {
  log.info('registering tenant event handlers');

  const unsubscribers: Array<() => void> = [];

  // Stripe subscription events
  unsubscribers.push(
    onTyped('webhook.stripe.subscription_changed', async (event) => {
      await handleStripeSubscriptionChanged(event.payload);
    })
  );

  // Razorpay subscription events
  unsubscribers.push(
    onTyped('webhook.razorpay.subscription_changed', async (event) => {
      await handleRazorpaySubscriptionChanged(event.payload);
    })
  );

  log.info('tenant event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering tenant event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
