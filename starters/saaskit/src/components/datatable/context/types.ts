import type { ReactNode } from "react";
import type {
  Column,
  FilterState,
  SortDirection,
  PaginationState,
  ColumnPinState,
  PinPosition,
  TableVariant,
  BulkAction,
} from "../types";

export type DensityLevel = "compact" | "standard" | "comfortable";

export interface DataTableState<T = unknown> {
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

  // UI State
  density: DensityLevel;
  isMobile: boolean;
}

export type DataTableAction =
  // Selection
  | { type: "SELECT_ROW"; id: string }
  | { type: "DESELECT_ROW"; id: string }
  | { type: "SELECT_ALL"; ids: string[] }
  | { type: "DESELECT_ALL" }
  | { type: "TOGGLE_EXPAND"; id: string }

  // Sorting
  | { type: "SET_SORT"; key: string | null; direction: SortDirection }

  // Filtering
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_FILTER"; key: string; value: unknown }
  | { type: "REMOVE_FILTER"; key: string }
  | { type: "CLEAR_ALL_FILTERS" }

  // Pagination
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_PAGE_SIZE"; pageSize: number }

  // Columns
  | { type: "TOGGLE_COLUMN_VISIBILITY"; key: string }
  | { type: "SHOW_ALL_COLUMNS" }
  | { type: "SET_COLUMN_WIDTH"; key: string; width: number }
  | { type: "RESET_COLUMN_WIDTHS" }
  | { type: "SET_COLUMN_PIN"; key: string; position: PinPosition }
  | { type: "RESET_COLUMN_PINS" }

  // UI
  | { type: "SET_DENSITY"; density: DensityLevel }
  | { type: "SET_MOBILE"; isMobile: boolean }

  // Bulk
  | { type: "RESET_ALL" };

export interface DataTableConfig<T> {
  tableId: string | undefined;
  columns: Column<T>[];
  mode: "local" | "remote";
  paginationMode: "page" | "cursor";
  variant: TableVariant;
  selectable: boolean;
  showColumnBorders: boolean;
  zebra: boolean;
  compact: boolean;
}

export interface DataTableContextValue<T = unknown> {
  state: DataTableState<T>;
  dispatch: React.Dispatch<DataTableAction>;
  config: DataTableConfig<T>;

  // Controlled state sync
  controlled: {
    sort: { key: string | null; direction: SortDirection } | undefined;
    filters: FilterState | undefined;
    search: string | undefined;
    pinState: ColumnPinState | undefined;
  };
  onSortChange:
    | ((key: string | null, direction: SortDirection) => void)
    | undefined;
  onFiltersChange: ((filters: FilterState) => void) | undefined;
  onSearchChange: ((value: string) => void) | undefined;
  onPinChange: ((key: string, position: PinPosition) => void) | undefined;
}

export interface DataTableProviderProps<T> {
  children: ReactNode;
  tableId?: string | undefined;
  columns: Column<T>[];
  mode?: "local" | "remote" | undefined;
  paginationMode?: "page" | "cursor" | undefined;
  variant?: TableVariant | undefined;
  selectable?: boolean | undefined;
  showColumnBorders?: boolean | undefined;
  zebra?: boolean | undefined;
  compact?: boolean | undefined;
  initialPageSize?: number | undefined;
  cursorLimit?: number | undefined;

  // Config override (computed from variant)
  config?: Partial<DataTableConfig<T>> | undefined;

  // Controlled props
  controlledSort?: { key: string | null; direction: SortDirection } | undefined;
  onSortChange?:
    | ((key: string | null, direction: SortDirection) => void)
    | undefined;
  controlledFilters?: FilterState | undefined;
  onFiltersChange?: ((filters: FilterState) => void) | undefined;
  searchValue?: string | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  columnPinState?: ColumnPinState | undefined;
  onColumnPinChange?:
    | ((key: string, position: PinPosition) => void)
    | undefined;
}
