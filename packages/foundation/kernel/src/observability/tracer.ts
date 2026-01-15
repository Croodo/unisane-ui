/**
 * Distributed Tracing
 *
 * Provides span-based tracing for tracking operations across services.
 * Integrates with context to correlate traces with requests.
 */

import { tryGetScopeContext } from '../scope/context';
import { generateId } from '../utils/ids';
import { logger } from './logger';

/**
 * Span status indicating success or failure.
 */
export type SpanStatus = 'ok' | 'error';

/**
 * A trace span representing a unit of work.
 */
export interface Span {
  /** Unique span identifier */
  spanId: string;
  /** Parent trace ID (from context) */
  traceId: string;
  /** Parent span ID (for nested spans) */
  parentSpanId?: string;
  /** Human-readable operation name */
  name: string;
  /** When the span started (epoch ms) */
  startTime: number;
  /** When the span ended (epoch ms) */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Span status */
  status: SpanStatus;
  /** Custom attributes */
  attributes: Record<string, unknown>;
  /** Error if status is 'error' */
  error?: string;
}

/**
 * Options for creating a trace span.
 */
export interface TraceOptions {
  /** Custom attributes to include */
  attributes?: Record<string, unknown>;
  /** Parent span ID for nested spans */
  parentSpanId?: string;
}

/**
 * Span event handlers for external integrations.
 */
type SpanHandler = (span: Span) => void;

/**
 * Registered span handlers (for exporting to external systems).
 */
const spanHandlers: Set<SpanHandler> = new Set();

/**
 * Register a handler to receive completed spans.
 * Use this to export spans to external tracing systems.
 *
 * @example
 * ```typescript
 * onSpanComplete((span) => {
 *   // Send to Datadog, Jaeger, etc.
 *   exporter.send(span);
 * });
 * ```
 */
export function onSpanComplete(handler: SpanHandler): () => void {
  spanHandlers.add(handler);
  return () => spanHandlers.delete(handler);
}

/**
 * Emit a completed span to all handlers.
 */
function emitSpan(span: Span): void {
  for (const handler of spanHandlers) {
    try {
      handler(span);
    } catch (err) {
      // Don't let handler errors affect the traced operation
      console.error('[tracer] Span handler error:', err);
    }
  }
}

/**
 * The main tracer API.
 */
export const tracer = {
  /**
   * Trace an async operation.
   * Creates a span that measures duration and captures errors.
   *
   * @example
   * ```typescript
   * const result = await tracer.trace('db.query', async () => {
   *   return await db.users.find({ active: true });
   * }, { attributes: { collection: 'users' } });
   * ```
   *
   * @param name - Human-readable operation name
   * @param fn - The async function to trace
   * @param options - Optional trace configuration
   * @returns The result of fn()
   */
  async trace<T>(
    name: string,
    fn: () => Promise<T>,
    options: TraceOptions = {}
  ): Promise<T> {
    const context = tryGetScopeContext();
    const spanId = generateId('span').slice(5); // Remove 'span_' prefix for shorter IDs
    const traceId = context?.requestId || generateId('trace');
    const startTime = performance.now();

    const span: Span = {
      spanId,
      traceId,
      parentSpanId: options.parentSpanId,
      name,
      startTime: Date.now(),
      status: 'ok',
      attributes: {
        ...options.attributes,
        ...(context?.scope?.id && { scopeId: context.scope.id }),
      },
    };

    logger.debug(`Span started: ${name}`, { spanId, traceId });

    try {
      const result = await fn();
      span.endTime = Date.now();
      span.duration = performance.now() - startTime;
      span.status = 'ok';

      logger.debug(`Span completed: ${name}`, {
        spanId,
        duration: span.duration.toFixed(2),
        status: 'ok',
      });

      emitSpan(span);
      return result;
    } catch (error) {
      span.endTime = Date.now();
      span.duration = performance.now() - startTime;
      span.status = 'error';
      span.error = error instanceof Error ? error.message : String(error);

      logger.debug(`Span failed: ${name}`, {
        spanId,
        duration: span.duration.toFixed(2),
        status: 'error',
        error: span.error,
      });

      emitSpan(span);
      throw error;
    }
  },

  /**
   * Trace a synchronous operation.
   *
   * @example
   * ```typescript
   * const parsed = tracer.traceSync('json.parse', () => {
   *   return JSON.parse(data);
   * });
   * ```
   */
  traceSync<T>(name: string, fn: () => T, options: TraceOptions = {}): T {
    const context = tryGetScopeContext();
    const spanId = generateId('span').slice(5);
    const traceId = context?.requestId || generateId('trace');
    const startTime = performance.now();

    const span: Span = {
      spanId,
      traceId,
      parentSpanId: options.parentSpanId,
      name,
      startTime: Date.now(),
      status: 'ok',
      attributes: {
        ...options.attributes,
        ...(context?.scope?.id && { scopeId: context.scope.id }),
      },
    };

    try {
      const result = fn();
      span.endTime = Date.now();
      span.duration = performance.now() - startTime;
      span.status = 'ok';
      emitSpan(span);
      return result;
    } catch (error) {
      span.endTime = Date.now();
      span.duration = performance.now() - startTime;
      span.status = 'error';
      span.error = error instanceof Error ? error.message : String(error);
      emitSpan(span);
      throw error;
    }
  },

  /**
   * Create a manual span for more control.
   * Must call end() when done.
   *
   * @example
   * ```typescript
   * const span = tracer.startSpan('custom.operation');
   * try {
   *   // ... do work ...
   *   span.end('ok');
   * } catch (err) {
   *   span.end('error', err.message);
   *   throw err;
   * }
   * ```
   */
  startSpan(name: string, options: TraceOptions = {}) {
    const context = tryGetScopeContext();
    const spanId = generateId('span').slice(5);
    const traceId = context?.requestId || generateId('trace');
    const startTime = performance.now();

    const span: Span = {
      spanId,
      traceId,
      parentSpanId: options.parentSpanId,
      name,
      startTime: Date.now(),
      status: 'ok',
      attributes: {
        ...options.attributes,
        ...(context?.scope?.id && { scopeId: context.scope.id }),
      },
    };

    return {
      spanId,
      traceId,

      /** Add an attribute to the span */
      setAttribute(key: string, value: unknown): void {
        span.attributes[key] = value;
      },

      /** End the span */
      end(status: SpanStatus = 'ok', error?: string): void {
        span.endTime = Date.now();
        span.duration = performance.now() - startTime;
        span.status = status;
        if (error) span.error = error;
        emitSpan(span);
      },
    };
  },
};
