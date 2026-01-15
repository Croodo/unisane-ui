/**
 * Resilient Adapter Pattern
 *
 * Combines all resilience patterns (circuit breaker, retry, failover, degradation)
 * into a single easy-to-use wrapper for adapters.
 *
 * @example
 * ```typescript
 * import { createResilientAdapter } from '@unisane/kernel';
 * import { StripeBillingAdapter } from '@unisane/billing-stripe';
 * import { RazorpayBillingAdapter } from '@unisane/billing-razorpay';
 *
 * // Create resilient billing adapter with failover
 * const billing = createResilientAdapter({
 *   name: 'billing',
 *   primary: new StripeBillingAdapter({ ... }),
 *   fallbacks: [new RazorpayBillingAdapter({ ... })],
 *   circuitBreaker: {
 *     failureThreshold: 5,
 *     resetTimeoutMs: 30000,
 *   },
 *   retry: {
 *     maxRetries: 3,
 *     baseDelayMs: 1000,
 *   },
 *   degradation: {
 *     fallback: () => ({ url: '/billing-unavailable' }),
 *   },
 * });
 *
 * // Use it - all resilience patterns applied automatically
 * const result = await billing.createCheckout({ ... });
 * ```
 */

import { CircuitBreaker, CircuitBreakerOptions, CircuitStats } from './circuit-breaker';
import { retry, RetryOptions, isRetryable } from './retry';
import { FailoverAdapter, FailoverOptions, NamedProvider } from './failover';
import { withFallback, FallbackOptions } from './degradation';
import { logger } from '../observability/logger';

/**
 * Options for creating a resilient adapter.
 */
export interface ResilientAdapterOptions<T extends NamedProvider> {
  /** Adapter name for logging */
  name: string;

  /** Primary adapter */
  primary: T;

  /** Fallback adapters for failover */
  fallbacks?: T[];

  /** Circuit breaker options */
  circuitBreaker?: CircuitBreakerOptions;

  /** Retry options */
  retry?: RetryOptions;

  /** Failover options */
  failover?: Omit<FailoverOptions, 'circuitBreakerOptions'>;

  /**
   * Degradation fallback when all adapters fail.
   *
   * **Warning:** The fallback function must return a value compatible with the
   * operation's return type. Type safety is not enforced at compile time because
   * the adapter wraps operations generically.
   */
  degradation?: {
    /**
     * Fallback function to call when all else fails.
     * Must return a value compatible with the expected return type of the operation.
     */
    fallback: () => unknown;
    /** Options for fallback behavior */
    options?: FallbackOptions;
  };

  /** Health check function for the adapter */
  healthCheck?: (adapter: T) => Promise<boolean>;

  /** Timeout for operations (ms) */
  timeoutMs?: number;
}

/**
 * Resilient adapter wrapper that combines all resilience patterns.
 */
export class ResilientAdapter<T extends NamedProvider> {
  private readonly name: string;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly failoverAdapter?: FailoverAdapter<T>;
  private readonly retryOptions?: RetryOptions;
  private readonly degradationFallback?: () => unknown;
  private readonly degradationOptions?: FallbackOptions;
  private readonly healthCheckFn?: (adapter: T) => Promise<boolean>;
  private readonly timeoutMs: number;
  private readonly primary: T;
  private readonly log = logger.child({ module: 'resilient-adapter' });

  constructor(options: ResilientAdapterOptions<T>) {
    this.name = options.name;
    this.primary = options.primary;
    this.timeoutMs = options.timeoutMs ?? 30000;
    this.retryOptions = options.retry;
    this.degradationFallback = options.degradation?.fallback;
    this.degradationOptions = options.degradation?.options;
    this.healthCheckFn = options.healthCheck;

    // Create circuit breaker
    this.circuitBreaker = new CircuitBreaker(
      `resilient:${options.name}`,
      options.circuitBreaker
    );

    // Create failover adapter if fallbacks provided
    if (options.fallbacks && options.fallbacks.length > 0) {
      this.failoverAdapter = new FailoverAdapter(
        options.primary,
        options.fallbacks,
        {
          ...options.failover,
          circuitBreakerOptions: options.circuitBreaker,
        }
      );
    }
  }

  /**
   * Execute an operation with all resilience patterns applied.
   */
  async execute<R>(
    fn: (adapter: T) => Promise<R>,
    operationName?: string
  ): Promise<R> {
    const opName = operationName ?? 'operation';
    const start = Date.now();

    this.log.debug('executing resilient operation', {
      adapter: this.name,
      operation: opName,
    });

    try {
      // If we have failover, use it
      if (this.failoverAdapter) {
        const result = await this.executeWithFailover(fn, opName);
        this.logSuccess(opName, Date.now() - start);
        return result;
      }

      // Otherwise use circuit breaker + retry
      const result = await this.executeWithCircuitBreaker(fn, opName);
      this.logSuccess(opName, Date.now() - start);
      return result;
    } catch (error) {
      // Try degradation fallback if available
      if (this.degradationFallback) {
        this.log.warn('using degradation fallback', {
          adapter: this.name,
          operation: opName,
          error: error instanceof Error ? error.message : String(error),
        });

        return (await withFallback(
          () => Promise.reject(error),
          this.degradationFallback as () => Promise<R>,
          this.degradationOptions
        )) as R;
      }

      throw error;
    }
  }

