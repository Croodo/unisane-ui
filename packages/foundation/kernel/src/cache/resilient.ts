/**
 * Resilient Cache Wrapper
 *
 * Wraps a cache provider with automatic fallback to in-memory cache
 * when the primary provider fails. This ensures application continues
 * functioning (with reduced consistency) rather than failing hard.
 *
 * Features:
 * - Automatic failover after consecutive failures
 * - Recovery detection to switch back to primary
 * - Metrics/logging for degradation visibility
 * - Configurable failure thresholds
 *
 * @example
 * ```typescript
 * const primaryCache = createRedisCache();
 * const resilientCache = createResilientCache(primaryCache, {
 *   maxFailures: 3,
 *   recoveryCheckIntervalMs: 30_000,
 * });
 *
 * // Use resilientCache - it will fallback automatically
 * await resilientCache.get('key');
 * ```
 */

import type { CachePort, CacheSetOpts } from './provider';
import { logger } from '../observability/logger';
import { incrementMetric } from '../ports/metrics.port';

export interface ResilientCacheConfig {
  /** Number of consecutive failures before switching to fallback (default: 3) */
  maxFailures?: number;
  /** How often to check if primary has recovered when degraded (default: 30s) */
  recoveryCheckIntervalMs?: number;
  /** Name for logging/metrics (default: 'cache') */
  name?: string;
}

export interface ResilientCacheState {
  /** Whether currently using fallback */
  isDegraded: boolean;
  /** Number of consecutive failures on primary */
  consecutiveFailures: number;
  /** When degradation started (null if not degraded) */
  degradedSince: Date | null;
}

/**
 * Resilient cache that automatically falls back to in-memory when primary fails.
 */
export class ResilientCache implements CachePort {
  private readonly primary: CachePort;
  private readonly fallback: CachePort;
  private readonly maxFailures: number;
  private readonly recoveryCheckIntervalMs: number;
  private readonly name: string;

  private isDegraded = false;
  private consecutiveFailures = 0;
  private degradedSince: Date | null = null;
  private lastRecoveryCheck = 0;

  constructor(
    primary: CachePort,
    fallback: CachePort,
    config: ResilientCacheConfig = {}
  ) {
    this.primary = primary;
    this.fallback = fallback;
    this.maxFailures = config.maxFailures ?? 3;
    this.recoveryCheckIntervalMs = config.recoveryCheckIntervalMs ?? 30_000;
    this.name = config.name ?? 'cache';
  }

  /**
   * Get current degradation state.
   */
  getState(): ResilientCacheState {
    return {
      isDegraded: this.isDegraded,
      consecutiveFailures: this.consecutiveFailures,
      degradedSince: this.degradedSince,
    };
  }

