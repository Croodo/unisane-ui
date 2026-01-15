/**
 * Resilience Metrics Exporter
 *
 * Provides an interface for exporting resilience pattern metrics to
 * external monitoring systems (Prometheus, DataDog, etc.).
 *
 * ## Usage
 *
 * ```typescript
 * import { setResilienceMetricsExporter } from '@unisane/kernel';
 *
 * // In bootstrap, configure your metrics exporter
 * setResilienceMetricsExporter({
 *   recordCircuitState: (name, state) => {
 *     prometheus.gauge('circuit_breaker_state', { name, state });
 *   },
 *   recordFailure: (name, operation) => {
 *     prometheus.counter('resilience_failures', { name, operation });
 *   },
 *   recordSuccess: (name, operation, durationMs) => {
 *     prometheus.histogram('resilience_duration', durationMs, { name, operation });
 *   },
 *   recordFailover: (name, from, to) => {
 *     prometheus.counter('failover_events', { name, from, to });
 *   },
 * });
 * ```
 */

/**
 * Circuit breaker states for metrics reporting.
 */
export type CircuitStateValue = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Interface for exporting resilience metrics to external systems.
 */
export interface ResilienceMetricsExporter {
  /**
   * Record a circuit breaker state change.
   * @param name - Circuit breaker name/identifier
   * @param state - New state (CLOSED, OPEN, HALF_OPEN)
   */
  recordCircuitState(name: string, state: CircuitStateValue): void;

  /**
   * Record a failure in a resilience-wrapped operation.
   * @param name - Component name (circuit breaker, adapter name)
   * @param operation - Operation that failed
   */
  recordFailure(name: string, operation: string): void;

  /**
   * Record a successful operation with duration.
   * @param name - Component name
   * @param operation - Operation that succeeded
   * @param durationMs - Duration in milliseconds
   */
  recordSuccess(name: string, operation: string, durationMs: number): void;

  /**
   * Record a failover event from one provider to another.
   * @param name - Failover adapter name
   * @param from - Original provider that failed
   * @param to - Provider that was used instead
   */
  recordFailover(name: string, from: string, to: string): void;

  /**
   * Record a retry attempt.
   * @param name - Component name
   * @param operation - Operation being retried
   * @param attempt - Current attempt number (1-based)
   */
  recordRetry?(name: string, operation: string, attempt: number): void;

  /**
   * Record degradation level change.
   * @param name - Degradation manager name
   * @param level - New degradation level
   */
  recordDegradationLevel?(name: string, level: string): void;
}

/**
 * No-op exporter used when no exporter is configured.
 */
const noopExporter: ResilienceMetricsExporter = {
  recordCircuitState: () => {},
  recordFailure: () => {},
  recordSuccess: () => {},
  recordFailover: () => {},
  recordRetry: () => {},
  recordDegradationLevel: () => {},
};

/**
 * Current metrics exporter instance.
 */
let _exporter: ResilienceMetricsExporter = noopExporter;

/**
 * Set the resilience metrics exporter.
 * Call this during app bootstrap to enable metrics collection.
 *
 * @param exporter - Metrics exporter implementation
 */
export function setResilienceMetricsExporter(exporter: ResilienceMetricsExporter): void {
  _exporter = exporter;
}

/**
 * Get the current resilience metrics exporter.
 * Returns the configured exporter or a no-op if none configured.
 */
export function getResilienceMetricsExporter(): ResilienceMetricsExporter {
  return _exporter;
}

/**
 * Reset to no-op exporter (for testing).
 */
export function resetResilienceMetricsExporter(): void {
  _exporter = noopExporter;
}

// ─── CONVENIENCE FUNCTIONS ─────────────────────────────────────────────────────

/**
 * Record a circuit state change.
 */
export function recordCircuitState(name: string, state: CircuitStateValue): void {
  _exporter.recordCircuitState(name, state);
}

/**
 * Record a failure.
 */
export function recordResilienceFailure(name: string, operation: string): void {
  _exporter.recordFailure(name, operation);
}

/**
 * Record a success with duration.
 */
export function recordResilienceSuccess(name: string, operation: string, durationMs: number): void {
  _exporter.recordSuccess(name, operation, durationMs);
}

/**
 * Record a failover event.
 */
export function recordFailoverEvent(name: string, from: string, to: string): void {
  _exporter.recordFailover(name, from, to);
}

/**
 * Record a retry attempt.
 */
export function recordRetryAttempt(name: string, operation: string, attempt: number): void {
  _exporter.recordRetry?.(name, operation, attempt);
}

/**
 * Record a degradation level change.
 */
export function recordDegradationChange(name: string, level: string): void {
  _exporter.recordDegradationLevel?.(name, level);
}
