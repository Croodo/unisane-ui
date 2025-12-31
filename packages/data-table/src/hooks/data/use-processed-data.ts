"use client";

import { useMemo } from "react";
import type { Column, FilterState, SortDirection, MultiSortState, FilterValue } from "../../types";
import { getNestedValue } from "../../utils/get-nested-value";

interface UseProcessedDataOptions<T> {
  data: T[];
  searchText: string;
  columnFilters: FilterState;
  /** @deprecated Use sortState instead for multi-sort */
  sortKey: string | null;
  /** @deprecated Use sortState instead for multi-sort */
  sortDirection: SortDirection;
  /** Multi-sort state - takes precedence over sortKey/sortDirection */
  sortState?: MultiSortState;
  columns: Column<T>[];
  disableLocalProcessing?: boolean;
}

/**
 * Hook to process data with search, filter, and sort operations
 * Returns memoized processed data
 */
export function useProcessedData<T extends { id: string }>({
  data,
  searchText,
  columnFilters,
  sortKey,
  sortDirection,
  sortState = [],
  columns,
  disableLocalProcessing = false,
}: UseProcessedDataOptions<T>): T[] {
  return useMemo(() => {
    // Guard against undefined data
    if (!data) {
      return [];
    }

    // Skip processing if disabled (for remote data)
    if (disableLocalProcessing) {
      return data;
    }

    let result = [...data];

    // ─── SEARCH ───────────────────────────────────────────────────────────────
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter((row) => {
        // Search across all columns
        return columns.some((col) => {
          const value = getNestedValue(row, String(col.key));
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // ─── COLUMN FILTERS ───────────────────────────────────────────────────────
    const filterEntries = Object.entries(columnFilters);
    if (filterEntries.length > 0) {
      result = result.filter((row) => {
        return filterEntries.every(([key, filterValue]) => {
          // Find column definition
          const column = columns.find((col) => String(col.key) === key);

          // Use custom filter function if provided
          if (column?.filterFn) {
            return column.filterFn(row, filterValue);
          }

          // Default filtering logic
          const cellValue = getNestedValue(row, key);

          return matchesFilter(cellValue, filterValue);
        });
      });
    }

    // ─── SORTING ──────────────────────────────────────────────────────────────
    // Determine effective sort state (prefer sortState array over legacy sortKey/sortDirection)
    const effectiveSortState: MultiSortState =
      sortState.length > 0
        ? sortState
        : sortKey && sortDirection
          ? [{ key: sortKey, direction: sortDirection }]
          : [];

    if (effectiveSortState.length > 0) {
      result.sort((a, b) => {
        // Compare by each sort column in order (primary first, then secondary, etc.)
        for (const sortItem of effectiveSortState) {
          // Find the column for custom sort function
          const sortColumn = columns.find((col) => String(col.key) === sortItem.key);

          let comparison: number;

          // Use custom sort function if provided
          if (sortColumn?.sortFn) {
            comparison = sortColumn.sortFn(a, b);
          } else {
            // Default sorting by column value
            const aValue = getNestedValue(a, sortItem.key);
            const bValue = getNestedValue(b, sortItem.key);
            comparison = compareValues(aValue, bValue);
          }

          // Apply direction
          comparison = sortItem.direction === "asc" ? comparison : -comparison;

          // If not equal, return the comparison result
          if (comparison !== 0) {
            return comparison;
          }
          // If equal, continue to next sort column
        }

        // All sort columns are equal
        return 0;
      });
    }

    return result;
  }, [data, searchText, columnFilters, sortKey, sortDirection, sortState, columns, disableLocalProcessing]);
}

/**
 * Compare two values for sorting
 */
function compareValues(a: unknown, b: unknown): number {
  // Handle null/undefined
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Handle numbers
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  // Handle strings (case-insensitive)
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  return strA.localeCompare(strB);
}

/**
 * Check if a cell value matches a filter value
 */
function matchesFilter(cellValue: unknown, filterValue: FilterValue): boolean {
  if (filterValue === null || filterValue === undefined) {
    return true;
  }

  // Handle array filter (multi-select)
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true;
    return filterValue.some((fv) => {
      if (cellValue === null || cellValue === undefined) return false;
      return String(cellValue).toLowerCase() === String(fv).toLowerCase();
    });
  }

  // Handle range filter (min/max)
  if (
    typeof filterValue === "object" &&
    filterValue !== null &&
    ("min" in filterValue || "max" in filterValue)
  ) {
    const { min, max } = filterValue as { min?: number | string; max?: number | string };
    const numValue = Number(cellValue);

    if (min !== undefined && numValue < Number(min)) return false;
    if (max !== undefined && numValue > Number(max)) return false;
    return true;
  }

  // Handle date range filter (start/end)
  if (
    typeof filterValue === "object" &&
    filterValue !== null &&
    ("start" in filterValue || "end" in filterValue)
  ) {
    const { start, end } = filterValue as { start?: Date | string; end?: Date | string };
    const cellDate = cellValue instanceof Date ? cellValue : new Date(String(cellValue));

    if (start) {
      const startDate = start instanceof Date ? start : new Date(start);
      if (cellDate < startDate) return false;
    }
    if (end) {
      const endDate = end instanceof Date ? end : new Date(end);
      if (cellDate > endDate) return false;
    }
    return true;
  }

  // Handle string/number filter
  if (cellValue === null || cellValue === undefined) {
    return false;
  }

  const cellStr = String(cellValue).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();

  return cellStr.includes(filterStr);
}
