/**
 * Telemetry Module
 *
 * Re-exports the observability logger and provides legacy interfaces.
 * The pino-based logger from observability is now the default.
 */

// Re-export the pino logger as the main logger
export { logger, type Logger } from '../../observability/logger';

/**
 * @deprecated Use the logger directly - it's already pino-based.
 * This function is no longer needed as the logger is pre-configured.
 */
export function setLogger(_impl: unknown): void {
  console.warn(
    '[DEPRECATED] setLogger() is deprecated. The pino logger from observability is now used by default.'
  );
}

// Metrics stub - kept for backwards compatibility
export interface MetricsClient {
  increment(name: string, value?: number, tags?: Record<string, string>): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  histogram(name: string, value: number, tags?: Record<string, string>): void;
  timing(name: string, value: number, tags?: Record<string, string>): void;
}

const noopMetrics: MetricsClient = {
  increment: () => {},
  gauge: () => {},
  histogram: () => {},
  timing: () => {},
};

let _metrics: MetricsClient = noopMetrics;

/**
 * Legacy metrics client - for backwards compatibility.
 * Consider using observabilityMetrics from '@unisane/kernel' instead.
 */
export const telemetryMetrics: MetricsClient = {
  increment: (...args) => _metrics.increment(...args),
  gauge: (...args) => _metrics.gauge(...args),
  histogram: (...args) => _metrics.histogram(...args),
  timing: (...args) => _metrics.timing(...args),
};

export function setMetrics(impl: MetricsClient): void {
  _metrics = impl;
}
