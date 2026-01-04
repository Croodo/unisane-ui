"use client";

import { useMemo } from "react";
import type { Column, FilterState, MultiSortState, FilterValue, TypedFilterValue } from "../../types";
import { getNestedValue } from "../../utils/get-nested-value";
import { useDebounce } from "../utilities/use-debounce";

interface UseProcessedDataOptions<T> {
  data: T[];
  searchText: string;
  columnFilters: FilterState;
  /** Sort state - array of sort items for multi-sort support */
  sortState: MultiSortState;
  /**
   * Column definitions array.
   *
   * ⚠️ **IMPORTANT: Reference Stability Required**
   *
   * This array is a dependency of the internal useMemo. If the `columns` array
   * reference changes on every render, the entire data processing pipeline
   * (filter, search, sort) will re-run unnecessarily.
   *
   * **Best Practice:** Memoize your columns array at the component level:
   *
   * ```tsx
   * // ✅ Good - stable reference
   * const columns = useMemo(() => [
   *   { key: 'name', header: 'Name' },
   *   { key: 'email', header: 'Email' },
   * ], []);
   *
   * // ❌ Bad - new array on every render
   * const columns = [
   *   { key: 'name', header: 'Name' },
   *   { key: 'email', header: 'Email' },
   * ];
   * ```
   *
   * For dynamic columns, include only the values that should trigger recalculation:
   *
   * ```tsx
   * const columns = useMemo(() => [
   *   { key: 'name', header: 'Name', width: nameWidth },
   * ], [nameWidth]); // Only recalculate when nameWidth changes
   * ```
   */
  columns: Column<T>[];
  disableLocalProcessing?: boolean;
  /**
   * Debounce delay for search text in milliseconds.
   * Helps prevent excessive recalculations on every keystroke.
   * @default 0 (no debounce)
   */
  searchDebounceMs?: number;
}

/**
 * Hook to process data with search, filter, and sort operations.
 * Returns memoized processed data.
 *
 * @remarks
 * This hook is performance-sensitive. To avoid unnecessary recalculations:
 * - Memoize the `columns` array (see columns prop documentation)
 * - Use `disableLocalProcessing: true` for server-side data
 * - Use `searchDebounceMs` for large datasets with client-side search
 *
 * @example
 * ```tsx
 * const columns = useMemo(() => [...], []);
 * const processedData = useProcessedData({
 *   data,
 *   columns,
 *   searchText,
 *   columnFilters,
 *   sortState,
 *   searchDebounceMs: 300, // Debounce search for better performance
 * });
 * ```
 */
