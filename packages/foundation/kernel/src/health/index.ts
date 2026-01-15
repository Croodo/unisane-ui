/**
 * Health Check Module
 *
 * Provides structured health checks for application monitoring.
 * Supports Kubernetes liveness/readiness probes and external monitoring.
 *
 * @example
 * ```typescript
 * import { healthCheck, registerHealthCheck } from '@unisane/kernel';
 *
 * // Register checks during app startup
 * registerHealthCheck('mongodb', mongoHealthCheck);
 * registerHealthCheck('redis', redisHealthCheck);
 *
 * // Run health check
 * const result = await healthCheck();
 * // { status: 'healthy', checks: { mongodb: { status: 'up', latencyMs: 12 }, ... } }
 * ```
 *
 * @module health
 */

/**
 * Status of a single health check.
 */
export type CheckStatus = 'up' | 'down' | 'degraded';

/**
 * Result of a single health check.
 */
export interface CheckResult {
  /** Status of the check */
  status: CheckStatus;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Optional message (e.g., error details) */
  message?: string;
  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Overall health status.
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Complete health check response.
 */
export interface HealthResponse {
  /** Overall status */
  status: HealthStatus;
  /** Individual check results */
  checks: Record<string, CheckResult>;
  /** Application version (from env or package.json) */
  version: string;
  /** Uptime in seconds */
  uptime: number;
  /** Timestamp of health check */
  timestamp: string;
}

/**
 * Health check function signature.
 */
export type HealthCheckFn = () => Promise<CheckResult>;

/**
 * Registered health checks.
 */
const checks = new Map<string, HealthCheckFn>();

/**
 * App start time for uptime calculation.
 */
const startTime = Date.now();

/**
 * Default timeout for health checks (5 seconds).
 */
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Register a health check.
 *
 * @param name - Unique name for the check (e.g., 'mongodb', 'redis')
 * @param check - Async function that returns a CheckResult
 *
 * @example
 * ```typescript
 * registerHealthCheck('mongodb', async () => {
 *   const start = Date.now();
 *   try {
 *     await db().command({ ping: 1 });
 *     return { status: 'up', latencyMs: Date.now() - start };
 *   } catch (err) {
 *     return { status: 'down', latencyMs: Date.now() - start, message: err.message };
 *   }
 * });
 * ```
 */
export function registerHealthCheck(name: string, check: HealthCheckFn): void {
  checks.set(name, check);
}

/**
 * Unregister a health check.
 */
export function unregisterHealthCheck(name: string): void {
  checks.delete(name);
}

/**
 * Get list of registered health check names.
 */
export function getRegisteredChecks(): string[] {
  return Array.from(checks.keys());
}

/**
 * Run a single health check with timeout.
 */
async function runCheck(
  name: string,
  check: HealthCheckFn,
  timeoutMs: number
): Promise<CheckResult> {
  const start = Date.now();

  try {
    const result = await Promise.race([
      check(),
      new Promise<CheckResult>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      ),
    ]);

    return result;
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Options for health check execution.
 */
export interface HealthCheckOptions {
  /** Timeout per check in milliseconds (default: 5000) */
  timeoutMs?: number;
  /** Only run specific checks (by name) */
  only?: string[];
  /** Skip specific checks (by name) */
  skip?: string[];
}

/**
 * Run all registered health checks.
 *
 * @returns HealthResponse with overall status and individual check results
 *
 * @example
 * ```typescript
 * const health = await healthCheck();
 * console.log(health.status); // 'healthy', 'degraded', or 'unhealthy'
 * ```
 */
export async function healthCheck(options: HealthCheckOptions = {}): Promise<HealthResponse> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, only, skip = [] } = options;

  const results: Record<string, CheckResult> = {};

  // Determine which checks to run
  const checksToRun = Array.from(checks.entries()).filter(([name]) => {
    if (only && only.length > 0) {
      return only.includes(name);
    }
    return !skip.includes(name);
  });

