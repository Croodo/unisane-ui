// ─── HOOK TYPES ──────────────────────────────────────────────────────────────
// Types for custom hook options and return values.

import type { SortDirection, FilterState, CursorPagination } from "./core";
import type { CellPosition, CellSelectionState, CellSelectionContext } from "./features";

// ─── USE INLINE EDITING ──────────────────────────────────────────────────────

/**
 * Options for useInlineEditing hook
 */
export interface UseInlineEditingOptions<T extends { id: string }> {
  /** Data rows for editing */
  data: T[];
  /** Callback when cell value changes */
  onCellChange?: (
    rowId: string,
    columnKey: string,
    value: unknown,
    row: T
  ) => void | Promise<void>;
  /** Callback when edit is cancelled */
  onCancelEdit?: (rowId: string, columnKey: string) => void;
  /** Callback when edit starts */
  onStartEdit?: (rowId: string, columnKey: string) => void;
  /** Validation function - return error message or null/undefined if valid */
  validateCell?: (
    rowId: string,
    columnKey: string,
    value: unknown
  ) => string | null | undefined;
  /** Enable inline editing (default: true) */
  enabled?: boolean;
}

// ─── USE CELL SELECTION ──────────────────────────────────────────────────────

/**
 * Options for useCellSelection hook
 */
export interface UseCellSelectionOptions<T extends { id: string }> {
  /** Data rows for resolving cell positions */
  data: T[];
  /** Column keys for navigation */
  columnKeys: string[];
  /** Callback when selection changes */
  onSelectionChange?: (cells: CellPosition[]) => void;
  /** Callback when active cell changes */
  onActiveCellChange?: (cell: CellPosition | null) => void;
  /** Enable multi-cell selection (default: true) */
  multiSelect?: boolean;
  /** Enable range selection with Shift+Click (default: true) */
  rangeSelect?: boolean;
  /** Enable cell selection feature (default: false) */
  enabled?: boolean;
}

/**
 * Return type for useCellSelection hook
 */
export interface UseCellSelectionReturn {
  /** Current cell selection state */
  state: CellSelectionState;
  /** Select a single cell */
  selectCell: (cell: CellPosition, addToSelection?: boolean) => void;
  /** Select a range of cells */
  selectRange: (start: CellPosition, end: CellPosition) => void;
  /** Clear all selection */
  clearSelection: () => void;
  /** Check if a cell is selected */
  isCellSelected: (rowId: string, columnKey: string) => boolean;
  /** Check if a cell is active */
  isCellActive: (rowId: string, columnKey: string) => boolean;
  /** Get cell selection context for rendering */
  getCellSelectionContext: (
    rowId: string,
    columnKey: string
  ) => CellSelectionContext;
  /** Handle cell click */
  handleCellClick: (
    rowId: string,
    columnKey: string,
    event: React.MouseEvent
  ) => void;
  /** Handle cell keyboard navigation */
  handleCellKeyDown: (event: React.KeyboardEvent) => void;
  /** Move active cell in a direction */
  moveActiveCell: (
    direction: "up" | "down" | "left" | "right",
    extend?: boolean
  ) => void;
  /** Copy selected cells to clipboard */
  copyToClipboard: () => Promise<void>;
  /** Get selected cell values as 2D array (for clipboard) */
  getSelectedValues: <V>(
    getData: (rowId: string, columnKey: string) => V
  ) => V[][];
}

// ─── USE KEYBOARD NAVIGATION ─────────────────────────────────────────────────

/**
 * Options for useKeyboardNavigation hook
 */
export interface UseKeyboardNavigationOptions {
  /** Total number of rows */
  rowCount: number;
  /** Page size for Page Up/Down navigation */
  pageSize?: number;
  /** Callback when focus row changes */
  onFocusChange?: (rowIndex: number) => void;
  /** Callback when row is activated (Enter) */
  onActivate?: (rowIndex: number) => void;
  /** Enable keyboard navigation (default: true) */
  enabled?: boolean;
}

/**
 * Return type for useKeyboardNavigation hook
 */
export interface UseKeyboardNavigationReturn {
  /** Currently focused row index */
  focusedIndex: number;
  /** Set focused row index */
  setFocusedIndex: (index: number) => void;
  /** Handle keyboard events */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Get props to spread on the container */
  getContainerProps: () => {
    tabIndex: number;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  /** Get props to spread on a row */
  getRowProps: (index: number) => {
    "data-focused": boolean;
    tabIndex: number;
  };
}

// ─── USE REMOTE DATA TABLE ───────────────────────────────────────────────────

/**
 * Generic list params from SDK hooks
 */
export interface ListParamsLike {
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters: Record<string, unknown>;
  onFiltersChange: (next: Record<string, unknown>) => void;
  sortDescriptor: { key: string; direction: "asc" | "desc" };
  onSortChange: (key: string | null, dir: SortDirection) => void;
  buildCursorPagination: (cursors: {
    next?: string;
    prev?: string;
  }) => CursorPagination;
}

/**
 * Generic query result from React Query / SWR
 */
export interface QueryLike<T> {
  data?:
    | { items?: T[]; nextCursor?: string; prevCursor?: string }
    | T[]
    | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch?: () => Promise<unknown>;
}

/**
 * Optional stats query for total count
 */
export interface StatsQueryLike {
  data?: { total?: number };
  isLoading: boolean;
}

/**
 * Options for useRemoteDataTable hook
 */
export interface UseRemoteDataTableOptions<T> {
  /** List params from SDK hook */
  params: ListParamsLike;
  /** Query result from React Query */
  query: QueryLike<T>;
  /** Optional stats query for total count */
  statsQuery?: StatsQueryLike;
  /** Initial/fallback data */
  initialData?:
    | {
        items?: T[];
        nextCursor?: string;
        prevCursor?: string;
      }
    | T[];
}

/**
 * Return type for useRemoteDataTable hook
 */
export interface UseRemoteDataTableReturn<T> {
  /** Props to spread on DataTable */
  tableProps: {
    data: T[];
    loading: boolean;
    refreshing: boolean;
    onRefresh: () => Promise<void>;
    mode: "remote";
    pagination: "cursor";
    searchValue: string;
    onSearchChange: (val: string) => void;
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    sortKey: string | null;
    sortDirection: SortDirection;
    onSortChange: (key: string | null, direction: SortDirection) => void;
    cursorPagination: CursorPagination;
    totalCount?: number;
  };
}

// ─── USE VIRTUALIZED ROWS ────────────────────────────────────────────────────

/**
 * Virtual row information
 */
export interface VirtualRow {
  index: number;
  start: number;
  size: number;
  key: string | number;
}

/**
 * Options for useVirtualizedRows hook
 */
export interface UseVirtualizedRowsOptions {
  /** Total number of rows */
  count: number;
  /** Estimated row height */
  estimateSize: number;
  /** Overscan count (extra rows to render) */
  overscan?: number;
  /** Parent ref for scroll container */
  parentRef: React.RefObject<HTMLElement>;
  /** Enable virtualization */
  enabled?: boolean;
}

/**
 * Return type for useVirtualizedRows hook
 */
export interface UseVirtualizedRowsReturn {
  /** Virtual items to render */
  virtualRows: VirtualRow[];
  /** Total height of all rows */
  totalSize: number;
  /** Measure element callback */
  measureElement: (node: HTMLElement | null) => void;
}
