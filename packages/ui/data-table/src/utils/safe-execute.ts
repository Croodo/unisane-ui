// ─── SAFE EXECUTION UTILITIES ─────────────────────────────────────────────────
// Wrappers for safely executing user-provided functions (filters, sorts, renderers).
// Catches errors and provides fallback values to prevent table crashes.

import type { ReactNode } from "react";
import { DataTableError, DataTableErrorCode, type DataTableErrorCodeValue } from "../errors/base";
import { ErrorSeverity } from "../errors/severity";
import type { ErrorHub } from "../errors/error-hub";
import {
  executeRecovery,
  type RecoveryStrategyConfig,
} from "../errors/recovery";
import { FilterError, SortError, SearchError, RenderError } from "../errors/runtime-errors";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Options for safe execution.
 */
export interface SafeExecuteOptions<T> {
  /** Error hub to report errors to */
  errorHub: ErrorHub;

  /** Fallback value if execution fails */
  fallback: T;

  /** Error code to use (determines default severity) */
  errorCode: DataTableErrorCodeValue;

  /** Override severity level */
  severity?: ErrorSeverity;

  /** Additional context for error reporting */
  context?: Record<string, unknown>;

  /** Recovery strategies to attempt */
  recoveryStrategies?: RecoveryStrategyConfig[];

  /** Whether to log warnings in development */
  logWarning?: boolean;
}

/**
 * Context for cell rendering.
 */
export interface CellRenderContext<T> {
  row: T & { id: string };
  value: unknown;
  columnKey: string;
  rowIndex: number;
}

// ─── CORE SAFE EXECUTE ────────────────────────────────────────────────────────

/**
 * Safely execute a function, catching errors and returning a fallback value.
 *
 * @param fn - Function to execute
 * @param args - Arguments to pass to the function
 * @param options - Execution options
 * @returns The function result or fallback value
 *
 * @example
 * ```ts
 * const result = safeExecute(
 *   userFilterFn,
 *   [row, filterValue],
 *   {
 *     errorHub,
 *     fallback: true, // Include row if filter fails
 *     errorCode: DataTableErrorCode.FILTER_ERROR,
 *     context: { columnKey: "age" },
 *   }
 * );
 * ```
 */
