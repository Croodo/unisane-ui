/**
 * Graceful Degradation Pattern
 *
 * Provides fallback behavior when services are unavailable:
 * - Cached fallbacks for read operations
 * - Default values for non-critical operations
 * - Feature flags integration for degraded mode
 *
 * @example
 * ```typescript
 * import { withFallback, createDegradedModeManager } from '@unisane/kernel';
 *
 * // Simple fallback
 * const result = await withFallback(
 *   () => fetchRecommendations(userId),
 *   () => getCachedRecommendations(userId),
 *   { operationName: 'recommendations' }
 * );
 *
 * // Degraded mode manager
 * const degraded = createDegradedModeManager({
 *   recommendations: { fallback: () => [], critical: false },
 *   payments: { fallback: null, critical: true },
 * });
 *
 * const recommendations = await degraded.execute('recommendations', () =>
 *   fetchRecommendations(userId)
 * );
 * ```
 */

import { logger } from '../observability/logger';

/**
 * Fallback options.
 */
export interface FallbackOptions {
  /** Operation name for logging */
  operationName?: string;

  /** Whether this operation is critical (throws on failure if true) */
  critical?: boolean;

  /** Called when falling back */
  onFallback?: (error: Error) => void;

  /** Timeout for primary operation in ms */
  timeoutMs?: number;
}

/**
 * Result of a fallback operation.
 */
export interface FallbackResult<T> {
  result: T;
  usedFallback: boolean;
  error?: Error;
  durationMs: number;
}

/**
 * Execute a function with a fallback.
 *
 * @example
 * ```typescript
 * // With async fallback
 * const data = await withFallback(
 *   () => fetchFromApi(),
 *   () => getFromCache(),
 *   { operationName: 'user-data' }
 * );
 *
 * // With static fallback value
 * const value = await withFallback(
 *   () => fetchConfig('feature-flag'),
 *   false, // Default to false if fetch fails
 *   { operationName: 'feature-flag' }
 * );
 * ```
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: T | (() => T | Promise<T>),
  options: FallbackOptions = {}
): Promise<FallbackResult<T>> {
  const { operationName, critical = false, onFallback, timeoutMs } = options;
  const startTime = Date.now();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    // Execute primary with optional timeout
    const primaryPromise = primary();
    let result: T;

    if (timeoutMs) {
      const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${operationName ?? 'Operation'} timed out`)),
          timeoutMs
        );
      });
      result = await Promise.race([primaryPromise, timeoutPromise]);
    } else {
      result = await primaryPromise;
    }

    return {
      result,
      usedFallback: false,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    logger.warn(`${operationName ?? 'Operation'} failed, using fallback`, {
      operation: operationName,
      error: err.message,
      critical,
    });

    onFallback?.(err);

    // If critical and no fallback, rethrow
    if (critical && fallback === null) {
      throw err;
    }

    // Get fallback value
    const fallbackValue = typeof fallback === 'function' ? await (fallback as () => T | Promise<T>)() : fallback;

    return {
      result: fallbackValue,
      usedFallback: true,
      error: err,
      durationMs: Date.now() - startTime,
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Degradation level indicating service health.
 */
export type DegradationLevel = 'normal' | 'degraded' | 'critical' | 'offline';

/**
 * Feature configuration for degraded mode.
 */
export interface DegradedFeatureConfig<T = unknown> {
  /** Fallback value or function when degraded */
  fallback: T | (() => T | Promise<T>) | null;

  /** Whether this feature is critical (cannot degrade) */
  critical?: boolean;

  /** Custom condition for enabling degraded mode */
  shouldDegrade?: () => boolean;

  /** Timeout for primary operation */
  timeoutMs?: number;
}

/**
 * Degraded mode manager options.
 */
export interface DegradedModeOptions {
  /** Global callback when entering degraded mode */
  onEnterDegraded?: (feature: string) => void;

  /** Global callback when exiting degraded mode */
  onExitDegraded?: (feature: string) => void;

  /** Check interval for health status (ms) */
  healthCheckIntervalMs?: number;
}

/**
 * Feature statistics.
 */
export interface FeatureStats {
  name: string;
  totalCalls: number;
  fallbackCalls: number;
  errors: number;
  lastError?: Error;
  lastFallback?: Date;
  degradationLevel: DegradationLevel;
}

/**
 * Degraded mode manager for coordinating graceful degradation.
 */
export class DegradedModeManager<TFeatures extends Record<string, DegradedFeatureConfig>> {
  private readonly stats: Map<string, FeatureStats> = new Map();
  private readonly degradedFeatures: Set<string> = new Set();
  private globalDegradationLevel: DegradationLevel = 'normal';

  constructor(
    private readonly features: TFeatures,
    private readonly options: DegradedModeOptions = {}
  ) {
    // Initialize stats for each feature
    for (const name of Object.keys(features)) {
      this.stats.set(name, {
        name,
        totalCalls: 0,
        fallbackCalls: 0,
        errors: 0,
        degradationLevel: 'normal',
      });
    }
  }

