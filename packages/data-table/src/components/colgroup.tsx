"use client";

import type { Column, ColumnMetaMap, PinPosition } from "../types";
import { COLUMN_WIDTHS } from "../constants";

// ─── COLGROUP PROPS ───────────────────────────────────────────────────────

interface TableColgroupProps<T> {
  columns: Column<T>[];
  columnMeta: ColumnMetaMap;
  selectable: boolean;
  enableExpansion: boolean;
  /** Function to get effective pin position for a column */
  getEffectivePinPosition?: (col: Column<T>) => PinPosition;
}

// ─── COLGROUP COMPONENT ───────────────────────────────────────────────────

export function TableColgroup<T>({
  columns,
  columnMeta,
  selectable,
  enableExpansion,
  getEffectivePinPosition,
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
      {/* Checkbox column - fixed width */}
      {selectable && (
        <col style={{ width: `${COLUMN_WIDTHS.checkbox}px`, minWidth: `${COLUMN_WIDTHS.checkbox}px` }} />
      )}

      {/* Expander column - fixed width */}
      {enableExpansion && (
        <col style={{ width: `${COLUMN_WIDTHS.expander}px`, minWidth: `${COLUMN_WIDTHS.expander}px` }} />
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
