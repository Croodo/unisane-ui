// ─── RECOVERY STRATEGIES ──────────────────────────────────────────────────────
// Defines recovery strategies for different error types.
// Each strategy provides fallback behavior when errors occur.

import { DataTableError, DataTableErrorCode } from "./base";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Result of attempting error recovery.
 */
export interface RecoveryResult<T = unknown> {
  /** Whether the error was successfully recovered */
  recovered: boolean;

  /** Fallback value to use when recovery is not possible */
  fallback?: T;

  /** Whether to suppress the error from being reported */
  suppress?: boolean;

  /** Modified error (e.g., with downgraded severity) */
  modifiedError?: DataTableError;
}

/**
 * Configuration for a recovery strategy.
 */
export interface RecoveryStrategyConfig {
  /** Unique identifier for this strategy */
  id: string;

  /** Error codes this strategy handles */
  codes: string[];

  /**
   * Attempt to recover from the error.
   * @returns true if recovered successfully, false otherwise
   */
  recover(error: DataTableError): boolean;

  /**
   * Get fallback value when recovery is not possible.
   * The fallback is used by the error source to continue operation.
   */
  getFallback?(error: DataTableError): unknown;

  /** Maximum recovery attempts before giving up */
  maxAttempts?: number;

  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;

  /** Description of the recovery strategy */
  description?: string;
}

// ─── BUILT-IN RECOVERY STRATEGIES ─────────────────────────────────────────────

/**
 * Recovery strategy for filter function errors.
 * Fallback: Include the row in results (don't filter it out).
 */
export const filterErrorRecovery: RecoveryStrategyConfig = {
  id: "filter-error-recovery",
  codes: [DataTableErrorCode.FILTER_ERROR],
  description: "When a filter function fails, include the row in results",
  recover: () => false, // Cannot auto-recover, use fallback
  getFallback: () => true, // Include row in results
};

/**
 * Recovery strategy for sort function errors.
 * Fallback: Treat items as equal (no sorting).
 */
export const sortErrorRecovery: RecoveryStrategyConfig = {
  id: "sort-error-recovery",
  codes: [DataTableErrorCode.SORT_ERROR],
  description: "When a sort function fails, treat items as equal",
  recover: () => false,
  getFallback: () => 0, // Equal comparison result
};

/**
 * Recovery strategy for render errors.
 * Fallback: Return null (render nothing or use placeholder).
 */
export const renderErrorRecovery: RecoveryStrategyConfig = {
  id: "render-error-recovery",
  codes: [DataTableErrorCode.RENDER_ERROR],
  description: "When a cell render fails, show placeholder",
  recover: () => false,
  getFallback: () => null, // Render nothing or placeholder
};

/**
 * Recovery strategy for edit errors.
 * Fallback: Cancel the edit and restore the original value.
 */
export const editErrorRecovery: RecoveryStrategyConfig = {
  id: "edit-error-recovery",
  codes: [DataTableErrorCode.EDIT_FAILED],
  description: "When an edit fails, restore the original value",
  recover: () => false,
  getFallback: (error) => error.context?.originalValue,
};

/**
 * Recovery strategy for data fetch errors.
 * Supports retry with exponential backoff.
 */
export const dataFetchErrorRecovery: RecoveryStrategyConfig = {
  id: "data-fetch-error-recovery",
  codes: [DataTableErrorCode.DATA_FETCH_FAILED],
  description: "When data fetch fails, return empty array or retry",
  maxAttempts: 3,
  retryDelay: 1000,
  recover: () => false, // Retry handled by consumer
  getFallback: () => [], // Empty data array
};

/**
 * Recovery strategy for virtualization errors.
 * Fallback: Disable virtualization and render normally.
 */
export const virtualizationErrorRecovery: RecoveryStrategyConfig = {
  id: "virtualization-error-recovery",
  codes: [DataTableErrorCode.VIRTUALIZATION_ERROR],
  description: "When virtualization fails, fall back to normal rendering",
  recover: () => false,
  getFallback: () => ({ disableVirtualization: true }),
};

/**
 * Recovery strategy for selection errors.
 * Fallback: Reset selection to empty state.
 */
export const selectionErrorRecovery: RecoveryStrategyConfig = {
  id: "selection-error-recovery",
  codes: [DataTableErrorCode.SELECTION_ERROR],
  description: "When selection fails, reset to empty selection",
  recover: () => false,
  getFallback: () => [], // Empty selection
};

/**
 * Recovery strategy for export errors.
 * No fallback - export is cancelled.
 */
export const exportErrorRecovery: RecoveryStrategyConfig = {
  id: "export-error-recovery",
  codes: [DataTableErrorCode.EXPORT_ERROR],
  description: "When export fails, cancel the operation",
  recover: () => false,
  getFallback: () => null, // No export produced
};

