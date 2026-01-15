/**
 * Outbox Worker
 *
 * Background worker that processes events from the outbox collection.
 * Implements the transactional outbox pattern for reliable event delivery.
 *
 * Features:
 * - Polls for pending events at configurable intervals
 * - Exponential backoff for failed deliveries
 * - Concurrent processing with configurable batch size
 * - Graceful shutdown support
 *
 * @example
 * ```typescript
 * import { createOutboxWorker } from '@unisane/kernel';
 *
 * // During app bootstrap
 * const worker = createOutboxWorker({
 *   getCollection: () => db.collection('_outbox'),
 *   pollInterval: 1000,
 *   batchSize: 10,
 *   maxRetries: 5,
 * });
 *
 * // Start processing
 * worker.start();
 *
 * // On shutdown
 * await worker.stop();
 * ```
 */

import type { Collection, WithId, Document } from 'mongodb';
import { events } from './emitter';
import type { OutboxEntry, DomainEvent } from './types';

/**
 * Outbox worker configuration options.
 */
export interface OutboxWorkerOptions {
  /** Function to get the outbox collection */
  getCollection: () => Collection<OutboxEntry>;
  /** Polling interval in milliseconds (default: 1000) */
  pollInterval?: number;
  /** Number of events to process per batch (default: 10) */
  batchSize?: number;
  /** Maximum retry attempts before marking as failed (default: 5) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseRetryDelay?: number;
  /** Maximum delay between retries in ms (default: 60000) */
  maxRetryDelay?: number;
  /** Optional logger */
  logger?: {
    info: (msg: string, data?: Record<string, unknown>) => void;
    error: (msg: string, data?: Record<string, unknown>) => void;
    debug: (msg: string, data?: Record<string, unknown>) => void;
  };
  /**
   * Called when an event permanently fails after all retry attempts.
   * Use this for alerting, dead letter queue integration, or custom handling.
   */
  onPermanentFailure?: (entry: OutboxEntry, error: Error) => Promise<void>;
}

/**
 * Outbox worker instance.
 */
export interface OutboxWorker {
  /** Start the worker */
  start: () => void;
  /** Stop the worker gracefully */
  stop: () => Promise<void>;
  /** Check if worker is running */
  isRunning: () => boolean;
  /** Process a single batch (for testing) */
  processBatch: () => Promise<number>;
  /** Retry a specific failed event by eventId */
  retryFailed: (eventId: string) => Promise<boolean>;
  /** Get count of permanently failed events */
  getFailedCount: () => Promise<number>;
}

/**
 * Default logger that uses console.
 */
