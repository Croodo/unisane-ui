// ─── DATA ERRORS ─────────────────────────────────────────────────────────────
// Errors related to data validation, row IDs, and data fetching.

import { DataTableError, DataTableErrorCode } from "./base";

/**
 * Error thrown when duplicate row IDs are detected in the data
 */
export class DuplicateRowIdError extends DataTableError {
  /** Array of duplicate ID values found */
  public readonly duplicateIds: string[];

  constructor(duplicateIds: string[]) {
    const displayIds = duplicateIds.slice(0, 5).join(", ");
    const moreCount = duplicateIds.length - 5;
    const suffix = moreCount > 0 ? ` and ${moreCount} more` : "";

    super(
      `Duplicate row IDs detected: ${displayIds}${suffix}. Each row must have a unique ID.`,
      DataTableErrorCode.DUPLICATE_ROW_ID,
      { context: { duplicateIds } }
    );

    this.name = "DuplicateRowIdError";
    this.duplicateIds = duplicateIds;
  }
}

/**
 * Error thrown when a required row ID is missing
 */
export class MissingRowIdError extends DataTableError {
  /** Index of the row with missing ID */
  public readonly rowIndex: number;

  constructor(rowIndex: number) {
    super(
      `Row at index ${rowIndex} is missing a required ID field.`,
      DataTableErrorCode.MISSING_ROW_ID,
      { context: { rowIndex } }
    );

    this.name = "MissingRowIdError";
    this.rowIndex = rowIndex;
  }
}

/**
 * Error thrown when data format is invalid
 */
export class InvalidDataFormatError extends DataTableError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      DataTableErrorCode.INVALID_DATA_FORMAT,
      { context: details }
    );

    this.name = "InvalidDataFormatError";
  }
}

/**
 * Error thrown when data fetching fails (for remote data tables)
 */
export class DataFetchError extends DataTableError {
  /** HTTP status code if applicable */
  public readonly statusCode?: number;
  /** URL that was being fetched */
  public readonly url?: string;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      url?: string;
      cause?: Error;
    }
  ) {
    super(
      message,
      DataTableErrorCode.DATA_FETCH_FAILED,
      {
        context: {
          statusCode: options?.statusCode,
          url: options?.url,
        },
        cause: options?.cause,
      }
    );

    this.name = "DataFetchError";
    this.statusCode = options?.statusCode;
    this.url = options?.url;
  }
}
