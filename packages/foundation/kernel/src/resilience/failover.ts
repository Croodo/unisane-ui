/**
 * Failover Adapter Pattern
 *
 * Provides automatic failover to backup providers when the primary fails.
 * Integrates with circuit breaker for intelligent failure detection.
 *
 * @example
 * ```typescript
 * import { createFailoverAdapter, CircuitBreaker } from '@unisane/kernel';
 *
 * // Create payment provider with automatic failover
 * const paymentProvider = createFailoverAdapter<PaymentProvider>(
 *   stripePrimary,
 *   [paypalFallback, razorpayFallback],
 *   {
 *     circuitBreakerOptions: { failureThreshold: 3 },
 *     onFailover: (from, to) => logger.warn('Payment failover', { from, to }),
 *   }
 * );
 *
 * // Use like a normal provider - failover is automatic
 * const result = await paymentProvider.charge(amount);
 * ```
 */

import { CircuitBreaker, CircuitBreakerOptions, CircuitOpenError } from './circuit-breaker';
import { logger } from '../observability/logger';
import { recordFailoverEvent } from './metrics';

/**
 * Named provider interface.
 */
export interface NamedProvider {
  /** Provider name for identification */
  readonly name: string;
}

/**
 * Failover adapter options.
 */
export interface FailoverOptions {
  /** Circuit breaker options for each provider */
  circuitBreakerOptions?: CircuitBreakerOptions;

  /** Called when failover occurs */
  onFailover?: (fromProvider: string, toProvider: string, error: Error) => void;

  /** Called when all providers fail */
  onAllFailed?: (errors: Array<{ provider: string; error: Error }>) => void;

  /** Maximum time to try failover chain (ms, default: 30000) */
  maxFailoverTimeMs?: number;

  /**
   * Methods to wrap with failover logic in createProxy().
   * If not specified, ALL functions are wrapped (making them async).
   * Specify method names to only wrap specific operations.
   *
   * @example
   * ```typescript
   * createFailoverAdapter(primary, fallbacks, {
   *   methods: ['charge', 'refund', 'createSubscription'],
   * });
   * // Only these methods get failover; getName() stays sync
   * ```
   */
  methods?: string[];
}

/**
 * Failover statistics.
 */
export interface FailoverStats {
  primaryName: string;
  fallbackCount: number;
  currentProvider: string;
  failoverCount: number;
  lastFailover?: {
    from: string;
    to: string;
    at: Date;
    reason: string;
  };
  providerStats: Array<{
    name: string;
    isPrimary: boolean;
    isActive: boolean;
    circuitState: string;
    failures: number;
  }>;
}

/**
 * Result of a failover execution.
 */
export interface FailoverResult<T> {
  result: T;
  usedProvider: string;
  wasFailover: boolean;
  attemptedProviders: string[];
}

/**
 * Error thrown when all providers fail.
 */
export class AllProvidersFailedError extends Error {
  constructor(
    public readonly attempts: Array<{ provider: string; error: Error }>
  ) {
    const providerNames = attempts.map((a) => a.provider).join(', ');
    super(`All providers failed: ${providerNames}`);
    this.name = 'AllProvidersFailedError';
  }
}

/**
 * Failover adapter that wraps providers with automatic failover.
 */
export class FailoverAdapter<T extends NamedProvider> {
  private readonly circuits: Map<string, CircuitBreaker> = new Map();
  private currentProviderIndex = 0;
  private failoverCount = 0;
  private lastFailover?: {
    from: string;
    to: string;
    at: Date;
    reason: string;
  };

  private readonly allProviders: T[];
  private readonly maxFailoverTimeMs: number;
  private readonly onFailover?: (from: string, to: string, error: Error) => void;
  private readonly onAllFailed?: (errors: Array<{ provider: string; error: Error }>) => void;

  constructor(
    private readonly primary: T,
    private readonly fallbacks: T[],
    private readonly options: FailoverOptions = {}
  ) {
    this.allProviders = [primary, ...fallbacks];
    this.maxFailoverTimeMs = options.maxFailoverTimeMs ?? 30000;
    this.onFailover = options.onFailover;
    this.onAllFailed = options.onAllFailed;

    // Initialize circuit breakers for each provider
    for (const provider of this.allProviders) {
      this.circuits.set(
        provider.name,
        new CircuitBreaker(`failover:${provider.name}`, options.circuitBreakerOptions)
      );
    }
  }

  /**
   * Get the current active provider.
   */
  getCurrentProvider(): T {
    const provider = this.allProviders[this.currentProviderIndex];
    if (!provider) {
      throw new Error('No provider available');
    }
    return provider;
  }