  /**
   * Execute a feature operation with automatic degradation handling.
   *
   * @param feature - The feature key to execute
   * @param fn - The function to execute
   * @returns Object containing the result and whether degraded mode was used
   */
  async execute<K extends keyof TFeatures, R>(
    feature: K,
    fn: () => Promise<R>
  ): Promise<{ result: R; degraded: boolean }> {
    const config = this.features[feature];
    const stats = this.stats.get(feature as string)!;

    if (!config) {
      throw new Error(`Unknown feature: ${String(feature)}`);
    }

    stats.totalCalls++;

    // Check if we should use degraded mode
    const shouldDegrade =
      this.degradedFeatures.has(feature as string) ||
      config.shouldDegrade?.() ||
      this.globalDegradationLevel === 'critical';

    if (shouldDegrade && !config.critical && config.fallback !== null) {
      stats.fallbackCalls++;
      const fallbackValue =
        typeof config.fallback === 'function'
          ? await (config.fallback as () => unknown | Promise<unknown>)()
          : config.fallback;

      return { result: fallbackValue as R, degraded: true };
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      // Execute with optional timeout
      let result: unknown;

      if (config.timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(`Feature ${String(feature)} timed out`)),
            config.timeoutMs
          );
        });
        result = await Promise.race([fn(), timeoutPromise]);
      } else {
        result = await fn();
      }

      // Success - remove from degraded if it was
      if (this.degradedFeatures.has(feature as string)) {
        this.degradedFeatures.delete(feature as string);
        stats.degradationLevel = 'normal';
        this.options.onExitDegraded?.(feature as string);
        logger.info(`Feature ${String(feature)} recovered from degraded mode`);
      }

      return { result: result as R, degraded: false };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      stats.errors++;
      stats.lastError = err;

      // If critical, rethrow
      if (config.critical || config.fallback === null) {
        logger.error(`Critical feature ${String(feature)} failed`, {
          feature,
          error: err.message,
        });
        throw err;
      }

      // Enter degraded mode for this feature
      if (!this.degradedFeatures.has(feature as string)) {
        this.degradedFeatures.add(feature as string);
        stats.degradationLevel = 'degraded';
        this.options.onEnterDegraded?.(feature as string);
        logger.warn(`Feature ${String(feature)} entering degraded mode`, {
          feature,
          error: err.message,
        });
      }

      stats.fallbackCalls++;
      stats.lastFallback = new Date();

      const fallbackValue =
        typeof config.fallback === 'function'
          ? await (config.fallback as () => unknown | Promise<unknown>)()
          : config.fallback;

      return { result: fallbackValue as R, degraded: true };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Manually enter degraded mode for a feature.
   */
  setDegraded(feature: keyof TFeatures, degraded = true): void {
    if (degraded) {
      this.degradedFeatures.add(feature as string);
      this.stats.get(feature as string)!.degradationLevel = 'degraded';
      this.options.onEnterDegraded?.(feature as string);
    } else {
      this.degradedFeatures.delete(feature as string);
      this.stats.get(feature as string)!.degradationLevel = 'normal';
      this.options.onExitDegraded?.(feature as string);
    }
  }

  /**
   * Set global degradation level.
   */
  setGlobalLevel(level: DegradationLevel): void {
    const oldLevel = this.globalDegradationLevel;
    this.globalDegradationLevel = level;

    logger.info(`Global degradation level changed`, {
      from: oldLevel,
      to: level,
    });
  }

  /**
   * Get global degradation level.
   */
  getGlobalLevel(): DegradationLevel {
    return this.globalDegradationLevel;
  }

  /**
   * Check if a feature is currently degraded.
   */
  isDegraded(feature: keyof TFeatures): boolean {
    return this.degradedFeatures.has(feature as string);
  }

  /**
   * Get statistics for all features.
   */
  getStats(): FeatureStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Get statistics for a specific feature.
   */
  getFeatureStats(feature: keyof TFeatures): FeatureStats | undefined {
    return this.stats.get(feature as string);
  }

  /**
   * Reset all degradation states.
   */
  reset(): void {
    this.degradedFeatures.clear();
    this.globalDegradationLevel = 'normal';

    for (const stats of this.stats.values()) {
      stats.degradationLevel = 'normal';
    }

    logger.info('Degraded mode manager reset');
  }
}

/**
 * Create a degraded mode manager.
 *
 * @example
 * ```typescript
 * const manager = createDegradedModeManager({
 *   recommendations: {
 *     fallback: () => [],
 *     critical: false,
 *   },
 *   userProfile: {
 *     fallback: null,
 *     critical: true,
 *   },
 *   analytics: {
 *     fallback: undefined,
 *     critical: false,
 *   },
 * });
 * ```
 */
export function createDegradedModeManager<TFeatures extends Record<string, DegradedFeatureConfig>>(
  features: TFeatures,
  options?: DegradedModeOptions
): DegradedModeManager<TFeatures> {
  return new DegradedModeManager(features, options);
}
