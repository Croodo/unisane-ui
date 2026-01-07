/**
 * Metrics Collection
 *
 * Provides counter, gauge, and histogram metrics for monitoring.
 * Metrics are buffered and can be flushed to external systems.
 */

/**
 * Metric types supported by the system.
 */
export type MetricType = 'counter' | 'gauge' | 'histogram';

/**
 * A single metric data point.
 */
export interface MetricValue {
  /** Metric name (e.g., 'http.requests.total') */
  name: string;
  /** Type of metric */
  type: MetricType;
  /** Metric value */
  value: number;
  /** Labels/tags for the metric */
  labels: Record<string, string>;
  /** When the metric was recorded */
  timestamp: number;
}

/**
 * Options for recording a metric.
 */
export interface MetricOptions {
  /** Labels/tags for the metric */
  labels?: Record<string, string>;
}

/**
 * Histogram bucket configuration.
 */
export interface HistogramConfig {
  /** Bucket boundaries (e.g., [10, 50, 100, 500, 1000]) */
  buckets: number[];
}

/**
 * Histogram data for a metric.
 */
interface HistogramData {
  /** Bucket counts */
  buckets: Map<number, number>;
  /** Sum of all values */
  sum: number;
  /** Count of all values */
  count: number;
}

/**
 * Internal metric storage.
 */
const metricsBuffer: MetricValue[] = [];
const gaugeValues: Map<string, number> = new Map();
const histogramData: Map<string, HistogramData> = new Map();

/**
 * Default histogram buckets (for response times in ms).
 */
const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * Metric flush handlers.
 */
type MetricHandler = (metrics: MetricValue[]) => void;
const metricHandlers: Set<MetricHandler> = new Set();

/**
 * Register a handler to receive flushed metrics.
 *
 * @example
 * ```typescript
 * onMetricsFlush((metrics) => {
 *   // Send to Prometheus, Datadog, etc.
 *   for (const metric of metrics) {
 *     exporter.record(metric);
 *   }
 * });
 * ```
 */
export function onMetricsFlush(handler: MetricHandler): () => void {
  metricHandlers.add(handler);
  return () => metricHandlers.delete(handler);
}

/**
 * Create a cache key for gauge/histogram lookups.
 */
function createKey(name: string, labels: Record<string, string>): string {
  const sortedLabels = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return `${name}{${sortedLabels}}`;
}

/**
 * The main metrics API.
 */
export const metrics = {
  /**
   * Increment a counter.
   * Counters are cumulative and only go up.
   *
   * @example
   * ```typescript
   * metrics.increment('http.requests.total', { method: 'GET', path: '/api/users' });
   * metrics.increment('errors.total', { type: 'validation' }, 5);
   * ```
   */
  increment(name: string, options: MetricOptions = {}, value = 1): void {
    const labels = options.labels || {};
    metricsBuffer.push({
      name,
      type: 'counter',
      value,
      labels,
      timestamp: Date.now(),
    });
  },

  /**
   * Set a gauge value.
   * Gauges can go up or down and represent current state.
   *
   * @example
   * ```typescript
   * metrics.gauge('active.connections', 42);
   * metrics.gauge('queue.size', 10, { queue: 'emails' });
   * ```
   */
  gauge(name: string, value: number, options: MetricOptions = {}): void {
    const labels = options.labels || {};
    const key = createKey(name, labels);
    gaugeValues.set(key, value);

    metricsBuffer.push({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: Date.now(),
    });
  },

  /**
   * Record a histogram value.
   * Histograms track distributions (e.g., response times).
   *
   * @example
   * ```typescript
   * const start = performance.now();
   * // ... do work ...
   * metrics.histogram('http.request.duration', performance.now() - start, {
   *   labels: { method: 'GET', path: '/api/users' },
   * });
   * ```
   */
  histogram(name: string, value: number, options: MetricOptions = {}): void {
    const labels = options.labels || {};
    const key = createKey(name, labels);

    // Initialize histogram data if needed
    if (!histogramData.has(key)) {
      histogramData.set(key, {
        buckets: new Map(DEFAULT_BUCKETS.map((b) => [b, 0])),
        sum: 0,
        count: 0,
      });
    }

    const data = histogramData.get(key)!;
    data.sum += value;
    data.count += 1;

    // Increment appropriate buckets
    for (const bucket of DEFAULT_BUCKETS) {
      if (value <= bucket) {
        data.buckets.set(bucket, (data.buckets.get(bucket) || 0) + 1);
      }
    }

    metricsBuffer.push({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: Date.now(),
    });
  },

  /**
   * Create a timer that records duration as a histogram.
   *
   * @example
   * ```typescript
   * const timer = metrics.timer('db.query.duration', { labels: { operation: 'find' } });
   * const results = await db.find({});
   * timer.end();
   * ```
   */
  timer(name: string, options: MetricOptions = {}) {
    const start = performance.now();

    return {
      /** End the timer and record the duration */
      end(): number {
        const duration = performance.now() - start;
        metrics.histogram(name, duration, options);
        return duration;
      },
    };
  },

  /**
   * Flush buffered metrics and return them.
   * Also notifies registered handlers.
   *
   * @example
   * ```typescript
   * // Periodically flush metrics
   * setInterval(() => {
   *   const flushed = metrics.flush();
   *   console.log(`Flushed ${flushed.length} metrics`);
   * }, 60000);
   * ```
   */
  flush(): MetricValue[] {
    const flushed = [...metricsBuffer];
    metricsBuffer.length = 0;

    // Notify handlers
    if (flushed.length > 0) {
      for (const handler of metricHandlers) {
        try {
          handler(flushed);
        } catch (err) {
          console.error('[metrics] Flush handler error:', err);
        }
      }
    }

    return flushed;
  },

  /**
   * Get the current value of a gauge.
   */
  getGauge(name: string, labels: Record<string, string> = {}): number | undefined {
    return gaugeValues.get(createKey(name, labels));
  },

  /**
   * Get histogram statistics.
   */
  getHistogramStats(name: string, labels: Record<string, string> = {}) {
    const data = histogramData.get(createKey(name, labels));
    if (!data) return undefined;

    return {
      count: data.count,
      sum: data.sum,
      mean: data.count > 0 ? data.sum / data.count : 0,
      buckets: Object.fromEntries(data.buckets),
    };
  },

  /**
   * Get the number of buffered metrics.
   */
  get bufferSize(): number {
    return metricsBuffer.length;
  },

  /**
   * Clear all metrics (mainly for testing).
   */
  reset(): void {
    metricsBuffer.length = 0;
    gaugeValues.clear();
    histogramData.clear();
  },
};
