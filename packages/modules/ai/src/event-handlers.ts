/** AI Module Event Handlers */

import { logger, onTyped, cacheDelete } from '@unisane/kernel';

const log = logger.child({ module: 'ai' });
const AI_CACHE_PREFIX = 'ai:';

async function handleSubscriptionUpdated(payload: {
  scopeId: string;
  planId: string;
  previousPlanId?: string;
}): Promise<void> {
  const { scopeId } = payload;
  await cacheDelete(`${AI_CACHE_PREFIX}config:${scopeId}`);
  await cacheDelete(`${AI_CACHE_PREFIX}models:${scopeId}`);
  log.debug('subscription updated', { scopeId });
}

async function handleCreditsConsumed(payload: {
  scopeId: string;
  amount: number;
  reason: string;
  feature?: string;
  remaining?: number;
}): Promise<void> {
  const { feature } = payload;
  if (feature && !feature.startsWith('ai.')) return;
}

async function handleCreditsGranted(payload: {
  scopeId: string;
  amount: number;
  reason: string;
  source?: 'subscription' | 'topup' | 'promo' | 'manual';
  expiresAt?: string;
}): Promise<void> {
  const { scopeId } = payload;
  await cacheDelete(`${AI_CACHE_PREFIX}disabled:${scopeId}`);
  log.debug('credits granted', { scopeId });
}

async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  const { scopeId } = payload;
  await cacheDelete(`${AI_CACHE_PREFIX}config:${scopeId}`);
  await cacheDelete(`${AI_CACHE_PREFIX}models:${scopeId}`);
  await cacheDelete(`${AI_CACHE_PREFIX}disabled:${scopeId}`);
  log.debug('tenant deleted', { scopeId });
}

export function registerAiEventHandlers(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onTyped('billing.subscription.updated', async (event) => {
      await handleSubscriptionUpdated(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('credits.consumed', async (event) => {
      await handleCreditsConsumed(event.payload);
    })
  );

  unsubscribers.push(
    onTyped('credits.granted', async (event) => {
      await handleCreditsGranted(event.payload);
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
