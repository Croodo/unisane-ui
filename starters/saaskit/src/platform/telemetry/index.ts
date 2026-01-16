/**
 * Telemetry - StatsD metrics exporter
 *
 * Uses kernel observability metrics with StatsD export for production monitoring.
 * Configure via STATSD_HOST, STATSD_PORT, STATSD_PREFIX env vars.
 *
 * Gateway automatically records HTTP metrics via kernel.
 * Use this module's `metrics` facade for app-specific metrics.
 */

import { metrics as kernelMetrics, onMetricsFlush, type MetricValue } from '@unisane/kernel';

type Tags = Record<string, string | number | boolean | undefined>;

type StatsClient = {
  timing: (stat: string, time: number, tags?: string[]) => void;
  increment: (stat: string, value?: number, tags?: string[]) => void;
  gauge: (stat: string, value: number, tags?: string[]) => void;
};

let statsClient: StatsClient | null = null;
let prefix = 'saaskit';
let initialized = false;

function labelsToTags(labels: Record<string, string>): string[] | undefined {
  const entries = Object.entries(labels);
  if (entries.length === 0) return undefined;
  return entries.map(([k, v]) => `${k}:${v}`);
}

function tagsToLabels(tags?: Tags): Record<string, string> {
  const labels: Record<string, string> = {};
  if (tags) {
    for (const [k, v] of Object.entries(tags)) {
      if (v !== undefined) labels[k] = String(v);
    }
  }
  return labels;
}

function initStatsD(): StatsClient | null {
  if (initialized) return statsClient;
  initialized = true;

  try {
    const host = process.env.STATSD_HOST;
    const port = process.env.STATSD_PORT ? Number(process.env.STATSD_PORT) : undefined;
    prefix = process.env.STATSD_PREFIX || 'saaskit';

    if (!host) return null;

    // Lazy require to avoid bundling if not used
    const StatsD = require('statsd-client');
    statsClient = new StatsD({ host, port, prefix, tcp: false, mock: false }) as StatsClient;

    // Register flush handler to send metrics to StatsD
    onMetricsFlush((flushedMetrics: MetricValue[]) => {
      if (!statsClient) return;

      for (const metric of flushedMetrics) {
        const tags = labelsToTags(metric.labels);
        const name = metric.name;

        switch (metric.type) {
          case 'counter':
            statsClient.increment(name, metric.value, tags);
            break;
          case 'gauge':
            statsClient.gauge(name, metric.value, tags);
            break;
          case 'histogram':
            statsClient.timing(name, metric.value, tags);
            break;
        }
      }
    });

    return statsClient;
  } catch {
    return null;
  }
}

// Initialize on first import
initStatsD();

/**
 * Metrics facade with convenience methods.
 * Uses kernel metrics internally, exports to StatsD when configured.
 */
export const metrics = {
  /** Increment a counter */
  inc(name: string, value = 1, tags?: Tags) {
    kernelMetrics.increment(name, { labels: tagsToLabels(tags) }, value);
  },

  /** Record timing/duration (histogram) */
  timing(name: string, ms: number, tags?: Tags) {
    kernelMetrics.histogram(name, ms, { labels: tagsToLabels(tags) });
  },

  /** Set a gauge value */
  gauge(name: string, value: number, tags?: Tags) {
    kernelMetrics.gauge(name, value, { labels: tagsToLabels(tags) });
  },

  /** Create a timer that records duration on end() */
  timer(name: string, tags?: Tags) {
    return kernelMetrics.timer(name, { labels: tagsToLabels(tags) });
  },

  /** Flush buffered metrics */
  flush() {
    return kernelMetrics.flush();
  },
};
