/**
 * Gateway Telemetry
 *
 * Uses kernel's observability metrics directly.
 * Apps can register exporters via kernel's onMetricsFlush().
 */

import { observabilityMetrics as metrics } from '@unisane/kernel';

/**
 * Record rate limit exceeded event.
 */
export function incRateLimited(op: string): void {
  metrics.increment('gateway.rate_limited_total', { labels: { op } });
}

/**
 * Record idempotency cache replay (request was deduplicated).
 */
export function incIdemReplay(): void {
  metrics.increment('gateway.idempotency_replay_total');
}

/**
 * Record idempotency wait timeout (concurrent request timed out waiting).
 */
export function incIdemWaitTimeout(): void {
  metrics.increment('gateway.idempotency_wait_timeout_total');
}

/**
 * Record HTTP request metrics.
 */
export function observeHttp(data: {
  op: string | null;
  method: string;
  status: number;
  ms: number;
}): void {
  const labels: Record<string, string> = {
    method: data.method,
    status: String(data.status),
  };
  if (data.op) {
    labels.op = data.op;
  }

  metrics.histogram('gateway.http_duration_ms', data.ms, { labels });

  if (data.status >= 500) {
    metrics.increment('gateway.http_errors_total', { labels });
  }
}
