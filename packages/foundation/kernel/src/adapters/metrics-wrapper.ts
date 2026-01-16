/**
 * Adapter Metrics Wrapper
 *
 * Wraps adapter methods to automatically record metrics:
 * - Operation duration (histogram)
 * - Operation count (counter)
 * - Success/failure rates
 *
 * @example
 * ```typescript
 * const adapter = createStripeAdapter({ ... });
 * const instrumentedAdapter = withAdapterMetrics(adapter, 'stripe');
 * // All calls will now be instrumented with metrics
 * ```
 */

import { getMetricsProvider, ADAPTER_METRICS } from '../ports/metrics.port';

/**
 * Wrap an adapter with metrics instrumentation.
 *
 * @param adapter - The adapter object to wrap
 * @param adapterName - Name of the adapter for metric labels
 * @returns The wrapped adapter with all methods instrumented
 */
export function withAdapterMetrics<T extends object>(
  adapter: T,
  adapterName: string
): T {
  return new Proxy(adapter, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      // Only wrap functions
      if (typeof original !== 'function') {
        return original;
      }

      // Return wrapped function that records metrics
      return async function (this: unknown, ...args: unknown[]) {
        const operation = String(prop);
        const start = Date.now();
        let success = true;
        let errorType: string | undefined;

        try {
          const result = await original.apply(this === receiver ? target : this, args);
          return result;
        } catch (error) {
          success = false;
          errorType = error instanceof Error ? error.name : 'Unknown';
          throw error;
        } finally {
          const durationMs = Date.now() - start;
          const metrics = getMetricsProvider();

          if (metrics) {
            // Record timing
            metrics.timing(ADAPTER_METRICS.OPERATION_DURATION, durationMs, {
              adapter: adapterName,
              operation,
              success: String(success),
            });

            // Record count
            metrics.increment(ADAPTER_METRICS.OPERATION_COUNT, {
              adapter: adapterName,
              operation,
              success: String(success),
              ...(errorType && { error_type: errorType }),
            });
          }
        }
      };
    },
  });
}

/**
 * Record an adapter retry attempt.
 *
 * @param adapterName - Name of the adapter
 * @param operation - Operation being retried
 * @param attempt - Current retry attempt number
 */
export function recordAdapterRetry(
  adapterName: string,
  operation: string,
  attempt: number
): void {
  const metrics = getMetricsProvider();
  if (metrics) {
    metrics.increment(ADAPTER_METRICS.RETRY_COUNT, {
      adapter: adapterName,
      operation,
      attempt: String(attempt),
    });
  }
}

/**
 * Circuit breaker state values for gauge metric.
 */
export const CircuitBreakerStateValue = {
  CLOSED: 0,
  HALF_OPEN: 1,
  OPEN: 2,
} as const;

/**
 * Record circuit breaker state change.
 *
 * @param adapterName - Name of the adapter
 * @param newState - New circuit breaker state
 * @param oldState - Previous circuit breaker state
 */
export function recordCircuitBreakerState(
  adapterName: string,
  newState: keyof typeof CircuitBreakerStateValue,
  oldState?: keyof typeof CircuitBreakerStateValue
): void {
  const metrics = getMetricsProvider();
  if (metrics) {
    // Set current state gauge
    metrics.gauge(ADAPTER_METRICS.CIRCUIT_BREAKER_STATE, CircuitBreakerStateValue[newState], {
      adapter: adapterName,
    });

    // Increment transition counter if state changed
    if (oldState && oldState !== newState) {
      metrics.increment(ADAPTER_METRICS.CIRCUIT_BREAKER_TRANSITION, {
        adapter: adapterName,
        from: oldState,
        to: newState,
      });
    }
  }
}
