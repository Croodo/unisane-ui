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
  type ToolbarAction,
  type ToolbarDropdown,
  type ToolbarDropdownOption,
  type ToolbarIconAction,
} from "./components/toolbar";
export { DataTablePagination } from "./components/pagination";

// ─── UTILITIES ─────────────────────────────────────────────────────────────
export { getNestedValue, setNestedValue } from "./utils/get-nested-value";
export { ensureRowIds } from "./utils/ensure-row-ids";
export { exportToCSV, toCSVString, type ExportResult } from "./utils/csv-export";

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
