/**
 * Event System Metrics
 *
 * Provides observability for the event system including:
 * - Event emission counters
 * - Handler execution duration
 * - Outbox processing metrics
 * - Error tracking
 *
 * ## Usage
 *
 * ```typescript
 * import { getEventMetrics, resetEventMetrics } from '@unisane/kernel';
 *
 * // Get current metrics
 * const metrics = getEventMetrics();
 * console.log('Events emitted:', metrics.eventsEmitted);
 * console.log('Handlers executed:', metrics.handlersExecuted);
 *
 * // Reset metrics (useful for testing)
 * resetEventMetrics();
 * ```
 *
 * ## Integration with Observability
 *
 * These metrics can be exported to your monitoring system (Prometheus, CloudWatch, etc.)
 * via the observability module's metrics export.
 */

import { logger } from '../observability/logger';

// =============================================================================
// Types
// =============================================================================

/**
 * Event emission metrics.
 */
export interface EventEmissionMetrics {
  /** Total events emitted (fire-and-forget) */
  eventsEmitted: number;

  /** Total events emitted reliably (outbox) */
  eventsEmittedReliable: number;

  /** Events by type */
  eventsByType: Record<string, number>;

  /** Average emission time in ms */
  avgEmissionTimeMs: number;

  /** Max emission time in ms */
  maxEmissionTimeMs: number;

  /** Total emission time for calculating average */
  totalEmissionTimeMs: number;
}

/**
 * Event handler metrics.
 */
export interface EventHandlerMetrics {
  /** Total handlers executed */
  handlersExecuted: number;

  /** Handlers that completed successfully */
  handlersSucceeded: number;

  /** Handlers that failed */
  handlersFailed: number;

  /** Handler failures by event type */
  failuresByType: Record<string, number>;

  /** Average handler execution time in ms */
  avgHandlerTimeMs: number;

  /** Max handler execution time in ms */
  maxHandlerTimeMs: number;

  /** Total handler time for calculating average */
  totalHandlerTimeMs: number;
}

/**
 * Outbox processing metrics.
 */
export interface OutboxMetrics {
  /** Total events processed from outbox */
  eventsProcessed: number;

  /** Events successfully delivered */
  eventsDelivered: number;

  /** Events that failed and were retried */
  eventsRetried: number;

  /** Events that permanently failed (DLQ) */
  eventsFailed: number;

  /** Current pending count (last known) */
  pendingCount: number;

  /** Current DLQ count (last known) */
  dlqCount: number;

  /** Average processing time in ms */
  avgProcessingTimeMs: number;

  /** Max processing time in ms */
  maxProcessingTimeMs: number;

  /** Total processing time */
  totalProcessingTimeMs: number;
}

/**
 * Saga execution metrics.
 */
export interface SagaMetrics {
  /** Total sagas started */
  sagasStarted: number;

  /** Sagas completed successfully */
  sagasCompleted: number;

  /** Sagas that failed */
  sagasFailed: number;

  /** Sagas that were compensated */
  sagasCompensated: number;

  /** Active sagas (in progress) */
  activeSagas: number;

  /** Sagas by name */
  sagasByName: Record<string, number>;

  /** Average saga duration in ms */
  avgSagaDurationMs: number;

  /** Max saga duration in ms */
  maxSagaDurationMs: number;

  /** Total saga duration */
  totalSagaDurationMs: number;
}

/**
 * Combined event system metrics.
 */
export interface EventSystemMetrics {
  emission: EventEmissionMetrics;
  handlers: EventHandlerMetrics;
  outbox: OutboxMetrics;
  saga: SagaMetrics;

  /** When metrics collection started */
  startedAt: Date;

  /** Last update time */
  lastUpdatedAt: Date;
}

// =============================================================================
// Global State
// =============================================================================

let metricsEnabled = true;

const metrics: EventSystemMetrics = createEmptyMetrics();