export function safeExecute<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  args: Args,
  options: SafeExecuteOptions<T>
): T {
  try {
    return fn(...args);
  } catch (cause) {
    const error = new DataTableError(
      `Function execution failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      options.errorCode,
      {
        severity: options.severity,
        context: options.context,
        cause: cause instanceof Error ? cause : undefined,
      }
    );

    // Attempt recovery if strategies provided
    if (options.recoveryStrategies?.length) {
      const result = executeRecovery<T>(error, options.recoveryStrategies);
      if (result.recovered) {
        return options.fallback;
      }
      if (result.fallback !== undefined) {
        // Report error but use recovery fallback
        options.errorHub.report(error);
        return result.fallback;
      }
    }

    // Report error and return fallback
    options.errorHub.report(error);

    // Log warning in development
    if (options.logWarning && process.env.NODE_ENV !== "production") {
      console.warn(
        `[DataTable] ${error.toFormattedString()}`,
        options.context ?? {}
      );
    }

    return options.fallback;
  }
}

// ─── FILTER WRAPPERS ──────────────────────────────────────────────────────────

/**
 * Create a safe wrapper for a filter function.
 * If the filter throws, the row is included in results (not filtered out).
 *
 * @param filterFn - Original filter function
 * @param errorHub - Error hub for reporting
 * @param columnKey - Column key for context
 * @returns Wrapped filter function
 *
 * @example
 * ```ts
 * const safeFilter = createSafeFilter(
 *   column.filterFn,
 *   errorHub,
 *   column.key
 * );
 *
 * const filtered = data.filter(row => safeFilter(row, filterValue));
 * ```
 */
export function createSafeFilter<T>(
  filterFn: (row: T, filterValue: unknown) => boolean,
  errorHub: ErrorHub,
  columnKey: string
): (row: T, filterValue: unknown) => boolean {
  // Track if we've already reported an error for this filter
  // to avoid spamming the error hub
  let hasReportedError = false;

  return (row: T, filterValue: unknown): boolean => {
    try {
      return filterFn(row, filterValue);
    } catch (cause) {
      // Only report the first error to avoid flooding
      if (!hasReportedError) {
        hasReportedError = true;
        const error = new FilterError(
          columnKey,
          filterValue,
          cause instanceof Error ? cause : undefined
        );
        errorHub.report(error);
      }

      // Include row in results (fail open)
      return true;
    }
  };
}

/**
 * Create a safe wrapper for multiple column filters.
 *
 * @param columns - Array of columns with filter functions
 * @param errorHub - Error hub for reporting
 * @returns Map of column key to safe filter function
 */
export function createSafeFilters<T>(
  columns: Array<{ key: string; filterFn?: (row: T, value: unknown) => boolean }>,
  errorHub: ErrorHub
): Map<string, (row: T, filterValue: unknown) => boolean> {
  const safeFilters = new Map<string, (row: T, filterValue: unknown) => boolean>();

  for (const column of columns) {
    if (column.filterFn) {
      safeFilters.set(column.key, createSafeFilter(column.filterFn, errorHub, column.key));
    }
  }

  return safeFilters;
}

// ─── SORT WRAPPERS ────────────────────────────────────────────────────────────

/**
 * Create a safe wrapper for a sort function.
 * If the sort throws, items are treated as equal (stable sort).
 *
 * @param sortFn - Original sort comparator function
 * @param errorHub - Error hub for reporting
 * @param columnKey - Column key for context
 * @returns Wrapped sort function
 *
 * @example
 * ```ts
 * const safeSort = createSafeSort(
 *   column.sortFn,
 *   errorHub,
 *   column.key
 * );
 *
 * data.sort((a, b) => safeSort(a, b));
 * ```
 */
export function createSafeSort<T>(
  sortFn: (a: T, b: T) => number,
  errorHub: ErrorHub,
  columnKey: string
): (a: T, b: T) => number {
  let hasReportedError = false;

  return (a: T, b: T): number => {
    try {
      return sortFn(a, b);
    } catch (cause) {
      if (!hasReportedError) {
        hasReportedError = true;
        const error = new SortError(
          columnKey,
          cause instanceof Error ? cause : undefined
        );
        errorHub.report(error);
      }

      // Treat as equal (stable sort)
      return 0;
    }
  };
}

// ─── SEARCH WRAPPERS ──────────────────────────────────────────────────────────

/**
 * Create a safe wrapper for a search function.
 * If the search throws, the row is included in results.
 *
 * @param searchFn - Original search function
 * @param errorHub - Error hub for reporting
 * @returns Wrapped search function
 *
 * @example
 * ```ts
 * const safeSearch = createSafeSearch(customSearchFn, errorHub);
 * const results = data.filter(row => safeSearch(row, searchText));
 * ```
 */
export function createSafeSearch<T>(
  searchFn: (row: T, searchText: string) => boolean,
  errorHub: ErrorHub
): (row: T, searchText: string) => boolean {
  let hasReportedError = false;

  return (row: T, searchText: string): boolean => {
    try {
      return searchFn(row, searchText);
    } catch (cause) {
      if (!hasReportedError) {
        hasReportedError = true;
        const error = new SearchError(
          searchText,
          cause instanceof Error ? cause : undefined
        );
        errorHub.report(error);
      }

      // Include row in results
      return true;
    }
  };
}

// ─── CELL RENDER WRAPPERS ─────────────────────────────────────────────────────

/**
 * Create a safe wrapper for a cell renderer.
 * If the renderer throws, returns a fallback node.
 *
 * @param renderer - Original cell renderer
 * @param errorHub - Error hub for reporting
 * @param columnKey - Column key for context
 * @param fallbackRenderer - Optional custom fallback renderer
 * @returns Wrapped cell renderer
 *
 * @example
 * ```ts
 * const safeCell = createSafeCellRenderer(
 *   column.cell,
 *   errorHub,
 *   column.key,
 *   (error) => <span className="error">Error</span>
 * );
 * ```
 */
export function createSafeCellRenderer<T>(
  renderer: (context: CellRenderContext<T>) => ReactNode,
  errorHub: ErrorHub,
  columnKey: string,
  fallbackRenderer?: (error: DataTableError) => ReactNode
): (context: CellRenderContext<T>) => ReactNode {
  // Track errors per row to avoid duplicate reporting
  const reportedRows = new Set<string>();

  return (context: CellRenderContext<T>): ReactNode => {
    try {
      return renderer(context);
    } catch (cause) {
      const rowId = context.row.id;

      // Only report once per row
      if (!reportedRows.has(rowId)) {
        reportedRows.add(rowId);

        const error = new RenderError(
          `Cell render failed for column "${columnKey}" in row "${rowId}"`,
          `Cell:${columnKey}`,
          cause instanceof Error ? cause : undefined
        );
        errorHub.report(error);

        // Cleanup old entries periodically
        if (reportedRows.size > 100) {
          reportedRows.clear();
        }

        // Return fallback
        if (fallbackRenderer) {
          return fallbackRenderer(error);
        }
      }

      // Default fallback: render nothing
      return null;
    }
  };
}

// ─── ACCESSOR WRAPPERS ────────────────────────────────────────────────────────

/**
 * Create a safe wrapper for a column accessor function.
 * If the accessor throws, returns undefined.
 *
 * @param accessorFn - Original accessor function
 * @param errorHub - Error hub for reporting
 * @param columnKey - Column key for context
 * @returns Wrapped accessor function
 */
export function createSafeAccessor<T, V>(
  accessorFn: (row: T) => V,
  errorHub: ErrorHub,
  columnKey: string
): (row: T) => V | undefined {
  let hasReportedError = false;

  return (row: T): V | undefined => {
    try {
      return accessorFn(row);
    } catch (cause) {
      if (!hasReportedError) {
        hasReportedError = true;
        const error = new DataTableError(
          `Accessor function failed for column "${columnKey}"`,
          DataTableErrorCode.RENDER_ERROR,
          {
            severity: ErrorSeverity.ERROR,
            context: { columnKey },
            cause: cause instanceof Error ? cause : undefined,
          }
        );
        errorHub.report(error);
      }

      return undefined;
    }
  };
}

// ─── BATCH SAFE EXECUTION ─────────────────────────────────────────────────────

/**
 * Execute multiple functions safely, collecting all errors.
 * Useful for validation or batch processing.
 *
 * @param operations - Array of operations to execute
 * @param errorHub - Error hub for reporting
 * @returns Array of results (undefined for failed operations)
 */
export function safeBatchExecute<T>(
  operations: Array<{
    fn: () => T;
    errorCode: DataTableErrorCodeValue;
    context?: Record<string, unknown>;
  }>,
  errorHub: ErrorHub
): Array<T | undefined> {
  return operations.map(({ fn, errorCode, context }) => {
    try {
      return fn();
    } catch (cause) {
      const error = new DataTableError(
        `Batch operation failed`,
        errorCode,
        {
          context,
          cause: cause instanceof Error ? cause : undefined,
        }
      );
      errorHub.report(error);
      return undefined;
    }
  });
}

// ─── ASYNC SAFE EXECUTION ─────────────────────────────────────────────────────

/**
 * Safely execute an async function.
 *
 * @param fn - Async function to execute
 * @param options - Execution options
 * @returns Promise of the function result or fallback value
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  options: SafeExecuteOptions<T>
): Promise<T> {
  try {
    return await fn();
  } catch (cause) {
    const error = new DataTableError(
      `Async function execution failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      options.errorCode,
      {
        severity: options.severity,
        context: options.context,
        cause: cause instanceof Error ? cause : undefined,
      }
    );

    options.errorHub.report(error);
    return options.fallback;
  }
}
