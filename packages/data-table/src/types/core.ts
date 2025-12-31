// ─── CORE TYPES ──────────────────────────────────────────────────────────────
// Fundamental types used throughout the data-table package.
// These are the building blocks for sorting, filtering, pagination, and display.

// ─── SORT TYPES ──────────────────────────────────────────────────────────────

/**
 * Sort direction for a column
 * - "asc": Ascending (A-Z, 0-9)
 * - "desc": Descending (Z-A, 9-0)
 * - null: No sorting applied
 */
export type SortDirection = "asc" | "desc" | null;

/**
 * Single sort item for multi-sort support
 */
export interface SortItem {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Multi-sort state - array of sort items in priority order
 * First item is primary sort, second is secondary, etc.
 */
export type MultiSortState = SortItem[];

// ─── FILTER TYPES ────────────────────────────────────────────────────────────

/**
 * Possible filter value types
 * Supports: text, number, boolean, date, arrays, and ranges
 */
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | (string | number)[]
  | { min?: number | string; max?: number | string }
  | { start?: Date | string; end?: Date | string }
  | null
  | undefined;

/**
 * Filter state map - column key to filter value
 */
export interface FilterState {
  [key: string]: FilterValue;
}

/**
 * Available filter input types
 */
export type FilterType =
  | "text"
  | "select"
  | "multi-select"
  | "number-range"
  | "date-range";

/**
 * Option for select/multi-select filters
 */
export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

/**
 * Props passed to custom filter renderer
 */
export interface FilterRendererProps<V = FilterValue> {
  value: V;
  onChange: (value: V) => void;
}

// ─── PIN TYPES ───────────────────────────────────────────────────────────────

/**
 * Column pin position
 * - "left": Pin to left edge
 * - "right": Pin to right edge
 * - null: Not pinned (scrolls with table)
 */
export type PinPosition = "left" | "right" | null;

/**
 * Map of column keys to pin positions
 */
export type ColumnPinState = Record<string, PinPosition>;

// ─── DISPLAY TYPES ───────────────────────────────────────────────────────────

/**
 * Table display variant presets
 * - "grid": Full featured with borders, column dividers (default for data editing)
 * - "list": Row borders only, cleaner look (default for read-only lists)
 * - "minimal": No borders, compact (ideal for logs/audit trails)
 */
export type TableVariant = "grid" | "list" | "minimal";

/**
 * Row density presets
 * - "compact": Tight spacing for data-dense views
 * - "dense": Slightly more compact than standard
 * - "standard": Default spacing
 * - "comfortable": Extra spacing for touch-friendly interfaces
 */
export type Density = "compact" | "dense" | "standard" | "comfortable";

// ─── PAGINATION TYPES ────────────────────────────────────────────────────────

/**
 * Offset-based pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
}

/**
 * Cursor-based pagination for remote data
 */
export interface CursorPagination {
  nextCursor?: string;
  prevCursor?: string;
  limit: number;
  pageIndex?: number;
  onNext: () => void;
  onPrev: () => void;
  onLimitChange: (limit: number) => void;
}
