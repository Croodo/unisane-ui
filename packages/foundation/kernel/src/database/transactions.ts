/**
 * Database Transaction Support
 *
 * Provides transaction helpers for atomic multi-document operations.
 *
 * ## Important: MongoDB Replica Set Requirement
 *
 * MongoDB transactions **require a replica set**. In development, you can:
 * 1. Use `run-rs` npm package for a local replica set
 * 2. Use MongoDB Atlas (even free tier has replica set)
 * 3. Set `MONGODB_TRANSACTIONS_ENABLED=false` to use no-op passthrough
 *
 * ## Usage
 *
 * ```typescript
 * import { withTransaction, getSession } from '@unisane/kernel';
 *
 * // Simple usage - session is auto-managed
 * await withTransaction(async (session) => {
 *   await col('users').updateOne({ _id }, { $set: { name } }, { session });
 *   await col('audit').insertOne({ action: 'user.updated', userId: _id }, { session });
 * });
 *
 * // With return value
 * const result = await withTransaction(async (session) => {
 *   const user = await col('users').findOneAndUpdate(
 *     { _id },
 *     { $set: { name } },
 *     { session, returnDocument: 'after' }
 *   );
 *   return user;
 * });
 * ```
 *
 * ## When to Use Transactions
 *
 * Use transactions when you need atomicity across:
 * - Multiple document updates in the same collection
 * - Updates across multiple collections
 * - Read-then-write operations that must be consistent
 *
 * Examples:
 * - Tenant deletion (update memberships, subscriptions, files)
 * - Credit transfers (deduct from one ledger, add to another)
 * - User signup with initial tenant creation
 */

import type { ClientSession, TransactionOptions } from 'mongodb';
import { getEnv } from '../env';

// Import these dynamically to avoid circular dependencies
let _mongoClient: (() => import('mongodb').MongoClient | null) | null = null;

/**
 * Internal: Lazily load the mongo client accessor to avoid circular imports.
 */
async function getMongoClient(): Promise<import('mongodb').MongoClient | null> {
  if (!_mongoClient) {
    // Dynamic import to avoid circular dependency
    const { connectDb } = await import('./connection');
    try {
      return await connectDb();
    } catch {
      return null;
    }
  }
  return _mongoClient();
}

/**
 * Check if MongoDB transactions are enabled and available.
 *
 * Transactions require:
 * 1. MONGODB_TRANSACTIONS_ENABLED env var not set to 'false'
 * 2. MongoDB connected and running as a replica set
 */
export function isTransactionsEnabled(): boolean {
  const env = getEnv();
  // Check env var (allows disabling in local dev without replica set)
  if (env.MONGODB_TRANSACTIONS_ENABLED === false) {
    return false;
  }
  return true;
}

/**
 * Default transaction options for consistency.
 * Uses majority read/write concern for strong consistency.
 */
export const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  readConcern: { level: 'majority' },
  writeConcern: { w: 'majority' },
  // 30 second timeout for long-running transactions
  maxCommitTimeMS: 30000,
};

/**
 * Execute a function within a MongoDB transaction.
 *
 * If transactions are disabled or unavailable (no replica set),
 * the function is executed without a transaction (no-op passthrough).
 *
 * @param fn - Function to execute with the session
 * @param options - Optional transaction options
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * await withMongoTransaction(async (session) => {
 *   await col('users').updateOne({ _id }, { $set: { name } }, { session });
 *   await col('audit').insertOne({ action: 'user.updated' }, { session });
 * });
 * ```
 */
export async function withMongoTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  const client = await getMongoClient();

  // If no client or transactions disabled, run without transaction
  if (!client || !isTransactionsEnabled()) {
    // Create a mock session that does nothing
    // This allows code to work in both transactional and non-transactional modes
    return fn(null as unknown as ClientSession);
  }

  const session = client.startSession();
  const txnOptions = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };

  try {
    session.startTransaction(txnOptions);
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    // Only abort if transaction is in progress
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Execute a function within a transaction with automatic retry on transient errors.
 *
 * MongoDB can have transient errors (network issues, elections) that are safe to retry.
 * This wrapper handles those cases automatically.
 *
 * @param fn - Function to execute with the session
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param options - Optional transaction options
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * await withRetryableTransaction(async (session) => {
 *   // Critical operations that should survive transient failures
 *   await col('credits').updateOne({ tenantId }, { $inc: { balance: -100 } }, { session });
 *   await col('credits').updateOne({ tenantId: otherTenant }, { $inc: { balance: 100 } }, { session });
 * });
 * ```
 */
export async function withRetryableTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
  maxRetries = 3,
  options?: TransactionOptions
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withMongoTransaction(fn, options);
    } catch (error) {
      lastError = error as Error;

      // Check if this is a transient transaction error that can be retried
      if (isTransientTransactionError(error) && attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms...
        const delay = 100 * Math.pow(2, attempt - 1);
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries reached
      throw error;
    }
  }

  // Should not reach here, but TypeScript needs this
  throw lastError ?? new Error('Transaction failed after retries');
}

/**
 * Check if an error is a transient transaction error that can be retried.
 */
function isTransientTransactionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as {
    errorLabels?: string[];
    hasErrorLabel?: (label: string) => boolean;
    code?: number;
  };

  // MongoDB driver 4.x+ uses hasErrorLabel method
  if (typeof err.hasErrorLabel === 'function') {
    return (
      err.hasErrorLabel('TransientTransactionError') ||
      err.hasErrorLabel('UnknownTransactionCommitResult')
    );
  }

  // Fallback: check errorLabels array
  if (Array.isArray(err.errorLabels)) {
    return (
      err.errorLabels.includes('TransientTransactionError') ||
      err.errorLabels.includes('UnknownTransactionCommitResult')
    );
  }

  // Check for specific error codes that are typically transient
  // 112 = WriteConflict, 251 = TransactionAborted
  if (typeof err.code === 'number' && [112, 251].includes(err.code)) {
    return true;
  }

  return false;
}

/**
 * Simple sleep utility for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type for functions that accept an optional session parameter.
 * Useful for making operations transaction-aware.
 *
 * @example
 * ```typescript
 * async function updateUser(
 *   userId: string,
 *   data: UpdateUserData,
 *   options?: TransactionAwareOptions
 * ): Promise<User> {
 *   return col('users').findOneAndUpdate(
 *     { _id: userId },
 *     { $set: data },
 *     { ...options, returnDocument: 'after' }
 *   );
 * }
 *
 * // Can be used standalone
 * await updateUser(id, { name: 'New Name' });
 *
 * // Or within a transaction
 * await withMongoTransaction(async (session) => {
 *   await updateUser(id, { name: 'New Name' }, { session });
 * });
 * ```
 */
export interface TransactionAwareOptions {
  session?: ClientSession;
}
