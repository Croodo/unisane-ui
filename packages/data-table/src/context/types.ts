import type { ReactNode } from "react";
import type {
  Column,
  ColumnGroup,
  FilterState,
  MultiSortState,
  PaginationState,
  ColumnPinState,
  PinPosition,
  TableVariant,
  SparseSelectionController,
} from "../types/index";
import type { PartialDataTableLocale } from "../i18n/types";

// ─── STATE TYPES ────────────────────────────────────────────────────────────

export interface DataTableState {
  // Selection
  selectedRows: Set<string>;
  expandedRows: Set<string>;

  // Sorting (supports multi-sort)
  sortState: MultiSortState;

  // Filtering
  searchText: string;
  columnFilters: FilterState;

  // Pagination
  pagination: PaginationState;

  // Columns
  hiddenColumns: Set<string>;
  columnWidths: Record<string, number>;
  columnPinState: ColumnPinState;
  columnOrder: string[];

  // Row Grouping (supports single string or array for multi-level)
  groupBy: string | string[] | null;
  expandedGroups: Set<string>;
}

// ─── ACTION TYPES ───────────────────────────────────────────────────────────

export type DataTableAction =
  // Selection
  | { type: "SELECT_ROW"; id: string }
  | { type: "DESELECT_ROW"; id: string }
  | { type: "SELECT_ALL"; ids: string[] }
  | { type: "DESELECT_ALL" }
  | { type: "TOGGLE_SELECT"; id: string }
  | { type: "TOGGLE_EXPAND"; id: string }
  | { type: "EXPAND_ROW"; id: string }
  | { type: "COLLAPSE_ROW"; id: string }

  // Sorting (multi-sort)
  | { type: "SET_SORT"; sortState: MultiSortState }
  | { type: "CYCLE_SORT"; key: string }
  | { type: "ADD_SORT"; key: string; maxColumns?: number }
  | { type: "REMOVE_SORT"; key: string }
  | { type: "CLEAR_SORT" }

  // Filtering
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_FILTER"; key: string; value: unknown }
  | { type: "REMOVE_FILTER"; key: string }
  | { type: "CLEAR_ALL_FILTERS" }

  // Pagination
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_PAGE_SIZE"; pageSize: number }
  | { type: "NEXT_PAGE" }
  | { type: "PREV_PAGE" }

  // Columns
  | { type: "TOGGLE_COLUMN_VISIBILITY"; key: string }
  | { type: "SHOW_ALL_COLUMNS" }
  | { type: "HIDE_COLUMN"; key: string }
  | { type: "SET_COLUMN_WIDTH"; key: string; width: number }
  | { type: "RESET_COLUMN_WIDTHS" }
  | { type: "SET_COLUMN_PIN"; key: string; position: PinPosition }
  | { type: "RESET_COLUMN_PINS" }
  | { type: "SET_COLUMN_ORDER"; order: string[] }

  // Row Grouping (supports single column or multi-level grouping)
  | { type: "SET_GROUP_BY"; key: string | string[] | null }
  | { type: "ADD_GROUP_BY"; key: string }
  | { type: "REMOVE_GROUP_BY"; key: string }
  | { type: "TOGGLE_GROUP_EXPAND"; groupId: string }
  | { type: "EXPAND_ALL_GROUPS"; groupIds: string[] }
  | { type: "COLLAPSE_ALL_GROUPS" }

  // Bulk
  | { type: "RESET_ALL" }
  | { type: "HYDRATE"; state: Partial<DataTableState> };

// ─── CONFIG TYPES ───────────────────────────────────────────────────────────

export interface DataTableConfig<T> {
  tableId: string | undefined;
  /** Original column definitions (may include groups) */
  columnDefinitions: Array<Column<T> | ColumnGroup<T>>;
  /** Flattened columns for rendering */
  columns: Column<T>[];
  /** Whether column groups exist */
  hasGroups: boolean;
  mode: "local" | "remote";
  paginationMode: "offset" | "cursor" | "none";
  variant: TableVariant;
  /** Whether row selection is enabled */
  rowSelectionEnabled: boolean;
  /** Whether to show column dividers/borders */
  showColumnDividers: boolean;
  zebra: boolean;
  stickyHeader: boolean;
  resizable: boolean;
  pinnable: boolean;
  reorderable: boolean;
  /** Enable row grouping feature */
  groupingEnabled: boolean;
  /** Show summary footer row */
  showSummary: boolean;
  /** Label for the summary row */
  summaryLabel: string;
  /** Text direction (ltr or rtl) */
  dir: "ltr" | "rtl";
}

