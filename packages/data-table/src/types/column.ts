// ─── COLUMN TYPES ────────────────────────────────────────────────────────────
// Column definition types and utilities for the data-table.

import type { ReactNode } from "react";
import type { FilterType, FilterOption, FilterRendererProps, FilterValue } from "./core";

// ─── CELL CONTEXT ────────────────────────────────────────────────────────────

/**
 * Context passed to cell render functions
 */
export interface CellContext<T = unknown> {
  row: T;
  rowIndex: number;
  columnKey: string;
  isSelected: boolean;
  isExpanded: boolean;
}

// ─── COLUMN GROUP ────────────────────────────────────────────────────────────

/**
 * Column group for hierarchical headers
 * Groups multiple columns under a single parent header
 */
export interface ColumnGroup<T> {
  /** Display header text for the group */
  header: string;
  /** Child columns in this group */
  children: Column<T>[];
}

// ─── COLUMN DEFINITION ───────────────────────────────────────────────────────

/**
 * Column definition for the data-table
 */
export interface Column<T> {
  /** Unique key for the column (can use dot notation for nested values) */
  key: keyof T | string;
  /** Display header text */
  header: string;
  /** Column width (number = pixels, string = CSS value) */
  width?: number | string;
  /** Minimum width during resize */
  minWidth?: number;
  /** Maximum width during resize */
  maxWidth?: number;
  /** Text alignment */
  align?: "start" | "center" | "end";

  // ─── Per-Column Features ───
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Enable filtering for this column */
  filterable?: boolean;
  /** Enable inline editing for this column */
  editable?: boolean;
  /** Input type for inline editing (defaults to "text") */
  inputType?:
    | "text"
    | "number"
    | "email"
    | "tel"
    | "url"
    | "date"
    | "time"
    | "datetime-local";
  /** Allow pinning this column */
  pinnable?: boolean;
  /** Allow hiding this column */
  hideable?: boolean;
  /** Allow reordering this column via drag-and-drop */
  reorderable?: boolean;
  /** Allow grouping by this column */
  groupable?: boolean;
  /** Static pin position (user can override) */
  pinned?: "left" | "right";
  /** Aggregation type for group headers (only applies to numeric columns) */
  aggregation?: "sum" | "average" | "count" | "min" | "max";

  // ─── Responsive Visibility ───
  /**
   * Minimum container width (in pixels) for this column to be visible.
   * Uses container queries for responsive behavior based on table width.
   * Example: 600 means column is hidden when container < 600px
   */
  minVisibleWidth?: number;
  /**
   * Column priority for responsive hiding (1 = highest, hide last).
   * Lower priority columns are hidden first when space is limited.
   * Defaults to 5 (medium priority).
   */
  responsivePriority?: 1 | 2 | 3 | 4 | 5;

  // ─── Rendering ───
  /** Custom cell renderer */
  render?: (row: T, ctx: CellContext<T>) => ReactNode;
  /** Custom header renderer */
  headerRender?: () => ReactNode;

  // ─── Sorting ───
  /** Custom sort function for this column (returns negative, zero, or positive) */
  sortFn?: (a: T, b: T) => number;

  // ─── Filtering ───
  /** Filter input type */
  filterType?: FilterType;
  /** Options for select/multi-select filters */
  filterOptions?: FilterOption[];
  /** Custom filter renderer */
  filterRenderer?: (props: FilterRendererProps) => ReactNode;
  /** Custom filter function for local filtering */
  filterFn?: (row: T, filterValue: FilterValue) => boolean;

  // ─── Summary Row ───
  /**
   * Summary calculation for footer row.
   * Shows aggregated values (sum, average, count, min, max) in a footer row.
   * Can also be a custom render function for full control.
   */
  summary?:
    | "sum"
    | "average"
    | "count"
    | "min"
    | "max"
    | ((data: T[]) => ReactNode);

  // ─── Print ───
  /**
   * Custom value formatter for print output.
   * Use this when the rendered cell contains React components
   * and you need a plain text representation for printing.
   */
  printValue?: (row: T) => string;
}

// ─── COLUMN META ─────────────────────────────────────────────────────────────

/**
 * Runtime column metadata (width, position)
 */
export interface ColumnMeta {
  width: number;
  left?: number;
  right?: number;
}

/**
 * Map of column keys to their runtime metadata
 */
export type ColumnMetaMap = Record<string, ColumnMeta>;

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Type guard to check if a column definition is a ColumnGroup
 */
export function isColumnGroup<T>(
  col: Column<T> | ColumnGroup<T>
): col is ColumnGroup<T> {
  return "children" in col && Array.isArray(col.children);
}

/**
 * Extract flat list of columns from a mixed array of columns and column groups
 */
export function flattenColumns<T>(
  columns: Array<Column<T> | ColumnGroup<T>>
): Column<T>[] {
  return columns.flatMap((col) =>
    isColumnGroup(col) ? col.children : [col]
  );
}

/**
 * Check if any column groups exist in the column definitions
 */
export function hasColumnGroups<T>(
  columns: Array<Column<T> | ColumnGroup<T>>
): boolean {
  return columns.some((col) => isColumnGroup(col));
}
