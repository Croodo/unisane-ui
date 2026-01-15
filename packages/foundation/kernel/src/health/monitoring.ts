/**
 * Health Monitoring System
 *
 * Provides continuous health monitoring with:
 * - Periodic health checks
 * - Health history tracking
 * - Status change notifications
 * - Degradation detection
 *
 * @example
 * ```typescript
 * import { HealthMonitor, registerHealthCheck } from '@unisane/kernel';
 *
 * // Register checks
 * registerHealthCheck('mongodb', mongoHealthCheck);
 * registerHealthCheck('redis', redisHealthCheck);
 *
 * // Start monitoring
 * const monitor = new HealthMonitor({
 *   intervalMs: 30000, // Check every 30 seconds
 *   onStatusChange: (oldStatus, newStatus, health) => {
 *     console.log(`Health status changed: ${oldStatus} -> ${newStatus}`);
 *   },
 * });
 *
 * monitor.start();
 * ```
 */

import { healthCheck, type HealthResponse, type HealthStatus, type CheckResult } from './index';
import { logger } from '../observability';

export interface HealthHistoryEntry {
  /** Timestamp of the check */
  timestamp: string;
  /** Overall status */
  status: HealthStatus;
  /** Individual check results */
  checks: Record<string, CheckResult>;
  /** Duration of health check in ms */
  durationMs: number;
}

export interface HealthMonitorOptions {
  /** Interval between health checks in milliseconds (default: 30000) */
  intervalMs?: number;
  /** Number of history entries to keep (default: 100) */
  historySize?: number;
  /** Timeout for individual checks in milliseconds */
  checkTimeoutMs?: number;
  /** Callback when status changes */
  onStatusChange?: (
    oldStatus: HealthStatus | null,
    newStatus: HealthStatus,
    health: HealthResponse
  ) => void;
  /** Callback when a check degrades */
  onCheckDegraded?: (checkName: string, result: CheckResult) => void;
  /** Callback when a check recovers */
  onCheckRecovered?: (checkName: string, result: CheckResult) => void;
  /** Callback for every health check */
  onHealthCheck?: (health: HealthResponse) => void;
}

/**
 * Health Monitor provides continuous health monitoring.
 */
export class HealthMonitor {
  private readonly intervalMs: number;
  private readonly historySize: number;
  private readonly checkTimeoutMs: number;
  private readonly onStatusChange?: HealthMonitorOptions['onStatusChange'];
  private readonly onCheckDegraded?: HealthMonitorOptions['onCheckDegraded'];
  private readonly onCheckRecovered?: HealthMonitorOptions['onCheckRecovered'];
  private readonly onHealthCheck?: HealthMonitorOptions['onHealthCheck'];

  private history: HealthHistoryEntry[] = [];
  private lastStatus: HealthStatus | null = null;
  private lastCheckResults: Map<string, CheckResult['status']> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;

  private readonly log = logger.child({ module: 'health-monitor' });

  constructor(options: HealthMonitorOptions = {}) {
    this.intervalMs = options.intervalMs ?? 30000;
    this.historySize = options.historySize ?? 100;
    this.checkTimeoutMs = options.checkTimeoutMs ?? 5000;
    this.onStatusChange = options.onStatusChange;
    this.onCheckDegraded = options.onCheckDegraded;
    this.onCheckRecovered = options.onCheckRecovered;
    this.onHealthCheck = options.onHealthCheck;
  }

