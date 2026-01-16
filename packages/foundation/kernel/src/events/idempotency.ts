/**
 * Idempotency Helpers for Event Processing
 *
 * Provides exactly-once event processing semantics by tracking processed events.
 * Prevents duplicate processing when events are retried or delivered multiple times.
 *
 * ## Usage
 *
 * ```typescript
 * import { withIdempotency, setIdempotencyProvider } from '@unisane/kernel';
 *
 * // Wire up the idempotency adapter during bootstrap
 * setIdempotencyProvider(createMongoIdempotencyAdapter(() => db().collection('_idempotency')));
 *
 * // Wrap handlers for exactly-once processing
 * const handler = withIdempotency(async (event) => {
 *   // This will only execute once per eventId
 *   await processOrder(event.payload);
 * });
 *
 * events.on('order.created', handler);
 * ```
 *
 * ## Custom Keys
 *
 * By default, deduplication uses `event.meta.eventId`. For business-level
 * idempotency (e.g., one order per external ID), provide a custom key function:
 *
 * ```typescript
 * const handler = withIdempotency(
 *   async (event) => { ... },
 *   { keyFn: (event) => `order:${event.payload.externalOrderId}` }
 * );
 * ```
 */

import type { DomainEvent, EventHandler } from './types';
import { logger } from '../observability/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of checking idempotency status for a key.
 */
export type IdempotencyResult =
  | { status: 'new' }
  | { status: 'in_progress'; startedAt: Date }
  | { status: 'completed'; result?: unknown; completedAt: Date }
  | { status: 'failed'; error: string; failedAt: Date };

/**
 * Port interface for idempotency storage.
 * Implement this to provide persistence (MongoDB, Redis, etc.).
 */
export interface IdempotencyPort {
  /**
   * Check if a key has been processed.
   * If new, atomically marks it as in_progress.
   *
   * @param key - Unique key for deduplication
   * @param ttlMs - Optional TTL in milliseconds (default: 7 days)
   * @returns Status of the key
   */
  check(key: string, ttlMs?: number): Promise<IdempotencyResult>;

  /**
   * Mark a key as successfully completed.
   * Optionally store a result for retrieval.
   *
   * @param key - The key to mark complete
   * @param result - Optional result to store
   */
  complete(key: string, result?: unknown): Promise<void>;

  /**
   * Mark a key as failed.
   * The key can be retried by calling check() again after clearing.
   *
   * @param key - The key to mark failed
   * @param error - Error message to store
   */
  fail(key: string, error: string): Promise<void>;

  /**
   * Clear a key to allow reprocessing.
   * Use cautiously - typically for admin/manual intervention.
   *
   * @param key - The key to clear
   */
  clear(key: string): Promise<void>;

  /**
   * Get the stored result for a completed key.
   *
   * @param key - The key to look up
   * @returns The stored result, or undefined if not found/not completed
   */
  getResult(key: string): Promise<unknown | undefined>;
}

/**
 * Options for the idempotency wrapper.
 */
export interface IdempotencyOptions<T> {
  /**
   * Custom function to generate the idempotency key from the event.
   * Defaults to using event.meta.eventId.
   */
  keyFn?: (event: DomainEvent<T>) => string;

  /**
   * TTL for idempotency records in milliseconds.
   * After this time, the key will be eligible for cleanup.
   * Default: 7 days (604800000ms)
   */
  ttlMs?: number;

  /**
   * Prefix to add to all keys for namespacing.
   * Useful when multiple handlers process the same event type.
   */
  keyPrefix?: string;

  /**
   * Whether to store the handler result on completion.
   * Default: false
   */
  storeResult?: boolean;

  /**
   * Custom logger for this handler.
   */
  logger?: {
    debug: (msg: string, data?: Record<string, unknown>) => void;
    warn: (msg: string, data?: Record<string, unknown>) => void;
    error: (msg: string, data?: Record<string, unknown>) => void;
  };
}

// =============================================================================
// Global State
// =============================================================================

/**
 * Global idempotency provider.
 * Set during bootstrap using setIdempotencyProvider().
 */
let idempotencyProvider: IdempotencyPort | null = null;

