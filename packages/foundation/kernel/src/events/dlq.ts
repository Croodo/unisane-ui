/**
 * Dead Letter Queue (DLQ) Management
 *
 * Provides visibility and management of permanently failed events.
 * Events land in the DLQ when they exceed retry limits in the outbox worker.
 *
 * ## Usage
 *
 * ```typescript
 * import { setDLQProvider, listDeadEvents, retryDeadEvent } from '@unisane/kernel';
 *
 * // Wire up the DLQ adapter during bootstrap
 * setDLQProvider(createMongoDLQAdapter(() => db().collection('_outbox')));
 *
 * // List failed events
 * const { items, nextCursor } = await listDeadEvents({ limit: 20 });
 *
 * // Retry a specific event
 * await retryDeadEvent('event_123');
 *
 * // Get stats
 * const stats = await getDLQStats();
 * console.log(`${stats.totalDead} events in DLQ`);
 * ```
 *
 * ## Admin API Integration
 *
 * The DLQ management functions are designed to be exposed via admin routes
 * for operational visibility and manual intervention.
 */

import { logger } from '../observability/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * A dead letter queue entry (failed event).
 */
export interface DeadEventEntry {
  /** Unique identifier */
  id: string;

  /** Event type */
  type: string;

  /** Event payload */
  payload: unknown;

  /** Event metadata */
  meta: {
    eventId: string;
    timestamp: string;
    source: string;
    correlationId?: string;
    scopeType?: string;
    scopeId?: string;
  };

  /** Number of failed delivery attempts */
  attempts: number;

  /** Last error message */
  lastError: string;

  /** When the event was created */
  createdAt: Date;

  /** When the event was last attempted */
  lastAttemptAt: Date;

  /** When the event moved to DLQ (failed status) */
  failedAt: Date;
}

/**
 * DLQ statistics.
 */
export interface DLQStats {
  /** Total number of dead events */
  totalDead: number;

  /** Dead events grouped by type */
  byType: Record<string, number>;

  /** Dead events grouped by error pattern */
  byError: Record<string, number>;

  /** Oldest dead event timestamp */
  oldestDeadAt?: Date;

  /** Most recent dead event timestamp */
  newestDeadAt?: Date;
}

/**
 * Paginated result for listing dead events.
 */
export interface PaginatedDeadEvents {
  /** Dead event entries */
  items: DeadEventEntry[];

  /** Cursor for next page (null if no more pages) */
  nextCursor: string | null;

  /** Total count (if available) */
  totalCount?: number;
}

/**
 * Options for listing dead events.
 */
export interface ListDeadEventsOptions {
  /** Maximum number of items to return */
  limit?: number;

  /** Cursor for pagination */
  cursor?: string;

  /** Filter by event type */
  type?: string;

  /** Filter by scope ID */
  scopeId?: string;

  /** Filter by error pattern (substring match) */
  errorPattern?: string;
}

/**
 * Result of a batch retry operation.
 */
export interface BatchRetryResult {
  /** IDs that were successfully queued for retry */
  succeeded: string[];

  /** IDs that failed to retry */
  failed: Array<{ id: string; error: string }>;
}

/**
 * Port interface for DLQ operations.
 */
export interface DLQPort {
  /**
   * List dead events with pagination.
   */
  list(options?: ListDeadEventsOptions): Promise<PaginatedDeadEvents>;

  /**
   * Get a single dead event by ID.
   */
  getById(id: string): Promise<DeadEventEntry | null>;

  /**
   * Retry a single dead event (move back to pending).
   * Returns true if found and retried, false if not found.
   */
  retry(id: string): Promise<boolean>;

  /**
   * Retry multiple dead events.
   */
  retryBatch(ids: string[]): Promise<BatchRetryResult>;

  /**
   * Permanently delete a dead event.
   * Use with caution - this is irreversible.
   */
  purge(id: string): Promise<boolean>;

  /**
   * Permanently delete multiple dead events.
   */
  purgeBatch(ids: string[]): Promise<number>;

  /**
   * Get DLQ statistics.
   */
  getStats(): Promise<DLQStats>;

  /**
   * Get count of dead events.
   */
  count(options?: { type?: string; scopeId?: string }): Promise<number>;
}

// =============================================================================
// Global State
// =============================================================================

/**
 * Global DLQ provider.
 */
let dlqProvider: DLQPort | null = null;

// =============================================================================
// Provider Management
// =============================================================================

/**
 * Set the DLQ provider.
 * Call this during bootstrap to enable DLQ management.
 *
 * @param provider - The DLQ port implementation
 *
 * @example
 * ```typescript
 * import { setDLQProvider } from '@unisane/kernel';
 * import { createMongoDLQAdapter } from '@unisane/outbox-mongodb';
 *
 * setDLQProvider(createMongoDLQAdapter({
 *   collection: () => db().collection('_outbox'),
 * }));
 * ```
 */