export function useProcessedData<T extends { id: string }>({
  data,
  searchText,
  columnFilters,
  sortState,
  columns,
  disableLocalProcessing = false,
  searchDebounceMs = 0,
}: UseProcessedDataOptions<T>): T[] {
  // Debounce search text to prevent excessive recalculations on every keystroke
  const debouncedSearchText = useDebounce(searchText, searchDebounceMs);

  return useMemo(() => {
    // Guard against empty data (early return for performance)
    if (data.length === 0) {
      return [];
    }

    // Skip processing if disabled (for remote data)
    if (disableLocalProcessing) {
      return data;
    }

    // Validate data in development mode
    if (process.env.NODE_ENV !== "production") {
      // Check for missing id field
      const missingIds = data.filter((row) => !row.id);
      if (missingIds.length > 0) {
        console.warn(
          `DataTable: ${missingIds.length} row(s) are missing the required 'id' field. ` +
          "This may cause issues with selection and rendering."
        );
      }

      // Check for duplicate ids - O(n) using Set instead of O(n²) indexOf
      const seenIds = new Set<string>();
      const duplicates: string[] = [];
      for (const row of data) {
        if (seenIds.has(row.id)) {
          duplicates.push(row.id);
        } else {
          seenIds.add(row.id);
        }
      }
      if (duplicates.length > 0) {
        console.warn(
          `DataTable: Duplicate row IDs detected: ${[...new Set(duplicates)].slice(0, 5).join(", ")}${duplicates.length > 5 ? "..." : ""}. ` +
          "Each row must have a unique 'id' for proper functionality."
        );
      }
    }

    let result = [...data];

    // ─── BUILD COLUMN LOOKUP MAP (cached for performance) ─────────────────────
    // This prevents O(n) column lookups for each filter/sort operation
    const columnMap = new Map<string, Column<T>>();
    for (const col of columns) {
      columnMap.set(String(col.key), col);
    }

    // ─── SEARCH ───────────────────────────────────────────────────────────────
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase().trim();

      result = result.filter((row) => {
        // Short-circuit: return true on first match
        for (const col of columns) {
          const value = getNestedValue(row, String(col.key));
          if (value === null || value === undefined) continue;
          if (String(value).toLowerCase().includes(searchLower)) {
            return true;
          }
        }
        return false;
      });
    }

    // ─── COLUMN FILTERS ───────────────────────────────────────────────────────
    const filterEntries = Object.entries(columnFilters);
    if (filterEntries.length > 0) {
      // Pre-build filter info for performance (avoid repeated lookups)
      const filterInfo = filterEntries.map(([key, filterValue]) => ({
        key,
        filterValue,
        column: columnMap.get(key),
      }));

      result = result.filter((row) => {
        // Short-circuit: return false on first non-match
        for (const { key, filterValue, column } of filterInfo) {
          // Use custom filter function if provided
          if (column?.filterFn) {
            if (!column.filterFn(row, filterValue)) {
              return false;
            }
          } else {
            // Default filtering logic
            const cellValue = getNestedValue(row, key);
            if (!matchesFilter(cellValue, filterValue)) {
              return false;
            }
          }
        }
        return true;
      });
    }

    // ─── SORTING ──────────────────────────────────────────────────────────────
    if (sortState.length > 0) {
      // Pre-lookup sort columns for performance
      const sortInfo = sortState.map((sortItem) => ({
        ...sortItem,
        column: columnMap.get(sortItem.key),
      }));

      result.sort((a, b) => {
        // Compare by each sort column in order (primary first, then secondary, etc.)
        for (const { key, direction, column } of sortInfo) {
          let comparison: number;

          // Use custom sort function if provided
          if (column?.sortFn) {
            const sortResult = column.sortFn(a, b);
            // Ensure sortFn returns a valid number, fallback to 0 if undefined/NaN
            comparison = typeof sortResult === "number" && !isNaN(sortResult) ? sortResult : 0;
          } else {
            // Default sorting by column value
            const aValue = getNestedValue(a, key);
            const bValue = getNestedValue(b, key);
            comparison = compareValues(aValue, bValue);
          }

          // Apply direction
          comparison = direction === "asc" ? comparison : -comparison;

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
  }, [data, debouncedSearchText, columnFilters, sortState, columns, disableLocalProcessing]);
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
 * Type guard to check if a filter value is a TypedFilterValue (has discriminator)
 */
function isTypedFilterValue(
  value: FilterValue
): value is TypedFilterValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as TypedFilterValue).type === "string"
  );
}

/**
 * Check if a cell value matches a typed filter value (discriminated union)
 * Uses the `type` discriminator for unambiguous handling
 */
function matchesTypedFilter(
  cellValue: unknown,
  filter: TypedFilterValue
): boolean {
  switch (filter.type) {
    case "text": {
      if (cellValue === null || cellValue === undefined) return false;
      const cellStr = String(cellValue);
      const filterStr = filter.value;
      const compare = filter.caseSensitive
        ? (a: string, b: string) => a.includes(b)
        : (a: string, b: string) => a.toLowerCase().includes(b.toLowerCase());

      switch (filter.match) {
        case "exact":
          return filter.caseSensitive
            ? cellStr === filterStr
            : cellStr.toLowerCase() === filterStr.toLowerCase();
        case "starts-with":
          return filter.caseSensitive
            ? cellStr.startsWith(filterStr)
            : cellStr.toLowerCase().startsWith(filterStr.toLowerCase());
        case "ends-with":
          return filter.caseSensitive
            ? cellStr.endsWith(filterStr)
            : cellStr.toLowerCase().endsWith(filterStr.toLowerCase());
        case "contains":
        default:
          return compare(cellStr, filterStr);
      }
    }

    case "number": {
      const numValue = Number(cellValue);
      if (isNaN(numValue)) return false;
      const filterNum = filter.value;

      switch (filter.operator) {
        case "neq":
          return numValue !== filterNum;
        case "gt":
          return numValue > filterNum;
        case "gte":
          return numValue >= filterNum;
        case "lt":
          return numValue < filterNum;
        case "lte":
          return numValue <= filterNum;
        case "eq":
        default:
          return numValue === filterNum;
      }
    }

    case "number-range": {
      const numValue = Number(cellValue);
      if (isNaN(numValue)) return false;

      const minInclusive = filter.minInclusive !== false;
      const maxInclusive = filter.maxInclusive !== false;

      if (filter.min !== undefined) {
        if (minInclusive ? numValue < filter.min : numValue <= filter.min) {
          return false;
        }
      }
      if (filter.max !== undefined) {
        if (maxInclusive ? numValue > filter.max : numValue >= filter.max) {
          return false;
        }
      }
      return true;
    }

    case "date": {
      const cellDate =
        cellValue instanceof Date ? cellValue : new Date(String(cellValue));
      if (isNaN(cellDate.getTime())) return false;

      const filterDate =
        filter.value instanceof Date ? filter.value : new Date(filter.value);
      if (isNaN(filterDate.getTime())) return true;

      // Normalize to start of day for comparison
      const cellDay = new Date(
        cellDate.getFullYear(),
        cellDate.getMonth(),
        cellDate.getDate()
      );
      const filterDay = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth(),
        filterDate.getDate()
      );

      switch (filter.operator) {
        case "neq":
          return cellDay.getTime() !== filterDay.getTime();
        case "before":
          return cellDay < filterDay;
        case "after":
          return cellDay > filterDay;
        case "on-or-before":
          return cellDay <= filterDay;
        case "on-or-after":
          return cellDay >= filterDay;
        case "eq":
        default:
          return cellDay.getTime() === filterDay.getTime();
      }
    }

    case "date-range": {
      const cellDate =
        cellValue instanceof Date ? cellValue : new Date(String(cellValue));
      if (isNaN(cellDate.getTime())) return false;

      const startInclusive = filter.startInclusive !== false;
      const endInclusive = filter.endInclusive !== false;

      if (filter.start) {
        const startDate =
          filter.start instanceof Date ? filter.start : new Date(filter.start);
        if (!isNaN(startDate.getTime())) {
          if (startInclusive ? cellDate < startDate : cellDate <= startDate) {
            return false;
          }
        }
      }
      if (filter.end) {
        const endDate =
          filter.end instanceof Date ? filter.end : new Date(filter.end);
        if (!isNaN(endDate.getTime())) {
          if (endInclusive ? cellDate > endDate : cellDate >= endDate) {
            return false;
          }
        }
      }
      return true;
    }

    case "select": {
      if (cellValue === null || cellValue === undefined) return false;
      return (
        String(cellValue).toLowerCase() === String(filter.value).toLowerCase()
      );
    }

    case "multi-select": {
      if (filter.values.length === 0) return true;
      if (cellValue === null || cellValue === undefined) return false;

      const cellStr = String(cellValue).toLowerCase();
      const matches = filter.values.map(
        (v) => cellStr === String(v).toLowerCase()
      );

      return filter.match === "all" ? matches.every(Boolean) : matches.some(Boolean);
    }

    case "boolean": {
      return Boolean(cellValue) === filter.value;
    }

    default: {
      // Exhaustive check - should never reach here
      const _exhaustive: never = filter;
      return true;
    }
  }
}

