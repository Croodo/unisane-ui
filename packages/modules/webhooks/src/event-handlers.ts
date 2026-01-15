/**
 * Webhooks Module Event Handlers
 *
 * This file contains event handlers that allow the webhooks module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The webhooks module listens for:
 * - Domain events (to log webhook activity)
 * - Tenant/subscription/payment events for audit purposes
 *
 * Usage:
 * ```typescript
 * import { registerWebhooksEventHandlers } from '@unisane/webhooks';
 *
 * // In bootstrap.ts
 * registerWebhooksEventHandlers();
 * ```
 */

import { logger, onTyped } from "@unisane/kernel";

const log = logger.child({ module: "webhooks", component: "event-handlers" });

/**
 * Handle tenant deletion events.
 * Logs the event for webhook processing.
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
  const { scopeId, actorId } = payload;

  log.info("handling tenant deletion for webhook module", {
    scopeId,
    actorId,
  });

  // Webhook deliveries for tenant deletion are handled by the outbound webhook system
  // which is configured per-tenant. This handler just logs the event for debugging.
  log.debug("tenant deletion event received by webhooks module", { scopeId });
}

/**
 * Handle subscription changes for webhook logging.
 */
async function handleSubscriptionChanged(payload: {
  scopeId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  const { scopeId, planId, previousPlanId } = payload;

  log.info("handling subscription change for webhook module", {
    scopeId,
    planId,
    previousPlanId,
  });

  // Log subscription changes for debugging/audit purposes
  log.debug("subscription change event received by webhooks module", {
    scopeId,
    planId,
  });
}

/**
 * Handle payment success events for webhook logging.
 */
async function handlePaymentSucceeded(payload: {
  scopeId: string;
  amount: number;
  currency: string;
  invoiceId?: string;
}): Promise<void> {
  const { scopeId, amount, currency, invoiceId } = payload;

  log.info("handling payment success for webhook module", {
    scopeId,
    amount,
    currency,
  });

  // Log payment events for debugging/audit purposes
  log.debug("payment success event received by webhooks module", {
    scopeId,
    invoiceId,
  });
}

/**
 * Handle file upload events for webhook logging.
 */
async function handleFileUploaded(payload: {
  scopeId: string;
  fileId: string;
  key: string;
  size: number;
}): Promise<void> {
  const { scopeId, fileId } = payload;

  log.info("handling file upload for webhook module", {
    scopeId,
    fileId,
  });

  // Log file upload events for debugging/audit purposes
  log.debug("file upload event received by webhooks module", {
    scopeId,
    fileId,
  });
}

/**
 * Register all webhooks event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerWebhooksEventHandlers(): () => void {
  log.info("registering webhooks event handlers");

  const unsubscribers: Array<() => void> = [];

  // Handle tenant deletion
  unsubscribers.push(
    onTyped("tenant.deleted", async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  // Handle subscription changes
  unsubscribers.push(
    onTyped("billing.subscription.updated", async (event) => {
      await handleSubscriptionChanged(event.payload);
    })
  );

  // Handle payment success
  unsubscribers.push(
    onTyped("billing.payment.succeeded", async (event) => {
      await handlePaymentSucceeded(event.payload);
    })
  );

  // Handle file uploads
  unsubscribers.push(
    onTyped("storage.upload.confirmed", async (event) => {
      await handleFileUploaded(event.payload);
    })
  );

  log.info("webhooks event handlers registered", {
    count: unsubscribers.length,
  });

  // Return cleanup function
  return () => {
    log.info("unregistering webhooks event handlers");
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
