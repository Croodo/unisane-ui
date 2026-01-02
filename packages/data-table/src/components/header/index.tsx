"use client";

import React, { memo } from "react";
import { cn, Checkbox } from "@unisane/ui";
import type {
  Column,
  ColumnGroup,
  SortDirection,
  MultiSortState,
  PinPosition,
  ColumnMetaMap,
  FilterValue,
} from "../../types";
import { isColumnGroup } from "../../types";
import { DENSITY_STYLES, type Density } from "../../constants";
import { useColumnDrag } from "../../hooks/ui/use-column-drag";
import { useI18n } from "../../i18n";
import { HeaderCell } from "./header-cell";
import { GroupHeaderRow } from "./group-header-row";

// Re-export sub-components for direct use
export { ResizeHandle } from "./resize-handle";
export { ColumnMenu } from "./column-menu";
export { HeaderCell } from "./header-cell";
export { GroupHeaderRow } from "./group-header-row";

// ─── HEADER PROPS ───────────────────────────────────────────────────────────

export interface DataTableHeaderProps<T> {
  /** Flattened leaf columns for rendering cells */
  columns: Column<T>[];
  /** Original column definitions (may include groups) */
  columnDefinitions?: Array<Column<T> | ColumnGroup<T>>;
  /** Whether column groups exist */
  hasGroups?: boolean;
  /** Multi-sort state */
  sortState: MultiSortState;
  /** Sort handler - receives key and whether Shift was held (for multi-sort) */
  onSort: (key: string, addToMultiSort?: boolean) => void;
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  selectable: boolean;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  showColumnBorders: boolean;
  enableExpansion: boolean;
  density?: Density;
  // Column features
  resizable?: boolean;
  pinnable?: boolean;
  reorderable?: boolean;
  onColumnPin?: (key: string, position: PinPosition) => void;
  onColumnResize?: (key: string, width: number) => void;
  onColumnHide?: (key: string) => void;
  onColumnFilter?: (key: string, value: FilterValue) => void;
  onColumnReorder?: (fromKey: string, toKey: string) => void;
  columnFilters?: Record<string, FilterValue>;
  /** Whether grouping is enabled */
  groupingEnabled?: boolean;
  /** Current column(s) being grouped by (supports multi-level) */
  groupBy?: string | string[] | null;
  /** Normalized array of groupBy keys */
  groupByArray?: string[];
  /** Callback to set groupBy column(s) - replaces current grouping */
  onGroupBy?: (key: string | string[] | null) => void;
  /** Callback to add a column to multi-level grouping */
  onAddGroupBy?: (key: string) => void;
  /** Whether row drag-to-reorder is enabled */
  reorderableRows?: boolean;
}

// ─── HEADER COMPONENT ───────────────────────────────────────────────────────

