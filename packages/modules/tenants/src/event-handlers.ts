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

import { logger, onTyped, emitTypedReliable, invalidateEntitlements, reverseMapPlanIdFromProvider } from '@unisane/kernel';
import type { BillingEventPayload } from '@unisane/kernel';
import { TenantsRepo } from './data/tenants.repository';

const log = logger.child({ module: 'tenants', component: 'event-handlers' });

/**
 * Handle Stripe subscription changes.
 * Updates tenant plan when subscription changes and emits plan.changed event.
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
      // Get current tenant to determine previous plan
      const currentTenant = await TenantsRepo.findById(scopeId);
      const previousPlan = currentTenant?.planId ?? 'free';

      await TenantsRepo.updatePlanId(scopeId, friendlyPlanId);

      // Invalidate entitlements cache so next request gets fresh data
      await invalidateEntitlements(scopeId).catch((err) => {
        log.warn('failed to invalidate entitlements', { scopeId, error: err?.message });
      });

      // Emit plan.changed event for other modules to react
      if (previousPlan !== friendlyPlanId) {
        const changeType = determinePlanChangeType(previousPlan, friendlyPlanId);
        await emitTypedReliable('plan.changed', {
          scopeId,
          previousPlan,
          newPlan: friendlyPlanId,
          changeType,
          effectiveAt: new Date().toISOString(),
        });

        log.info('plan.changed event emitted', {
          scopeId,
          previousPlan,
          newPlan: friendlyPlanId,
          changeType,
        });
      }

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
 * Determine if a plan change is an upgrade, downgrade, or lateral move.
 * Simple heuristic based on plan naming convention.
 */
function determinePlanChangeType(
  previousPlan: string,
  newPlan: string
): 'upgrade' | 'downgrade' | 'lateral' {
  const planOrder = ['free', 'starter', 'pro', 'business', 'enterprise'];
  const prevIndex = planOrder.indexOf(previousPlan.toLowerCase());
  const newIndex = planOrder.indexOf(newPlan.toLowerCase());

  if (prevIndex === -1 || newIndex === -1) {
    // Unknown plans - default to lateral
    return 'lateral';
  }

  if (newIndex > prevIndex) return 'upgrade';
  if (newIndex < prevIndex) return 'downgrade';
  return 'lateral';
}

/**
 * Handle Razorpay subscription changes.
 * Updates tenant plan when subscription changes and emits plan.changed event.
 */
async function handleRazorpaySubscriptionChanged(
  payload: BillingEventPayload<'webhook.razorpay.subscription_changed'>
): Promise<void> {
  const { scopeId, planId, rawStatus, normalizedStatus, eventType } = payload;

  log.info('processing razorpay subscription change', {
    scopeId,
    planId,
    rawStatus,
    normalizedStatus,
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
      // Get current tenant to determine previous plan
      const currentTenant = await TenantsRepo.findById(scopeId);
      const previousPlan = currentTenant?.planId ?? 'free';

      await TenantsRepo.updatePlanId(scopeId, friendlyPlanId);

      // Invalidate entitlements cache
      await invalidateEntitlements(scopeId).catch((err) => {
        log.warn('failed to invalidate entitlements', { scopeId, error: err?.message });
      });

      // Emit plan.changed event for other modules to react
      if (previousPlan !== friendlyPlanId) {
        const changeType = determinePlanChangeType(previousPlan, friendlyPlanId);
        await emitTypedReliable('plan.changed', {
          scopeId,
          previousPlan,
          newPlan: friendlyPlanId,
          changeType,
          effectiveAt: new Date().toISOString(),
        });

        log.info('plan.changed event emitted', {
          scopeId,
          previousPlan,
          newPlan: friendlyPlanId,
          changeType,
        });
      }

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
 * Handle subscription cancellation.
 * Downgrades tenant to free plan and emits plan.changed event.
 */
async function handleSubscriptionCancelled(payload: {
  scopeId: string;
  atPeriodEnd: boolean;
}): Promise<void> {
  const { scopeId, atPeriodEnd } = payload;

  log.info('tenants: handling subscription cancellation', { scopeId, atPeriodEnd });

  // If cancelled at period end, the downgrade will happen when the period ends
  // via a separate webhook event. For immediate cancellation, downgrade now.
  if (!atPeriodEnd) {
    try {
      // Get current plan before downgrade
      const currentTenant = await TenantsRepo.findById(scopeId);
      const previousPlan = currentTenant?.planId ?? 'free';

      await TenantsRepo.updatePlanId(scopeId, 'free');

      // Invalidate entitlements cache
      await invalidateEntitlements(scopeId).catch((err) => {
        log.warn('failed to invalidate entitlements', { scopeId, error: err?.message });
      });

      // Emit plan.changed event for other modules to react
      if (previousPlan !== 'free') {
        await emitTypedReliable('plan.changed', {
          scopeId,
          previousPlan,
          newPlan: 'free',
          changeType: 'downgrade' as const,
          effectiveAt: new Date().toISOString(),
        });

        log.info('plan.changed event emitted after cancellation', {
          scopeId,
          previousPlan,
          newPlan: 'free',
        });
      }

      log.info('tenants: downgraded to free plan after subscription cancellation', { scopeId });
    } catch (error) {
      log.error('tenants: failed to downgrade plan after subscription cancellation', {
        scopeId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - plan update failure shouldn't block other cascade handlers
    }
  } else {
    log.info('tenants: subscription will end at period end, no immediate downgrade', { scopeId });
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

  // Subscription cancellation (from billing module)
  unsubscribers.push(
    onTyped('billing.subscription.cancelled', async (event) => {
      await handleSubscriptionCancelled(event.payload);
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