/**
 * Default TTL for idempotency records (7 days).
 */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// =============================================================================
// Provider Management
// =============================================================================

/**
 * Set the idempotency provider.
 * Call this during bootstrap to enable idempotency features.
 *
 * @param provider - The idempotency port implementation
 *
 * @example
 * ```typescript
 * import { setIdempotencyProvider } from '@unisane/kernel';
 * import { createMongoIdempotencyAdapter } from '@unisane/idempotency-mongodb';
 *
 * setIdempotencyProvider(createMongoIdempotencyAdapter({
 *   collection: () => db().collection('_idempotency'),
 * }));
 * ```
 */
export function setIdempotencyProvider(provider: IdempotencyPort): void {
  idempotencyProvider = provider;
  logger.debug('Idempotency provider configured', { module: 'events' });
}

/**
 * Get the current idempotency provider.
 * Returns null if not configured.
 */
export function getIdempotencyProvider(): IdempotencyPort | null {
  return idempotencyProvider;
}

/**
 * Check if idempotency is enabled (provider configured).
 */
export function isIdempotencyEnabled(): boolean {
  return idempotencyProvider !== null;
}

/**
 * Clear the idempotency provider (for testing).
 */
export function clearIdempotencyProvider(): void {
  idempotencyProvider = null;
}

// =============================================================================
// Idempotent Handler Wrapper
// =============================================================================

/**
 * Wrap an event handler for exactly-once processing.
 *
 * The wrapper:
 * 1. Checks if the event has been processed before
 * 2. If already completed, skips execution
 * 3. If in progress (crash recovery), throws to allow retry
 * 4. If new, marks as in-progress, executes handler, marks complete/failed
 *
 * @param handler - The event handler to wrap
 * @param options - Idempotency options
 * @returns Wrapped handler with idempotency
 *
 * @example
 * ```typescript
 * // Basic usage (dedupe by eventId)
 * const handler = withIdempotency(async (event) => {
 *   await processPayment(event.payload);
 * });
 *
 * // Custom key for business-level idempotency
 * const handler = withIdempotency(
 *   async (event) => {
 *     await createOrder(event.payload);
 *   },
 *   {
 *     keyFn: (event) => `order:${event.payload.orderId}`,
 *     keyPrefix: 'billing:',
 *   }
 * );
 * ```
 */
