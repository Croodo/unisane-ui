/**
 * MongoDB Idempotency Adapter
 *
 * Implements the IdempotencyPort interface using MongoDB for persistence.
 * Provides exactly-once event processing semantics with atomic operations.
 *
 * ## Required Index
 *
 * For optimal performance, create this index on your idempotency collection:
 *
 * ```javascript
 * // Primary index for key lookups (required)
 * db._idempotency.createIndex(
 *   { key: 1 },
 *   { name: 'idempotency_key_idx', unique: true }
 * );
 *
 * // TTL index for automatic cleanup of old records
 * db._idempotency.createIndex(
 *   { expiresAt: 1 },
 *   { name: 'idempotency_ttl_idx', expireAfterSeconds: 0 }
 * );
 * ```
 *
 * @example
 * ```typescript
 * import { createMongoIdempotencyAdapter } from '@unisane/idempotency-mongodb';
 * import { setIdempotencyProvider } from '@unisane/kernel';
 *
 * setIdempotencyProvider(createMongoIdempotencyAdapter({
 *   collection: () => db().collection('_idempotency'),
 * }));
 * ```
 */

import type { Collection, Document } from 'mongodb';
import type { IdempotencyPort, IdempotencyResult } from '@unisane/kernel';

/**
 * MongoDB document shape for idempotency records.
 */
interface IdempotencyDoc {
  /** Unique idempotency key */
  key: string;
  /** Processing status */
  status: 'in_progress' | 'completed' | 'failed';
  /** When processing started */
  startedAt: Date;
  /** When processing completed (if completed) */
  completedAt?: Date;
  /** When processing failed (if failed) */
  failedAt?: Date;
  /** Stored result (if storeResult option used) */
  result?: unknown;
  /** Error message (if failed) */
  error?: string;
  /** When this record expires (for TTL index) */
  expiresAt: Date;
  /** Record creation time */
  createdAt: Date;
  /** Last update time */
  updatedAt: Date;
}

/**
 * Configuration for the MongoDB idempotency adapter.
 */
export interface MongoIdempotencyAdapterConfig {
  /**
   * Function that returns the MongoDB collection for idempotency records.
   * This allows lazy initialization after database connection.
   */
  collection: () => Collection<IdempotencyDoc>;

  /**
   * Default TTL for idempotency records in milliseconds.
   * After this time, records are eligible for TTL cleanup.
   * Default: 7 days (604800000ms)
   */
  defaultTtlMs?: number;

  /**
   * Timeout in milliseconds for in_progress status.
   * If a record has been in_progress longer than this, it's considered stale
   * (crash/timeout scenario) and can be retried.
   * Default: 5 minutes (300000ms)
   */
  inProgressTimeoutMs?: number;
}

/**
 * Default TTL: 7 days
 */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Default in-progress timeout: 5 minutes
 */
const DEFAULT_IN_PROGRESS_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Create an IdempotencyPort adapter using MongoDB.
 *
 * @param config Configuration options
 * @returns IdempotencyPort implementation
 *
 * @example
 * ```typescript
 * import { createMongoIdempotencyAdapter } from '@unisane/idempotency-mongodb';
 * import { setIdempotencyProvider } from '@unisane/kernel';
 *
 * setIdempotencyProvider(createMongoIdempotencyAdapter({
 *   collection: () => db().collection('_idempotency'),
 * }));
 * ```
 */
export function createMongoIdempotencyAdapter(
  config: MongoIdempotencyAdapterConfig
): IdempotencyPort {
  const {
    collection,
    defaultTtlMs = DEFAULT_TTL_MS,
    inProgressTimeoutMs = DEFAULT_IN_PROGRESS_TIMEOUT_MS,
  } = config;

  const col = () => collection();

  return {
    async check(key: string, ttlMs?: number): Promise<IdempotencyResult> {
      const now = new Date();
      const ttl = ttlMs ?? defaultTtlMs;
      const expiresAt = new Date(now.getTime() + ttl);
      const staleThreshold = new Date(now.getTime() - inProgressTimeoutMs);

      // Try to find existing record
      const existing = await col().findOne({ key } as Document);

      if (existing) {
        // Check status
        switch (existing.status) {
          case 'completed':
            return {
              status: 'completed',
              result: existing.result,
              completedAt: existing.completedAt!,
            };

          case 'failed':
            return {
              status: 'failed',
              error: existing.error ?? 'Unknown error',
              failedAt: existing.failedAt!,
            };

          case 'in_progress':
            // Check if stale (crash recovery scenario)
            if (existing.startedAt < staleThreshold) {
              // Stale in_progress - allow retry by updating to new in_progress
              await col().updateOne(
                { key, status: 'in_progress', startedAt: existing.startedAt } as Document,
                {
                  $set: {
                    startedAt: now,
                    expiresAt,
                    updatedAt: now,
                  },
                } as Document
              );
              // Return as new (we've claimed it for retry)
              return { status: 'new' };
            }

            // Still actively processing
            return {
              status: 'in_progress',
              startedAt: existing.startedAt,
            };
        }
      }

      // No existing record - atomically insert new one
      try {
        await col().insertOne({
          key,
          status: 'in_progress',
          startedAt: now,
          expiresAt,
          createdAt: now,
          updatedAt: now,
        } as IdempotencyDoc);

        return { status: 'new' };
      } catch (error) {
        // Duplicate key error - another process beat us
        // This can happen in race conditions
        if ((error as { code?: number }).code === 11000) {
          // Re-check the status
          const retryExisting = await col().findOne({ key } as Document);
          if (retryExisting) {
            switch (retryExisting.status) {
              case 'completed':
                return {
                  status: 'completed',
                  result: retryExisting.result,
                  completedAt: retryExisting.completedAt!,
                };
              case 'failed':
                return {
                  status: 'failed',
                  error: retryExisting.error ?? 'Unknown error',
                  failedAt: retryExisting.failedAt!,
                };
              case 'in_progress':
                return {
                  status: 'in_progress',
                  startedAt: retryExisting.startedAt,
                };
            }
          }
        }
        throw error;
      }
    },

    async complete(key: string, result?: unknown): Promise<void> {
      const now = new Date();
      await col().updateOne(
        { key } as Document,
        {
          $set: {
            status: 'completed',
            completedAt: now,
            updatedAt: now,
            ...(result !== undefined ? { result } : {}),
          },
        } as Document
      );
    },

    async fail(key: string, error: string): Promise<void> {
      const now = new Date();
      await col().updateOne(
        { key } as Document,
        {
          $set: {
            status: 'failed',
            failedAt: now,
            error,
            updatedAt: now,
          },
        } as Document
      );
    },

    async clear(key: string): Promise<void> {
      await col().deleteOne({ key } as Document);
    },

    async getResult(key: string): Promise<unknown | undefined> {
      const doc = await col().findOne({ key, status: 'completed' } as Document);
      return doc?.result;
    },
  };
}

// Re-export types for convenience
export type { IdempotencyPort, IdempotencyResult } from '@unisane/kernel';