// ─── STATE SLICES ────────────────────────────────────────────────────────────
// Split state into separate memoized slices to prevent unnecessary re-renders.

export interface SelectionSlice {
  selectedRows: Set<string>;
  expandedRows: Set<string>;
}

export interface SortSlice {
  sortState: MultiSortState;
}

export interface FilterSlice {
  searchText: string;
  columnFilters: FilterState;
}

export interface PaginationSlice {
  pagination: PaginationState;
}

export interface ColumnSlice {
  hiddenColumns: Set<string>;
  columnWidths: Record<string, number>;
  columnPinState: ColumnPinState;
  columnOrder: string[];
}

export interface GroupingSlice {
  groupBy: string | string[] | null;
  expandedGroups: Set<string>;
}

export interface StateSlices {
  selection: SelectionSlice;
  sort: SortSlice;
  filter: FilterSlice;
  pagination: PaginationSlice;
  column: ColumnSlice;
  grouping: GroupingSlice;
}

// ─── CALLBACK TYPES ──────────────────────────────────────────────────────────

/** Scroll event information */
export interface ScrollEventInfo {
  /** Horizontal scroll position */
  scrollLeft: number;
  /** Vertical scroll position */
  scrollTop: number;
  /** Total scrollable width */
  scrollWidth: number;
  /** Total scrollable height */
  scrollHeight: number;
  /** Visible container width */
  clientWidth: number;
  /** Visible container height */
  clientHeight: number;
}

/** Error event information */
export interface DataTableError {
  /** Error type/category */
  type: "render" | "data" | "export" | "filter" | "sort" | "selection" | "unknown";
  /** Error message */
  message: string;
  /** Original error object if available */
  error?: Error;
  /** Additional context about where the error occurred */
  context?: Record<string, unknown>;
}

export interface DataTableCallbacks {
  onSortChange: ((sortState: MultiSortState) => void) | undefined;
  onFilterChange: ((filters: FilterState) => void) | undefined;
  onSearchChange: ((value: string) => void) | undefined;
  onColumnPinChange: ((key: string, position: PinPosition) => void) | undefined;
  onColumnOrderChange: ((order: string[]) => void) | undefined;
  onSelectionChange: ((ids: string[]) => void) | undefined;
  onGroupByChange: ((key: string | string[] | null) => void) | undefined;
  onSelectAllFiltered: (() => Promise<string[]>) | undefined;
  onPaginationChange: ((page: number, pageSize: number) => void) | undefined;
  /** Callback when column visibility changes */
  onColumnVisibilityChange: ((hiddenColumns: string[]) => void) | undefined;
  /** Callback when table scrolls */
  onScroll: ((info: ScrollEventInfo) => void) | undefined;
  /** Global error handler for DataTable errors */
  onError: ((error: DataTableError) => void) | undefined;
}

// ─── CONTEXT VALUE ──────────────────────────────────────────────────────────

export interface DataTableContextValue<T = unknown> {
  state: DataTableState;
  /** Memoized state slices for optimized re-renders */
  stateSlices: StateSlices;
  dispatch: React.Dispatch<DataTableAction>;
  config: DataTableConfig<T>;

  // Controlled state
  controlled: {
    sortState: MultiSortState | undefined;
    filters: FilterState | undefined;
    search: string | undefined;
    pinState: ColumnPinState | undefined;
    columnOrder: string[] | undefined;
    selectedIds: string[] | undefined;
    groupBy: string | string[] | null | undefined;
    sparseSelection: SparseSelectionController | undefined;
  };

  // Multi-sort config
  maxSortColumns: number;

