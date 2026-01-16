/**
 * Distributed Locking Utilities
 *
 * Provides atomic locking for preventing race conditions in distributed systems.
 * Uses Redis for lock storage with automatic expiration.
 *
 * @example
 * ```typescript
 * const lock = await acquireLock('seat-limit:tenant123', { ttlMs: 5000 });
 * if (!lock) {
 *   throw new Error('Unable to acquire lock');
 * }
 * try {
 *   // Critical section
 * } finally {
 *   await releaseLock(lock);
 * }
 * ```
 */

import { randomUUID } from 'node:crypto';
import { redis as kv } from '../cache/redis';
import { logger } from '../observability/logger';

/**
 * Options for acquiring a distributed lock
 */
export interface LockOptions {
  /** Time-to-live in milliseconds. Lock expires after this duration. */
  ttlMs: number;
  /** Retry interval in milliseconds (default: 100) */
  retryMs?: number;
  /** Maximum retry attempts (default: 10) */
  maxRetries?: number;
}

/**
 * Represents an acquired lock
 */
export interface Lock {
  /** Lock key */
  key: string;
  /** Unique token for this lock holder */
  token: string;
  /** When the lock expires */
  expiresAt: number;
}

const LOCK_PREFIX = 'lock:';

/**
 * Helper function to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt to acquire a distributed lock.
 *
 * Uses SET NX (only set if not exists) with expiration to ensure atomicity.
 * Retries until maxRetries is reached.
 *
 * @param key - Lock key (will be prefixed with 'lock:')
 * @param options - Lock options including TTL and retry settings
 * @returns Lock object if acquired, null if unable to acquire
 *
 * @example
 * ```typescript
 * const lock = await acquireLock('seat-limit:tenant123', {
 *   ttlMs: 5000,
 *   retryMs: 100,
 *   maxRetries: 50,
 * });
 * ```
 */
export async function acquireLock(
  key: string,
  options: LockOptions
): Promise<Lock | null> {
  const { ttlMs, retryMs = 100, maxRetries = 10 } = options;
  const token = randomUUID();
  const lockKey = `${LOCK_PREFIX}${key}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // SET key token NX PX ttlMs - only set if not exists with expiration
      const acquired = await kv.set(lockKey, token, { NX: true, PX: ttlMs });

      if (acquired) {
        logger.debug('Lock acquired', {
          module: 'locks',
          key,
          token,
          ttlMs,
          attempt,
        });
        return {
          key,
          token,
          expiresAt: Date.now() + ttlMs,
        };
      }

      // Lock not acquired, wait and retry
      if (attempt < maxRetries - 1) {
        await sleep(retryMs);
      }
    } catch (error) {
      logger.warn('Lock acquisition error, retrying', {
        module: 'locks',
        key,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt < maxRetries - 1) {
        await sleep(retryMs);
      }
    }
  }

  logger.warn('Failed to acquire lock after max retries', {
    module: 'locks',
    key,
    maxRetries,
  });
  return null;
}

/**
 * Release a distributed lock.
 *
 * Only releases the lock if we own it (token matches).
 * This prevents releasing a lock that has expired and been acquired by another process.
 *
 * @param lock - The lock to release
 * @returns true if the lock was released, false if it was already released or expired
 */
export async function releaseLock(lock: Lock): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${lock.key}`;

  try {
    // Check if we still own the lock before deleting
    const currentToken = await kv.get(lockKey);

    if (currentToken === lock.token) {
      await kv.del(lockKey);
      logger.debug('Lock released', {
        module: 'locks',
        key: lock.key,
        token: lock.token,
      });
      return true;
    }

    // Lock was either released, expired, or taken by another process
    logger.debug('Lock not released - token mismatch or expired', {
      module: 'locks',
      key: lock.key,
      ourToken: lock.token,
      currentToken: currentToken ?? 'none',
    });
    return false;
  } catch (error) {
    logger.error('Error releasing lock', {
      module: 'locks',
      key: lock.key,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Execute a function while holding a distributed lock.
 *
 * Automatically acquires the lock, executes the function, and releases the lock.
 * Throws if the lock cannot be acquired.
 *
 * @param key - Lock key
 * @param options - Lock options
 * @param fn - Function to execute while holding the lock
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const result = await withLock('seat-limit:tenant123', { ttlMs: 5000 }, async () => {
 *   // Check seat count
 *   // Add member
 *   return membership;
 * });
 * ```
 */
export async function withLock<T>(
  key: string,
  options: LockOptions,
  fn: () => Promise<T>
): Promise<T> {
  const lock = await acquireLock(key, options);

  if (!lock) {
    throw new Error(`Unable to acquire lock for key: ${key}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(lock);
  }
}