export function setDLQProvider(provider: DLQPort): void {
  dlqProvider = provider;
  logger.debug('DLQ provider configured', { module: 'events' });
}

/**
 * Get the current DLQ provider.
 * Returns null if not configured.
 */
export function getDLQProvider(): DLQPort | null {
  return dlqProvider;
}

/**
 * Check if DLQ management is enabled.
 */
export function isDLQEnabled(): boolean {
  return dlqProvider !== null;
}

/**
 * Clear the DLQ provider (for testing).
 */
export function clearDLQProvider(): void {
  dlqProvider = null;
}

// =============================================================================
// DLQ Management API
// =============================================================================

/**
 * List dead events with pagination.
 *
 * @param options - List options
 * @returns Paginated list of dead events
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * // List first page
 * const page1 = await listDeadEvents({ limit: 20 });
 *
 * // Get next page
 * if (page1.nextCursor) {
 *   const page2 = await listDeadEvents({ limit: 20, cursor: page1.nextCursor });
 * }
 *
 * // Filter by type
 * const paymentFailures = await listDeadEvents({
 *   limit: 20,
 *   type: 'billing.payment.process',
 * });
 * ```
 */
export async function listDeadEvents(
  options?: ListDeadEventsOptions
): Promise<PaginatedDeadEvents> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }
  return dlqProvider.list(options);
}

/**
 * Get a single dead event by ID.
 *
 * @param id - The dead event ID
 * @returns The dead event, or null if not found
 * @throws Error if provider not configured
 */
export async function getDeadEvent(id: string): Promise<DeadEventEntry | null> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }
  return dlqProvider.getById(id);
}

/**
 * Retry a single dead event.
 * Moves the event back to pending status for reprocessing.
 *
 * @param id - The dead event ID
 * @returns True if event was found and retried
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * const success = await retryDeadEvent('event_123');
 * if (success) {
 *   console.log('Event queued for retry');
 * } else {
 *   console.log('Event not found');
 * }
 * ```
 */
export async function retryDeadEvent(id: string): Promise<boolean> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }

  const success = await dlqProvider.retry(id);

  if (success) {
    logger.info('Dead event queued for retry', { module: 'dlq', eventId: id });
  }

  return success;
}

/**
 * Retry multiple dead events.
 *
 * @param ids - Array of dead event IDs
 * @returns Result indicating which succeeded and failed
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * const result = await retryDeadEventBatch(['event_1', 'event_2', 'event_3']);
 * console.log(`Retried: ${result.succeeded.length}, Failed: ${result.failed.length}`);
 * ```
 */
export async function retryDeadEventBatch(ids: string[]): Promise<BatchRetryResult> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }

  const result = await dlqProvider.retryBatch(ids);

  if (result.succeeded.length > 0) {
    logger.info('Dead events queued for retry', {
      module: 'dlq',
      count: result.succeeded.length,
    });
  }

  return result;
}

/**
 * Permanently delete a dead event.
 * Use with caution - this is irreversible.
 *
 * @param id - The dead event ID
 * @returns True if event was found and deleted
 * @throws Error if provider not configured
 */
export async function purgeDeadEvent(id: string): Promise<boolean> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }

  const success = await dlqProvider.purge(id);

  if (success) {
    logger.warn('Dead event purged', { module: 'dlq', eventId: id });
  }

  return success;
}

/**
 * Permanently delete multiple dead events.
 *
 * @param ids - Array of dead event IDs
 * @returns Number of events deleted
 * @throws Error if provider not configured
 */
export async function purgeDeadEventBatch(ids: string[]): Promise<number> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }

  const count = await dlqProvider.purgeBatch(ids);

  if (count > 0) {
    logger.warn('Dead events purged', { module: 'dlq', count });
  }

  return count;
}

/**
 * Get DLQ statistics.
 *
 * @returns Statistics about dead events
 * @throws Error if provider not configured
 *
 * @example
 * ```typescript
 * const stats = await getDLQStats();
 * console.log(`Total dead: ${stats.totalDead}`);
 * console.log('By type:', stats.byType);
 * ```
 */
export async function getDLQStats(): Promise<DLQStats> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }
  return dlqProvider.getStats();
}

/**
 * Get count of dead events.
 *
 * @param options - Filter options
 * @returns Number of matching dead events
 * @throws Error if provider not configured
 */
export async function countDeadEvents(
  options?: { type?: string; scopeId?: string }
): Promise<number> {
  if (!dlqProvider) {
    throw new Error('DLQ provider not configured. Call setDLQProvider() during bootstrap.');
  }
  return dlqProvider.count(options);
}
