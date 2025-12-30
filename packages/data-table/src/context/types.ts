import type { ReactNode } from "react";
import type {
  Column,
  ColumnGroup,
  FilterState,
  SortDirection,
  PaginationState,
  ColumnPinState,
  PinPosition,
  TableVariant,
  InlineEditingController,
} from "../types";

// ─── STATE TYPES ────────────────────────────────────────────────────────────

export interface DataTableState {
  // Selection
  selectedRows: Set<string>;
  expandedRows: Set<string>;

  // Sorting
  sortKey: string | null;
  sortDirection: SortDirection;

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
  isMobile: boolean;
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

  // Sorting
  | { type: "SET_SORT"; key: string | null; direction: SortDirection }
  | { type: "CYCLE_SORT"; key: string }

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

  // UI
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
}

// ─── CONTEXT VALUE ──────────────────────────────────────────────────────────

export interface DataTableContextValue<T = unknown> {
  state: DataTableState;
  dispatch: React.Dispatch<DataTableAction>;
  config: DataTableConfig<T>;

  // Controlled state
  controlled: {
    sort: { key: string | null; direction: SortDirection } | undefined;
    filters: FilterState | undefined;
    search: string | undefined;
    pinState: ColumnPinState | undefined;
    selectedIds: string[] | undefined;
  };

  // Event callbacks
  onSortChange: ((key: string | null, direction: SortDirection) => void) | undefined;
  onFilterChange: ((filters: FilterState) => void) | undefined;
  onSearchChange: ((value: string) => void) | undefined;
  onColumnPinChange: ((key: string, position: PinPosition) => void) | undefined;
  onSelectionChange: ((ids: string[]) => void) | undefined;
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
  initialPageSize?: number;

  // Controlled props
  controlledSort?: { key: string | null; direction: SortDirection };
  onSortChange?: (key: string | null, direction: SortDirection) => void;
  controlledFilters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  columnPinState?: ColumnPinState;
  onColumnPinChange?: (key: string, position: PinPosition) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Async callback to select all rows across the filtered dataset (server-backed) */
  onSelectAllFiltered?: () => Promise<string[]>;
  /** Callback when pagination changes (useful for sync when controlled sort/filter resets page) */
  onPaginationChange?: (page: number, pageSize: number) => void;
}
