"use client";

import type { Column, ColumnMetaMap, PinPosition } from "../types/index";
import { COLUMN_WIDTHS } from "../constants/index";

// ─── COLGROUP PROPS ───────────────────────────────────────────────────────

interface TableColgroupProps<T> {
  columns: Column<T>[];
  columnMeta: ColumnMetaMap;
  selectable: boolean;
  enableExpansion: boolean;
  /** Function to get effective pin position for a column */
  getEffectivePinPosition?: (col: Column<T>) => PinPosition;
  /** Whether row reordering is enabled */
  reorderableRows?: boolean;
}

// ─── COLGROUP COMPONENT ───────────────────────────────────────────────────

export function TableColgroup<T>({
  columns,
  columnMeta,
  selectable,
  enableExpansion,
  getEffectivePinPosition,
  reorderableRows = false,
}: TableColgroupProps<T>) {
  // Find the last non-pinned column to make it flexible
  const lastNonPinnedIndex = getEffectivePinPosition
    ? columns.reduce((lastIdx, col, idx) => {
        const pin = getEffectivePinPosition(col);
        return !pin ? idx : lastIdx;
      }, -1)
    : columns.length - 1;

  return (
    <colgroup>
      {/* Drag handle column - fixed width */}
      {reorderableRows && (
        <col style={{ width: 40, minWidth: 40, maxWidth: 40 }} />
      )}

      {/* Checkbox column - fixed width */}
      {selectable && (
        <col style={{ width: COLUMN_WIDTHS.CHECKBOX, minWidth: COLUMN_WIDTHS.CHECKBOX, maxWidth: COLUMN_WIDTHS.CHECKBOX }} />
      )}

      {/* Expander column - fixed width */}
      {enableExpansion && (
        <col style={{ width: COLUMN_WIDTHS.EXPANDER, minWidth: COLUMN_WIDTHS.EXPANDER, maxWidth: COLUMN_WIDTHS.EXPANDER }} />
      )}

      {/* Data columns */}
      {columns.map((col, idx) => {
        const key = String(col.key);
        const meta = columnMeta[key];
        const width = meta?.width ?? (typeof col.width === "number" ? col.width : 150);
        const isPinned = getEffectivePinPosition ? !!getEffectivePinPosition(col) : false;
        const isLastNonPinned = idx === lastNonPinnedIndex;

        // Pinned columns get fixed width, last non-pinned column gets flexible width
        // Other columns use minWidth to allow growth
        return (
          <col
            key={key}
            style={{
              width: isPinned ? `${width}px` : isLastNonPinned ? "auto" : `${width}px`,
              minWidth: `${col.minWidth ?? width}px`,
            }}
          />
        );
      })}
    </colgroup>
  );
}

export default TableColgroup;
