// ─── COLUMN ERRORS ───────────────────────────────────────────────────────────
// Errors related to column configuration and validation.

import { DataTableError, DataTableErrorCode } from "./base";

/**
 * Error thrown when a column key is invalid
 */
export class InvalidColumnKeyError extends DataTableError {
  /** The invalid column key */
  public readonly columnKey: string;

  constructor(columnKey: string, reason?: string) {
    const message = reason
      ? `Invalid column key "${columnKey}": ${reason}`
      : `Invalid column key "${columnKey}".`;

    super(
      message,
      DataTableErrorCode.INVALID_COLUMN_KEY,
      { context: { columnKey, reason } }
    );

    this.name = "InvalidColumnKeyError";
    this.columnKey = columnKey;
  }
}

/**
 * Error thrown when duplicate column keys are detected
 */
export class DuplicateColumnKeyError extends DataTableError {
  /** The duplicate column key */
  public readonly duplicateKey: string;

  constructor(duplicateKey: string) {
    super(
      `Duplicate column key "${duplicateKey}". Each column must have a unique key.`,
      DataTableErrorCode.DUPLICATE_COLUMN_KEY,
      { context: { duplicateKey } }
    );

    this.name = "DuplicateColumnKeyError";
    this.duplicateKey = duplicateKey;
  }
}

/**
 * Error thrown when a column is missing a required accessor
 */
export class MissingColumnAccessorError extends DataTableError {
  /** The column key missing an accessor */
  public readonly columnKey: string;

  constructor(columnKey: string) {
    super(
      `Column "${columnKey}" must have either an accessor function or a key that matches a data property.`,
      DataTableErrorCode.MISSING_COLUMN_ACCESSOR,
      { context: { columnKey } }
    );

    this.name = "MissingColumnAccessorError";
    this.columnKey = columnKey;
  }
}