  /**
   * Execute with failover adapter (includes circuit breaker per provider).
   */
  private async executeWithFailover<R>(
    fn: (adapter: T) => Promise<R>,
    opName: string
  ): Promise<R> {
    if (!this.failoverAdapter) {
      throw new Error('Failover adapter not configured');
    }

    // Add retry logic around failover
    if (this.retryOptions) {
      const retryResult = await retry(
        async () => {
          const result = await this.failoverAdapter!.execute(fn, opName);
          return result.result;
        },
        {
          ...this.retryOptions,
          shouldRetry: (error) => {
            // Don't retry if all providers failed
            if (error.name === 'AllProvidersFailedError') {
              return false;
            }
            return isRetryable(error);
          },
        }
      );
      return retryResult.result;
    }

    const result = await this.failoverAdapter.execute(fn, opName);
    return result.result;
  }

  /**
   * Execute with circuit breaker (no failover).
   */
  private async executeWithCircuitBreaker<R>(
    fn: (adapter: T) => Promise<R>,
    opName: string
  ): Promise<R> {
    // Add retry logic around circuit breaker
    if (this.retryOptions) {
      const retryResult = await retry(
        () => this.circuitBreaker.execute(() => fn(this.primary)),
        {
          ...this.retryOptions,
          shouldRetry: (error) => {
            // Don't retry if circuit is open
            if (error.name === 'CircuitOpenError') {
              return false;
            }
            return isRetryable(error);
          },
        }
      );
      return retryResult.result;
    }

    return this.circuitBreaker.execute(() => fn(this.primary));
  }

  /**
   * Log successful operation.
   */
  private logSuccess(opName: string, durationMs: number): void {
    this.log.debug('operation completed', {
      adapter: this.name,
      operation: opName,
      durationMs,
    });
  }

  /**
   * Create a proxy that wraps all async methods with resilience.
   */
  createProxy(): T {
    const self = this;
    const handler: ProxyHandler<T> = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        // Skip name property
        if (prop === 'name') {
          return `resilient:${self.name}`;
        }

        // Wrap async methods
        if (typeof value === 'function') {
          return async function (this: unknown, ...args: unknown[]) {
            return self.execute(async (adapter) => {
              const method = (adapter as Record<string, unknown>)[prop as string];
              if (typeof method === 'function') {
                return method.apply(adapter, args);
              }
              throw new Error(`Method ${String(prop)} not found on adapter`);
            }, String(prop));
          };
        }

        return value;
      },
    };

    return new Proxy(this.primary, handler);
  }

  /**
   * Run health check on the adapter.
   */
  async healthCheck(): Promise<boolean> {
    if (!this.healthCheckFn) {
      // If no health check defined, check circuit state
      return this.circuitBreaker.getState() !== 'OPEN';
    }

    try {
      return await this.healthCheckFn(this.primary);
    } catch {
      return false;
    }
  }

  /**
   * Get adapter statistics.
   */
  getStats(): ResilientAdapterStats {
    return {
      name: this.name,
      circuitState: this.circuitBreaker.getState(),
      circuitStats: this.circuitBreaker.getStats(),
      failoverStats: this.failoverAdapter?.getStats(),
    };
  }

  /**
   * Reset the adapter (circuit breaker and failover).
   */
  reset(): void {
    this.circuitBreaker.reset();
    this.failoverAdapter?.resetCircuits();
    this.failoverAdapter?.resetToPrimary();
    this.log.info('resilient adapter reset', { adapter: this.name });
  }
}

/**
 * Statistics for a resilient adapter.
 */
export interface ResilientAdapterStats {
  name: string;
  circuitState: string;
  circuitStats: CircuitStats;
  failoverStats?: {
    primaryName: string;
    fallbackCount: number;
    currentProvider: string;
    failoverCount: number;
  };
}

/**
 * Create a resilient adapter with all patterns applied.
 */
export function createResilientAdapter<T extends NamedProvider>(
  options: ResilientAdapterOptions<T>
): ResilientAdapter<T> {
  return new ResilientAdapter(options);
}

/**
 * Create a resilient adapter and return a proxy for transparent usage.
 */
export function createResilientProxy<T extends NamedProvider>(
  options: ResilientAdapterOptions<T>
): T {
  return new ResilientAdapter(options).createProxy();
}
