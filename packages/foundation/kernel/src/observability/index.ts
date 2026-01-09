/**
 * Observability Module
 *
 * Provides logging, tracing, and metrics for monitoring and debugging.
 *
 * @example
 * ```typescript
 * import { logger, tracer, observabilityMetrics } from '@unisane/kernel';
 *
 * // Logging - auto-includes context fields (requestId, tenantId, userId)
 * logger.info('Processing order', { orderId: 'order_123' });
 *
 * // Tracing - measure operation duration
 * const result = await tracer.trace('db.query', async () => {
 *   return await db.users.find({ active: true });
 * });
 *
 * // Metrics - counters, gauges, histograms
 * observabilityMetrics.increment('http.requests.total', { labels: { method: 'GET' } });
 * observabilityMetrics.gauge('active.connections', 42);
 * observabilityMetrics.histogram('response.time', responseTimeMs);
 * ```
 */

// Logger - the main pino-based context-aware logger
export {
  logger,
  createModuleLogger,
  getPinoLogger,
} from './logger';
// Note: LogLevel is not exported here to avoid conflict with constants/env.ts LogLevel
// Use the string literal type 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type { Logger } from './logger';

// Tracer
export {
  tracer,
  onSpanComplete,
} from './tracer';
export type { Span, SpanStatus, TraceOptions } from './tracer';

// Metrics - renamed to avoid conflict with utils/metrics (legacy no-op facade)
export {
  metrics as observabilityMetrics,
  onMetricsFlush,
} from './metrics';
export type {
  MetricType,
  MetricValue,
  MetricOptions,
  HistogramConfig,
} from './metrics';
