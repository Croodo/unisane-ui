// ─── CORE TYPES ──────────────────────────────────────────────────────────────
// Fundamental types used throughout the data-table package.
// These are the building blocks for sorting, filtering, pagination, and display.

import type { ReactNode } from "react";

// ─── BRANDED TYPES ───────────────────────────────────────────────────────────

/**
 * Brand symbol for nominal typing
 */
declare const __brand: unique symbol;

/**
 * Branded type helper for nominal typing
 * Creates distinct types that are structurally identical but nominally different
 */
export type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };

/**
 * Non-empty array type - guarantees at least one element
 * Use `asNonEmpty()` or `isNonEmpty()` to safely create/check
 */
export type NonEmptyArray<T> = Brand<[T, ...T[]], "NonEmptyArray">;

/**
 * Type guard to check if an array is non-empty
 */
export function isNonEmpty<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

/**
 * Assert an array is non-empty (throws if empty)
 */
export function asNonEmpty<T>(arr: T[], message = "Expected non-empty array"): NonEmptyArray<T> {
  if (arr.length === 0) {
    throw new Error(message);
  }
  return arr as NonEmptyArray<T>;
}

/**
 * Safely create a non-empty array (returns undefined if empty)
 */
export function toNonEmpty<T>(arr: T[]): NonEmptyArray<T> | undefined {
  return isNonEmpty(arr) ? arr : undefined;
}

// ─── SORT TYPES ──────────────────────────────────────────────────────────────

/**
 * Sort direction for a column
 * - "asc": Ascending (A-Z, 0-9)
 * - "desc": Descending (Z-A, 9-0)
 * - null: No sorting applied
 */
export type SortDirection = "asc" | "desc" | null;

/**
 * Source of a sort operation - helps track how the sort was triggered
 */
export type SortSource =
  | "header-click"    // User clicked column header
  | "menu"            // User used column menu
  | "keyboard"        // User used keyboard shortcut
  | "api"             // Programmatic via API
  | "initial"         // Initial/default sort
  | "restore";        // Restored from persistence

/**
 * Single sort item for multi-sort support
 */
export interface SortItem {
  /** Column key being sorted */
  key: string;
  /** Sort direction */
  direction: "asc" | "desc";
  /**
   * Source of the sort operation (optional, for tracking/analytics)
   * @default undefined
   */
  source?: SortSource;
  /**
   * Timestamp when this sort was applied (optional, for tracking)
   * Useful for debugging sort order in multi-sort scenarios
   */
  timestamp?: number;
}

/**
 * Multi-sort state - array of sort items in priority order
 * First item is primary sort, second is secondary, etc.
 */
export type MultiSortState = SortItem[];

// ─── FILTER TYPES ────────────────────────────────────────────────────────────

/**
 * Text filter value - for text search/contains matching
 */
export interface TextFilterValue {
  type: "text";
  value: string;
  /** Case-sensitive matching */
  caseSensitive?: boolean;
  /** Match mode */
  match?: "contains" | "exact" | "starts-with" | "ends-with";
}

/**
 * Number filter value - single number or comparison
 */
export interface NumberFilterValue {
  type: "number";
  value: number;
  /** Comparison operator */
  operator?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
}

/**
 * Number range filter value - min/max bounds
 */
export interface NumberRangeFilterValue {
  type: "number-range";
  min?: number;
  max?: number;
  /** Include min value in range (default: true) */
  minInclusive?: boolean;
  /** Include max value in range (default: true) */
  maxInclusive?: boolean;
}

/**
 * Date filter value - single date comparison
 */
export interface DateFilterValue {
  type: "date";
  value: Date | string;
  /** Comparison operator */
  operator?: "eq" | "neq" | "before" | "after" | "on-or-before" | "on-or-after";
}

/**
 * Date range filter value - start/end bounds
 */
export interface DateRangeFilterValue {
  type: "date-range";
  start?: Date | string;
  end?: Date | string;
  /** Include start date in range (default: true) */
  startInclusive?: boolean;
  /** Include end date in range (default: true) */
  endInclusive?: boolean;
}

/**
 * Select filter value - single selection from options
 */
export interface SelectFilterValue {
  type: "select";
  value: string | number;
}

/**
 * Multi-select filter value - multiple selections
 */
export interface MultiSelectFilterValue {
  type: "multi-select";
  values: (string | number)[];
  /** Match mode for multiple values */
  match?: "any" | "all";
}

/**
 * Boolean filter value
 */
export interface BooleanFilterValue {
  type: "boolean";
  value: boolean;
}

/**
 * Typed filter value - discriminated union for type-safe filter handling
 * Use the `type` property to narrow the filter type
 *
 * @example
 * ```typescript
 * function applyFilter(filter: TypedFilterValue) {
 *   switch (filter.type) {
 *     case "text":
 *       return row.name.includes(filter.value);
 *     case "number-range":
 *       return row.price >= (filter.min ?? 0) && row.price <= (filter.max ?? Infinity);
 *     // ...
 *   }
 * }
 * ```
 */
export type TypedFilterValue =
  | TextFilterValue
  | NumberFilterValue
  | NumberRangeFilterValue
  | DateFilterValue
  | DateRangeFilterValue
  | SelectFilterValue
  | MultiSelectFilterValue
  | BooleanFilterValue;

/**
 * Possible filter value types (legacy/simple)
 * Supports: text, number, boolean, date, arrays, and ranges
 *
 * @deprecated For new code, prefer `TypedFilterValue` which provides
 * discriminated unions for better type safety
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
  | TypedFilterValue
  | null
  | undefined;

/**
 * Filter state map - column key to filter value
 */
export interface FilterState {
  [key: string]: FilterValue;
}

/**
 * Typed filter state map - for strict typing
 */
export interface TypedFilterState {
  [key: string]: TypedFilterValue | null | undefined;
}

/**
 * Available filter input types
 */
export type FilterType =
  | "text"
  | "select"
  | "multi-select"
  | "number-range"
  | "date-range"
  | "number"
  | "date"
  | "boolean";

/**
 * Option for select/multi-select filters
 */
export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
  /** Optional icon for the option */
  icon?: ReactNode;
  /** Disabled state */
  disabled?: boolean;
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
