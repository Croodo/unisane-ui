// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export { DataTable, default as DataTableDefault } from "./data-table";
export { DataTableInner, type DataTableInnerProps } from "./data-table-inner";

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type {
  // Core types
  Column,
  ColumnGroup,
  DataTableProps,
  CellContext,
  SortDirection,
  SortItem,
  MultiSortState,
  PinPosition,
  ColumnMetaMap,
  Density,

  // Filter types
  FilterValue,
  FilterState,

  // Pagination types
  PaginationState,
  CursorPagination,

  // Action types
  BulkAction,

  // Controller types
  InlineEditingController,
  EditingCell,

  // Hook options
  UseRemoteDataTableOptions,
  UseInlineEditingOptions,

  // Render prop types
  DataTableHeaderRenderProps,
  DataTableToolbarRenderProps,
} from "./types";

// ─── TYPE UTILITIES ─────────────────────────────────────────────────────────
export {
  isColumnGroup,
  flattenColumns,
  hasColumnGroups,
} from "./types";

// ─── CONTEXT & HOOKS ───────────────────────────────────────────────────────
export {
  DataTableProvider,
  useDataTableContext,
  useSelection,
  useSorting,
  useFiltering,
  usePagination,
  useColumns,
  useTableUI,
} from "./context";

// ─── HOOKS ─────────────────────────────────────────────────────────────────
export {
  // Data processing
  useProcessedData,

  // Virtualization
  useVirtualizedRows,
  type UseVirtualizedRowsOptions,
  type UseVirtualizedRowsReturn,
  type VirtualRow,

  // Remote data
  useRemoteDataTable,
  type ListParamsLike,
  type QueryLike,
  type StatsQueryLike,
  type UseRemoteDataTableReturn,

  // Keyboard navigation
  useKeyboardNavigation,
  type UseKeyboardNavigationOptions,
  type UseKeyboardNavigationReturn,

  // Inline editing
  useInlineEditing,

  // Debouncing
  useDebounce,
  useDebouncedCallback,
} from "./hooks";

// ─── COMPONENTS ────────────────────────────────────────────────────────────
export {
  // Base table primitives
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,

  // Data table components
  DataTableHeader,
  DataTableRow,
  DataTableBody,

  // Error handling
  DataTableErrorBoundary,
  DataTableError,
} from "./components";

export {
  DataTableToolbar,
  ExportDropdown,
  type ToolbarAction,
  type ToolbarDropdown,
  type ToolbarDropdownOption,
  type ToolbarIconAction,
  type DataTableToolbarProps,
  type ExportHandler,
} from "./components/toolbar/index";
export { DataTablePagination } from "./components/pagination";

// ─── UTILITIES ─────────────────────────────────────────────────────────────
export { getNestedValue, setNestedValue } from "./utils/get-nested-value";
export { ensureRowIds } from "./utils/ensure-row-ids";

// Export utilities - CSV, Excel, PDF, JSON
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
} from "./utils/export";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
export {
  DENSITY_STYLES,
  DENSITY_CONFIG,
  COLUMN_WIDTHS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_KEYBOARD_PAGE_SIZE,
  DEFAULT_VIRTUALIZE_THRESHOLD,
  DEFAULT_OVERSCAN,
} from "./constants";
export type { Density as DensityType } from "./constants";
