/** Auth Module Event Handlers */

import { logger, onTyped } from '@unisane/kernel';

const log = logger.child({ module: 'auth' });

async function handleUserDeleted(payload: {
  scopeId: string;
  userId: string;
  removedBy?: string;
}): Promise<void> {
  const { scopeId, userId } = payload;
  log.debug('user deleted', { scopeId, userId });
}

async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  const { scopeId } = payload;
  log.debug('tenant deleted', { scopeId });
}

export function registerAuthEventHandlers(): () => void {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    onTyped('tenant.member.removed', async (event) => {
      await handleUserDeleted(event.payload);
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