const defaultLogger = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[outbox-worker] ${msg}`, data || ''),
  error: (msg: string, data?: Record<string, unknown>) =>
    console.error(`[outbox-worker] ${msg}`, data || ''),
  debug: (msg: string, data?: Record<string, unknown>) =>
    console.debug(`[outbox-worker] ${msg}`, data || ''),
};

/**
 * Calculate next retry time with exponential backoff.
 */
function calculateNextRetry(
  attempts: number,
  baseDelay: number,
  maxDelay: number
): Date {
  const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
  // Add jitter (±10%) to prevent thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return new Date(Date.now() + delay + jitter);
}

/**
 * Create an outbox worker instance.
 */
export function createOutboxWorker(options: OutboxWorkerOptions): OutboxWorker {
  const {
    getCollection,
    pollInterval = 1000,
    batchSize = 10,
    maxRetries = 5,
    baseRetryDelay = 1000,
    maxRetryDelay = 60000,
    logger = defaultLogger,
    onPermanentFailure,
  } = options;

  let running = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let processing = false;

  /**
   * Process a batch of pending events.
   * Returns the number of events processed.
   */
  async function processBatch(): Promise<number> {
    const collection = getCollection();
    const now = new Date();

    // Find pending events that are ready for processing
    const entries = await collection
      .find({
        $or: [
          { status: 'pending' },
          {
            status: 'processing',
            nextRetryAt: { $lte: now },
          },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(batchSize)
      .toArray();

    if (entries.length === 0) {
      return 0;
    }

    logger.debug(`Processing ${entries.length} outbox entries`);

    // Process each entry
    let processed = 0;
    for (const entry of entries) {
      try {
        // Mark as processing
        await collection.updateOne(
          { _id: entry._id, status: { $in: ['pending', 'processing'] } },
          {
            $set: {
              status: 'processing',
              updatedAt: new Date(),
            },
            $inc: { attempts: 1 },
          }
        );

        // Dispatch the event to handlers via events.emit()
        await dispatchEvent(entry);

        // Mark as completed
        await collection.updateOne(
          { _id: entry._id },
          {
            $set: {
              status: 'completed',
              updatedAt: new Date(),
            },
          }
        );

        logger.debug(`Processed event`, {
          type: entry.type,
          eventId: entry.meta.eventId,
        });
        processed++;
      } catch (error) {
        const err = error as Error;
        const attempts = (entry.attempts || 0) + 1;

        if (attempts >= maxRetries) {
          // Mark as permanently failed
          await collection.updateOne(
            { _id: entry._id },
            {
              $set: {
                status: 'failed',
                lastError: err.message,
                updatedAt: new Date(),
              },
            }
          );

          logger.error(`Event permanently failed after ${attempts} attempts`, {
            type: entry.type,
            eventId: entry.meta.eventId,
            error: err.message,
          });

          // Invoke failure callback for alerting/DLQ integration
          if (onPermanentFailure) {
            try {
              await onPermanentFailure(entry, err);
            } catch (callbackErr) {
              logger.error('onPermanentFailure callback failed', {
                eventId: entry.meta.eventId,
                error: (callbackErr as Error).message,
              });
            }
          }
        } else {
          // Schedule retry with exponential backoff
          const nextRetryAt = calculateNextRetry(
            attempts,
            baseRetryDelay,
            maxRetryDelay
          );

          await collection.updateOne(
            { _id: entry._id },
            {
              $set: {
                status: 'processing',
                lastError: err.message,
                nextRetryAt,
                updatedAt: new Date(),
              },
            }
          );

          logger.debug(`Event scheduled for retry`, {
            type: entry.type,
            eventId: entry.meta.eventId,
            attempt: attempts,
            nextRetryAt: nextRetryAt.toISOString(),
          });
        }
      }
    }

    return processed;
  }

  /**
   * Dispatch event to handlers.
   * Re-uses the events.emit() which will dispatch to registered handlers.
   * The payload was already validated when inserted into the outbox.
   */
  async function dispatchEvent(entry: OutboxDocument): Promise<void> {
    // Re-emit through the events system
    // The payload was already validated on insert, but events.emit() will validate again
    // This is acceptable as schemas should be stable
    await events.emit(entry.type, entry.payload, entry.meta.source);
  }

  /**
   * Main polling loop.
   */
  async function poll(): Promise<void> {
    if (!running || processing) {
      return;
    }

    processing = true;

    try {
      const processed = await processBatch();
      if (processed > 0) {
        logger.info(`Processed ${processed} events from outbox`);
      }
    } catch (error) {
      logger.error('Error processing outbox batch', {
        error: (error as Error).message,
      });
    } finally {
      processing = false;
    }

    // Schedule next poll if still running
    if (running) {
      timeoutId = setTimeout(poll, pollInterval);
    }
  }

  return {
    start() {
      if (running) {
        logger.debug('Worker already running');
        return;
      }

      running = true;
      logger.info('Outbox worker started', { pollInterval, batchSize, maxRetries });

      // Start polling
      poll();
    },

    async stop() {
      if (!running) {
        return;
      }

      logger.info('Stopping outbox worker...');
      running = false;

      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Wait for any in-progress batch to complete
      while (processing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      logger.info('Outbox worker stopped');
    },

    isRunning() {
      return running;
    },

    processBatch,

    async retryFailed(eventId: string): Promise<boolean> {
      const collection = getCollection();
      const result = await collection.updateOne(
        { 'meta.eventId': eventId, status: 'failed' },
        {
          $set: {
            status: 'pending',
            attempts: 0,
            updatedAt: new Date(),
          },
          $unset: {
            lastError: '',
            nextRetryAt: '',
          },
        }
      );
      if (result.modifiedCount > 0) {
        logger.info('Failed event reset for retry', { eventId });
      }
      return result.modifiedCount > 0;
    },

    async getFailedCount(): Promise<number> {
      const collection = getCollection();
      return collection.countDocuments({ status: 'failed' });
    },
  };
}

/**
 * Type for MongoDB document with _id
 */
type OutboxDocument = WithId<OutboxEntry>;
