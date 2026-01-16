/**
 * Storage Module Event Handlers
 *
 * This file contains event handlers that allow the storage module to respond to
 * events from other modules without direct imports. This achieves loose coupling
 * as part of the hexagonal architecture.
 *
 * Usage:
 * ```typescript
 * import { registerStorageEventHandlers } from '@unisane/storage';
 *
 * // In bootstrap.ts
 * registerStorageEventHandlers();
 * ```
 */

import { logger, onTyped, emitTypedReliable } from '@unisane/kernel';
import { cleanupOrphanedUploads, cleanupDeletedFiles } from './service/cleanup';
import { StorageRepo } from './data/storage.repository';

const log = logger.child({ module: 'storage', component: 'event-handlers' });

/**
 * Handle tenant deletion by marking storage files for cleanup.
 * Marks all files as deleted (actual S3 cleanup happens in cleanup job).
 * Emits completion event for tracking.
 */
async function handleTenantDeleted(payload: {
  scopeId: string;
  actorId?: string;
  timestamp: string;
}): Promise<void> {
  const { scopeId, actorId } = payload;

  log.info('storage: handling tenant deletion cascade', { scopeId, actorId });

  let filesMarked = 0;
  // STOR-004 FIX: Track cascade errors to return in completion event
  let cascadeError: string | null = null;

  // Mark all files as deleted (actual S3 cleanup is deferred to cleanup job)
  try {
    const result = await StorageRepo.markAllDeletedForScope(scopeId);
    filesMarked = result.markedCount;
    log.info('storage: marked files for deletion', { scopeId, count: filesMarked });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    cascadeError = errorMessage;
    log.error('storage: failed to mark files for deletion', {
      scopeId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Continue - don't fail the entire cascade, but track the error
  }

  // STOR-004 FIX: Include error metadata in completion event
  await emitTypedReliable('storage.cascade.completed', {
    sourceEvent: 'tenant.deleted',
    scopeId,
    results: {
      filesMarked,
      success: cascadeError === null,
      ...(cascadeError ? { error: cascadeError } : {}),
    },
  });

  log.info('storage: tenant deletion cascade complete', {
    scopeId,
    filesMarked,
    success: cascadeError === null,
    ...(cascadeError ? { error: cascadeError } : {}),
  });
}

/**
 * Handle storage cleanup trigger event.
 * This can be emitted by a scheduled job or admin action.
 */
async function handleStorageCleanupTriggered(): Promise<void> {
  log.info('storage cleanup triggered');

  try {
    // Cleanup orphaned uploads (pending > 24h)
    const orphanedResult = await cleanupOrphanedUploads();
    log.info('orphaned uploads cleanup complete', {
      checked: orphanedResult.checked,
      cleaned: orphanedResult.cleaned,
      failed: orphanedResult.failed,
    });

    // Cleanup deleted files (soft-deleted > 7d)
    const deletedResult = await cleanupDeletedFiles();
    log.info('deleted files cleanup complete', {
      checked: deletedResult.checked,
      cleaned: deletedResult.cleaned,
      failed: deletedResult.failed,
      s3Errors: deletedResult.s3Errors,
    });
  } catch (error) {
    log.error('storage cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Register all storage event handlers.
 * Call this during application bootstrap.
 *
 * @returns Cleanup function to unsubscribe all handlers
 */
export function registerStorageEventHandlers(): () => void {
  log.info('registering storage event handlers');

  const unsubscribers: Array<() => void> = [];

  // Handle tenant deletion
  unsubscribers.push(
    onTyped('tenant.deleted', async (event) => {
      await handleTenantDeleted(event.payload);
    })
  );

  // Handle cleanup trigger (from scheduled jobs)
  unsubscribers.push(
    onTyped('storage.cleanup.orphaned', async () => {
      await handleStorageCleanupTriggered();
    })
  );

  unsubscribers.push(
    onTyped('storage.cleanup.deleted', async () => {
      await handleStorageCleanupTriggered();
    })
  );

  log.info('storage event handlers registered', { count: unsubscribers.length });

  // Return cleanup function
  return () => {
    log.info('unregistering storage event handlers');
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
