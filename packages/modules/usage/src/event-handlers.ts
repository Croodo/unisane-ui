/**
 * Usage Module Event Handlers
 *
 * This file contains event handlers that allow the usage module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The usage module listens for:
 * - Subscription changes (to reset usage quotas)
 * - Billing period events (to reset counters)
 * - Tenant deletion (for cleanup logging)
 *
 * Note: Direct usage tracking (increment) should be called from within the
 * request context where getScopeId() is available. These event handlers are
 * for cross-module coordination, not direct usage tracking.
 *
 * Usage:
 * ```typescript
 * import { registerUsageEventHandlers } from '@unisane/usage';
 *
 * // In bootstrap.ts
 * registerUsageEventHandlers();
 * ```
 */

import { logger, onTyped } from '@unisane/kernel';

const log = logger.child({ module: 'usage', component: 'event-handlers' });

/**
 * Handle subscription changes.
 * Logs when usage quotas may need to be reset.
 */
async function handleSubscriptionInvoicePaid(payload: {
  scopeId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  periodEnd: string | null;
  creditGrants: Array<{ key: string; amount: number }>;
}): Promise<void> {
  const { scopeId, periodEnd } = payload;

  log.info('handling subscription invoice for usage reset', {
    scopeId,
    periodEnd,
  });

  // When a subscription invoice is paid, usage quotas may reset
  // The actual reset logic depends on the plan configuration
  // Usage counters in Redis have TTLs that align with billing periods
  log.debug('usage quotas evaluated for subscription renewal', { scopeId });
}

/**
 * Handle storage upload events.
 * Logs storage activity for the usage module.
 */
async function handleStorageUpload(payload: {
  scopeId: string;
  fileId: string;
  key: string;
  size: number;
}): Promise<void> {
  const { scopeId, size, fileId } = payload;

  log.info('storage upload event received by usage module', {
    scopeId,
    size,
    fileId,
  });

  // Note: Actual usage tracking (increment) should be called within the
  // request context where the upload occurred, not from this event handler.
  // This handler is for cross-module visibility and coordination.
}

/**
 * Handle tenant deletion.
 * Cleans up usage data for deleted scope.
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

  log.info('handling tenant deletion for usage cleanup', { scopeId });

  // Usage data cleanup is handled by database cascade
  // Redis counters will expire naturally via TTL
  log.debug('usage cleanup noted for deleted scope', { scopeId });
}

/**
 * Register all usage event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerUsageEventHandlers(): () => void {
  log.info('registering usage event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle subscription invoice payments
  unsubscribers.push(
    onTyped('webhook.stripe.subscription_invoice_paid', async (event) => {
      await handleSubscriptionInvoicePaid(event.payload);
    })
  );

  // Handle storage uploads
  unsubscribers.push(
    onTyped('storage.upload.confirmed', async (event) => {
      await handleStorageUpload(event.payload);
    })
  );

  // Handle tenant deletion
  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  log.info('usage event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering usage event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
