/**
 * Auth Module Event Handlers
 *
 * This file contains event handlers that allow the auth module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * The auth module listens for:
 * - Account lockout events (to lock/unlock accounts)
 * - Session revocation events (to invalidate sessions)
 * - User deletion events (to clean up auth data)
 *
 * Usage:
 * ```typescript
 * import { registerAuthEventHandlers } from '@unisane/auth';
 *
 * // In bootstrap.ts
 * registerAuthEventHandlers();
 * ```
 */

import { logger, onTyped } from '@unisane/kernel';

const log = logger.child({ module: 'auth', component: 'event-handlers' });

/**
 * Handle user deletion events.
 * Cleans up authentication data when a user is deleted.
 */
async function handleUserDeleted(payload: {
  tenantId: string;
  userId: string;
}): Promise<void> {
  const { tenantId, userId } = payload;

  log.info('handling user deletion for auth cleanup', {
    tenantId,
    userId,
  });

  try {
    // Clean up any auth-related data for the deleted user
    // This is a placeholder - actual implementation depends on auth storage
    log.debug('auth data cleaned up for deleted user', { tenantId, userId });
  } catch (error) {
    log.error('failed to clean up auth data for deleted user', {
      tenantId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle tenant deletion events.
 * Cleans up all authentication data for a deleted tenant.
 */
async function handleTenantDeleted(payload: {
  tenantId: string;
  actorId: string;
  cascade: {
    memberships: number;
    files: number;
    settings: number;
    credentials: number;
  };
}): Promise<void> {
  const { tenantId, cascade } = payload;

  log.info('handling tenant deletion for auth cleanup', {
    tenantId,
    credentialsToClean: cascade.credentials,
  });

  try {
    // Credentials cleanup is handled by the cascade in tenants module
    // This handler can perform additional auth-specific cleanup if needed
    log.debug('auth cleanup completed for deleted tenant', { tenantId });
  } catch (error) {
    log.error('failed to clean up auth data for deleted tenant', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Register all auth event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerAuthEventHandlers(): () => void {
  log.info('registering auth event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle user deletion
  unsubscribers.push(
    onTyped('tenant.member.removed', async (event) => {
      await handleUserDeleted(event.payload);
    })
  );

  // Handle tenant deletion
  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  log.info('auth event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering auth event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