export function withIdempotency<T>(
  handler: EventHandler<T>,
  options?: IdempotencyOptions<T>
): EventHandler<T> {
  const {
    keyFn,
    ttlMs = DEFAULT_TTL_MS,
    keyPrefix = '',
    storeResult = false,
    logger: customLogger,
  } = options ?? {};

  const log = customLogger ?? {
    debug: (msg: string, data?: Record<string, unknown>) =>
      logger.debug(msg, { module: 'idempotency', ...data }),
    warn: (msg: string, data?: Record<string, unknown>) =>
      logger.warn(msg, { module: 'idempotency', ...data }),
    error: (msg: string, data?: Record<string, unknown>) =>
      logger.error(msg, { module: 'idempotency', ...data }),
  };

  return async (event: DomainEvent<T>): Promise<void> => {
    // If no provider configured, execute without idempotency
    if (!idempotencyProvider) {
      log.debug('No idempotency provider configured, executing without deduplication', {
        eventId: event.meta.eventId,
        eventType: event.type,
      });
      await handler(event);
      return;
    }

    // Generate idempotency key
    const baseKey = keyFn ? keyFn(event) : event.meta.eventId;
    const key = keyPrefix ? `${keyPrefix}${baseKey}` : baseKey;

    // Check idempotency status
    const result = await idempotencyProvider.check(key, ttlMs);

    switch (result.status) {
      case 'completed':
        log.debug('Event already processed, skipping', {
          key,
          eventId: event.meta.eventId,
          eventType: event.type,
          completedAt: result.completedAt.toISOString(),
        });
        return;

      case 'in_progress':
        // Another instance is processing, or previous attempt crashed
        // Throw to allow retry mechanism to handle
        log.warn('Event processing in progress (possible crash recovery)', {
          key,
          eventId: event.meta.eventId,
          eventType: event.type,
          startedAt: result.startedAt.toISOString(),
        });
        throw new IdempotencyInProgressError(key, result.startedAt);

      case 'failed':
        // Previous attempt failed, allow retry
        log.debug('Previous attempt failed, retrying', {
          key,
          eventId: event.meta.eventId,
          eventType: event.type,
          previousError: result.error,
        });
        // Clear and retry
        await idempotencyProvider.clear(key);
        // Re-check to mark as in_progress
        await idempotencyProvider.check(key, ttlMs);
        break;

      case 'new':
        log.debug('New event, processing', {
          key,
          eventId: event.meta.eventId,
          eventType: event.type,
        });
        break;
    }

    // Execute handler
    try {
      const handlerResult = await handler(event);

      // Mark as completed
      if (storeResult) {
        await idempotencyProvider.complete(key, handlerResult);
      } else {
        await idempotencyProvider.complete(key);
      }

      log.debug('Event processed successfully', {
        key,
        eventId: event.meta.eventId,
        eventType: event.type,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Mark as failed (allows retry on next attempt)
      await idempotencyProvider.fail(key, err.message);

      log.error('Event processing failed', {
        key,
        eventId: event.meta.eventId,
        eventType: event.type,
        error: err.message,
      });

      // Re-throw so the outbox worker can handle retry
      throw error;
    }
  };
}

// =============================================================================
// Errors
// =============================================================================

/**
 * Error thrown when an event is already being processed.
 * Typically indicates crash recovery scenario.
 */
export class IdempotencyInProgressError extends Error {
  readonly key: string;
  readonly startedAt: Date;

  constructor(key: string, startedAt: Date) {
    super(`Event processing in progress for key: ${key}`);
    this.name = 'IdempotencyInProgressError';
    this.key = key;
    this.startedAt = startedAt;
  }
}

// =============================================================================
// Standalone Helpers
// =============================================================================

/**
 * Check idempotency status for a key without wrapping a handler.
 * Useful for custom idempotency flows.
 *
 * @param key - The idempotency key
 * @param ttlMs - Optional TTL in milliseconds
 * @returns Idempotency result
 * @throws Error if provider not configured
 */
export async function checkIdempotency(
  key: string,
  ttlMs?: number
): Promise<IdempotencyResult> {
  if (!idempotencyProvider) {
    throw new Error('Idempotency provider not configured. Call setIdempotencyProvider() during bootstrap.');
  }
  return idempotencyProvider.check(key, ttlMs);
}

/**
 * Mark a key as completed.
 *
 * @param key - The idempotency key
 * @param result - Optional result to store
 * @throws Error if provider not configured
 */
export async function completeIdempotency(
  key: string,
  result?: unknown
): Promise<void> {
  if (!idempotencyProvider) {
    throw new Error('Idempotency provider not configured. Call setIdempotencyProvider() during bootstrap.');
  }
  await idempotencyProvider.complete(key, result);
}

/**
 * Mark a key as failed.
 *
 * @param key - The idempotency key
 * @param error - Error message
 * @throws Error if provider not configured
 */
export async function failIdempotency(key: string, error: string): Promise<void> {
  if (!idempotencyProvider) {
    throw new Error('Idempotency provider not configured. Call setIdempotencyProvider() during bootstrap.');
  }
  await idempotencyProvider.fail(key, error);
}

/**
 * Clear an idempotency key to allow reprocessing.
 *
 * @param key - The idempotency key
 * @throws Error if provider not configured
 */
export async function clearIdempotency(key: string): Promise<void> {
  if (!idempotencyProvider) {
    throw new Error('Idempotency provider not configured. Call setIdempotencyProvider() during bootstrap.');
  }
  await idempotencyProvider.clear(key);
}

/**
 * Get stored result for a completed key.
 *
 * @param key - The idempotency key
 * @returns The stored result, or undefined
 * @throws Error if provider not configured
 */
export async function getIdempotencyResult(key: string): Promise<unknown | undefined> {
  if (!idempotencyProvider) {
    throw new Error('Idempotency provider not configured. Call setIdempotencyProvider() during bootstrap.');
  }
  return idempotencyProvider.getResult(key);
}
