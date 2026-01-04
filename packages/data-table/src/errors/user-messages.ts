// ─── USER-FACING ERROR MESSAGES ───────────────────────────────────────────────
// Maps error codes to user-friendly, translatable messages.

import type { DataTableStrings } from "../i18n/types";
import { DataTableError, DataTableErrorCode, type DataTableErrorCodeValue } from "./base";
import { ErrorSeverity } from "./severity";

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * Context for message formatting (placeholder values)
 */
export interface MessageContext {
  id?: string;
  key?: string;
  column?: string;
  index?: number | string;
  prop?: string;
  component?: string;
  format?: string;
  [key: string]: string | number | undefined;
}

/**
 * Formatted user message with all relevant information
 */
export interface UserMessage {
  /** The user-friendly message */
  message: string;
  /** Severity level for UI styling */
  severity: ErrorSeverity;
  /** Technical details (for developers) */
  details?: string;
  /** Error code for reference */
  code: DataTableErrorCodeValue;
  /** Whether this error is recoverable */
  recoverable: boolean;
  /** Suggested action for the user */
  action?: string;
}

// ─── MESSAGE KEY MAPPING ──────────────────────────────────────────────────────

/**
 * Maps error codes to i18n string keys
 */
const ERROR_CODE_TO_MESSAGE_KEY: Record<DataTableErrorCodeValue, keyof DataTableStrings> = {
  [DataTableErrorCode.DUPLICATE_ROW_ID]: "errorDuplicateRowId",
  [DataTableErrorCode.MISSING_ROW_ID]: "errorMissingRowId",
  [DataTableErrorCode.INVALID_DATA_FORMAT]: "errorInvalidDataFormat",
  [DataTableErrorCode.DATA_FETCH_FAILED]: "errorDataFetchFailed",
  [DataTableErrorCode.INVALID_COLUMN_KEY]: "errorInvalidColumnKey",
  [DataTableErrorCode.DUPLICATE_COLUMN_KEY]: "errorDuplicateColumnKey",
  [DataTableErrorCode.MISSING_COLUMN_ACCESSOR]: "errorMissingColumnAccessor",
  [DataTableErrorCode.INVALID_CONFIG]: "errorInvalidConfig",
  [DataTableErrorCode.MISSING_REQUIRED_PROP]: "errorMissingRequiredProp",
  [DataTableErrorCode.INCOMPATIBLE_OPTIONS]: "errorIncompatibleOptions",
  [DataTableErrorCode.CONTEXT_NOT_FOUND]: "errorContextNotFound",
  [DataTableErrorCode.PROVIDER_MISSING]: "errorProviderMissing",
  [DataTableErrorCode.RENDER_ERROR]: "errorRenderFailed",
  [DataTableErrorCode.VIRTUALIZATION_ERROR]: "errorVirtualizationFailed",
  [DataTableErrorCode.EDIT_FAILED]: "errorEditFailed",
  [DataTableErrorCode.SELECTION_ERROR]: "errorSelectionFailed",
  [DataTableErrorCode.EXPORT_ERROR]: "errorExportFailed",
  [DataTableErrorCode.FILTER_ERROR]: "errorFilterFailed",
  [DataTableErrorCode.SORT_ERROR]: "errorSortFailed",
};

/**
 * Maps error codes to severity string keys
 */
const SEVERITY_TO_KEY: Record<ErrorSeverity, keyof DataTableStrings> = {
  [ErrorSeverity.WARNING]: "severityWarning",
  [ErrorSeverity.ERROR]: "severityError",
  [ErrorSeverity.CRITICAL]: "severityCritical",
  [ErrorSeverity.FATAL]: "severityFatal",
};

// ─── MESSAGE FORMATTING ───────────────────────────────────────────────────────

/**
 * Replace placeholders in a message string with context values.
 * Placeholders are in the format {key}.
 *
 * @param template - Message template with placeholders
 * @param context - Values to replace placeholders with
 * @returns Formatted message
 *
 * @example
 * ```ts
 * formatMessage("Column {column} has an error", { column: "name" })
 * // => "Column name has an error"
 * ```
 */
