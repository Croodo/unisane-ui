"use client";

import { useMemo } from "react";
import type { Column, ColumnMetaMap, PinPosition } from "../../types";
import { COLUMN_WIDTHS } from "../../constants/index";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface UseColumnLayoutOptions<T> {
  /** Visible columns to layout */
  visibleColumns: Column<T>[];
  /** User-set column widths */
  columnWidths: Record<string, number>;
  /** Function to get effective pin position for a column */
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  /** Whether selection column is shown */
  selectable: boolean;
  /** Whether expansion column is shown */
  enableExpansion: boolean;
  /** Whether row drag handles are shown */
  reorderableRows?: boolean;
  /** Whether data is grouped (disables drag handles) */
  isGrouped?: boolean;
}

export interface UseColumnLayoutReturn<T> {
  /** Columns sorted by pin position (left → unpinned → right) */
  sortedVisibleColumns: Column<T>[];
  /** Metadata for each column (width, left/right positions) */
  columnMeta: ColumnMetaMap;
  /** Total calculated table width */
  totalTableWidth: number;
  /** Width of all left-pinned columns including checkbox/expander */
  pinnedLeftWidth: number;
  /** Width of all right-pinned columns */
  pinnedRightWidth: number;
  /** Whether all columns are hidden (edge case) */
  allColumnsHidden: boolean;
}

/**
 * Hook for calculating column layout metadata.
 *
 * Handles:
 * - Sorting columns by pin position (left → unpinned → right)
 * - Calculating left/right offsets for pinned columns
 * - Computing total table width
 * - Computing pinned column widths for scrollbar positioning
 */
export function useColumnLayout<T>({
  visibleColumns,
  columnWidths,
  getEffectivePinPosition,
  selectable,
  enableExpansion,
  reorderableRows = false,
  isGrouped = false,
}: UseColumnLayoutOptions<T>): UseColumnLayoutReturn<T> {
  // Sort columns by pin position: pinned-left → unpinned → pinned-right
  // This ensures correct DOM order for sticky positioning
  const sortedVisibleColumns = useMemo(() => {
    const pinnedLeft: Column<T>[] = [];
    const unpinned: Column<T>[] = [];
    const pinnedRight: Column<T>[] = [];

    visibleColumns.forEach((col) => {
      const pin = getEffectivePinPosition(col);
      if (pin === "left") pinnedLeft.push(col);
      else if (pin === "right") pinnedRight.push(col);
      else unpinned.push(col);
    });

    return [...pinnedLeft, ...unpinned, ...pinnedRight];
  }, [visibleColumns, getEffectivePinPosition]);

  // Calculate column metadata (widths, left/right positions)
  const columnMeta = useMemo<ColumnMetaMap>(() => {
    const meta: ColumnMetaMap = {};
    const expanderWidth = enableExpansion ? COLUMN_WIDTHS.EXPANDER : 0;
    let leftAcc = (selectable ? COLUMN_WIDTHS.CHECKBOX : 0) + expanderWidth;

    // Initialize all column widths
    sortedVisibleColumns.forEach((col) => {
      const key = String(col.key);
      meta[key] = {
        width:
          columnWidths[key] ??
          (typeof col.width === "number" ? col.width : 150),
      };
    });

    // Calculate left positions for left-pinned columns
    sortedVisibleColumns.forEach((col) => {
      const key = String(col.key);
      const target = meta[key];
      if (getEffectivePinPosition(col) === "left" && target) {
        target.left = leftAcc;
        leftAcc += target.width;
      }
    });

    // Calculate right positions for right-pinned columns
    let rightAcc = 0;
    [...sortedVisibleColumns].reverse().forEach((col) => {
      const key = String(col.key);
      const target = meta[key];
      if (getEffectivePinPosition(col) === "right" && target) {
        target.right = rightAcc;
        rightAcc += target.width;
      }
    });

    return meta;
  }, [
    sortedVisibleColumns,
    columnWidths,
    enableExpansion,
    getEffectivePinPosition,
    selectable,
  ]);

  // Calculate total table width
  const totalTableWidth = useMemo(() => {
    const dragHandleWidth = reorderableRows && !isGrouped ? COLUMN_WIDTHS.DRAG_HANDLE : 0;
    const checkboxWidth = selectable ? COLUMN_WIDTHS.CHECKBOX : 0;
    const expanderWidth = enableExpansion ? COLUMN_WIDTHS.EXPANDER : 0;
    const columnsWidth = sortedVisibleColumns.reduce((acc, col) => {
      const key = String(col.key);
      const width =
        columnMeta[key]?.width ??
        (typeof col.width === "number" ? col.width : 150);
      return acc + width;
    }, 0);
    return dragHandleWidth + checkboxWidth + expanderWidth + columnsWidth;
  }, [
    selectable,
    enableExpansion,
    sortedVisibleColumns,
    columnMeta,
    reorderableRows,
    isGrouped,
  ]);

  // Calculate pinned column widths for scrollbar positioning
  const { pinnedLeftWidth, pinnedRightWidth } = useMemo(() => {
    const dragHandleWidth = reorderableRows && !isGrouped ? COLUMN_WIDTHS.DRAG_HANDLE : 0;
    const checkboxWidth = selectable ? COLUMN_WIDTHS.CHECKBOX : 0;
    const expanderWidth = enableExpansion ? COLUMN_WIDTHS.EXPANDER : 0;

    // Left pinned: includes checkbox, expander, drag handle, and left-pinned columns
    let leftWidth = dragHandleWidth + checkboxWidth + expanderWidth;
    sortedVisibleColumns.forEach((col) => {
      if (getEffectivePinPosition(col) === "left") {
        const key = String(col.key);
        leftWidth += columnMeta[key]?.width ?? 150;
      }
    });

    // Right pinned: includes right-pinned columns
    let rightWidth = 0;
    sortedVisibleColumns.forEach((col) => {
      if (getEffectivePinPosition(col) === "right") {
        const key = String(col.key);
        rightWidth += columnMeta[key]?.width ?? 150;
      }
    });

    return { pinnedLeftWidth: leftWidth, pinnedRightWidth: rightWidth };
  }, [
    sortedVisibleColumns,
    columnMeta,
    getEffectivePinPosition,
    selectable,
    enableExpansion,
    reorderableRows,
    isGrouped,
  ]);

  // Detect edge case where all columns are hidden
  const allColumnsHidden = sortedVisibleColumns.length === 0;

  // Warn in development if all columns are hidden
  if (process.env.NODE_ENV !== "production" && allColumnsHidden) {
    console.warn(
      "DataTable: All columns are hidden. Consider showing at least one column."
    );
  }

  return {
    sortedVisibleColumns,
    columnMeta,
    totalTableWidth,
    pinnedLeftWidth,
    pinnedRightWidth,
    allColumnsHidden,
  };
}

export default useColumnLayout;
