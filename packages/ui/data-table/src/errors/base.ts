// ─── BASE ERROR CLASS ────────────────────────────────────────────────────────
// Foundation for all DataTable-specific errors.

import { ErrorSeverity } from "./severity";

/**
 * Error codes for DataTable errors
 */
export const DataTableErrorCode = {
  // Data errors (1xx)
  DUPLICATE_ROW_ID: "DT_101",
  MISSING_ROW_ID: "DT_102",
  INVALID_DATA_FORMAT: "DT_103",
  DATA_FETCH_FAILED: "DT_104",

  // Column errors (2xx)
  INVALID_COLUMN_KEY: "DT_201",
  DUPLICATE_COLUMN_KEY: "DT_202",
  MISSING_COLUMN_ACCESSOR: "DT_203",

  // Configuration errors (3xx)
  INVALID_CONFIG: "DT_301",
  MISSING_REQUIRED_PROP: "DT_302",
  INCOMPATIBLE_OPTIONS: "DT_303",

  // Context errors (4xx)
  CONTEXT_NOT_FOUND: "DT_401",
  PROVIDER_MISSING: "DT_402",

  // Runtime errors (5xx)
  RENDER_ERROR: "DT_501",
  VIRTUALIZATION_ERROR: "DT_502",
  EDIT_FAILED: "DT_503",
  SELECTION_ERROR: "DT_504",
  EXPORT_ERROR: "DT_505",
  FILTER_ERROR: "DT_506",
  SORT_ERROR: "DT_507",
} as const;

export type DataTableErrorCodeValue = (typeof DataTableErrorCode)[keyof typeof DataTableErrorCode];

/**
 * Default severity for each error code.
 * Used when severity is not explicitly set.
 */
export const DEFAULT_ERROR_SEVERITY: Record<DataTableErrorCodeValue, ErrorSeverity> = {
  // Data errors - mostly critical as they affect data integrity
  [DataTableErrorCode.DUPLICATE_ROW_ID]: ErrorSeverity.CRITICAL,
  [DataTableErrorCode.MISSING_ROW_ID]: ErrorSeverity.CRITICAL,
  [DataTableErrorCode.INVALID_DATA_FORMAT]: ErrorSeverity.CRITICAL,
  [DataTableErrorCode.DATA_FETCH_FAILED]: ErrorSeverity.ERROR,

  // Column errors - critical as they affect rendering
  [DataTableErrorCode.INVALID_COLUMN_KEY]: ErrorSeverity.CRITICAL,
  [DataTableErrorCode.DUPLICATE_COLUMN_KEY]: ErrorSeverity.CRITICAL,
  [DataTableErrorCode.MISSING_COLUMN_ACCESSOR]: ErrorSeverity.ERROR,

  // Configuration errors - vary by impact
  [DataTableErrorCode.INVALID_CONFIG]: ErrorSeverity.CRITICAL,
  [DataTableErrorCode.MISSING_REQUIRED_PROP]: ErrorSeverity.FATAL,
  [DataTableErrorCode.INCOMPATIBLE_OPTIONS]: ErrorSeverity.WARNING,

  // Context errors - fatal as table cannot function
  [DataTableErrorCode.CONTEXT_NOT_FOUND]: ErrorSeverity.FATAL,
  [DataTableErrorCode.PROVIDER_MISSING]: ErrorSeverity.FATAL,

  // Runtime errors - recoverable with fallbacks
  [DataTableErrorCode.RENDER_ERROR]: ErrorSeverity.ERROR,
  [DataTableErrorCode.VIRTUALIZATION_ERROR]: ErrorSeverity.ERROR,
  [DataTableErrorCode.EDIT_FAILED]: ErrorSeverity.ERROR,
  [DataTableErrorCode.SELECTION_ERROR]: ErrorSeverity.WARNING,
  [DataTableErrorCode.EXPORT_ERROR]: ErrorSeverity.ERROR,
  [DataTableErrorCode.FILTER_ERROR]: ErrorSeverity.ERROR,
  [DataTableErrorCode.SORT_ERROR]: ErrorSeverity.ERROR,
};

/**
 * Base error class for all DataTable-specific errors.
 * Provides consistent error structure with error codes, severity levels, and additional context.
 *
 * @example
 * ```ts
 * throw new DataTableError(
 *   "Failed to process data",
 *   DataTableErrorCode.INVALID_DATA_FORMAT,
 *   {
 *     severity: ErrorSeverity.CRITICAL,
 *     context: { rowCount: 100 },
 *     cause: originalError,
 *   }
 * );
 * ```
 */
export class DataTableError extends Error {
  /** Error code for programmatic error handling */
  public readonly code: DataTableErrorCodeValue;

  /** Severity level determining how the error should be handled */
  public severity: ErrorSeverity;

  /** Additional context about the error */
  public readonly context?: Record<string, unknown>;

  /** Original error if this wraps another error */
  public override readonly cause?: Error;

  /** Timestamp when the error was created */
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: DataTableErrorCodeValue,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = "DataTableError";
    this.code = code;
    this.severity = options?.severity ?? DEFAULT_ERROR_SEVERITY[code] ?? ErrorSeverity.ERROR;
    this.context = options?.context;
    this.cause = options?.cause;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataTableError);
    }
  }

  /**
   * Returns a formatted error message including code and severity
   */
  toFormattedString(): string {
    return `[${this.code}] [${this.severity.toUpperCase()}] ${this.message}`;
  }

  /**
   * Returns error as a plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.cause?.message,
    };
  }

  /**
   * Check if this error is of a specific severity or higher
   */
  isAtLeast(minSeverity: ErrorSeverity): boolean {
    const order = [
      ErrorSeverity.WARNING,
      ErrorSeverity.ERROR,
      ErrorSeverity.CRITICAL,
      ErrorSeverity.FATAL,
    ];
    return order.indexOf(this.severity) >= order.indexOf(minSeverity);
  }

  /**
   * Check if this error should trigger the error boundary
   */
  shouldTriggerBoundary(): boolean {
    return this.severity === ErrorSeverity.CRITICAL || this.severity === ErrorSeverity.FATAL;
  }

  /**
   * Check if this error is recoverable
   */
  isRecoverable(): boolean {
    return this.severity !== ErrorSeverity.FATAL;
  }
}
