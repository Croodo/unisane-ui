export { getNestedValue, setNestedValue, getNestedValueSafe, type GetNestedValueOptions } from "./get-nested-value";
export {
  ensureRowIds,
  validateRowIds,
  findDuplicateRowIds,
} from "./ensure-row-ids";

// Re-export error from errors module
export { DuplicateRowIdError } from "../errors";

// Deprecation utilities
export {
  DEPRECATED_PROPS,
  warnDeprecatedProp,
  resolveDeprecatedProp,
  resolveDeprecatedProps,
  clearDeprecationWarnings,
  type WithDeprecatedProps,
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