function createEmptyMetrics(): EventSystemMetrics {
  const now = new Date();
  return {
    emission: {
      eventsEmitted: 0,
      eventsEmittedReliable: 0,
      eventsByType: {},
      avgEmissionTimeMs: 0,
      maxEmissionTimeMs: 0,
      totalEmissionTimeMs: 0,
    },
    handlers: {
      handlersExecuted: 0,
      handlersSucceeded: 0,
      handlersFailed: 0,
      failuresByType: {},
      avgHandlerTimeMs: 0,
      maxHandlerTimeMs: 0,
      totalHandlerTimeMs: 0,
    },
    outbox: {
      eventsProcessed: 0,
      eventsDelivered: 0,
      eventsRetried: 0,
      eventsFailed: 0,
      pendingCount: 0,
      dlqCount: 0,
      avgProcessingTimeMs: 0,
      maxProcessingTimeMs: 0,
      totalProcessingTimeMs: 0,
    },
    saga: {
      sagasStarted: 0,
      sagasCompleted: 0,
      sagasFailed: 0,
      sagasCompensated: 0,
      activeSagas: 0,
      sagasByName: {},
      avgSagaDurationMs: 0,
      maxSagaDurationMs: 0,
      totalSagaDurationMs: 0,
    },
    startedAt: now,
    lastUpdatedAt: now,
  };
}

// =============================================================================
// Metrics API
// =============================================================================

/**
 * Enable or disable metrics collection.
 */
export function setMetricsEnabled(enabled: boolean): void {
  metricsEnabled = enabled;
}

/**
 * Check if metrics collection is enabled.
 */
export function isMetricsEnabled(): boolean {
  return metricsEnabled;
}

/**
 * Get current event system metrics.
 */
export function getEventMetrics(): Readonly<EventSystemMetrics> {
  return {
    ...metrics,
    emission: { ...metrics.emission, eventsByType: { ...metrics.emission.eventsByType } },
    handlers: { ...metrics.handlers, failuresByType: { ...metrics.handlers.failuresByType } },
    outbox: { ...metrics.outbox },
    saga: { ...metrics.saga, sagasByName: { ...metrics.saga.sagasByName } },
  };
}

/**
 * Reset all metrics to zero.
 */
export function resetEventMetrics(): void {
  const empty = createEmptyMetrics();
  Object.assign(metrics, empty);
}

// =============================================================================
// Recording Functions (called internally by event system)
// =============================================================================

/**
 * Record an event emission.
 */
export function recordEventEmission(
  type: string,
  reliable: boolean,
  durationMs: number
): void {
  if (!metricsEnabled) return;

  if (reliable) {
    metrics.emission.eventsEmittedReliable++;
  } else {
    metrics.emission.eventsEmitted++;
  }

  metrics.emission.eventsByType[type] = (metrics.emission.eventsByType[type] ?? 0) + 1;
  metrics.emission.totalEmissionTimeMs += durationMs;

  const totalEmissions = metrics.emission.eventsEmitted + metrics.emission.eventsEmittedReliable;
  metrics.emission.avgEmissionTimeMs = metrics.emission.totalEmissionTimeMs / totalEmissions;

  if (durationMs > metrics.emission.maxEmissionTimeMs) {
    metrics.emission.maxEmissionTimeMs = durationMs;
  }

  metrics.lastUpdatedAt = new Date();
}

/**
 * Record a handler execution.
 */
export function recordHandlerExecution(
  type: string,
  success: boolean,
  durationMs: number
): void {
  if (!metricsEnabled) return;

  metrics.handlers.handlersExecuted++;

  if (success) {
    metrics.handlers.handlersSucceeded++;
  } else {
    metrics.handlers.handlersFailed++;
    metrics.handlers.failuresByType[type] = (metrics.handlers.failuresByType[type] ?? 0) + 1;
  }

  metrics.handlers.totalHandlerTimeMs += durationMs;
  metrics.handlers.avgHandlerTimeMs = metrics.handlers.totalHandlerTimeMs / metrics.handlers.handlersExecuted;

  if (durationMs > metrics.handlers.maxHandlerTimeMs) {
    metrics.handlers.maxHandlerTimeMs = durationMs;
  }

  metrics.lastUpdatedAt = new Date();
}