function DataTableHeaderInner<T extends { id: string }>({
  columns,
  columnDefinitions,
  hasGroups = false,
  sortState,
  onSort,
  columnMeta,
  getEffectivePinPosition,
  selectable,
  allSelected,
  indeterminate,
  onSelectAll,
  showColumnBorders,
  enableExpansion,
  density = "standard",
  resizable = false,
  pinnable = false,
  reorderable = false,
  onColumnPin,
  onColumnResize,
  onColumnHide,
  onColumnFilter,
  onColumnReorder,
  columnFilters = {},
  groupingEnabled = false,
  groupBy,
  groupByArray = [],
  onGroupBy,
  onAddGroupBy,
  reorderableRows = false,
}: DataTableHeaderProps<T>) {
  const { t } = useI18n();
  const paddingClass = DENSITY_STYLES[density];

  // Column drag-to-reorder
  const { getDragProps, isDraggingColumn, isDropTarget, getDropPosition } =
    useColumnDrag({
      enabled: reorderable,
      onReorder: (fromKey, toKey) => onColumnReorder?.(fromKey, toKey),
    });

  // Helper to get sort info from sortState
  const getSortInfo = (
    key: string
  ): {
    isSorted: boolean;
    direction: SortDirection;
    priority: number | null;
  } => {
    const index = sortState.findIndex((s) => s.key === key);
    if (index === -1) {
      return { isSorted: false, direction: null, priority: null };
    }
    return {
      isSorted: true,
      direction: sortState[index]!.direction,
      priority: sortState.length > 1 ? index + 1 : null,
    };
  };

  // Get columns that are children of groups (for second row when groups exist)
  const groupChildColumns =
    hasGroups && columnDefinitions
      ? columnDefinitions.flatMap((def) =>
          isColumnGroup(def) ? def.children : []
        )
      : [];

  // Determine pinned column info for border logic
  const columnsToRender = hasGroups ? groupChildColumns : columns;
  const pinnedLeftColumns = columnsToRender.filter(
    (col) => getEffectivePinPosition(col) === "left"
  );
  const pinnedRightColumns = columnsToRender.filter(
    (col) => getEffectivePinPosition(col) === "right"
  );
  const hasPinnedLeftData = pinnedLeftColumns.length > 0;
  const lastPinnedLeftKey = hasPinnedLeftData
    ? String(pinnedLeftColumns[pinnedLeftColumns.length - 1]!.key)
    : null;
  const firstPinnedRightKey =
    pinnedRightColumns.length > 0 ? String(pinnedRightColumns[0]!.key) : null;

  return (
    <thead className="bg-surface">
      {/* Group header row (only if groups exist) */}
      {hasGroups && columnDefinitions && (
        <GroupHeaderRow
          columnDefinitions={columnDefinitions}
          selectable={selectable}
          enableExpansion={enableExpansion}
          showColumnBorders={showColumnBorders}
          paddingClass={paddingClass}
          hasPinnedLeftData={hasPinnedLeftData}
          reorderableRows={reorderableRows}
        />
      )}

      {/* Main header row (or child columns row if groups exist) */}
      <tr>
        {/* Drag handle column - scrolls with content, not sticky */}
        {reorderableRows && (
          <th
            className={cn(
              "bg-surface border-b border-outline-variant/50",
              showColumnBorders && "border-r border-outline-variant/50"
            )}
            style={{ width: 40, minWidth: 40, maxWidth: 40 }}
          >
            <span className="sr-only">Reorder rows</span>
          </th>
        )}

        {/* Checkbox column - only render if no groups (groups use rowSpan) */}
        {selectable && !hasGroups && (
          <th
            className={cn(
              "bg-surface border-b border-outline-variant/50",
              "z-20",
              // Only show border-r if there are no more sticky columns after this
              showColumnBorders &&
                !enableExpansion &&
                !hasPinnedLeftData &&
                "border-r border-outline-variant/50"
            )}
            style={{
              width: 48,
              minWidth: 48,
              maxWidth: 48,
              // Pinned left at position 0:
              // Use max() to only start translating once scroll exceeds drag handle width
              // This mimics sticky behavior: stays in DOM position until scroll catches up
              transform: reorderableRows
                ? "translateX(max(0px, calc(var(--header-scroll-offset, 0px) - 40px)))"
                : "translateX(var(--header-scroll-offset, 0px))",
            }}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={allSelected}
                indeterminate={indeterminate}
                onChange={(e) => onSelectAll(e.target.checked)}
                aria-label={t("selectAll")}
                className="[&>div]:w-8 [&>div]:h-8"
              />
            </div>
          </th>
        )}

        {/* Checkbox for group mode (needs to be in second row too for proper alignment) */}
        {selectable && hasGroups && (
          <th
            className={cn(
              "bg-surface border-b border-outline-variant/50",
              "z-20",
              // Only show border-r if there are no more sticky columns after this
              showColumnBorders &&
                !enableExpansion &&
                !hasPinnedLeftData &&
                "border-r border-outline-variant/50"
            )}
            style={{
              width: 48,
              minWidth: 48,
              maxWidth: 48,
              // Pinned left at position 0:
              // Use max() to only start translating once scroll exceeds drag handle width
              transform: reorderableRows
                ? "translateX(max(0px, calc(var(--header-scroll-offset, 0px) - 40px)))"
                : "translateX(var(--header-scroll-offset, 0px))",
            }}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={allSelected}
                indeterminate={indeterminate}
                onChange={(e) => onSelectAll(e.target.checked)}
                aria-label={t("selectAll")}
                className="[&>div]:w-8 [&>div]:h-8"
              />
            </div>
          </th>
        )}

        {/* Expander column - only render if no groups */}
        {enableExpansion && !hasGroups && (
          <th
            className={cn(
              "bg-surface border-b border-outline-variant/50",
              "z-20",
              // Only show border-r if there are no pinned-left data columns after this
              showColumnBorders &&
                !hasPinnedLeftData &&
                "border-r border-outline-variant/50"
            )}
            style={{
              width: 40,
              minWidth: 40,
              maxWidth: 40,
              // Pinned left at position 48 (after checkbox) or 0 (if no checkbox):
              // Use max() to only start translating once scroll exceeds the offset
              transform: (() => {
                // Calculate the offset to subtract from natural position
                // Natural position = dragHandle(40 if exists) + checkbox(48 if exists)
                const dragHandleWidth = reorderableRows ? 40 : 0;
                const checkboxWidth = selectable ? 48 : 0;
                // Target position = checkbox width (48 if exists, 0 otherwise)
                const targetLeft = selectable ? 48 : 0;
                // Offset to subtract = natural position - target position
                const offset = dragHandleWidth + checkboxWidth - targetLeft;
                return offset > 0
                  ? `translateX(max(0px, calc(var(--header-scroll-offset, 0px) - ${offset}px)))`
                  : "translateX(var(--header-scroll-offset, 0px))";
              })(),
            }}
          >
            <span className="sr-only">Expand row</span>
          </th>
        )}

        {/* Data columns - render group children if groups exist, otherwise all columns */}
        {(hasGroups ? groupChildColumns : columns).map((col, index) => {
          const key = String(col.key);
          const meta = columnMeta[key];
          const sortInfo = getSortInfo(key);
          const isSortable = col.sortable !== false;
          const pinPosition = getEffectivePinPosition(col);
          const columnsToCheck = hasGroups ? groupChildColumns : columns;
          const isLastColumn = index === columnsToCheck.length - 1;

          // Only allow reordering non-pinned columns
          const canReorder =
            reorderable && col.reorderable !== false && !pinPosition;

          return (
            <HeaderCell
              key={key}
              column={col}
              meta={meta}
              isSorted={sortInfo.isSorted}
              sortDirection={sortInfo.direction}
              sortPriority={sortInfo.priority}
              isSortable={isSortable}
              pinPosition={pinPosition}
              isLastColumn={isLastColumn}
              paddingClass={paddingClass}
              showColumnBorders={showColumnBorders}
              resizable={resizable}
              pinnable={pinnable}
              onSort={(e) => onSort(key, e.shiftKey)}
              onPin={(position) => onColumnPin?.(key, position)}
              onResize={(colKey, width) => onColumnResize?.(colKey, width)}
              onHide={() => onColumnHide?.(key)}
              onFilter={(value) => onColumnFilter?.(key, value)}
              currentFilter={columnFilters[key]}
              isLastPinnedLeft={key === lastPinnedLeftKey}
              isFirstPinnedRight={key === firstPinnedRightKey}
              dragProps={canReorder ? getDragProps(key) : undefined}
              isDragging={canReorder && isDraggingColumn(key)}
              isDropTarget={canReorder && isDropTarget(key)}
              dropPosition={canReorder ? getDropPosition(key) : null}
              groupingEnabled={groupingEnabled}
              groupBy={groupBy}
              groupByArray={groupByArray}
              onGroupBy={onGroupBy}
              onAddGroupBy={onAddGroupBy}
              reorderableRows={reorderableRows}
            />
          );
        })}
      </tr>
    </thead>
  );
}

export const DataTableHeader = memo(
  DataTableHeaderInner
) as typeof DataTableHeaderInner;
