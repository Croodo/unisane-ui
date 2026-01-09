"use client";

import { useMemo } from "react";
import type { CellContext, Column } from "../../types";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface UseRowNumbersOptions {
  /**
   * Whether to show row numbers
   * @default false
   */
  enabled?: boolean;
  /**
   * Header text for the row number column
   * @default "#"
   */
  header?: string;
  /**
   * Width of the row number column in pixels
   * @default 50
   */
  width?: number;
  /**
   * Current page (1-indexed) for calculating row offset
   * @default 1
   */
  page?: number;
  /**
   * Page size for calculating row offset
   * @default 10
   */
  pageSize?: number;
  /**
   * Pin the row number column to the left
   * @default true
   */
  pinned?: boolean;
}

export interface UseRowNumbersReturn<T> {
  /** The row number column definition (null if not enabled) */
  rowNumberColumn: Column<T> | null;
  /**
   * Get the display row number for a given row index.
   * Accounts for pagination offset.
   */
  getRowNumber: (rowIndex: number) => number;
  /**
   * Calculate the starting row number for the current page.
   */
  startingRowNumber: number;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

/** Special key prefix for the row number column */
export const ROW_NUMBER_COLUMN_KEY = "__rowNumber" as const;

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for adding a row number column to the DataTable.
 *
 * @example
 * ```tsx
 * const { rowNumberColumn, getRowNumber } = useRowNumbers<User>({
 *   enabled: showRowNumbers,
 *   page: currentPage,
 *   pageSize: 10,
 * });
 *
 * // Prepend to columns
 * const columnsWithRowNumbers = rowNumberColumn
 *   ? [rowNumberColumn, ...columns]
 *   : columns;
 * ```
 */
export function useRowNumbers<T extends { id: string }>(
  options: UseRowNumbersOptions = {}
): UseRowNumbersReturn<T> {
  const {
    enabled = false,
    header = "#",
    width = 50,
    page = 1,
    pageSize = 10,
    pinned = true,
  } = options;

  // Calculate starting row number based on pagination
  const startingRowNumber = useMemo(() => {
    return (page - 1) * pageSize + 1;
  }, [page, pageSize]);

  // Function to get row number for a given index
  const getRowNumber = useMemo(() => {
    return (rowIndex: number): number => {
      return startingRowNumber + rowIndex;
    };
  }, [startingRowNumber]);

  // Create the row number column definition
  const rowNumberColumn = useMemo((): Column<T> | null => {
    if (!enabled) {
      return null;
    }

    return {
      key: ROW_NUMBER_COLUMN_KEY,
      header,
      width,
      minWidth: 40,
      maxWidth: 100,
      align: "center",
      sortable: false,
      filterable: false,
      resizable: false,
      pinned: pinned ? "left" : undefined,
      // Custom cell renderer that shows the row number
      cell: ({ rowIndex }: CellContext<T>) => {
        const rowNumber = getRowNumber(rowIndex);
        return (
          <span className="text-on-surface-variant text-label-sm tabular-nums">
            {rowNumber}
          </span>
        );
      },
    } as Column<T>;
  }, [enabled, header, width, pinned, getRowNumber]);

  return {
    rowNumberColumn,
    getRowNumber,
    startingRowNumber,
  };
}
