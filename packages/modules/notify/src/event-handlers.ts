/**
 * Notify Module Event Handlers
 *
 * This file contains event handlers that allow the notify module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * Usage:
 * ```typescript
 * import { registerNotifyEventHandlers } from '@unisane/notify';
 *
 * // In bootstrap.ts
 * registerNotifyEventHandlers();
 * ```
 */

import { logger, onTyped } from '@unisane/kernel';
import type { EventPayload } from '@unisane/kernel';
import { addSuppression } from './service/suppression';

const log = logger.child({ module: 'notify', component: 'event-handlers' });

/**
 * Handle email suppression requests from webhooks.
 * Adds emails to the suppression list when bounces/complaints are reported.
 */
async function handleEmailSuppressionRequested(
  payload: EventPayload<'notify.email_suppression_requested'>
): Promise<void> {
  const { email, reason, provider, scopeId } = payload;

  log.info('processing email suppression request', {
    email,
    reason,
    provider,
    scopeId,
  });

  try {
    await addSuppression({
      email,
      reason,
      provider,
      scopeId,
    });

    log.info('email added to suppression list', {
      email,
      reason,
      provider,
    });
  } catch (error) {
    log.error('failed to add email to suppression list', {
      email,
      reason,
      provider,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Register all notify event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerNotifyEventHandlers(): () => void {
  log.info('registering notify event handlers');

  const unsubscribers: Array<() => void> = [];

  // Email suppression from webhook events
  unsubscribers.push(
    onTyped('notify.email_suppression_requested', async (event) => {
      await handleEmailSuppressionRequested(event.payload);
    })
  );

  log.info('notify event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering notify event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
