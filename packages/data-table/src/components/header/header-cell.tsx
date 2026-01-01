"use client";

import React from "react";
import { cn, Icon } from "@unisane/ui";
import type { Column, SortDirection, PinPosition, ColumnMetaMap, FilterValue } from "../../types";
import { ResizeHandle } from "./resize-handle";
import { ColumnMenu } from "./column-menu";

export interface HeaderCellProps<T> {
  column: Column<T>;
  meta: ColumnMetaMap[string] | undefined;
  isSorted: boolean;
  sortDirection: SortDirection;
  /** Sort priority for multi-sort (1, 2, 3...) or null if single-sort or not sorted */
  sortPriority?: number | null;
  isSortable: boolean;
  pinPosition: PinPosition;
  isLastColumn: boolean;
  paddingClass: string;
  showColumnBorders: boolean;
  resizable: boolean;
  pinnable: boolean;
  onSort: (e: React.MouseEvent) => void;
  onPin: (position: PinPosition) => void;
  onResize: (key: string, width: number) => void;
  onHide: () => void;
  onFilter?: (value: FilterValue) => void;
  currentFilter?: FilterValue;
  /** Whether this is the last pinned-left column */
  isLastPinnedLeft?: boolean;
  /** Whether this is the first pinned-right column */
  isFirstPinnedRight?: boolean;
  /** Drag props for column reordering */
  dragProps?: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Whether this column is currently being dragged */
  isDragging?: boolean;
  /** Whether this column is a drop target */
  isDropTarget?: boolean;
  /** Drop position indicator */
  dropPosition?: "before" | "after" | null;
  /** Whether grouping is enabled */
  groupingEnabled?: boolean;
  /** Current column(s) being grouped by */
  groupBy?: string | string[] | null;
  /** Normalized array of groupBy keys */
  groupByArray?: string[];
  /** Callback to set groupBy column(s) */
  onGroupBy?: (key: string | string[] | null) => void;
  /** Callback to add a column to multi-level grouping */
  onAddGroupBy?: (key: string) => void;
}