  // Event callbacks (direct references for backward compatibility)
  onSortChange: ((sortState: MultiSortState) => void) | undefined;
  onFilterChange: ((filters: FilterState) => void) | undefined;
  onSearchChange: ((value: string) => void) | undefined;
  onColumnPinChange: ((key: string, position: PinPosition) => void) | undefined;
  onColumnOrderChange: ((order: string[]) => void) | undefined;
  onSelectionChange: ((ids: string[]) => void) | undefined;
  onGroupByChange: ((key: string | string[] | null) => void) | undefined;
  /** Async callback to select all rows across the filtered dataset (server-backed) */
  onSelectAllFiltered: (() => Promise<string[]>) | undefined;
  /** Callback when pagination changes (useful for sync when controlled sort/filter resets page) */
  onPaginationChange: ((page: number, pageSize: number) => void) | undefined;
  /** Callback when column visibility changes */
  onColumnVisibilityChange: ((hiddenColumns: string[]) => void) | undefined;
  /** Callback when table scrolls */
  onScroll: ((info: ScrollEventInfo) => void) | undefined;
  /** Global error handler for DataTable errors */
  onError: ((error: DataTableError) => void) | undefined;

  /** Get stable callback references (avoids stale closure issues) */
  getCallbacks: () => DataTableCallbacks;
}

// ─── PROVIDER PROPS ─────────────────────────────────────────────────────────

export interface DataTableProviderProps<T> {
  children: ReactNode;
  tableId?: string;
  /** Column definitions (supports flat columns or grouped columns) */
  columns: Array<Column<T> | ColumnGroup<T>>;
  mode?: "local" | "remote";
  paginationMode?: "offset" | "cursor" | "none";
  variant?: TableVariant;
  /** Enable row selection (checkboxes) */
  rowSelectionEnabled?: boolean;
  /** Show column dividers/borders between cells */
  showColumnDividers?: boolean;
  zebra?: boolean;
  stickyHeader?: boolean;
  resizable?: boolean;
  pinnable?: boolean;
  reorderable?: boolean;
  /** Enable row grouping feature (adds "Group by" option to column menus) */
  groupingEnabled?: boolean;
  /** Show summary footer row with aggregated values */
  showSummary?: boolean;
  /** Custom label for the summary row (defaults to "Summary") */
  summaryLabel?: string;
  initialPageSize?: number;

  // Sort config
  /** Maximum number of columns that can be sorted simultaneously */
  maxSortColumns?: number;

  // Controlled props
  /** Controlled sort state - array of sort items for multi-sort support */
  sortState?: MultiSortState;
  /** Callback when sort state changes */
  onSortChange?: (sortState: MultiSortState) => void;
  controlledFilters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  columnPinState?: ColumnPinState;
  onColumnPinChange?: (key: string, position: PinPosition) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Controlled groupBy column key(s) - single string or array for multi-level */
  groupBy?: string | string[] | null;
  onGroupByChange?: (key: string | string[] | null) => void;
  /** Async callback to select all rows across the filtered dataset (server-backed) */
  onSelectAllFiltered?: () => Promise<string[]>;

  // ─── Sparse Selection ───
  /**
   * Sparse selection controller from useSparseSelection hook.
   * Enables O(1) select-all operations for large datasets (100K+ rows).
   * When provided, this takes precedence over selectedIds for selection state.
   */
  sparseSelection?: SparseSelectionController;

  /** Callback when pagination changes (useful for sync when controlled sort/filter resets page) */
  onPaginationChange?: (page: number, pageSize: number) => void;
  /** Callback when column visibility changes (show/hide columns) */
  onColumnVisibilityChange?: (hiddenColumns: string[]) => void;
  /** Callback when table scrolls (useful for infinite scroll, lazy loading) */
  onScroll?: (info: ScrollEventInfo) => void;
  /**
   * Global error handler for DataTable errors.
   * Catches errors from rendering, data processing, exports, etc.
   */
  onError?: (error: DataTableError) => void;

  // ─── Internationalization ───
  /** Locale configuration for i18n support */
  locale?: PartialDataTableLocale;

  // ─── RTL Support ───
  /**
   * Text direction for RTL language support.
   * When set to "rtl":
   * - Pinned columns are flipped (left becomes right, right becomes left)
   * - Keyboard navigation (arrow keys) is adjusted
   * - Scroll positions are normalized across browsers
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";

  // ─── Feedback ───
  /**
   * Enable toast notifications and ARIA announcements for table operations.
   * When enabled, operations like inline editing, export, undo/redo will show feedback.
   * @default true
   */
  enableFeedback?: boolean;
  /**
   * Disable toast notifications while keeping ARIA announcements.
   * Useful for screen-reader-only feedback.
   * @default false
   */
  disableToasts?: boolean;
  /**
   * Disable ARIA live region announcements while keeping toast notifications.
   * @default false
   */
  disableAnnouncements?: boolean;
}
