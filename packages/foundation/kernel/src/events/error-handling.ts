/**
 * Event Handler Error Handling Utilities
 *
 * Provides standardized error handling patterns for event handlers.
 * Use these utilities to ensure consistent behavior across all modules.
 *
 * ## Error Handling Tiers
 *
 * | Tier | Behavior | Use Case | Example |
 * |------|----------|----------|---------|
 * | Critical | Throw, event system retries | Billing, user creation | Payment recording |
 * | Important | Throw, fail cascade | Core setup operations | Membership creation |
 * | Non-Critical | Log, continue cascade | Cache invalidation, seat updates | Settings cleanup |
 * | Monitoring | Log only, never throw | Audit logging | Audit trail |
 *
 * ## Usage
 *
 * ```typescript
 * import { withErrorHandling, ErrorTier } from '@unisane/kernel';
 *
 * // Critical handler - will throw, outbox will retry
 * const handlePayment = withErrorHandling(
 *   async (payload) => { await recordPayment(payload); },
 *   { tier: 'critical', context: 'billing.payment' }
 * );
 *
 * // Non-critical handler - will log and continue
 * const handleCacheInvalidation = withErrorHandling(
 *   async (payload) => { await invalidateCache(payload); },
 *   { tier: 'non-critical', context: 'flags.cache' }
 * );
 * ```
 */

import { logger } from '../observability/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * Error handling tier determines behavior on failure.
 */
export type ErrorTier = 'critical' | 'important' | 'non-critical' | 'monitoring';

/**
 * Options for error handling wrapper.
 */
export interface ErrorHandlingOptions {
  /**
   * Error tier determines behavior on failure.
   * - critical: Throw, allow retry (billing, payments)
   * - important: Throw, fail cascade (core setup)
   * - non-critical: Log, continue (cache, settings)
   * - monitoring: Log only (audit)
   */
  tier: ErrorTier;

  /**
   * Context for logging (e.g., 'billing.payment', 'identity.membership').
   */
  context: string;

  /**
   * Custom logger instance.
   */
  logger?: {
    debug: (msg: string, data?: Record<string, unknown>) => void;
    warn: (msg: string, data?: Record<string, unknown>) => void;
    error: (msg: string, data?: Record<string, unknown>) => void;
  };

  /**
   * Callback when error is caught (for tracking cascade errors).
   */
  onError?: (error: Error, context: string) => void;
}

/**
 * Result of a handled operation.
 */
export interface HandledResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
}

// =============================================================================
// Error Handling Wrapper
// =============================================================================

/**
 * Wrap a handler function with standardized error handling.
 *
 * @param handler - The handler function to wrap
 * @param options - Error handling options
 * @returns Wrapped handler with appropriate error behavior
 *
 * @example
 * ```typescript
 * // Critical: will throw on error (outbox will retry)
 * const criticalHandler = withErrorHandling(
 *   async (payload) => await recordPayment(payload),
 *   { tier: 'critical', context: 'billing.payment' }
 * );
 *
 * // Non-critical: will log and continue
 * const nonCriticalHandler = withErrorHandling(
 *   async (payload) => await invalidateCache(payload),
 *   { tier: 'non-critical', context: 'flags.cache' }
 * );
 * ```
 */
export function withErrorHandling<T, R>(
  handler: (payload: T) => Promise<R>,
  options: ErrorHandlingOptions
): (payload: T) => Promise<R | undefined> {
  const { tier, context, onError } = options;
  const log = options.logger ?? {
    debug: (msg: string, data?: Record<string, unknown>) =>
      logger.debug(msg, { module: 'events', context, ...data }),
    warn: (msg: string, data?: Record<string, unknown>) =>
      logger.warn(msg, { module: 'events', context, ...data }),
    error: (msg: string, data?: Record<string, unknown>) =>
      logger.error(msg, { module: 'events', context, ...data }),
  };

  return async (payload: T): Promise<R | undefined> => {
    try {
      return await handler(payload);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Call error callback if provided (for tracking cascade errors)
      if (onError) {
        onError(err, context);
      }

      switch (tier) {
        case 'critical':
          // Critical: always throw, outbox will retry
          log.error(`critical operation failed: ${context}`, {
            error: err.message,
            tier,
          });
          throw error;

        case 'important':
          // Important: throw to fail cascade, but log clearly
          log.error(`important operation failed: ${context}`, {
            error: err.message,
            tier,
          });
          throw error;

        case 'non-critical':
          // Non-critical: log warning, continue cascade
          log.warn(`non-critical operation failed, continuing: ${context}`, {
            error: err.message,
            tier,
          });
          return undefined;

        case 'monitoring':
          // Monitoring: log only, never throw
          log.debug(`monitoring operation failed: ${context}`, {
            error: err.message,
            tier,
          });
          return undefined;

        default:
          // Default to throwing for safety
          log.error(`operation failed: ${context}`, {
            error: err.message,
            tier,
          });
          throw error;
      }
    }
  };
}

