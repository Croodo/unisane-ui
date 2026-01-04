// ─── RUNTIME ERRORS ──────────────────────────────────────────────────────────
// Errors that occur during runtime operations.

import { DataTableError, DataTableErrorCode } from "./base";
import { ErrorSeverity } from "./severity";

/**
 * Error thrown during rendering
 */
export class RenderError extends DataTableError {
  /** The component that failed to render */
  public readonly componentName?: string;

  constructor(message: string, componentName?: string, cause?: Error) {
    super(
      message,
      DataTableErrorCode.RENDER_ERROR,
      { context: { componentName }, cause }
    );

    this.name = "RenderError";
    this.componentName = componentName;
  }
}

/**
 * Error thrown when virtualization fails
 */
export class VirtualizationError extends DataTableError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      DataTableErrorCode.VIRTUALIZATION_ERROR,
      { context: details }
    );

    this.name = "VirtualizationError";
  }
}

/**
 * Error thrown when cell editing fails
 */
export class EditError extends DataTableError {
  /** The row ID being edited */
  public readonly rowId?: string;
  /** The column key being edited */
  public readonly columnKey?: string;

  constructor(
    message: string,
    options?: {
      rowId?: string;
      columnKey?: string;
      cause?: Error;
    }
  ) {
    super(
      message,
      DataTableErrorCode.EDIT_FAILED,
      {
        context: {
          rowId: options?.rowId,
          columnKey: options?.columnKey,
        },
        cause: options?.cause,
      }
    );

    this.name = "EditError";
    this.rowId = options?.rowId;
    this.columnKey = options?.columnKey;
  }
}

/**
 * Error thrown when a filter function fails.
 * The table will continue to work but the filter will be bypassed for the affected rows.
 *
 * @example
 * ```ts
 * throw new FilterError("age", 25, originalError);
 * ```
 */
export class FilterError extends DataTableError {
  /** The column key whose filter failed */
  public readonly columnKey: string;
  /** The filter value that caused the error */
  public readonly filterValue: unknown;

  constructor(
    columnKey: string,
    filterValue: unknown,
    cause?: Error
  ) {
    super(
      `Filter function failed for column "${columnKey}"`,
      DataTableErrorCode.FILTER_ERROR,
      {
        severity: ErrorSeverity.ERROR,
        context: { columnKey, filterValue },
        cause,
      }
    );

    this.name = "FilterError";
    this.columnKey = columnKey;
    this.filterValue = filterValue;
  }
}

/**
 * Error thrown when a sort function fails.
 * The table will continue to work but the sort will treat items as equal.
 *
 * @example
 * ```ts
 * throw new SortError("customDate", originalError);
 * ```
 */
export class SortError extends DataTableError {
  /** The column key whose sort failed */
  public readonly columnKey: string;

  constructor(columnKey: string, cause?: Error) {
    super(
      `Sort function failed for column "${columnKey}"`,
      DataTableErrorCode.SORT_ERROR,
      {
        severity: ErrorSeverity.ERROR,
        context: { columnKey },
        cause,
      }
    );

    this.name = "SortError";
    this.columnKey = columnKey;
  }
}

/**
 * Export format types supported by the data table.
 */
export type ExportFormat = "csv" | "excel" | "pdf" | "json" | "html";

/**
 * Error thrown when an export operation fails.
 *
 * @example
 * ```ts
 * throw new ExportError("pdf", "Failed to generate PDF", { rowCount: 1000, cause: originalError });
 * ```
 */
export class ExportError extends DataTableError {
  /** The export format that failed */
  public readonly exportType: ExportFormat;
  /** Number of rows that were being exported */
  public readonly rowCount?: number;

  constructor(
    exportType: ExportFormat,
    message: string,
    options?: {
      rowCount?: number;
      cause?: Error;
    }
  ) {
    super(
      `Export to ${exportType.toUpperCase()} failed: ${message}`,
      DataTableErrorCode.EXPORT_ERROR,
      {
        severity: ErrorSeverity.ERROR,
        context: { exportType, rowCount: options?.rowCount },
        cause: options?.cause,
      }
    );

    this.name = "ExportError";
    this.exportType = exportType;
    this.rowCount = options?.rowCount;
  }
}

/**
 * Selection operation types.
 */
export type SelectionOperation = "select" | "deselect" | "selectAll" | "clear" | "toggle";

/**
 * Error thrown when a selection operation fails.
 * This is typically a warning-level error as selection state can be recovered.
 *
 * @example
 * ```ts
 * throw new SelectionError("selectAll", "Cannot select all in sparse mode", { affectedIds: ["1", "2"] });
 * ```
 */
export class SelectionError extends DataTableError {
  /** The selection operation that failed */
  public readonly operation: SelectionOperation;
  /** IDs that were affected by the failed operation */
  public readonly affectedIds?: string[];

  constructor(
    operation: SelectionOperation,
    message: string,
    options?: {
      affectedIds?: string[];
      cause?: Error;
    }
  ) {
    super(
      `Selection ${operation} failed: ${message}`,
      DataTableErrorCode.SELECTION_ERROR,
      {
        severity: ErrorSeverity.WARNING,
        context: { operation, affectedIds: options?.affectedIds },
        cause: options?.cause,
      }
    );

    this.name = "SelectionError";
    this.operation = operation;
    this.affectedIds = options?.affectedIds;
  }
}

/**
 * Error thrown when a search function fails.
 * Similar to FilterError but specifically for global search operations.
 *
 * @example
 * ```ts
 * throw new SearchError("complex query", originalError);
 * ```
 */
export class SearchError extends DataTableError {
  /** The search query that caused the error */
  public readonly searchQuery: string;

  constructor(searchQuery: string, cause?: Error) {
    super(
      `Search function failed for query "${searchQuery}"`,
      DataTableErrorCode.FILTER_ERROR, // Reuse filter error code
      {
        severity: ErrorSeverity.ERROR,
        context: { searchQuery },
        cause,
      }
    );

    this.name = "SearchError";
    this.searchQuery = searchQuery;
  }
}
