import type { Column } from "../../types";

// ─── EXPORT FORMATS ─────────────────────────────────────────────────────────

export type ExportFormat = "csv" | "excel" | "pdf" | "json" | "html";

// ─── EXPORT OPTIONS ─────────────────────────────────────────────────────────

export interface ExportOptions<T extends { id: string }> {
  /** Data to export */
  data: T[];
  /** Columns configuration */
  columns: Column<T>[];
  /** Output filename (without extension) */
  filename?: string;
  /** Include only visible columns */
  visibleColumnsOnly?: boolean;
  /** Set of hidden column keys (used with visibleColumnsOnly) */
  hiddenColumns?: Set<string>;
  /** Export only selected rows */
  selectedOnly?: boolean;
  /** Set of selected row IDs (used with selectedOnly) */
  selectedIds?: Set<string>;
  /** Include headers in export */
  includeHeaders?: boolean;
  /** Custom value formatter for cells */
  formatValue?: (value: unknown, column: Column<T>, row: T) => string;
}

// ─── CSV OPTIONS ────────────────────────────────────────────────────────────

export interface CSVExportOptions<T extends { id: string }> extends ExportOptions<T> {
  /** CSV delimiter (default: comma) */
  delimiter?: "," | ";" | "\t";
  /** Include BOM for Excel compatibility */
  includeBOM?: boolean;
}

// ─── EXCEL OPTIONS ──────────────────────────────────────────────────────────

export interface ExcelExportOptions<T extends { id: string }> extends ExportOptions<T> {
  /** Sheet name */
  sheetName?: string;
  /** Auto-size columns to fit content */
  autoWidth?: boolean;
  /** Freeze header row */
  freezeHeader?: boolean;
  /** Apply header styling */
  styleHeader?: boolean;
  /** Apply zebra striping to rows */
  zebraStripes?: boolean;
}

// ─── PDF OPTIONS ────────────────────────────────────────────────────────────

export type PDFOrientation = "portrait" | "landscape";
export type PDFPageSize = "a4" | "letter" | "legal";

export interface PDFExportOptions<T extends { id: string }> extends ExportOptions<T> {
  /** Page orientation */
  orientation?: PDFOrientation;
  /** Page size */
  pageSize?: PDFPageSize;
  /** Document title (shown at top) */
  title?: string;
  /** Show page numbers */
  showPageNumbers?: boolean;
  /** Header background color */
  headerColor?: string;
  /** Alternate row color */
  alternateRowColor?: string;
  /** Font size */
  fontSize?: number;
  /** Add timestamp to footer */
  includeTimestamp?: boolean;
}

// ─── JSON OPTIONS ───────────────────────────────────────────────────────────

export interface JSONExportOptions<T extends { id: string }> extends ExportOptions<T> {
  /** Pretty print with indentation */
  pretty?: boolean;
  /** Indentation spaces (default: 2) */
  indent?: number;
  /** Include metadata (export date, row count, etc.) */
  includeMetadata?: boolean;
}

// ─── HTML OPTIONS ───────────────────────────────────────────────────────────

export interface HTMLExportOptions<T extends { id: string }> extends ExportOptions<T> {
  /** Document/table title */
  title?: string;
  /** Include CSS styles (default: true) */
  includeStyles?: boolean;
  /** Use inline styles instead of CSS classes (better for email) */
  inlineStyles?: boolean;
  /** Header background color (default: #6750A4) */
  headerColor?: string;
  /** Header text color (default: #ffffff) */
  headerTextColor?: string;
  /** Border color (default: #e0e0e0) */
  borderColor?: string;
  /** Zebra stripe color (default: #f5f5f5) */
  zebraColor?: string;
  /** Font size in pixels (default: 14) */
  fontSize?: number;
  /** Font family (default: system fonts) */
  fontFamily?: string;
  /** Include metadata footer (export date, row count) */
  includeMetadata?: boolean;
  /** Wrap in full HTML document with DOCTYPE (default: true for export, false for string) */
  wrapInDocument?: boolean;
}

// ─── EXPORT RESULT ──────────────────────────────────────────────────────────

export interface ExportResult {
  success: boolean;
  error?: string;
  /** Number of rows exported */
  rowCount?: number;
  /** File size in bytes (if available) */
  fileSize?: number;
}

// ─── EXPORT CONFIG (combined options for all formats) ───────────────────────

export type ExportConfig<T extends { id: string }> =
  | ({ format: "csv" } & CSVExportOptions<T>)
  | ({ format: "excel" } & ExcelExportOptions<T>)
  | ({ format: "pdf" } & PDFExportOptions<T>)
  | ({ format: "json" } & JSONExportOptions<T>)
  | ({ format: "html" } & HTMLExportOptions<T>);
