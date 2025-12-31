export { getNestedValue, setNestedValue, getNestedValueSafe, type GetNestedValueOptions } from "./get-nested-value";
export {
  ensureRowIds,
  validateRowIds,
  findDuplicateRowIds,
} from "./ensure-row-ids";

// Re-export error from errors module
export { DuplicateRowIdError } from "../errors";

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