// ─── RECOVERY REGISTRY ────────────────────────────────────────────────────────

/**
 * All built-in recovery strategies.
 */
const builtInStrategies: RecoveryStrategyConfig[] = [
  filterErrorRecovery,
  sortErrorRecovery,
  renderErrorRecovery,
  editErrorRecovery,
  dataFetchErrorRecovery,
  virtualizationErrorRecovery,
  selectionErrorRecovery,
  exportErrorRecovery,
];

/**
 * Get all default recovery strategies.
 */
export function getDefaultRecoveryStrategies(): RecoveryStrategyConfig[] {
  return [...builtInStrategies];
}

/**
 * Create a recovery strategy map from an array of strategies.
 */
export function createRecoveryStrategyMap(
  strategies: RecoveryStrategyConfig[]
): Map<string, RecoveryStrategyConfig> {
  const map = new Map<string, RecoveryStrategyConfig>();

  for (const strategy of strategies) {
    for (const code of strategy.codes) {
      map.set(code, strategy);
    }
  }

  return map;
}

/**
 * Execute recovery for an error using the provided strategies.
 *
 * @param error - The error to recover from
 * @param strategies - Array of recovery strategies to try
 * @returns Recovery result with fallback value if applicable
 *
 * @example
 * ```ts
 * const result = executeRecovery(filterError, getDefaultRecoveryStrategies());
 * if (!result.recovered && result.fallback !== undefined) {
 *   return result.fallback; // Use fallback value
 * }
 * ```
 */
export function executeRecovery<T = unknown>(
  error: DataTableError,
  strategies: RecoveryStrategyConfig[]
): RecoveryResult<T> {
  // Find matching strategy
  const strategy = strategies.find((s) => s.codes.includes(error.code));

  if (!strategy) {
    return { recovered: false };
  }

  // Attempt recovery
  try {
    const recovered = strategy.recover(error);

    if (recovered) {
      return { recovered: true, suppress: true };
    }
  } catch {
    // Recovery attempt failed, continue to fallback
  }

  // Get fallback value
  const fallback = strategy.getFallback?.(error) as T | undefined;

  return {
    recovered: false,
    fallback,
  };
}

/**
 * Execute recovery with retry support.
 *
 * @param error - The error to recover from
 * @param strategy - Recovery strategy to use
 * @param onRetry - Callback for retry attempts
 * @returns Promise that resolves to recovery result
 */
export async function executeRecoveryWithRetry<T = unknown>(
  error: DataTableError,
  strategy: RecoveryStrategyConfig,
  onRetry?: (attempt: number, delay: number) => void
): Promise<RecoveryResult<T>> {
  const maxAttempts = strategy.maxAttempts ?? 1;
  const retryDelay = strategy.retryDelay ?? 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const recovered = strategy.recover(error);

      if (recovered) {
        return { recovered: true, suppress: true };
      }
    } catch {
      // Recovery attempt failed
    }

    // If not last attempt, wait and retry
    if (attempt < maxAttempts) {
      const delay = retryDelay * attempt; // Simple linear backoff
      onRetry?.(attempt, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All attempts failed, return fallback
  const fallback = strategy.getFallback?.(error) as T | undefined;

  return {
    recovered: false,
    fallback,
  };
}

// ─── CUSTOM STRATEGY HELPERS ──────────────────────────────────────────────────

/**
 * Create a custom recovery strategy.
 *
 * @example
 * ```ts
 * const customStrategy = createRecoveryStrategy({
 *   id: "custom-filter-recovery",
 *   codes: ["DT_506"],
 *   recover: (error) => {
 *     // Custom recovery logic
 *     return false;
 *   },
 *   getFallback: () => true,
 * });
 * ```
 */
export function createRecoveryStrategy(
  config: RecoveryStrategyConfig
): RecoveryStrategyConfig {
  return { ...config };
}

/**
 * Merge custom strategies with defaults.
 * Custom strategies override defaults for the same error codes.
 *
 * @param customStrategies - Custom strategies to add/override
 * @returns Combined strategy array
 */
export function mergeRecoveryStrategies(
  customStrategies: RecoveryStrategyConfig[]
): RecoveryStrategyConfig[] {
  const strategyMap = new Map<string, RecoveryStrategyConfig>();

  // Add defaults first
  for (const strategy of builtInStrategies) {
    strategyMap.set(strategy.id, strategy);
  }

  // Override with custom
  for (const strategy of customStrategies) {
    strategyMap.set(strategy.id, strategy);
  }

  return Array.from(strategyMap.values());
}
