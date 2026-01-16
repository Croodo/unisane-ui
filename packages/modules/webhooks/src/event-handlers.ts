/** Webhooks Module Event Handlers */

import { logger, onTyped } from "@unisane/kernel";

const log = logger.child({ module: "webhooks" });

async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  log.debug("tenant deleted", { scopeId: payload.scopeId });
}

async function handleSubscriptionChanged(payload: {
  scopeId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  log.debug("subscription changed", { scopeId: payload.scopeId, planId: payload.planId });
}

async function handlePaymentSucceeded(payload: {
  scopeId: string;
  amount: number;
  currency: string;
  invoiceId?: string;
}): Promise<void> {
  log.debug("payment succeeded", { scopeId: payload.scopeId });
}

async function handleFileUploaded(payload: {
  scopeId: string;
  fileId: string;
  key: string;
  size: number;
}): Promise<void> {
  log.debug("file uploaded", { scopeId: payload.scopeId, fileId: payload.fileId });
}

export function registerWebhooksEventHandlers(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onTyped("tenant.deleted", async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  unsubscribers.push(
    onTyped("billing.subscription.updated", async (event) => {
      await handleSubscriptionChanged(event.payload);
    })
  );

  unsubscribers.push(
    onTyped("billing.payment.succeeded", async (event) => {
      await handlePaymentSucceeded(event.payload);
    })
  );

  unsubscribers.push(
    onTyped("storage.upload.confirmed", async (event) => {
      await handleFileUploaded(event.payload);
    })
  );

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