export function HeaderCell<T>({
  column,
  meta,
  isSorted,
  sortDirection,
  sortPriority,
  isSortable,
  pinPosition,
  isLastColumn,
  paddingClass,
  showColumnBorders,
  resizable,
  pinnable,
  onSort,
  onPin,
  onResize,
  onHide,
  onFilter,
  currentFilter,
  isLastPinnedLeft = false,
  isFirstPinnedRight = false,
  dragProps,
  isDragging = false,
  isDropTarget = false,
  dropPosition = null,
  groupingEnabled = false,
  groupBy,
  groupByArray = [],
  onGroupBy,
  onAddGroupBy,
}: HeaderCellProps<T>) {
  const hasFilterOptions = column.filterable !== false;
  // Grouping is only available for columns with explicit groupable: true OR columns with select filter (categorical data)
  const isGroupable = column.groupable === true || (column.groupable !== false && column.filterType === "select");
  const hasMenu =
    hasFilterOptions ||
    (pinnable && column.pinnable !== false) ||
    (column.hideable !== false) ||
    (groupingEnabled && isGroupable);

  const hasActiveFilter = currentFilter !== undefined && currentFilter !== null && currentFilter !== "";

  return (
    <th
      className={cn(
        "group bg-surface border-b border-outline-variant/50",
        "text-label-large font-medium text-on-surface-variant whitespace-nowrap",
        "transition-colors duration-snappy",
        // Relative positioning is needed for the resize handle (absolute positioned)
        "relative align-middle",
        paddingClass,
        column.align === "center" && "text-center",
        column.align === "end" && "text-right",
        column.align !== "center" && column.align !== "end" && "text-left",
        isSortable && "cursor-pointer select-none hover:bg-surface-container-low",
        // Draggable cursor when reorderable
        dragProps?.draggable && "cursor-grab active:cursor-grabbing",
        // Pinned columns: sticky with higher z-index (shadow applied via inline style)
        // Non-pinned columns get z-0 to ensure they stack below pinned columns (z-20)
        pinPosition ? "sticky z-20 isolate" : "z-0",
        // Column borders: show on non-pinned columns (except last), and on last pinned-left / first pinned-right
        showColumnBorders && !isLastColumn && !pinPosition && "border-r border-outline-variant/50",
        showColumnBorders && isLastPinnedLeft && "border-r border-outline-variant/50",
        showColumnBorders && isFirstPinnedRight && "border-l border-outline-variant/50",
        // Drag state styling
        isDragging && "opacity-50",
        isDropTarget && "bg-primary/10"
      )}
      style={{
        left: pinPosition === "left" ? meta?.left : undefined,
        right: pinPosition === "right" ? meta?.right : undefined,
        // Pinned column elevation shadow
        boxShadow: pinPosition === "left"
          ? "4px 0 6px -2px rgba(0, 0, 0, 0.1)"
          : pinPosition === "right"
          ? "-4px 0 6px -2px rgba(0, 0, 0, 0.1)"
          : undefined,
      }}
      scope="col"
      aria-sort={
        isSorted
          ? sortDirection === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
      // Use suppressHydrationWarning for draggable attribute since it changes post-hydration
      suppressHydrationWarning
      draggable={dragProps?.draggable || undefined}
      onDragStart={dragProps?.onDragStart}
      onDragEnd={dragProps?.onDragEnd}
      onDragOver={dragProps?.onDragOver}
      onDragEnter={dragProps?.onDragEnter}
      onDragLeave={dragProps?.onDragLeave}
      onDrop={dragProps?.onDrop}
    >
      {/* Main content area - text uses full width */}
      <div
        onClick={isSortable ? onSort : undefined}
        className={cn(
          "flex items-center gap-1.5 min-w-0",
          column.align === "center" && "justify-center",
          column.align === "end" && "justify-end"
        )}
      >
        {/* Header text - full width, no truncation by icons */}
        {column.headerRender ? (
          column.headerRender()
        ) : (
          <span className="truncate">{column.header}</span>
        )}

        {/* Persistent state indicators (always visible when active) */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Sort indicator - always visible when sorted */}
          {isSorted && (
            <span className="inline-flex items-center text-primary">
              <Icon
                symbol={sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                className="text-[16px]"
              />
              {sortPriority != null && sortPriority > 0 && (
                <span className="text-[10px] font-semibold leading-none min-w-[10px]">
                  {sortPriority}
                </span>
              )}
            </span>
          )}

          {/* Filter active indicator */}
          {hasActiveFilter && (
            <span className="inline-flex items-center justify-center w-[16px] h-[16px]">
              <Icon symbol="filter_alt" className="text-[14px] text-primary" />
            </span>
          )}

          {/* Pin indicator */}
          {pinPosition && (
            <span className="inline-flex items-center justify-center w-[14px] h-[14px]">
              <Icon
                symbol="push_pin"
                className={cn(
                  "text-[12px] text-primary",
                  pinPosition === "left" ? "-rotate-45" : "rotate-45"
                )}
              />
            </span>
          )}
        </div>
      </div>

      {/* Hover actions - absolute positioned on right, uses surface-container-low for subtle elevation */}
      <div
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 pl-2 pr-2",
          "bg-surface-container-low",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          "pointer-events-none group-hover:pointer-events-auto"
        )}
      >
        {/* Sort button (on hover, when sortable but not yet sorted) */}
        {isSortable && !isSorted && (
          <button
            onClick={onSort}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface transition-colors"
            aria-label="Sort column"
          >
            <Icon symbol="unfold_more" className="text-[18px]" />
          </button>
        )}

        {/* Sort button (on hover, when already sorted - to cycle sort) */}
        {isSortable && isSorted && (
          <button
            onClick={onSort}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-primary hover:bg-primary/8 transition-colors"
            aria-label={sortDirection === "asc" ? "Sort descending" : "Clear sort"}
          >
            <Icon
              symbol={sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
              className="text-[18px]"
            />
            {sortPriority != null && sortPriority > 0 && (
              <span className="text-[10px] font-semibold leading-none absolute -top-0.5 -right-0.5 bg-primary text-on-primary rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {sortPriority}
              </span>
            )}
          </button>
        )}

        {/* Column menu trigger */}
        {hasMenu && (
          <ColumnMenu
            column={column}
            pinPosition={pinPosition}
            pinnable={pinnable}
            currentFilter={currentFilter}
            hasActiveFilter={hasActiveFilter}
            onPin={onPin}
            onHide={onHide}
            onFilter={onFilter}
            groupingEnabled={groupingEnabled}
            groupBy={groupBy}
            groupByArray={groupByArray}
            onGroupBy={onGroupBy}
            onAddGroupBy={onAddGroupBy}
          />
        )}
      </div>

      {/* Resize handle */}
      {resizable && (
        <ResizeHandle
          columnKey={String(column.key)}
          currentWidth={meta?.width ?? 150}
          minWidth={column.minWidth}
          maxWidth={column.maxWidth}
          onResize={onResize}
        />
      )}

      {/* Drop position indicator */}
      {isDropTarget && dropPosition && (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 bg-primary z-30",
            dropPosition === "before" ? "left-0" : "right-0"
          )}
        />
      )}

      {/* Freeze boundary indicator - shows on last pinned-left and first pinned-right columns */}
      {isLastPinnedLeft && (
        <div
          className="absolute top-0 bottom-0 right-0 w-[3px] z-30 pointer-events-none"
          style={{
            background: "linear-gradient(to right, var(--color-primary) 0%, transparent 100%)",
            opacity: 0.4,
          }}
          aria-hidden="true"
        />
      )}
      {isFirstPinnedRight && (
        <div
          className="absolute top-0 bottom-0 left-0 w-[3px] z-30 pointer-events-none"
          style={{
            background: "linear-gradient(to left, var(--color-primary) 0%, transparent 100%)",
            opacity: 0.4,
          }}
          aria-hidden="true"
        />
      )}
    </th>
  );
}