/**
 * Record outbox processing.
 */
export function recordOutboxProcessing(
  status: 'delivered' | 'retried' | 'failed',
  durationMs: number
): void {
  if (!metricsEnabled) return;

  metrics.outbox.eventsProcessed++;

  switch (status) {
    case 'delivered':
      metrics.outbox.eventsDelivered++;
      break;
    case 'retried':
      metrics.outbox.eventsRetried++;
      break;
    case 'failed':
      metrics.outbox.eventsFailed++;
      break;
  }

  metrics.outbox.totalProcessingTimeMs += durationMs;
  metrics.outbox.avgProcessingTimeMs = metrics.outbox.totalProcessingTimeMs / metrics.outbox.eventsProcessed;

  if (durationMs > metrics.outbox.maxProcessingTimeMs) {
    metrics.outbox.maxProcessingTimeMs = durationMs;
  }

  metrics.lastUpdatedAt = new Date();
}

/**
 * Update outbox counts.
 */
export function updateOutboxCounts(pending: number, dlq: number): void {
  if (!metricsEnabled) return;

  metrics.outbox.pendingCount = pending;
  metrics.outbox.dlqCount = dlq;
  metrics.lastUpdatedAt = new Date();
}

/**
 * Record saga execution.
 */
export function recordSagaExecution(
  sagaName: string,
  status: 'started' | 'completed' | 'failed' | 'compensated',
  durationMs?: number
): void {
  if (!metricsEnabled) return;

  metrics.saga.sagasByName[sagaName] = (metrics.saga.sagasByName[sagaName] ?? 0) + 1;

  switch (status) {
    case 'started':
      metrics.saga.sagasStarted++;
      metrics.saga.activeSagas++;
      break;
    case 'completed':
      metrics.saga.sagasCompleted++;
      metrics.saga.activeSagas = Math.max(0, metrics.saga.activeSagas - 1);
      break;
    case 'failed':
      metrics.saga.sagasFailed++;
      metrics.saga.activeSagas = Math.max(0, metrics.saga.activeSagas - 1);
      break;
    case 'compensated':
      metrics.saga.sagasCompensated++;
      break;
  }

  if (durationMs !== undefined && status !== 'started') {
    const completedSagas = metrics.saga.sagasCompleted + metrics.saga.sagasFailed;
    if (completedSagas > 0) {
      metrics.saga.totalSagaDurationMs += durationMs;
      metrics.saga.avgSagaDurationMs = metrics.saga.totalSagaDurationMs / completedSagas;

      if (durationMs > metrics.saga.maxSagaDurationMs) {
        metrics.saga.maxSagaDurationMs = durationMs;
      }
    }
  }

  metrics.lastUpdatedAt = new Date();
}

/**
 * Log current metrics summary.
 * Useful for periodic health checks.
 */
export function logMetricsSummary(): void {
  const m = getEventMetrics();

  logger.info('Event system metrics summary', {
    module: 'events.metrics',
    emission: {
      total: m.emission.eventsEmitted + m.emission.eventsEmittedReliable,
      reliable: m.emission.eventsEmittedReliable,
      avgTimeMs: Math.round(m.emission.avgEmissionTimeMs),
    },
    handlers: {
      executed: m.handlers.handlersExecuted,
      succeeded: m.handlers.handlersSucceeded,
      failed: m.handlers.handlersFailed,
      successRate: m.handlers.handlersExecuted > 0
        ? `${((m.handlers.handlersSucceeded / m.handlers.handlersExecuted) * 100).toFixed(1)}%`
        : 'N/A',
    },
    outbox: {
      processed: m.outbox.eventsProcessed,
      delivered: m.outbox.eventsDelivered,
      pending: m.outbox.pendingCount,
      dlq: m.outbox.dlqCount,
    },
    saga: {
      started: m.saga.sagasStarted,
      completed: m.saga.sagasCompleted,
      failed: m.saga.sagasFailed,
      active: m.saga.activeSagas,
    },
    uptime: `${Math.round((Date.now() - m.startedAt.getTime()) / 1000)}s`,
  });
}
