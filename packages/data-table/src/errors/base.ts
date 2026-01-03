// ─── BASE ERROR CLASS ────────────────────────────────────────────────────────
// Foundation for all DataTable-specific errors.

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
 * Base error class for all DataTable-specific errors
 * Provides consistent error structure with error codes and additional context
 */
export class DataTableError extends Error {
  /** Error code for programmatic error handling */
  public readonly code: DataTableErrorCodeValue;
  /** Additional context about the error */
  public readonly context?: Record<string, unknown>;
  /** Original error if this wraps another error */
  public readonly cause?: Error;

  constructor(
    message: string,
    code: DataTableErrorCodeValue,
    options?: {
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = "DataTableError";
    this.code = code;
    this.context = options?.context;
    this.cause = options?.cause;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataTableError);
    }
  }

  /**
   * Returns a formatted error message including code
   */
  toFormattedString(): string {
    return `[${this.code}] ${this.message}`;
  }

  /**
   * Returns error as a plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      cause: this.cause?.message,
    };
  }
}