  async get(key: string): Promise<string | null> {
    if (this.isDegraded) {
      await this.checkRecovery();
      if (this.isDegraded) {
        return this.fallback.get(key);
      }
    }

    try {
      const result = await this.primary.get(key);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error, 'get');
      return this.fallback.get(key);
    }
  }

  async set(key: string, value: string, opts?: CacheSetOpts): Promise<boolean> {
    if (this.isDegraded) {
      await this.checkRecovery();
      if (this.isDegraded) {
        return this.fallback.set(key, value, opts);
      }
    }

    try {
      const result = await this.primary.set(key, value, opts);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error, 'set');
      return this.fallback.set(key, value, opts);
    }
  }

  async incrBy(key: string, by: number, ttlMs?: number): Promise<number> {
    if (this.isDegraded) {
      await this.checkRecovery();
      if (this.isDegraded) {
        return this.fallback.incrBy(key, by, ttlMs);
      }
    }

    try {
      const result = await this.primary.incrBy(key, by, ttlMs);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error, 'incrBy');
      return this.fallback.incrBy(key, by, ttlMs);
    }
  }

  async del(key: string): Promise<void> {
    if (this.isDegraded) {
      await this.checkRecovery();
      if (this.isDegraded) {
        return this.fallback.del(key);
      }
    }

    try {
      await this.primary.del(key);
      this.recordSuccess();
    } catch (error) {
      this.recordFailure(error, 'del');
      await this.fallback.del(key);
    }
  }

  /**
   * Record a successful primary operation.
   * Resets failure count and recovers from degraded state.
   */
  private recordSuccess(): void {
    this.consecutiveFailures = 0;

    if (this.isDegraded) {
      logger.info('Cache recovered, switching back to primary', {
        module: this.name,
        degradedDurationMs: this.degradedSince
          ? Date.now() - this.degradedSince.getTime()
          : 0,
      });
      incrementMetric('cache_recovery_total', { name: this.name });
      this.isDegraded = false;
      this.degradedSince = null;
    }
  }

  /**
   * Record a failed primary operation.
   * May trigger degradation if threshold is reached.
   */
  private recordFailure(error: unknown, operation: string): void {
    this.consecutiveFailures++;

    logger.warn('Cache operation failed', {
      module: this.name,
      operation,
      error: error instanceof Error ? error.message : 'Unknown',
      consecutiveFailures: this.consecutiveFailures,
      isDegraded: this.isDegraded,
    });

    incrementMetric('cache_error_total', { name: this.name, operation });

    if (this.consecutiveFailures >= this.maxFailures && !this.isDegraded) {
      this.isDegraded = true;
      this.degradedSince = new Date();

      logger.error('Cache degraded, switching to memory fallback', {
        module: this.name,
        consecutiveFailures: this.consecutiveFailures,
      });

      incrementMetric('cache_degradation_total', { name: this.name });
    }
  }

  /**
   * Check if primary has recovered by attempting a health check.
   */
  private async checkRecovery(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRecoveryCheck < this.recoveryCheckIntervalMs) {
      return;
    }
    this.lastRecoveryCheck = now;

    try {
      // Try a simple set/get to check if primary is working
      const healthKey = `_health:${this.name}:${now}`;
      await this.primary.set(healthKey, 'ok', { PX: 5000 });
      const value = await this.primary.get(healthKey);

      if (value === 'ok') {
        this.recordSuccess();
        logger.info('Cache recovery check succeeded', { module: this.name });
      }
    } catch {
      // Still failing, stay degraded
      logger.debug('Cache recovery check failed, staying degraded', {
        module: this.name,
      });
    }
  }
}

/**
 * Create a resilient cache wrapper around a primary cache.
 * Uses a simple in-memory map as the fallback.
 */
export function createResilientCache(
  primary: CachePort,
  config?: ResilientCacheConfig
): CachePort {
  const fallback = createSimpleMemoryFallback();
  return new ResilientCache(primary, fallback, config);
}

/**
 * Simple in-memory cache for fallback.
 * Note: This is a basic implementation - data is not shared across instances.
 */
function createSimpleMemoryFallback(): CachePort {
  const store = new Map<string, { value: string; expiresAt: number | null }>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt && entry.expiresAt < now) {
        store.delete(key);
      }
    }
  }, 60_000);

  return {
    async get(key: string): Promise<string | null> {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },

    async set(key: string, value: string, opts?: CacheSetOpts): Promise<boolean> {
      if (opts?.NX && store.has(key)) {
        const existing = store.get(key);
        if (existing && (!existing.expiresAt || existing.expiresAt >= Date.now())) {
          return false;
        }
      }
      const expiresAt = opts?.PX ? Date.now() + opts.PX : null;
      store.set(key, { value, expiresAt });
      return true;
    },

    async incrBy(key: string, by: number, ttlMs?: number): Promise<number> {
      const entry = store.get(key);
      let current = 0;

      if (entry) {
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          store.delete(key);
        } else {
          current = parseInt(entry.value, 10) || 0;
        }
      }

      const newValue = current + by;
      const expiresAt = ttlMs ? Date.now() + ttlMs : entry?.expiresAt ?? null;
      store.set(key, { value: String(newValue), expiresAt });
      return newValue;
    },

    async del(key: string): Promise<void> {
      store.delete(key);
    },
  };
}
