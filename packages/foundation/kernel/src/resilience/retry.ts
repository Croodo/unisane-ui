/**
 * Retry Pattern with Exponential Backoff
 *
 * Provides intelligent retry logic for transient failures with:
 * - Exponential backoff with jitter
 * - Configurable retry conditions
 * - Maximum retry limits
 *
 * @example
 * ```typescript
 * import { retry, isRetryable } from '@unisane/kernel';
 *
 * const result = await retry(
 *   () => fetchExternalApi(),
 *   {
 *     maxRetries: 3,
 *     baseDelayMs: 1000,
 *     shouldRetry: (error) => isRetryable(error),
 *   }
 * );
 * ```
 */

import { logger } from '../observability/logger';

/**
 * Options for retry behavior.
 */
export interface RetryOptions {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;

  /** Base delay in ms for backoff calculation (default: 1000) */
  baseDelayMs?: number;

  /** Maximum delay between retries in ms (default: 30000) */
  maxDelayMs?: number;

  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;

  /** Add random jitter to prevent thundering herd (default: true) */
  jitter?: boolean;

  /** Custom function to determine if error should be retried */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /** Called before each retry attempt */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;

  /** Operation name for logging */
  operationName?: string;
}

/**
 * Result of a retry operation.
 */
export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDurationMs: number;
  errors: Error[];
}

/**
 * Error thrown when all retries are exhausted.
 */
export class RetriesExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastError: Error,
    public readonly allErrors: Error[],
    operationName?: string
  ) {
    super(
      `Retries exhausted after ${attempts} attempts${operationName ? ` for '${operationName}'` : ''}: ${lastError.message}`
    );
    this.name = 'RetriesExhaustedError';
  }
}

/**
 * Default retry condition - retries network and timeout errors.
 */
export function isRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Common retryable errors
  const retryablePatterns = [
    'timeout',
    'timed out',
    'econnreset',
    'econnrefused',
    'enotfound',
    'network',
    'socket hang up',
    'unavailable',
    'service unavailable',
    '503',
    '502',
    '504',
    'too many requests',
    '429',
    'rate limit',
    'temporary',
    'transient',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern) || name.includes(pattern));
}

/**
 * Calculate delay with exponential backoff and optional jitter.
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
  jitter: boolean
): number {
  // Exponential backoff: base * (multiplier ^ attempt)
  let delay = baseDelayMs * Math.pow(multiplier, attempt - 1);

  // Cap at maximum
  delay = Math.min(delay, maxDelayMs);

  // Add jitter (random 0-50% reduction to prevent thundering herd)
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const data = await retry(() => fetchData());
 *
 * // With options
 * const result = await retry(
 *   () => externalApiCall(),
 *   {
 *     maxRetries: 5,
 *     baseDelayMs: 500,
 *     shouldRetry: (e) => e.message.includes('timeout'),
 *     onRetry: (e, attempt) => console.log(`Retry ${attempt}`)
 *   }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitter = true,
    shouldRetry = isRetryable,
    onRetry,
    operationName,
  } = options;

  const startTime = Date.now();
  const errors: Error[] = [];
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;

    try {
      const result = await fn();
      return {
        result,
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
        errors,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      // Check if we should retry
      if (attempt > maxRetries || !shouldRetry(err, attempt)) {
        logger.warn(`${operationName ?? 'Operation'} failed permanently`, {
          operation: operationName,
          attempt,
          maxRetries,
          error: err.message,
        });

        throw new RetriesExhaustedError(attempt, err, errors, operationName);
      }

      // Calculate delay
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs, backoffMultiplier, jitter);

      logger.debug(`${operationName ?? 'Operation'} failed, retrying`, {
        operation: operationName,
        attempt,
        maxRetries,
        delayMs: delay,
        error: err.message,
      });

      // Call onRetry callback
      onRetry?.(err, attempt, delay);

      // Wait before retry
      await sleep(delay);
    }
  }

  // This shouldn't be reached, but just in case
  throw new RetriesExhaustedError(
    attempt,
    errors[errors.length - 1] ?? new Error('Unknown error'),
    errors,
    operationName
  );
}

/**
 * Create a retryable version of a function.
 *
 * @example
 * ```typescript
 * const retryableFetch = withRetry(fetchData, { maxRetries: 3 });
 * const data = await retryableFetch('https://api.example.com');
 * ```
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<RetryResult<TResult>> {
  return (...args: TArgs) => retry(() => fn(...args), options);
}

/**
 * Decorates a class method with retry logic.
 * Use as a method decorator.
 *
 * @example
 * ```typescript
 * class ApiClient {
 *   @Retryable({ maxRetries: 3 })
 *   async fetchUser(id: string) {
 *     return fetch(`/users/${id}`);
 *   }
 * }
 * ```
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const result = await retry(
        () => originalMethod.apply(this, args),
        { ...options, operationName: options.operationName ?? propertyKey }
      );
      return result.result;
    };

    return descriptor;
  };
}
