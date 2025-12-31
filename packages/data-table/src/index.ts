// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export { DataTable } from "./components/data-table";
export { DataTableInner, type DataTableInnerProps } from "./components/data-table-inner";

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type {
  // Core types
  Column,
  ColumnGroup,
  DataTableProps,
  CellContext,
  SortItem,
  MultiSortState,
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

  // Row Context Menu types
  RowContextMenuItem,
  RowContextMenuSeparator,
  RowContextMenuItemOrSeparator,
  RowContextMenuRenderProps,

  // Cell Selection types
  CellPosition,
  CellRange,
  CellSelectionState,
  CellSelectionContext,
  UseCellSelectionOptions,
  UseCellSelectionReturn,

  // Controller types
  InlineEditingController,
  EditingCell,

  // Hook options
  UseRemoteDataTableOptions,
  UseInlineEditingOptions,

  // Render prop types
  DataTableHeaderRenderProps,
  DataTableToolbarRenderProps,
} from "./types/index";

// ─── TYPE UTILITIES ─────────────────────────────────────────────────────────
export {
  isColumnGroup,
  flattenColumns,
  hasColumnGroups,
} from "./types/index";

// ─── CONTEXT & HOOKS ───────────────────────────────────────────────────────
export {
  DataTableProvider,
  useDataTableContext,
  useSelection,
  useSorting,
  useFiltering,
  usePagination,
  useColumns,
  useGrouping,
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

  // Cell selection
  useCellSelection,

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
  DataTableFooter,
  SummaryRow,

  // Summary utilities
  calculateSummary,
  formatSummaryValue,

  // Row Context Menu
  RowContextMenu,
  useRowContextMenu,
  createDefaultContextMenuItems,

  // Error handling
  DataTableErrorBoundary,
  DataTableErrorDisplay,
} from "./components";

export type {
  DataTableFooterProps,
  SummaryRowProps,
  RowContextMenuProps,
  ContextMenuState,
  UseRowContextMenuOptions,
  UseRowContextMenuReturn,
} from "./components";

export {
  DataTableToolbar,
  ExportDropdown,
  GroupingPillsBar,
  FrozenColumnsIndicator,
  type ToolbarAction,
  type ToolbarDropdown,
  type ToolbarDropdownOption,
  type ToolbarIconAction,
  type DataTableToolbarProps,
  type ExportHandler,
  type PrintHandler,
  type GroupingPillsBarProps,
  type FrozenColumnsIndicatorProps,
} from "./components/toolbar/index";
export { DataTablePagination } from "./components/pagination";

// ─── UTILITIES ─────────────────────────────────────────────────────────────
export {
  getNestedValue,
  setNestedValue,
  getNestedValueSafe,
  type GetNestedValueOptions,
} from "./utils/get-nested-value";
export {
  ensureRowIds,
  validateRowIds,
  findDuplicateRowIds,
} from "./utils/ensure-row-ids";

// Export utilities - CSV, Excel, PDF, JSON
export {
  type ExportFormat,
  type ExportOptions,
  type CSVExportOptions,
  type ExcelExportOptions,
  type PDFExportOptions,
  type JSONExportOptions,
  type ExportResult,
  type ExportConfig,
  exportData,
  exportToCSV,
  toCSVString,
  exportToExcel,
  toExcelBlob,
  exportToPDF,
  toPDFBlob,
  exportToJSON,
  toJSONString,
} from "./utils/export";

// Print utilities
export {
  type PrintOptions,
  type PrintConfig,
  type UsePrintOptions,
  type UsePrintReturn,
  printDataTable,
  printInline,
  usePrint,
} from "./utils/print";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
export {
  // Density
  DENSITY_STYLES,
  DENSITY_CONFIG,
  ROW_HEIGHT_BASE,
  DEFAULT_DENSITY,
  DensityLevel,
  type DensityLevelValue,

  // Dimensions
  COLUMN_WIDTHS,
  HEADER_DIMENSIONS,
  SCROLL_CONSTANTS,

  // Pagination
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  PAGINATION_LIMITS,

  // Virtualization
  DEFAULT_VIRTUALIZE_THRESHOLD,
  DEFAULT_OVERSCAN,
  VIRTUALIZATION_CONFIG,

  // Keyboard
  DEFAULT_KEYBOARD_PAGE_SIZE,
  KeyboardKeys,
  KEYBOARD_SHORTCUTS,

  // Enums
  SortDirection,
  type SortDirectionValue,
  PinPosition,
  type PinPositionValue,
  TableVariant,
  type TableVariantValue,
  FilterType,
  type FilterTypeValue,
  SelectionMode,
  type SelectionModeValue,
  ColumnAlign,
  type ColumnAlignValue,
  CellSelectionMode,
  type CellSelectionModeValue,
} from "./constants/index";

// ─── ERRORS ────────────────────────────────────────────────────────────────
export {
  // Base error
  DataTableError,
  DataTableErrorCode,
  type DataTableErrorCodeValue,

  // Data errors
  DuplicateRowIdError,
  MissingRowIdError,
  InvalidDataFormatError,
  DataFetchError,

  // Column errors
  InvalidColumnKeyError,
  DuplicateColumnKeyError,
  MissingColumnAccessorError,

  // Config errors
  InvalidConfigError,
  MissingRequiredPropError,
  IncompatibleOptionsError,

  // Context errors
  ContextNotFoundError,
  ProviderMissingError,

  // Runtime errors
  RenderError,
  VirtualizationError,
  EditError,

  // Type guards
  isDataTableError,
  hasErrorCode,
} from "./errors";