export function formatMessage(
  template: string,
  context: MessageContext = {}
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Extract context from a DataTableError for message formatting.
 *
 * @param error - The error to extract context from
 * @returns Context object for message formatting
 */
export function extractMessageContext(error: DataTableError): MessageContext {
  const context: MessageContext = {};

  // Extract common context properties
  if (error.context) {
    if (typeof error.context.id === "string") context.id = error.context.id;
    if (typeof error.context.key === "string") context.key = error.context.key;
    if (typeof error.context.column === "string") context.column = error.context.column;
    if (typeof error.context.columnKey === "string") context.column = error.context.columnKey;
    if (typeof error.context.index === "number") context.index = error.context.index;
    if (typeof error.context.prop === "string") context.prop = error.context.prop;
    if (typeof error.context.component === "string") context.component = error.context.component;
    if (typeof error.context.format === "string") context.format = error.context.format;
  }

  return context;
}

// ─── MAIN FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Get user-friendly message for an error using i18n strings.
 *
 * @param error - The DataTableError to get a message for
 * @param strings - The i18n strings object for the current locale
 * @returns Formatted user message
 *
 * @example
 * ```ts
 * const error = new DuplicateColumnKeyError("name");
 * const message = getUserMessage(error, strings);
 * // => { message: "Duplicate column key \"name\" found...", severity: "critical", ... }
 * ```
 */
export function getUserMessage(
  error: DataTableError,
  strings: DataTableStrings
): UserMessage {
  const messageKey = ERROR_CODE_TO_MESSAGE_KEY[error.code];
  const context = extractMessageContext(error);

  // Get the template, fallback to generic if not found
  const template = messageKey && strings[messageKey]
    ? strings[messageKey]
    : strings.errorGeneric;

  // Format the message with context
  const message = formatMessage(template, context);

  return {
    message,
    severity: error.severity,
    details: error.message, // Technical message
    code: error.code,
    recoverable: error.isRecoverable(),
    action: getActionForError(error, strings),
  };
}

/**
 * Get severity label for an error.
 *
 * @param severity - The error severity
 * @param strings - The i18n strings object
 * @returns Localized severity label
 */
export function getSeverityLabel(
  severity: ErrorSeverity,
  strings: DataTableStrings
): string {
  const key = SEVERITY_TO_KEY[severity];
  return strings[key];
}

/**
 * Get suggested action for an error.
 *
 * @param error - The error to get action for
 * @param strings - The i18n strings object
 * @returns Suggested action or undefined
 */
function getActionForError(
  error: DataTableError,
  strings: DataTableStrings
): string | undefined {
  // Provide action suggestions based on error type
  switch (error.code) {
    case DataTableErrorCode.DATA_FETCH_FAILED:
      return strings.retry;
    case DataTableErrorCode.FILTER_ERROR:
    case DataTableErrorCode.SORT_ERROR:
      return strings.clearAll;
    case DataTableErrorCode.EXPORT_ERROR:
      return strings.retry;
    default:
      return undefined;
  }
}

/**
 * Get all messages from an array of errors.
 *
 * @param errors - Array of errors
 * @param strings - The i18n strings object
 * @returns Array of user messages
 */
export function getUserMessages(
  errors: DataTableError[],
  strings: DataTableStrings
): UserMessage[] {
  return errors.map((error) => getUserMessage(error, strings));
}

/**
 * Format error for display in UI (combines severity label and message).
 *
 * @param error - The error to format
 * @param strings - The i18n strings object
 * @returns Formatted string like "[Error] Column \"name\" has an error"
 */
export function formatErrorForDisplay(
  error: DataTableError,
  strings: DataTableStrings
): string {
  const userMessage = getUserMessage(error, strings);
  const severityLabel = getSeverityLabel(error.severity, strings);
  return `[${severityLabel}] ${userMessage.message}`;
}

/**
 * Format error for copying to clipboard (includes technical details).
 *
 * @param error - The error to format
 * @param strings - The i18n strings object
 * @returns Multi-line string with all error information
 */
export function formatErrorForClipboard(
  error: DataTableError,
  strings: DataTableStrings
): string {
  const userMessage = getUserMessage(error, strings);
  const severityLabel = getSeverityLabel(error.severity, strings);

  const lines = [
    `[${error.code}] ${severityLabel}`,
    `Message: ${userMessage.message}`,
    `Details: ${error.message}`,
    `Time: ${error.timestamp.toISOString()}`,
  ];

  if (error.context) {
    lines.push(`Context: ${JSON.stringify(error.context, null, 2)}`);
  }

  if (error.stack) {
    lines.push(`Stack: ${error.stack}`);
  }

  return lines.join("\n");
}
