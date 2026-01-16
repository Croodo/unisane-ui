/**
 * Timeout Utilities
 *
 * Provides timeout protection for async operations using AbortController.
 * Ensures proper cleanup to prevent timer memory leaks.
 *
 * @example
 * ```typescript
 * import { withTimeout, fetchWithTimeout, TimeoutError } from '@unisane/kernel';
 *
 * // Wrap any promise with timeout
 * const result = await withTimeout(
 *   expensiveOperation(),
 *   { timeoutMs: 5000, operation: 'expensive-op' }
 * );
 *
 * // Fetch with timeout
 * const response = await fetchWithTimeout('https://api.example.com/data', {
 *   timeoutMs: 10000,
 * });
 * ```
 */

import { TimeoutError } from '../errors/common';

/**
 * Options for withTimeout.
 */
export interface TimeoutOptions {
  /** Timeout duration in milliseconds */
  timeoutMs: number;
  /** Operation name for error messages and logging */
  operation?: string;
}

/**
 * Wrap a promise with timeout protection.
 * Throws TimeoutError if the promise doesn't resolve within the specified time.
 *
 * @example
 * ```typescript
 * try {
 *   const result = await withTimeout(
 *     database.query('SELECT * FROM users'),
 *     { timeoutMs: 5000, operation: 'database.query' }
 *   );
 * } catch (err) {
 *   if (err instanceof TimeoutError) {
 *     console.log('Query took too long');
 *   }
 *   throw err;
 * }
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, operation = 'unknown' } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Options for fetchWithTimeout.
 */
export interface FetchWithTimeoutOptions extends RequestInit {
  /** Timeout duration in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/**
 * Fetch with built-in timeout using AbortController.
 * This properly aborts the fetch request when timeout occurs.
 *
 * @example
 * ```typescript
 * const response = await fetchWithTimeout('https://api.example.com/data', {
 *   method: 'POST',
 *   timeoutMs: 10000,
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ data: 'value' }),
 * });
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`fetch(${url})`, timeoutMs);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Default timeout configuration for different operation types.
 * Can be overridden via environment variables.
 */
export const DEFAULT_TIMEOUTS = {
  database: {
    query: parseInt(process.env.TIMEOUT_DB_QUERY ?? '30000', 10),
    healthCheck: parseInt(process.env.TIMEOUT_DB_HEALTH ?? '5000', 10),
    connection: parseInt(process.env.TIMEOUT_DB_CONNECT ?? '10000', 10),
  },
  adapters: {
    billing: parseInt(process.env.TIMEOUT_BILLING ?? '10000', 10),
    email: parseInt(process.env.TIMEOUT_EMAIL ?? '10000', 10),
    storage: parseInt(process.env.TIMEOUT_STORAGE ?? '60000', 10),
    jobs: parseInt(process.env.TIMEOUT_JOBS ?? '5000', 10),
  },
  external: {
    default: parseInt(process.env.TIMEOUT_EXTERNAL ?? '30000', 10),
  },
} as const;
