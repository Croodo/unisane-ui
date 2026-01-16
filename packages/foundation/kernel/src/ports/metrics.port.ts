/**
 * Metrics Port
 *
 * Port interface for metrics collection (Prometheus, DataDog, etc.).
 * Provides a unified interface for recording counters, gauges, and histograms.
 */

import { setGlobalProvider, getGlobalProvider, hasGlobalProvider } from './global-provider';

const PROVIDER_KEY = 'metrics';

/**
 * Port interface for metrics collection.
 */
export interface MetricsPort {
  /**
   * Increment a counter metric.
   * @param name - Metric name (e.g., 'http_requests_total')
   * @param labels - Optional labels for filtering/grouping
   * @param value - Amount to increment (default: 1)
   */
  increment(name: string, labels?: Record<string, string>, value?: number): void;

  /**
   * Set a gauge metric to a specific value.
   * @param name - Metric name (e.g., 'active_connections')
   * @param value - Current value
   * @param labels - Optional labels for filtering/grouping
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a value in a histogram (for distributions like latency).
   * @param name - Metric name (e.g., 'http_request_duration_ms')
   * @param value - Value to record
   * @param labels - Optional labels for filtering/grouping
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a timing measurement (convenience wrapper for histogram).
   * @param name - Metric name (e.g., 'api_latency_ms')
   * @param durationMs - Duration in milliseconds
   * @param labels - Optional labels for filtering/grouping
   */
  timing(name: string, durationMs: number, labels?: Record<string, string>): void;
}

/**
 * Set the metrics provider implementation.
 * Call this at app bootstrap.
 */
export function setMetricsProvider(provider: MetricsPort): void {
  setGlobalProvider(PROVIDER_KEY, provider);
}

/**
 * Get the metrics provider.
 * Returns null if not configured (metrics collection is optional).
 */
export function getMetricsProvider(): MetricsPort | null {
  return getGlobalProvider<MetricsPort>(PROVIDER_KEY) ?? null;
}

/**
 * Check if metrics provider is configured.
 */
export function hasMetricsProvider(): boolean {
  return hasGlobalProvider(PROVIDER_KEY);
}

/**
 * Convenience function: Increment a counter if metrics provider is configured.
 * Fails silently if no provider is configured.
 */
export function incrementMetric(name: string, labels?: Record<string, string>, value?: number): void {
  const provider = getMetricsProvider();
  if (provider) {
    provider.increment(name, labels, value);
  }
}

/**
 * Convenience function: Set a gauge if metrics provider is configured.
 * Fails silently if no provider is configured.
 */
export function setGaugeMetric(name: string, value: number, labels?: Record<string, string>): void {
  const provider = getMetricsProvider();
  if (provider) {
    provider.gauge(name, value, labels);
  }
}

/**
 * Convenience function: Record a histogram value if metrics provider is configured.
 * Fails silently if no provider is configured.
 */
export function recordHistogramMetric(name: string, value: number, labels?: Record<string, string>): void {
  const provider = getMetricsProvider();
  if (provider) {
    provider.histogram(name, value, labels);
  }
}

/**
 * Convenience function: Record a timing if metrics provider is configured.
 * Fails silently if no provider is configured.
 */
export function recordTimingMetric(name: string, durationMs: number, labels?: Record<string, string>): void {
  const provider = getMetricsProvider();
  if (provider) {
    provider.timing(name, durationMs, labels);
  }
}

/**
 * Noop metrics provider for testing or when metrics collection is disabled.
 */
export const noopMetrics: MetricsPort = {
  increment: () => {},
  gauge: () => {},
  histogram: () => {},
  timing: () => {},
};

/**
 * Standard metric names for adapters.
 */
export const ADAPTER_METRICS = {
  /** Duration of adapter operations in milliseconds */
  OPERATION_DURATION: 'adapter_operation_duration_ms',
  /** Count of adapter operations */
  OPERATION_COUNT: 'adapter_operation_total',
  /** Adapter retry count */
  RETRY_COUNT: 'adapter_retry_total',
  /** Circuit breaker state (0=closed, 1=half-open, 2=open) */
  CIRCUIT_BREAKER_STATE: 'circuit_breaker_state',
  /** Circuit breaker state transitions */
  CIRCUIT_BREAKER_TRANSITION: 'circuit_breaker_transition_total',
} as const;