/**
 * Check if a cell value matches a filter value
 * Supports both legacy FilterValue and new TypedFilterValue formats
 */
function matchesFilter(cellValue: unknown, filterValue: FilterValue): boolean {
  if (filterValue === null || filterValue === undefined) {
    return true;
  }

  // Handle TypedFilterValue (discriminated union) - preferred path
  if (isTypedFilterValue(filterValue)) {
    return matchesTypedFilter(cellValue, filterValue);
  }

  // ─── LEGACY FILTER HANDLING ─────────────────────────────────────────────────
  // For backwards compatibility with simple filter values

  // Handle array filter (multi-select)
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true;
    return filterValue.some((fv) => {
      if (cellValue === null || cellValue === undefined) return false;
      return String(cellValue).toLowerCase() === String(fv).toLowerCase();
    });
  }

  // Handle legacy range filter (min/max) - assumes number range
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

  // Handle legacy date range filter (start/end)
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

  // Handle Date filter value
  if (filterValue instanceof Date) {
    const cellDate = cellValue instanceof Date ? cellValue : new Date(String(cellValue));
    if (isNaN(cellDate.getTime())) return false;
    // Compare dates at day level
    return (
      cellDate.getFullYear() === filterValue.getFullYear() &&
      cellDate.getMonth() === filterValue.getMonth() &&
      cellDate.getDate() === filterValue.getDate()
    );
  }

  // Handle boolean filter
  if (typeof filterValue === "boolean") {
    return Boolean(cellValue) === filterValue;
  }

  // Handle string/number filter (text search)
  if (cellValue === null || cellValue === undefined) {
    return false;
  }

  const cellStr = String(cellValue).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();

  return cellStr.includes(filterStr);
}
