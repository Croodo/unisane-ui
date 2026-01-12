/**
 * OpenTelemetry Integration
 *
 * Provides optional integration with OpenTelemetry for distributed tracing.
 * This is opt-in - tracing works without OTel, but this enables export to
 * external systems like Jaeger, Datadog, Honeycomb, etc.
 *
 * @example
 * ```typescript
 * import { initOpenTelemetry } from '@unisane/kernel';
 *
 * // Initialize early in your app (before other imports)
 * initOpenTelemetry({
 *   serviceName: 'saaskit-api',
 *   // Optional: configure exporter
 *   exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
 * });
 * ```
 *
 * @module observability/otel
 */

import { onSpanComplete, type Span } from './tracer';
import { logger } from './logger';

/**
 * OpenTelemetry initialization options.
 */
export interface OTelOptions {
  /** Service name for traces (e.g., 'saaskit-api') */
  serviceName: string;

  /** Service version (optional, defaults to 'unknown') */
  serviceVersion?: string;

  /** OTLP exporter endpoint (e.g., 'http://localhost:4318/v1/traces') */
  exporterEndpoint?: string;

  /** Export format: 'http' (OTLP/HTTP) or 'console' (for debugging) */
  exporterType?: 'http' | 'console';

  /** Sample rate (0-1, default 1.0 = 100%) */
  sampleRate?: number;

  /** Additional resource attributes */
  resourceAttributes?: Record<string, string>;

  /** Enable debug logging for OTel */
  debug?: boolean;
}

/**
 * OpenTelemetry span batch for OTLP export.
 */
interface OTLPSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Array<{ key: string; value: { stringValue?: string; intValue?: string; boolValue?: boolean } }>;
  status: { code: number; message?: string };
}

/**
 * Batch of spans waiting to be exported.
 */
let spanBatch: OTLPSpan[] = [];
let exportTimeout: ReturnType<typeof setTimeout> | null = null;
let otelConfig: OTelOptions | null = null;
let initialized = false;

/**
 * Convert internal span to OTLP format.
 */
function toOTLPSpan(span: Span): OTLPSpan {
  const attributes: OTLPSpan['attributes'] = [];

  // Convert attributes to OTLP format
  for (const [key, value] of Object.entries(span.attributes)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'string') {
      attributes.push({ key, value: { stringValue: value } });
    } else if (typeof value === 'number') {
      attributes.push({ key, value: { intValue: String(value) } });
    } else if (typeof value === 'boolean') {
      attributes.push({ key, value: { boolValue: value } });
    } else {
      attributes.push({ key, value: { stringValue: String(value) } });
    }
  }

  // Add service info
  if (otelConfig?.serviceName) {
    attributes.push({ key: 'service.name', value: { stringValue: otelConfig.serviceName } });
  }
  if (otelConfig?.serviceVersion) {
    attributes.push({ key: 'service.version', value: { stringValue: otelConfig.serviceVersion } });
  }

  return {
    traceId: span.traceId.replace(/[^a-f0-9]/gi, '').padEnd(32, '0').slice(0, 32),
    spanId: span.spanId.replace(/[^a-f0-9]/gi, '').padEnd(16, '0').slice(0, 16),
    parentSpanId: span.parentSpanId?.replace(/[^a-f0-9]/gi, '').padEnd(16, '0').slice(0, 16),
    name: span.name,
    kind: 1, // SPAN_KIND_INTERNAL
    startTimeUnixNano: String(span.startTime * 1_000_000),
    endTimeUnixNano: String((span.endTime ?? span.startTime) * 1_000_000),
    attributes,
    status: {
      code: span.status === 'ok' ? 1 : 2, // STATUS_CODE_OK = 1, STATUS_CODE_ERROR = 2
      message: span.error,
    },
  };
}

/**
 * Export spans to OTLP endpoint.
 */
async function exportSpans(): Promise<void> {
  if (spanBatch.length === 0 || !otelConfig) return;

  const spansToExport = spanBatch;
  spanBatch = [];

  if (otelConfig.exporterType === 'console') {
    // Console exporter for debugging
    for (const span of spansToExport) {
      console.log('[OTEL]', JSON.stringify(span, null, 2));
    }
    return;
  }

  if (!otelConfig.exporterEndpoint) return;

  // Build OTLP request payload
  const payload = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: otelConfig.serviceName } },
            { key: 'service.version', value: { stringValue: otelConfig.serviceVersion ?? 'unknown' } },
            ...(otelConfig.resourceAttributes
              ? Object.entries(otelConfig.resourceAttributes).map(([key, value]) => ({
                  key,
                  value: { stringValue: value },
                }))
              : []),
          ],
        },
        scopeSpans: [
          {
            scope: { name: '@unisane/kernel', version: '0.1.0' },
            spans: spansToExport,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(otelConfig.exporterEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok && otelConfig.debug) {
      logger.warn('OTEL export failed', {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (err) {
    if (otelConfig.debug) {
      logger.warn('OTEL export error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/**
 * Schedule span export (batched for efficiency).
 */
function scheduleExport(): void {
  if (exportTimeout) return;

  // Export after 5 seconds or when batch reaches 100 spans
  exportTimeout = setTimeout(() => {
    exportTimeout = null;
    exportSpans().catch(() => {});
  }, 5000);

  if (spanBatch.length >= 100) {
    if (exportTimeout) {
      clearTimeout(exportTimeout);
      exportTimeout = null;
    }
    exportSpans().catch(() => {});
  }
}

/**
 * Handle completed span from the tracer.
 */
function handleSpan(span: Span): void {
  if (!otelConfig) return;

  // Apply sampling
  if (otelConfig.sampleRate !== undefined && otelConfig.sampleRate < 1) {
    if (Math.random() > otelConfig.sampleRate) return;
  }

  spanBatch.push(toOTLPSpan(span));
  scheduleExport();
}

/**
 * Initialize OpenTelemetry integration.
 *
 * Call this early in your application startup, before other imports if possible.
 * This is opt-in - if not called, tracing still works but spans aren't exported.
 *
 * @example
 * ```typescript
 * // instrumentation.ts or app startup
 * import { initOpenTelemetry } from '@unisane/kernel';
 *
 * initOpenTelemetry({
 *   serviceName: 'my-api',
 *   exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
 *   sampleRate: 0.1, // 10% sampling in production
 * });
 * ```
 */
export function initOpenTelemetry(options: OTelOptions): () => void {
  if (initialized) {
    logger.warn('OpenTelemetry already initialized, skipping re-initialization');
    return () => {};
  }

  otelConfig = options;
  initialized = true;

  logger.info('OpenTelemetry initialized', {
    serviceName: options.serviceName,
    exporterType: options.exporterType ?? (options.exporterEndpoint ? 'http' : 'none'),
    sampleRate: options.sampleRate ?? 1,
  });

  // Register span handler
  const unsubscribe = onSpanComplete(handleSpan);

  // Return cleanup function
  return () => {
    unsubscribe();
    if (exportTimeout) {
      clearTimeout(exportTimeout);
      exportTimeout = null;
    }
    // Flush remaining spans
    exportSpans().catch(() => {});
    otelConfig = null;
    initialized = false;
  };
}

/**
 * Check if OpenTelemetry is initialized.
 */
export function isOTelInitialized(): boolean {
  return initialized;
}

/**
 * Force flush any pending spans.
 * Call this on graceful shutdown.
 */
export async function flushOTelSpans(): Promise<void> {
  if (exportTimeout) {
    clearTimeout(exportTimeout);
    exportTimeout = null;
  }
  await exportSpans();
}