  /**
   * Start the health monitor.
   */
  start(): void {
    if (this.running) {
      this.log.warn('health monitor already running');
      return;
    }

    this.running = true;
    this.log.info('starting health monitor', { intervalMs: this.intervalMs });

    // Run initial check
    void this.runCheck();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      void this.runCheck();
    }, this.intervalMs);
  }

  /**
   * Stop the health monitor.
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.log.info('health monitor stopped');
  }

  /**
   * Run a health check and process the results.
   */
  async runCheck(): Promise<HealthResponse> {
    const start = Date.now();

    const health = await healthCheck({ timeoutMs: this.checkTimeoutMs });
    const durationMs = Date.now() - start;

    // Add to history
    this.addToHistory({
      timestamp: health.timestamp,
      status: health.status,
      checks: health.checks,
      durationMs,
    });

    // Check for status changes
    if (this.lastStatus !== null && this.lastStatus !== health.status) {
      this.log.info('health status changed', {
        from: this.lastStatus,
        to: health.status,
      });
      this.onStatusChange?.(this.lastStatus, health.status, health);
    }

    // Check for individual check changes
    for (const [name, result] of Object.entries(health.checks)) {
      const previousStatus = this.lastCheckResults.get(name);

      if (previousStatus && previousStatus !== result.status) {
        if (result.status === 'up' && previousStatus !== 'up') {
          this.log.info('check recovered', { check: name });
          this.onCheckRecovered?.(name, result);
        } else if (result.status !== 'up' && previousStatus === 'up') {
          this.log.warn('check degraded', { check: name, status: result.status });
          this.onCheckDegraded?.(name, result);
        }
      }

      this.lastCheckResults.set(name, result.status);
    }

    this.lastStatus = health.status;
    this.onHealthCheck?.(health);

    return health;
  }

  /**
   * Add an entry to history, maintaining the size limit.
   */
  private addToHistory(entry: HealthHistoryEntry): void {
    this.history.push(entry);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }
  }

  /**
   * Get health history.
   */
  getHistory(): readonly HealthHistoryEntry[] {
    return this.history;
  }

  /**
   * Get the last health status.
   */
  getLastStatus(): HealthStatus | null {
    return this.lastStatus;
  }

  /**
   * Get statistics about health over the history period.
   */
  getStats(): HealthStats {
    if (this.history.length === 0) {
      return {
        totalChecks: 0,
        healthyCount: 0,
        degradedCount: 0,
        unhealthyCount: 0,
        healthyPercent: 0,
        averageLatencyMs: 0,
        maxLatencyMs: 0,
        minLatencyMs: 0,
      };
    }

    const healthyCount = this.history.filter((h) => h.status === 'healthy').length;
    const degradedCount = this.history.filter((h) => h.status === 'degraded').length;
    const unhealthyCount = this.history.filter((h) => h.status === 'unhealthy').length;

    const latencies = this.history.map((h) => h.durationMs);
    const averageLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatencyMs = Math.max(...latencies);
    const minLatencyMs = Math.min(...latencies);

    return {
      totalChecks: this.history.length,
      healthyCount,
      degradedCount,
      unhealthyCount,
      healthyPercent: (healthyCount / this.history.length) * 100,
      averageLatencyMs: Math.round(averageLatencyMs),
      maxLatencyMs,
      minLatencyMs,
    };
  }

  /**
   * Check if the monitor is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Clear history.
   */
  clearHistory(): void {
    this.history = [];
  }
}

export interface HealthStats {
  /** Total number of checks in history */
  totalChecks: number;
  /** Number of healthy checks */
  healthyCount: number;
  /** Number of degraded checks */
  degradedCount: number;
  /** Number of unhealthy checks */
  unhealthyCount: number;
  /** Percentage of healthy checks */
  healthyPercent: number;
  /** Average check latency in ms */
  averageLatencyMs: number;
  /** Maximum check latency in ms */
  maxLatencyMs: number;
  /** Minimum check latency in ms */
  minLatencyMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────────────────────

let defaultMonitor: HealthMonitor | null = null;

/**
 * Get or create the default health monitor.
 */
export function getHealthMonitor(options?: HealthMonitorOptions): HealthMonitor {
  if (!defaultMonitor) {
    defaultMonitor = new HealthMonitor(options);
  }
  return defaultMonitor;
}

/**
 * Start the default health monitor.
 */
export function startHealthMonitor(options?: HealthMonitorOptions): HealthMonitor {
  const monitor = getHealthMonitor(options);
  monitor.start();
  return monitor;
}

/**
 * Stop the default health monitor.
 */
export function stopHealthMonitor(): void {
  defaultMonitor?.stop();
}
