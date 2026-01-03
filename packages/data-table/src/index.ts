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

  // Tree Data types
  TreeDataConfig,
  TreeExpanderProps as TreeExpanderPropsType,
  FlattenedTreeRow,
  TreeDataState,
  TreeSelectionMode,
  TreeRowContext,

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
  useInlineEditingWithHistory,
  useInlineEditingWithFeedback,
  type UseInlineEditingWithHistoryOptions,
  type UseInlineEditingWithHistoryReturn,
  type UseInlineEditingWithFeedbackOptions,
  type UseInlineEditingWithFeedbackReturn,

  // Cell selection
  useCellSelection,

  // Tree data
  useTreeData,
  type UseTreeDataOptions,
  type UseTreeDataReturn,

  // Infinite scroll
  useInfiniteScroll,
  type UseInfiniteScrollOptions,
  type UseInfiniteScrollReturn,

  // Selection persistence
  useSelectionPersistence,
  type UseSelectionPersistenceOptions,
  type UseSelectionPersistenceReturn,

  // Clipboard paste
  useClipboardPaste,
  useClipboardPasteWithFeedback,
  type ParsedClipboardData,
  type PasteCellUpdate,
  type PasteValidationResult,
  type PasteResult,
  type UseClipboardPasteOptions,
  type UseClipboardPasteReturn,
  type UseClipboardPasteWithFeedbackOptions,
  type UseClipboardPasteWithFeedbackReturn,

  // Edit history (undo/redo)
  useEditHistory,
  useEditHistoryWithFeedback,
  type EditHistoryEntry,
  type EditChange,
  type UndoRedoResult,
  type UseEditHistoryOptions,
  type UseEditHistoryReturn,
  type UseEditHistoryWithFeedbackOptions,
  type UseEditHistoryWithFeedbackReturn,

  // Filter presets
  useFilterPresets,
  useFilterPresetsWithFeedback,
  type FilterPreset,
  type FilterPresetInput,
  type UseFilterPresetsOptions,
  type UseFilterPresetsReturn,
  type UseFilterPresetsWithFeedbackOptions,
  type UseFilterPresetsWithFeedbackReturn,

  // Compound filters (AND/OR)
  useCompoundFilters,
  type FilterLogicOperator,
  type FilterComparisonOperator,
  type FilterCondition,
  type FilterGroup,
  type CompoundFilter,
  type UseCompoundFiltersOptions,
  type UseCompoundFiltersReturn,

  // Column spanning
  useColumnSpan,
  type ColumnSpan,
  type CellSpanInfo,
  type ColumnSpanFn,
  type UseColumnSpanOptions,
  type UseColumnSpanReturn,

  // Sticky group headers
  useStickyGroupHeaders,
  type StickyGroupHeader,
  type GroupPosition,
  type UseStickyGroupHeadersOptions,
  type UseStickyGroupHeadersReturn,

  // Debouncing
  useDebounce,
  useDebouncedCallback,

  // RTL support
  useRTL,
  useRTLContext,
  RTLProvider,
  arrowKeyToLogical,
  arrowKeyToPhysical,
  tabToLogical,
  type Direction,
  type LogicalDirection,
  type PhysicalDirection,
  type LogicalPinPosition,
  type RTLContextValue,
  type UseRTLOptions,
  type UseRTLReturn,
  type RTLProviderProps,

  // Action dialog management
  useActionDialog,
  useConfirmAction,
  type ActionDialogType,
  type ActionDialogState,
  type UseActionDialogOptions,
  type UseActionDialogReturn,
  type ConfirmActionOptions,
  type UseConfirmActionReturn,

  // Responsive density
  useResponsiveDensity,
  type UseResponsiveDensityOptions,
  type UseResponsiveDensityReturn,
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

  // Layout components for split-table architecture (sticky header + synced scroll)
  DataTableLayout,
  StickyZone,
  SyncedScrollContainer,
  StickyHeaderScrollContainer,
  HeaderTable,
  BodyTable,
  useScrollSync,

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
  useDefaultContextMenuItems,

  // Actions Cell
  ActionsCell,
  createActionsColumn,

  // Error handling
  DataTableErrorBoundary,
  DataTableErrorDisplay,

  // Tree Data
  TreeExpander,

  // Infinite Scroll
  InfiniteScrollLoader,
} from "./components";

export type {
  DataTableFooterProps,
  SummaryRowProps,
  RowContextMenuProps,
  ContextMenuState,
  UseRowContextMenuOptions,
  UseRowContextMenuReturn,
  ActionsCellProps,
  CreateActionsColumnOptions,
  TreeExpanderProps,
  InfiniteScrollLoaderProps,
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

// ─── I18N ───────────────────────────────────────────────────────────────────
export {
  // Provider and hook
  I18nProvider,
  useI18n,
  createTranslator,
  defaultLocale,

  // Locale registry
  locales,
  getLocaleStrings,
  enStrings,
  hiStrings,

  // Types
  type DataTableStrings,
  type DataTableLocale,
  type PartialDataTableLocale,
  type I18nContextValue,
} from "./i18n";

// ─── FEEDBACK ────────────────────────────────────────────────────────────────
export {
  // Provider and hook
  FeedbackProvider,
  useFeedback,

  // Types
  type FeedbackOptions,
  type FeedbackType,
  type FeedbackParams,
  type FeedbackContextValue,
  type FeedbackProviderProps,
} from "./feedback";

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
