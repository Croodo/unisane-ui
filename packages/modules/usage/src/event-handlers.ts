/** Usage Module Event Handlers */

import { logger, onTyped } from '@unisane/kernel';

const log = logger.child({ module: 'usage' });

async function handleSubscriptionInvoicePaid(payload: {
  scopeId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  periodEnd: string | null;
  creditGrants: Array<{ key: string; amount: number }>;
}): Promise<void> {
  const { scopeId } = payload;
  log.debug('subscription invoice paid', { scopeId });
}

async function handleStorageUpload(payload: {
  scopeId: string;
  fileId: string;
  key: string;
  size: number;
}): Promise<void> {
  const { scopeId, fileId } = payload;
  log.debug('storage upload', { scopeId, fileId });
}

async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  const { scopeId } = payload;
  log.debug('tenant deleted', { scopeId });
}

export function registerUsageEventHandlers(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onTyped('webhook.stripe.subscription_invoice_paid', async (event) => {
      await handleSubscriptionInvoicePaid(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('storage.upload.confirmed', async (event) => {
      await handleStorageUpload(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
