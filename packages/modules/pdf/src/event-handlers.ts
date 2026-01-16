/** PDF Module Event Handlers */

import { logger, onTyped } from '@unisane/kernel';

const log = logger.child({ module: 'pdf' });

async function handleSubscriptionUpdated(payload: {
  scopeId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  const { scopeId, planId } = payload;
  log.debug('subscription updated', { scopeId, planId });
}

async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  const { scopeId } = payload;
  log.debug('tenant deleted', { scopeId });
}

export function registerPdfEventHandlers(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onTyped('billing.subscription.updated', async (event) => {
      await handleSubscriptionUpdated(event.payload);
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