  /**
   * Execute a function on the current provider with automatic failover.
   */
  async execute<R>(
    fn: (provider: T) => Promise<R>,
    operationName?: string
  ): Promise<FailoverResult<R>> {
    const startTime = Date.now();
    const attemptedProviders: string[] = [];
    const errors: Array<{ provider: string; error: Error }> = [];

    // Try each provider starting from current
    for (let i = 0; i < this.allProviders.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.allProviders.length;
      const provider = this.allProviders[providerIndex];

      if (!provider) continue;

      const circuit = this.circuits.get(provider.name);
      if (!circuit) continue;

      // Check timeout
      if (Date.now() - startTime > this.maxFailoverTimeMs) {
        break;
      }

      attemptedProviders.push(provider.name);

      try {
        // Try to execute through circuit breaker
        const result = await circuit.execute(() => fn(provider));

        // Success! If we failed over, update current provider
        const wasFailover = i > 0;
        if (wasFailover && this.currentProviderIndex !== providerIndex) {
          const currentProvider = this.allProviders[this.currentProviderIndex];
          const oldProviderName = currentProvider?.name ?? 'unknown';
          this.currentProviderIndex = providerIndex;
          this.failoverCount++;
          this.lastFailover = {
            from: oldProviderName,
            to: provider.name,
            at: new Date(),
            reason: errors[errors.length - 1]?.error.message ?? 'Unknown',
          };

          logger.warn('Failover successful', {
            operation: operationName,
            from: oldProviderName,
            to: provider.name,
            attempts: attemptedProviders,
          });

          // Record failover metrics
          recordFailoverEvent(
            `failover:${this.primary.name}`,
            oldProviderName,
            provider.name
          );

          this.onFailover?.(
            oldProviderName,
            provider.name,
            errors[errors.length - 1]?.error ?? new Error('Unknown')
          );
        }

        return {
          result,
          usedProvider: provider.name,
          wasFailover,
          attemptedProviders,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ provider: provider.name, error: err });

        // Log failure
        if (!(error instanceof CircuitOpenError)) {
          logger.warn('Provider failed, attempting failover', {
            operation: operationName,
            provider: provider.name,
            error: err.message,
            remainingProviders: this.allProviders.length - i - 1,
          });
        }
      }
    }

    // All providers failed
    logger.error('All providers failed', {
      operation: operationName,
      attempts: errors.map((e) => ({ provider: e.provider, error: e.error.message })),
    });

    this.onAllFailed?.(errors);
    throw new AllProvidersFailedError(errors);
  }

  /**
   * Create a proxy that automatically wraps methods with failover.
   *
   * By default, ALL functions are wrapped (making them async).
   * Use the `methods` option to specify which methods to wrap,
   * leaving other functions as-is (preserving sync behavior).
   *
   * @example
   * ```typescript
   * // Wrap all methods (default behavior)
   * const proxy = adapter.createProxy();
   *
   * // Or configure specific methods via options
   * const adapter = createFailoverAdapter(primary, fallbacks, {
   *   methods: ['charge', 'refund'], // Only these get failover
   * });
   * ```
   */
  createProxy(): T {
    const self = this;
    const methodsToWrap = this.options.methods;
    const handler: ProxyHandler<T> = {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        // Skip name property
        if (prop === 'name') {
          return `failover:${self.primary.name}`;
        }

        // Wrap methods with failover logic
        if (typeof value === 'function') {
          const propName = String(prop);

          // If methods list is specified, only wrap those methods
          if (methodsToWrap && !methodsToWrap.includes(propName)) {
            // Return original function unchanged (keeps sync behavior)
            return value;
          }

          return async function (this: unknown, ...args: unknown[]) {
            const result = await self.execute(
              async (provider) => {
                const method = (provider as Record<string, unknown>)[propName];
                if (typeof method === 'function') {
                  return method.apply(provider, args);
                }
                throw new Error(`Method ${propName} not found on provider`);
              },
              propName
            );
            return result.result;
          };
        }

        return value;
      },
    };

    return new Proxy(this.primary, handler);
  }

  /**
   * Get failover statistics.
   */
  getStats(): FailoverStats {
    return {
      primaryName: this.primary.name,
      fallbackCount: this.fallbacks.length,
      currentProvider: this.getCurrentProvider().name,
      failoverCount: this.failoverCount,
      lastFailover: this.lastFailover,
      providerStats: this.allProviders.map((p, i) => ({
        name: p.name,
        isPrimary: i === 0,
        isActive: i === this.currentProviderIndex,
        circuitState: this.circuits.get(p.name)?.getState() ?? 'UNKNOWN',
        failures: this.circuits.get(p.name)?.getStats().failures ?? 0,
      })),
    };
  }

  /**
   * Reset to primary provider.
   * Call this when you want to try the primary again.
   */
  resetToPrimary(): void {
    this.currentProviderIndex = 0;
    logger.info('Failover reset to primary', { primary: this.primary.name });
  }

  /**
   * Reset all circuit breakers.
   */
  resetCircuits(): void {
    for (const circuit of this.circuits.values()) {
      circuit.reset();
    }
    logger.info('All failover circuits reset');
  }
}

/**
 * Create a failover adapter for a provider.
 *
 * @example
 * ```typescript
 * const failoverProvider = createFailoverAdapter(
 *   stripeProvider,
 *   [paypalProvider, razorpayProvider],
 *   { circuitBreakerOptions: { failureThreshold: 3 } }
 * );
 *
 * // Use directly with execute
 * const { result } = await failoverProvider.execute(p => p.charge(100));
 *
 * // Or create a proxy for transparent usage
 * const provider = failoverProvider.createProxy();
 * await provider.charge(100); // Automatic failover
 * ```
 */
export function createFailoverAdapter<T extends NamedProvider>(
  primary: T,
  fallbacks: T[],
  options?: FailoverOptions
): FailoverAdapter<T> {
  return new FailoverAdapter(primary, fallbacks, options);
}
