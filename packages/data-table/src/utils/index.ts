export { getNestedValue, setNestedValue, getNestedValueSafe, type GetNestedValueOptions } from "./get-nested-value";
export {
  ensureRowIds,
  validateRowIds,
  findDuplicateRowIds,
} from "./ensure-row-ids";

// Re-export error from errors module
export { DuplicateRowIdError } from "../errors";

// Deprecation utilities (for future use)
export {
  warnDeprecatedProp,
  resolveDeprecatedProp,
  clearDeprecationWarnings,
} from "./deprecation";

// Grouping utilities
export {
  getNestedValue as getNestedGroupValue,
  formatGroupLabel,
  calculateAggregation,
  buildNestedGroups,
  buildGroupedData,
  type BuildGroupsOptions,
} from "./grouping";

// Export module - CSV, Excel, PDF, JSON
export {
  // Types
  type ExportFormat,
  type ExportOptions,
  type CSVExportOptions,
  type ExcelExportOptions,
  type PDFExportOptions,
  type JSONExportOptions,
  type ExportResult,
  type ExportConfig,
  // Unified export
  exportData,
  // Individual exports
  exportToCSV,
  toCSVString,
  exportToExcel,
  toExcelBlob,
  exportToPDF,
  toPDFBlob,
  exportToJSON,
  toJSONString,
} from "./export";

// Logger utility - standardized error handling
export {
  createLogger,
  logger,
  devWarn,
  logAndThrow,
  logRecoverable,
  withErrorLogging,
  withErrorLoggingSync,
  type LogLevel,
  type LogContext,
  type LoggerOptions,
} from "./logger";

// Pagination utilities
export {
  getTotalPages,
  clampPage,
  getPageIndices,
  getPaginationState,
} from "./pagination";

// Safe execution utilities - error handling wrappers
export {
  safeExecute,
  safeExecuteAsync,
  safeBatchExecute,
  createSafeFilter,
  createSafeFilters,
  createSafeSort,
  createSafeSearch,
  createSafeCellRenderer,
  createSafeAccessor,
  type SafeExecuteOptions,
  type CellRenderContext,
} from "./safe-execute";

// Validation utilities - column and data validation
export {
  validateColumns,
  assertValidColumns,
  isValidColumnKey,
  findDuplicateColumnKeys,
  getAllColumnKeys,
  validateRowIds as validateRowIdsUniqueness,
  type ValidationResult,
  type ValidateColumnsOptions,
} from "./validation";

// Controlled state desync warnings
export {
  DesyncDetector,
  createDesyncDetector,
  warnControlledDesync,
  type ControlledStateType,
  type DesyncWarning,
  type DesyncDetectorOptions,
} from "./controlled-state-warnings";

// Type guards - safe DOM and object type checking
export {
  // DOM element guards
  isHTMLElement,
  isInputElement,
  isTextAreaElement,
  isButtonElement,
  isSelectElement,
  isTableCellElement,
  isTableRowElement,
  isEditableElement,
  isInteractiveElement,
  // Object guards
  isPlainObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isDate,
  isDefined,
  isNullish,
  // Array utilities
  safeArrayAccess,
  first,
  last,
  // Event utilities
  shouldIgnoreEvent,
  closestElement,
  // Parse utilities
  safeParseInt,
  safeParseFloat,
} from "./type-guards";