// =============================================================================
// Cascade Error Tracker
// =============================================================================

/**
 * Track errors during cascade operations.
 * Use this to collect errors and include them in completion events.
 *
 * @example
 * ```typescript
 * const tracker = createCascadeErrorTracker('tenant.deleted');
 *
 * // Use in handlers
 * await withErrorHandling(
 *   async () => { ... },
 *   { tier: 'non-critical', context: 'cleanup.apikeys', onError: tracker.track }
 * );
 *
 * // Include in completion event
 * await emitTypedReliable('cascade.completed', {
 *   ...results,
 *   errors: tracker.getErrors(),
 * });
 * ```
 */
export interface CascadeErrorTracker {
  /**
   * Track an error that occurred during cascade.
   */
  track: (error: Error, context: string) => void;

  /**
   * Get all tracked errors.
   */
  getErrors: () => Array<{ context: string; message: string }>;

  /**
   * Check if any errors were tracked.
   */
  hasErrors: () => boolean;

  /**
   * Get count of tracked errors.
   */
  count: () => number;
}

/**
 * Create a cascade error tracker.
 *
 * @param cascadeName - Name of the cascade for logging
 * @returns Error tracker instance
 */
export function createCascadeErrorTracker(cascadeName: string): CascadeErrorTracker {
  const errors: Array<{ context: string; message: string }> = [];
  const log = logger.child({ module: 'events', cascade: cascadeName });

  return {
    track: (error: Error, context: string) => {
      errors.push({ context, message: error.message });
      log.warn('cascade operation error tracked', {
        context,
        error: error.message,
        totalErrors: errors.length,
      });
    },

    getErrors: () => [...errors],

    hasErrors: () => errors.length > 0,

    count: () => errors.length,
  };
}

// =============================================================================
// Retry Helper
// =============================================================================

/**
 * Options for event handler retry logic.
 * Named differently from resilience/retry.ts to avoid conflicts.
 */
export interface EventRetryOptions {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in ms.
   * @default 100
   */
  initialDelayMs?: number;

  /**
   * Maximum delay in ms.
   * @default 5000
   */
  maxDelayMs?: number;

  /**
   * Backoff multiplier.
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Whether to add jitter to delays.
   * @default true
   */
  jitter?: boolean;

  /**
   * Function to determine if error is retryable.
   * @default () => true
   */
  isRetryable?: (error: Error) => boolean;

  /**
   * Context for logging.
   */
  context?: string;
}

/**
 * Execute a function with retry logic.
 * Use for transient failures in event handlers.
 *
 * Note: Named `withEventRetry` to avoid conflict with `retry` from resilience module.
 *
 * @param fn - Function to execute
 * @param options - Retry options
 * @returns Result of successful execution
 * @throws Last error if all retries failed
 *
 * @example
 * ```typescript
 * const result = await withEventRetry(
 *   () => externalApi.call(data),
 *   { maxAttempts: 3, context: 'billing.api' }
 * );
 * ```
 */
export async function withEventRetry<T>(
  fn: () => Promise<T>,
  options?: EventRetryOptions
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 5000,
    backoffMultiplier = 2,
    jitter = true,
    isRetryable = () => true,
    context = 'retry',
  } = options ?? {};

  const log = logger.child({ module: 'events', context });
  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !isRetryable(lastError)) {
        log.error('all retry attempts failed', {
          attempt,
          maxAttempts,
          error: lastError.message,
        });
        throw lastError;
      }

      // Calculate delay with optional jitter
      const actualDelay = jitter
        ? delay * (0.5 + Math.random())
        : delay;

      log.debug('retrying after failure', {
        attempt,
        maxAttempts,
        delayMs: Math.round(actualDelay),
        error: lastError.message,
      });

      await sleep(actualDelay);
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // Should not reach here, but TypeScript needs this
  throw lastError ?? new Error('Retry failed');
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Common Retry Presets
// =============================================================================

/**
 * Preset retry options for common scenarios.
 */
export const RetryPresets = {
  /**
   * Quick retries for fast failures (cache, local DB).
   */
  quick: {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 500,
    backoffMultiplier: 2,
  } satisfies EventRetryOptions,

  /**
   * Standard retries for external APIs.
   */
  standard: {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
  } satisfies EventRetryOptions,

  /**
   * Extended retries for critical operations.
   */
  extended: {
    maxAttempts: 5,
    initialDelayMs: 200,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  } satisfies EventRetryOptions,
} as const;
