// ─── ERRORS MODULE ───────────────────────────────────────────────────────────
// Central export point for all DataTable error classes.

import { DataTableError, type DataTableErrorCodeValue } from "./base";
import { ErrorSeverity } from "./severity";

// ─── SEVERITY ─────────────────────────────────────────────────────────────────
export {
  ErrorSeverity,
  SEVERITY_CONFIG,
  SEVERITY_ORDER,
  getSeverityConfig,
  compareSeverity,
  maxSeverity,
  meetsMinSeverity,
  shouldReport,
  shouldTriggerBoundary,
  shouldAttemptRecovery,
  shouldNotifyUser,
  type SeverityConfig,
} from "./severity";

// ─── BASE ────────────────────────────────────────────────────────────────────
export {
  DataTableError,
  DataTableErrorCode,
  DEFAULT_ERROR_SEVERITY,
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
  FilterError,
  SortError,
  ExportError,
  SelectionError,
  SearchError,
  type ExportFormat,
  type SelectionOperation,
} from "./runtime-errors";

// ─── ERROR HUB ────────────────────────────────────────────────────────────────
export {
  ErrorHub,
  getErrorHub,
  createErrorHub,
  resetDefaultErrorHub,
  type ErrorHandler,
  type Unsubscribe,
  type ErrorHubOptions,
  type ErrorHubState,
  type RecoveryStrategy,
} from "./error-hub";

// ─── RECOVERY STRATEGIES ──────────────────────────────────────────────────────
export {
  // Built-in strategies
  filterErrorRecovery,
  sortErrorRecovery,
  renderErrorRecovery,
  editErrorRecovery,
  dataFetchErrorRecovery,
  virtualizationErrorRecovery,
  selectionErrorRecovery,
  exportErrorRecovery,
  // Utilities
  getDefaultRecoveryStrategies,
  createRecoveryStrategyMap,
  executeRecovery,
  executeRecoveryWithRetry,
  createRecoveryStrategy,
  mergeRecoveryStrategies,
  // Types
  type RecoveryResult,
  type RecoveryStrategyConfig,
} from "./recovery";

// ─── AGGREGATE ERROR ──────────────────────────────────────────────────────────
export {
  AggregateDataTableError,
  ErrorCollector,
  aggregateErrors,
  flattenErrors,
  isAggregateError,
} from "./aggregate-error";

// ─── USER MESSAGES ────────────────────────────────────────────────────────────
export {
  formatMessage,
  extractMessageContext,
  getUserMessage,
  getSeverityLabel,
  getUserMessages,
  formatErrorForDisplay,
  formatErrorForClipboard,
  type MessageContext,
  type UserMessage,
} from "./user-messages";

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

/**
 * Type guard to check if an error has a specific severity or higher
 */
export function hasSeverityAtLeast(
  error: unknown,
  minSeverity: ErrorSeverity
): error is DataTableError {
  return isDataTableError(error) && error.isAtLeast(minSeverity);
}

/**
 * Type guard to check if an error is fatal
 */
export function isFatalError(error: unknown): error is DataTableError {
  return isDataTableError(error) && error.severity === ErrorSeverity.FATAL;
}

/**
 * Type guard to check if an error should trigger the error boundary
 */
export function shouldTriggerErrorBoundary(error: unknown): boolean {
  return isDataTableError(error) && error.shouldTriggerBoundary();
}

/**
 * Type guard to check if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  return isDataTableError(error) && error.isRecoverable();
}
