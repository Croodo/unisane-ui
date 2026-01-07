import { useMemo } from "react";
import type { Column, FilterState, SortDirection } from "../types";
import { getNestedValue } from "../utils/getNestedValue";

interface UseProcessedDataParams<T extends { id: string }> {
  data: T[];
  searchText: string;
  columnFilters: FilterState;
  sortColumn: keyof T | string | null;
  sortDirection: SortDirection;
  columns: Column<T>[];
  disableLocalProcessing?: boolean;
}

export const useProcessedData = <T extends { id: string }>({
  data,
  searchText,
  columnFilters,
  sortColumn,
  sortDirection,
  columns,
  disableLocalProcessing = false,
}: UseProcessedDataParams<T>) => {
  return useMemo(() => {
    const base = Array.isArray(data) ? data : [];
    if (disableLocalProcessing) return base;
    let processed = [...base];

    if (searchText) {
      const lowerFilter = searchText.toLowerCase();
      processed = processed.filter((item) => {
        // Optimized search: only check values corresponding to columns
        return columns.some((col) => {
          const val = getNestedValue(item, String(col.key));
          if (val == null) return false;
          return String(val).toLowerCase().includes(lowerFilter);
        });
      });
    }

    if (Object.keys(columnFilters).length > 0) {
      processed = processed.filter((item) =>
        Object.entries(columnFilters).every(([key, filterValue]) => {
          const col = columns.find((c) => String(c.key) === key);
          if (col?.filterFn) return col.filterFn(item, filterValue);

          const itemValue = getNestedValue(item, key);
          if (Array.isArray(filterValue)) {
            return (
              filterValue.length === 0 ||
              filterValue.map(String).includes(String(itemValue))
            );
          }
          if (typeof filterValue === "string") {
            return String(itemValue ?? "")
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }
          return itemValue == filterValue;
        })
      );
    }

    if (sortColumn && sortDirection) {
      processed.sort((a, b) => {
        const aVal = getNestedValue(a, sortColumn as string);
        const bVal = getNestedValue(b, sortColumn as string);

        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Handle Date objects or ISO date strings
        const aDate = aVal instanceof Date ? aVal : typeof aVal === 'string' && !isNaN(Date.parse(aVal)) ? new Date(aVal) : null;
        const bDate = bVal instanceof Date ? bVal : typeof bVal === 'string' && !isNaN(Date.parse(bVal)) ? new Date(bVal) : null;

        if (aDate && bDate) {
           const aTime = aDate.getTime();
           const bTime = bDate.getTime();
           if (aTime < bTime) return sortDirection === "asc" ? -1 : 1;
           if (aTime > bTime) return sortDirection === "asc" ? 1 : -1;
           return 0;
        }

        const aCmp = (aVal as number | string);
        const bCmp = (bVal as number | string);

        if (aCmp < bCmp) return sortDirection === "asc" ? -1 : 1;
        if (aCmp > bCmp) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [data, searchText, columnFilters, sortColumn, sortDirection, columns, disableLocalProcessing]);
};
