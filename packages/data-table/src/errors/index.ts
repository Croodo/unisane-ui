// ─── ERRORS MODULE ───────────────────────────────────────────────────────────
// Central export point for all DataTable error classes.

import { DataTableError, type DataTableErrorCodeValue } from "./base";

// ─── BASE ────────────────────────────────────────────────────────────────────
export {
  DataTableError,
  DataTableErrorCode,
  type DataTableErrorCodeValue,
} from "./base";

// ─── DATA ERRORS ─────────────────────────────────────────────────────────────
export {
  DuplicateRowIdError,
  MissingRowIdError,
  InvalidDataFormatError,
  DataFetchError,
} from "./data-errors";

// ─── COLUMN ERRORS ───────────────────────────────────────────────────────────
export {
  InvalidColumnKeyError,
  DuplicateColumnKeyError,
  MissingColumnAccessorError,
} from "./column-errors";

// ─── CONFIG ERRORS ───────────────────────────────────────────────────────────
export {
  InvalidConfigError,
  MissingRequiredPropError,
  IncompatibleOptionsError,
} from "./config-errors";

// ─── CONTEXT ERRORS ──────────────────────────────────────────────────────────
export {
  ContextNotFoundError,
  ProviderMissingError,
} from "./context-errors";

// ─── RUNTIME ERRORS ──────────────────────────────────────────────────────────
export {
  RenderError,
  VirtualizationError,
  EditError,
} from "./runtime-errors";

// ─── TYPE GUARDS ─────────────────────────────────────────────────────────────

/**
 * Type guard to check if an error is a DataTableError
 */
export function isDataTableError(error: unknown): error is DataTableError {
  return error instanceof DataTableError;
}

/**
 * Type guard to check if an error has a specific error code
 */
export function hasErrorCode(
  error: unknown,
  code: DataTableErrorCodeValue
): error is DataTableError {
  return isDataTableError(error) && error.code === code;
}
