import type { ReactNode } from "react";
import type {
  Column,
  ColumnGroup,
  FilterState,
  SortDirection,
  MultiSortState,
  PaginationState,
  ColumnPinState,
  PinPosition,
  TableVariant,
  InlineEditingController,
} from "../types/index";

// ─── STATE TYPES ────────────────────────────────────────────────────────────

export interface DataTableState {
  // Selection
  selectedRows: Set<string>;
  expandedRows: Set<string>;

  // Sorting (single-sort for backward compatibility)
  sortKey: string | null;
  sortDirection: SortDirection;
  // Multi-sort state
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

  // UI State
  /**
   * @deprecated Use container queries or useColumns().containerWidth instead.
   * Responsive behavior is now container-based, not viewport-based.
   */
  isMobile: boolean;

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

  // Sorting (single-sort)
  | { type: "SET_SORT"; key: string | null; direction: SortDirection }
  | { type: "CYCLE_SORT"; key: string }
  // Multi-sort
  | { type: "SET_MULTI_SORT"; sortState: MultiSortState }
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

  // UI (deprecated - kept for backward compatibility)
  /** @deprecated Container queries are now used for responsive behavior */
  | { type: "SET_MOBILE"; isMobile: boolean }

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
  selectable: boolean;
  columnBorders: boolean;
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
}

// ─── CONTEXT VALUE ──────────────────────────────────────────────────────────

export interface DataTableContextValue<T = unknown> {
  state: DataTableState;
  dispatch: React.Dispatch<DataTableAction>;
  config: DataTableConfig<T>;

  // Controlled state
  controlled: {
    sort: { key: string | null; direction: SortDirection } | undefined;
    sortState: MultiSortState | undefined;
    filters: FilterState | undefined;
    search: string | undefined;
    pinState: ColumnPinState | undefined;
    columnOrder: string[] | undefined;
    selectedIds: string[] | undefined;
    groupBy: string | string[] | null | undefined;
  };

  // Multi-sort config
  multiSort: boolean;
  maxSortColumns: number;

  // Event callbacks
  onSortChange: ((key: string | null, direction: SortDirection) => void) | undefined;
  onMultiSortChange: ((sortState: MultiSortState) => void) | undefined;
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
  selectable?: boolean;
  columnBorders?: boolean;
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

  // Multi-sort config
  multiSort?: boolean;
  maxSortColumns?: number;

  // Controlled props
  controlledSort?: { key: string | null; direction: SortDirection };
  controlledSortState?: MultiSortState;
  onSortChange?: (key: string | null, direction: SortDirection) => void;
  onMultiSortChange?: (sortState: MultiSortState) => void;
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
  /** Callback when pagination changes (useful for sync when controlled sort/filter resets page) */
  onPaginationChange?: (page: number, pageSize: number) => void;
}
