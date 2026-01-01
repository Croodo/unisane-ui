"use client";

import React, { memo } from "react";
import type { ReactNode } from "react";
import type { Column, PinPosition, ColumnMetaMap } from "../types/index";
import type { Density } from "../constants/index";
import { SummaryRow } from "./summary-row";

// ─── FOOTER PROPS ────────────────────────────────────────────────────────────

export interface DataTableFooterProps<T> {
  /** Data to calculate summaries from */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Column metadata for positioning */
  columnMeta: ColumnMetaMap;
  /** Get effective pin position for a column */
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  /** Whether selection checkbox column is shown */
  selectable: boolean;
  /** Whether expansion column is shown */
  enableExpansion: boolean;
  /** Whether to show column borders */
  showColumnBorders: boolean;
  /** Row density */
  density?: Density;
  /** Whether to show the summary row */
  showSummary: boolean;
  /** Label for the summary row */
  summaryLabel?: string;
  /** Custom summary renderer for specific columns */
  customSummaryRenderer?: Record<string, (data: T[]) => ReactNode>;
  /** Whether row reordering is enabled (adds drag handle column) */
  reorderableRows?: boolean;
}

// ─── FOOTER COMPONENT ────────────────────────────────────────────────────────

function DataTableFooterInner<T extends { id: string }>({
  data,
  columns,
  columnMeta,
  getEffectivePinPosition,
  selectable,
  enableExpansion,
  showColumnBorders,
  density = "standard",
  showSummary,
  summaryLabel = "Summary",
  customSummaryRenderer,
  reorderableRows = false,
}: DataTableFooterProps<T>) {
  if (!showSummary) {
    return null;
  }

  // Calculate last pinned left and first pinned right for border logic
  const pinnedLeftColumns = columns.filter((col) => getEffectivePinPosition(col) === "left");
  const pinnedRightColumns = columns.filter((col) => getEffectivePinPosition(col) === "right");
  const lastPinnedLeftKey = pinnedLeftColumns.length > 0
    ? String(pinnedLeftColumns[pinnedLeftColumns.length - 1]!.key)
    : null;
  const firstPinnedRightKey = pinnedRightColumns.length > 0
    ? String(pinnedRightColumns[0]!.key)
    : null;

  return (
    <tfoot>
      <SummaryRow
        data={data}
        columns={columns}
        columnMeta={columnMeta}
        getEffectivePinPosition={getEffectivePinPosition}
        selectable={selectable}
        enableExpansion={enableExpansion}
        showColumnBorders={showColumnBorders}
        density={density}
        label={summaryLabel}
        lastPinnedLeftKey={lastPinnedLeftKey}
        firstPinnedRightKey={firstPinnedRightKey}
        customSummaryRenderer={customSummaryRenderer}
        reorderableRows={reorderableRows}
      />
    </tfoot>
  );
}

export const DataTableFooter = memo(DataTableFooterInner) as typeof DataTableFooterInner;