  // Run all checks in parallel
  const checkPromises = checksToRun.map(async ([name, check]) => {
    const result = await runCheck(name, check, timeoutMs);
    results[name] = result;
  });

  await Promise.all(checkPromises);

  // Determine overall status
  const statuses = Object.values(results).map((r) => r.status);
  let status: HealthStatus = 'healthy';

  if (statuses.some((s) => s === 'down')) {
    status = 'unhealthy';
  } else if (statuses.some((s) => s === 'degraded')) {
    status = 'degraded';
  }

  return {
    status,
    checks: results,
    version: process.env.npm_package_version ?? process.env.APP_VERSION ?? 'unknown',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simple liveness check (always returns healthy if app is running).
 * Use for Kubernetes liveness probes.
 */
export function livenessCheck(): { status: 'ok' } {
  return { status: 'ok' };
}

/**
 * Readiness check - runs all health checks.
 * Use for Kubernetes readiness probes.
 *
 * Returns 200 if healthy/degraded, 503 if unhealthy.
 */
export async function readinessCheck(
  options?: HealthCheckOptions
): Promise<{ ready: boolean; health: HealthResponse }> {
  const health = await healthCheck(options);
  return {
    ready: health.status !== 'unhealthy',
    health,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Health Checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a MongoDB health check.
 *
 * @example
 * ```typescript
 * import { db } from '@unisane/kernel';
 * import { createMongoHealthCheck, registerHealthCheck } from '@unisane/kernel';
 *
 * registerHealthCheck('mongodb', createMongoHealthCheck(() => db()));
 * ```
 */
export function createMongoHealthCheck(
  getDb: () => { command: (cmd: { ping: 1 }) => Promise<unknown> }
): HealthCheckFn {
  return async () => {
    const start = Date.now();
    try {
      await getDb().command({ ping: 1 });
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  };
}

/**
 * Create a Redis health check.
 *
 * @example
 * ```typescript
 * import { getRedis } from '@unisane/kernel';
 * import { createRedisHealthCheck, registerHealthCheck } from '@unisane/kernel';
 *
 * registerHealthCheck('redis', createRedisHealthCheck(() => getRedis()));
 * ```
 */
export function createRedisHealthCheck(
  getRedis: () => { ping: () => Promise<string> } | null
): HealthCheckFn {
  return async () => {
    const start = Date.now();
    const redis = getRedis();

    if (!redis) {
      return {
        status: 'up',
        latencyMs: Date.now() - start,
        message: 'Redis not configured (optional)',
      };
    }

    try {
      await redis.ping();
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  };
}

/**
 * Create a generic HTTP health check for external services.
 *
 * @example
 * ```typescript
 * registerHealthCheck('stripe', createHttpHealthCheck('https://api.stripe.com/v1'));
 * ```
 */
export function createHttpHealthCheck(
  url: string,
  options: {
    method?: 'GET' | 'HEAD';
    headers?: Record<string, string>;
    expectedStatus?: number[];
  } = {}
): HealthCheckFn {
  const { method = 'HEAD', headers = {}, expectedStatus = [200, 204] } = options;

  return async () => {
    const start = Date.now();
    try {
      const response = await fetch(url, {
        method,
        headers,
        signal: AbortSignal.timeout(4000), // 4s timeout for HTTP checks
      });

      const latencyMs = Date.now() - start;

      if (expectedStatus.includes(response.status)) {
        return { status: 'up', latencyMs };
      }

      return {
        status: 'degraded',
        latencyMs,
        message: `Unexpected status: ${response.status}`,
      };
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Monitoring
// ─────────────────────────────────────────────────────────────────────────────

export {
  HealthMonitor,
  getHealthMonitor,
  startHealthMonitor,
  stopHealthMonitor,
  type HealthMonitorOptions,
  type HealthHistoryEntry,
  type HealthStats,
} from './monitoring';
