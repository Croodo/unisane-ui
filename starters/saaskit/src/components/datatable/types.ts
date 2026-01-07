import { ReactNode, CSSProperties } from "react";
import type { UseInlineEditingReturn } from "./hooks/useInlineEditing";

export type SortDirection = "asc" | "desc" | null;

export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | (string | number)[]
  | { min?: string; max?: string }
  | { start?: string; end?: string }
  | Record<string, unknown>
  | null
  | undefined;

export type PinPosition = "left" | "right" | null;

export type ColumnPinState = Record<string, PinPosition>;

/**
 * Table display variant presets
 * - "grid": Full featured with borders, checkboxes, column dividers (default for editable data)
 * - "list": Row borders only, no column dividers, cleaner look (default for lists)
 * - "log": Minimal chrome, no borders between columns, compact (ideal for audit/logs)
 */
export type TableVariant = "grid" | "list" | "log";

export interface FilterRendererProps<V = FilterValue> {
  value: V;
  onChange: (value: V) => void;
}

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  filterable?: boolean;
  /**
   * Enable inline editing for this column when an inline editing controller is provided.
   */
   editable?: boolean;
  pinned?: "left" | "right"; // Static default pin position
  render?: (row: T) => ReactNode;
  type?: "text" | "number" | "currency" | "status" | "date" | "select";
  filterOptions?: { label: string; value: string | number; count?: number }[];
  filterRenderer?: (props: FilterRendererProps) => ReactNode;
  filterFn?: (row: T, filterValue: FilterValue) => boolean;
  /**
   * Configuration for the summary/total row at the bottom of the table.
   * - 'sum': Sums up numeric values.
   * - 'average': Averages numeric values.
   * - 'count': Counts the number of rows.
   * - Function: Custom renderer receiving the filtered dataset.
   */
  summary?: "sum" | "average" | "count" | ((data: T[]) => ReactNode);
}

export interface BulkAction {
  label: string;
  onClick: (ids: string[]) => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
}

export interface FilterState {
  [key: string]: FilterValue;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  title?: string | undefined;
  isLoading?: boolean | undefined;
  refreshing?: boolean | undefined;
  searchable?: boolean | undefined;
  onRefresh?: (() => void) | undefined;
  bulkActions?: BulkAction[] | undefined;
  renderSubComponent?: ((row: T) => ReactNode) | undefined;
  getRowCanExpand?: ((row: T) => boolean) | undefined;
  tableId?: string | undefined; // Unique ID for LocalStorage persistence
  className?: string | undefined;
  style?: CSSProperties | undefined;
  mode?: "local" | "remote" | undefined;
  paginationMode?: "page" | "cursor" | undefined;

  // === Visual Variants & Styling ===
  /**
   * Table display variant preset.
   * - "grid": Full featured with borders, checkboxes, column dividers
   * - "list": Row borders only, no column dividers, cleaner look (default)
   * - "log": Minimal chrome, no borders between columns, compact
   * @default "list"
   */
  variant?: TableVariant | undefined;
  /**
   * Enable row selection with checkboxes.
   * Defaults to true when bulkActions are provided, false otherwise.
   */
  selectable?: boolean | undefined;
  /**
   * Show column border dividers between cells.
   * Defaults based on variant: true for "grid", false for others.
   */
  showColumnBorders?: boolean | undefined;
  /**
   * Enable zebra striping (alternating row backgrounds).
   * @default false
   */
  zebra?: boolean | undefined;
  /**
   * Make the table more compact (reduce padding).
   * @default false for "grid"/"list", true for "log"
   */
  compact?: boolean | undefined;
  totalItems?: number | undefined; // Optional: total count from stats endpoint
  cursorPagination?:
    | {
        nextCursor?: string | undefined;
        prevCursor?: string | undefined;
        onNext: () => void;
        onPrev: () => void;
        limit: number;
        onLimitChange: (n: number) => void;
        pageIndex?: number | undefined;
      }
    | undefined;
  controlledSort?:
    | { key: keyof T | string | null; direction: SortDirection }
    | undefined;
  onSortChange?:
    | ((key: keyof T | string | null, dir: SortDirection) => void)
    | undefined;
  controlledFilters?: FilterState | undefined;
  onFiltersChange?: ((filters: FilterState) => void) | undefined;
  searchValue?: string | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  disableLocalProcessing?: boolean | undefined;
  // Column pinning
  columnPinState?: ColumnPinState | undefined;
  onColumnPinChange?:
    | ((columnKey: string, pinned: PinPosition) => void)
    | undefined;
  // Row detail interaction
  onRowClick?: ((row: T, event: React.MouseEvent) => void) | undefined;
  activeRowId?: string | undefined;
  rowClassName?: ((row: T) => string) | undefined;
  /**
   * Optional inline editing controller. When provided, columns with `editable: true`
   * will render a built-in cell editor that fills the cell across density variants.
   */
  inlineEditing?: UseInlineEditingReturn<T>;
}
