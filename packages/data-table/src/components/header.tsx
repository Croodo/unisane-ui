"use client";

import React, { memo, useCallback, useState } from "react";
import {
  cn,
  Icon,
  Checkbox,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@unisane/ui";
import type { Column, ColumnGroup, SortDirection, PinPosition, ColumnMetaMap, FilterValue } from "../types";
import { isColumnGroup } from "../types";
import { DENSITY_STYLES, type Density } from "../constants";

// ─── HEADER PROPS ───────────────────────────────────────────────────────────

interface DataTableHeaderProps<T> {
  /** Flattened leaf columns for rendering cells */
  columns: Column<T>[];
  /** Original column definitions (may include groups) */
  columnDefinitions?: Array<Column<T> | ColumnGroup<T>>;
  /** Whether column groups exist */
  hasGroups?: boolean;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  selectable: boolean;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  showColumnBorders: boolean;
  enableExpansion: boolean;
  density?: Density;
  // New props for column features
  resizable?: boolean;
  pinnable?: boolean;
  onColumnPin?: (key: string, position: PinPosition) => void;
  onColumnResize?: (key: string, width: number) => void;
  onColumnHide?: (key: string) => void;
  onColumnFilter?: (key: string, value: FilterValue) => void;
  columnFilters?: Record<string, FilterValue>;
  /** Tailwind class for sticky header offset */
  headerOffsetClassName?: string;
}

// ─── RESIZE HANDLE ──────────────────────────────────────────────────────────

interface ResizeHandleProps {
  columnKey: string;
  currentWidth: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (key: string, width: number) => void;
}

function ResizeHandle({ columnKey, currentWidth, minWidth = 50, maxWidth = 800, onResize }: ResizeHandleProps) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = currentWidth;

      // Set cursor and prevent text selection during resize
      const prevCursor = document.body.style.cursor;
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
        onResize(columnKey, newWidth);
      };

      const handleMouseUp = () => {
        // Restore cursor and user select
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevUserSelect;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [columnKey, currentWidth, minWidth, maxWidth, onResize]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize",
        "hover:w-3 hover:bg-primary/20 active:bg-primary/40 transition-all",
        "z-10"
      )}
      title="Drag to resize column"
      aria-hidden="true"
    />
  );
}

// ─── HEADER CELL ────────────────────────────────────────────────────────────

interface HeaderCellProps<T> {
  column: Column<T>;
  meta: ColumnMetaMap[string] | undefined;
  isSorted: boolean;
  sortDirection: SortDirection;
  isSortable: boolean;
  pinPosition: PinPosition;
  isLastColumn: boolean;
  paddingClass: string;
  showColumnBorders: boolean;
  resizable: boolean;
  pinnable: boolean;
  onSort: () => void;
  onPin: (position: PinPosition) => void;
  onResize: (key: string, width: number) => void;
  onHide: () => void;
  onFilter?: (value: FilterValue) => void;
  currentFilter?: FilterValue;
  /** Whether this is the last pinned-left column */
  isLastPinnedLeft?: boolean;
  /** Whether this is the first pinned-right column */
  isFirstPinnedRight?: boolean;
}

function HeaderCell<T>({
  column,
  meta,
  isSorted,
  sortDirection,
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
}: HeaderCellProps<T>) {
  // Local state for text filter input
  const [filterInputValue, setFilterInputValue] = useState(
    typeof currentFilter === "string" ? currentFilter : ""
  );

  const hasFilterOptions = column.filterable !== false;
  const hasMenu =
    hasFilterOptions ||
    (pinnable && column.pinnable !== false) ||
    (column.hideable !== false);

  const hasActiveFilter = currentFilter !== undefined && currentFilter !== null && currentFilter !== "";

  // Handle text filter submission
  const handleFilterSubmit = useCallback(() => {
    if (filterInputValue.trim()) {
      onFilter?.(filterInputValue.trim());
    }
  }, [filterInputValue, onFilter]);

  // Handle clearing the filter
  const handleFilterClear = useCallback(() => {
    setFilterInputValue("");
    onFilter?.(null);
  }, [onFilter]);

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
        isSortable && "cursor-pointer select-none hover:bg-on-surface/5",
        // Pinned columns: sticky with higher z-index (shadow applied via inline style)
        // Non-pinned columns get z-0 to ensure they stack below pinned columns (z-20)
        pinPosition ? "sticky z-20 isolate" : "z-0",
        // Column borders: show on non-pinned columns (except last), and on last pinned-left / first pinned-right
        showColumnBorders && !isLastColumn && !pinPosition && "border-r border-outline-variant/50",
        showColumnBorders && isLastPinnedLeft && "border-r border-outline-variant/50",
        showColumnBorders && isFirstPinnedRight && "border-l border-outline-variant/50"
      )}
      style={{
        left: pinPosition === "left" ? meta?.left : undefined,
        right: pinPosition === "right" ? meta?.right : undefined,
        // Pinned column elevation shadow
        boxShadow: pinPosition === "left"
          ? "4px 0 8px -3px rgba(0, 0, 0, 0.15)"
          : pinPosition === "right"
          ? "-4px 0 8px -3px rgba(0, 0, 0, 0.15)"
          : undefined,
      }}
      aria-sort={
        isSorted
          ? sortDirection === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <div
        className={cn(
          "flex items-center gap-1",
          column.align === "center" && "justify-center",
          column.align === "end" && "justify-end"
        )}
      >
        {/* Header text - clickable for sorting */}
        <div
          onClick={isSortable ? onSort : undefined}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          {column.headerRender ? (
            column.headerRender()
          ) : (
            <span className="truncate">{column.header}</span>
          )}

          {/* Sort indicator */}
          {isSortable && (
            <span
              className={cn(
                "inline-flex items-center justify-center shrink-0 w-[18px] h-[18px] transition-all duration-snappy",
                isSorted ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-50"
              )}
            >
              {isSorted && sortDirection === "asc" && (
                <Icon symbol="arrow_upward" className="text-[18px]" />
              )}
              {isSorted && sortDirection === "desc" && (
                <Icon symbol="arrow_downward" className="text-[18px]" />
              )}
              {!isSorted && (
                <Icon symbol="unfold_more" className="text-[18px]" />
              )}
            </span>
          )}

          {/* Filter active indicator */}
          {hasActiveFilter && (
            <span className="inline-flex items-center justify-center shrink-0 w-[16px] h-[16px]">
              <Icon symbol="filter_alt" className="text-[16px] text-primary" />
            </span>
          )}

          {/* Pin indicator */}
          {pinPosition && (
            <span className="inline-flex items-center justify-center shrink-0 w-[14px] h-[14px]">
              <Icon
                symbol="push_pin"
                className={cn(
                  "text-[14px] text-primary",
                  pinPosition === "left" ? "-rotate-45" : "rotate-45"
                )}
              />
            </span>
          )}
        </div>

        {/* Column menu trigger - wrapper div stops click from triggering sort */}
        {hasMenu && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded hover:bg-on-surface/10 transition-colors",
                    "opacity-0 group-hover:opacity-100 focus:opacity-100",
                    "outline-none shrink-0"
                  )}
                >
                  <Icon symbol="more_vert" className="text-[18px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                {/* Filter options */}
                {hasFilterOptions && (
                  <>
                    {column.filterType === "select" && column.filterOptions ? (
                      // Select filter with submenu
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                          icon={<Icon symbol="filter_alt" className="w-4 h-4" />}
                        >
                          Filter by {column.header}
                          {hasActiveFilter && (
                            <span className="ml-auto text-primary text-xs">Active</span>
                          )}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="min-w-40">
                          {column.filterOptions.map((opt) => (
                            <DropdownMenuItem
                              key={String(opt.value)}
                              onClick={() => onFilter?.(opt.value)}
                              className={currentFilter === opt.value ? "bg-primary/8 text-primary" : ""}
                            >
                              <span className="flex items-center gap-2 w-full">
                                {currentFilter === opt.value && (
                                  <Icon symbol="check" className="w-4 h-4" />
                                )}
                                <span className={currentFilter !== opt.value ? "ml-6" : ""}>
                                  {opt.label}
                                </span>
                                {opt.count !== undefined && (
                                  <span className="ml-auto text-on-surface-variant text-xs">
                                    {opt.count}
                                  </span>
                                )}
                              </span>
                            </DropdownMenuItem>
                          ))}
                          {hasActiveFilter && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onFilter?.(null)}
                                icon={<Icon symbol="close" className="w-4 h-4" />}
                              >
                                Clear filter
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ) : (
                      // Text filter with search input
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                          icon={<Icon symbol="filter_alt" className="w-4 h-4" />}
                        >
                          Filter by {column.header}
                          {hasActiveFilter && (
                            <span className="ml-auto text-primary text-xs">Active</span>
                          )}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="min-w-56 p-2">
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={filterInputValue}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterInputValue(e.target.value)}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleFilterSubmit();
                                }
                                // Stop propagation to prevent dropdown from closing
                                e.stopPropagation();
                              }}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              placeholder={`Search ${column.header}...`}
                              className={cn(
                                "w-full px-3 py-2 text-body-medium",
                                "bg-surface border border-outline-variant rounded-sm",
                                "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
                                "placeholder:text-on-surface-variant/60"
                              )}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={handleFilterSubmit}
                                disabled={!filterInputValue.trim()}
                                className={cn(
                                  "flex-1 px-3 py-1.5 text-label-medium rounded",
                                  "bg-primary text-on-primary",
                                  "hover:bg-primary/90 transition-colors",
                                  "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                              >
                                Apply
                              </button>
                              {hasActiveFilter && (
                                <button
                                  type="button"
                                  onClick={handleFilterClear}
                                  className={cn(
                                    "px-3 py-1.5 text-label-medium rounded",
                                    "bg-surface-container text-on-surface",
                                    "hover:bg-surface-container-high transition-colors"
                                  )}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    {((pinnable && column.pinnable !== false) || column.hideable !== false) && (
                      <DropdownMenuSeparator />
                    )}
                  </>
                )}

                {/* Pin options */}
                {pinnable && column.pinnable !== false && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onPin(pinPosition === "left" ? null : "left")}
                      icon={<Icon symbol="push_pin" className="w-4 h-4 -rotate-45" />}
                    >
                      {pinPosition === "left" ? "Unpin from left" : "Pin to left"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onPin(pinPosition === "right" ? null : "right")}
                      icon={<Icon symbol="push_pin" className="w-4 h-4 rotate-45" />}
                    >
                      {pinPosition === "right" ? "Unpin from right" : "Pin to right"}
                    </DropdownMenuItem>
                    {column.hideable !== false && <DropdownMenuSeparator />}
                  </>
                )}

                {/* Hide column */}
                {column.hideable !== false && (
                  <DropdownMenuItem
                    onClick={onHide}
                    icon={<Icon symbol="visibility_off" className="w-4 h-4" />}
                  >
                    Hide column
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
    </th>
  );
}

// ─── GROUP HEADER ROW ────────────────────────────────────────────────────────

interface GroupHeaderRowProps<T> {
  columnDefinitions: Array<Column<T> | ColumnGroup<T>>;
  selectable: boolean;
  enableExpansion: boolean;
  showColumnBorders: boolean;
  paddingClass: string;
  hasPinnedLeftData: boolean;
}

function GroupHeaderRow<T>({
  columnDefinitions,
  selectable,
  enableExpansion,
  showColumnBorders,
  paddingClass,
  hasPinnedLeftData,
}: GroupHeaderRowProps<T>) {

  return (
    <tr>
      {/* Checkbox placeholder */}
      {selectable && (
        <th
          className={cn(
            "bg-surface-container-low border-b border-outline-variant/50",
            "sticky left-0 z-20 isolate",
            // Only show border-r if there are no more sticky columns after this
            showColumnBorders && !enableExpansion && !hasPinnedLeftData && "border-r border-outline-variant/50"
          )}
          style={{ width: 48, minWidth: 48, maxWidth: 48 }}
          rowSpan={2}
        />
      )}

      {/* Expander placeholder */}
      {enableExpansion && (
        <th
          className={cn(
            "bg-surface-container-low border-b border-outline-variant/50",
            "sticky z-20 isolate",
            // Only show border-r if there are no pinned-left data columns after this
            showColumnBorders && !hasPinnedLeftData && "border-r border-outline-variant/50"
          )}
          style={{
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            left: selectable ? 48 : 0,
          }}
          rowSpan={2}
        />
      )}

      {/* Group headers */}
      {columnDefinitions.map((def, idx) => {
        if (isColumnGroup(def)) {
          const isLastGroup = idx === columnDefinitions.length - 1;
          return (
            <th
              key={`group-${idx}`}
              colSpan={def.children.length}
              className={cn(
                "bg-surface-container-low border-b border-outline-variant/50",
                "text-label-medium font-semibold text-on-surface-variant text-center align-middle",
                paddingClass,
                showColumnBorders && !isLastGroup && "border-r border-outline-variant/50"
              )}
            >
              {def.header}
            </th>
          );
        } else {
          // Standalone column spans both rows
          const isLastColumn = idx === columnDefinitions.length - 1;
          return (
            <th
              key={String(def.key)}
              rowSpan={2}
              className={cn(
                "bg-surface-container-low border-b border-outline-variant/50",
                "text-label-large font-medium text-on-surface-variant align-middle",
                paddingClass,
                def.align === "center" && "text-center",
                def.align === "end" && "text-right",
                showColumnBorders && !isLastColumn && "border-r border-outline-variant/50"
              )}
            >
              {def.header}
            </th>
          );
        }
      })}
    </tr>
  );
}

// ─── HEADER COMPONENT ───────────────────────────────────────────────────────

function DataTableHeaderInner<T extends { id: string }>({
  columns,
  columnDefinitions,
  hasGroups = false,
  sortKey,
  sortDirection,
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
  onColumnPin,
  onColumnResize,
  onColumnHide,
  onColumnFilter,
  columnFilters = {},
  headerOffsetClassName,
}: DataTableHeaderProps<T>) {
  const paddingClass = DENSITY_STYLES[density];

  // Get columns that are children of groups (for second row when groups exist)
  const groupChildColumns = hasGroups && columnDefinitions
    ? columnDefinitions.flatMap((def) =>
        isColumnGroup(def) ? def.children : []
      )
    : [];

  // Determine pinned column info for border logic
  const columnsToRender = hasGroups ? groupChildColumns : columns;
  const pinnedLeftColumns = columnsToRender.filter((col) => getEffectivePinPosition(col) === "left");
  const pinnedRightColumns = columnsToRender.filter((col) => getEffectivePinPosition(col) === "right");
  const hasPinnedLeftData = pinnedLeftColumns.length > 0;
  const lastPinnedLeftKey = hasPinnedLeftData ? String(pinnedLeftColumns[pinnedLeftColumns.length - 1]!.key) : null;
  const firstPinnedRightKey = pinnedRightColumns.length > 0 ? String(pinnedRightColumns[0]!.key) : null;

  return (
    <thead className={cn("sticky top-0 z-30", headerOffsetClassName)}>
      {/* Group header row (only if groups exist) */}
      {hasGroups && columnDefinitions && (
        <GroupHeaderRow
          columnDefinitions={columnDefinitions}
          selectable={selectable}
          enableExpansion={enableExpansion}
          showColumnBorders={showColumnBorders}
          paddingClass={paddingClass}
          hasPinnedLeftData={hasPinnedLeftData}
        />
      )}

      {/* Main header row (or child columns row if groups exist) */}
      <tr>
        {/* Checkbox column - only render if no groups (groups use rowSpan) */}
        {selectable && !hasGroups && (
          <th
            className={cn(
              "bg-surface border-b border-outline-variant/50",
              "sticky left-0 z-20 isolate",
              // Only show border-r if there are no more sticky columns after this
              showColumnBorders && !enableExpansion && !hasPinnedLeftData && "border-r border-outline-variant/50"
            )}
            style={{ width: 48, minWidth: 48, maxWidth: 48 }}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={allSelected}
                indeterminate={indeterminate}
                onChange={(e) => onSelectAll(e.target.checked)}
                aria-label="Select all rows"
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
              "sticky left-0 z-20 isolate",
              // Only show border-r if there are no more sticky columns after this
              showColumnBorders && !enableExpansion && !hasPinnedLeftData && "border-r border-outline-variant/50"
            )}
            style={{ width: 48, minWidth: 48, maxWidth: 48 }}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={allSelected}
                indeterminate={indeterminate}
                onChange={(e) => onSelectAll(e.target.checked)}
                aria-label="Select all rows"
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
              "sticky z-20 isolate",
              // Only show border-r if there are no pinned-left data columns after this
              showColumnBorders && !hasPinnedLeftData && "border-r border-outline-variant/50"
            )}
            style={{
              width: 40,
              minWidth: 40,
              maxWidth: 40,
              left: selectable ? 48 : 0,
            }}
          >
            <span className="sr-only">Expand row</span>
          </th>
        )}

        {/* Data columns - render group children if groups exist, otherwise all columns */}
        {(hasGroups ? groupChildColumns : columns).map((col, index) => {
          const key = String(col.key);
          const meta = columnMeta[key];
          const isSorted = sortKey === key;
          const isSortable = col.sortable !== false;
          const pinPosition = getEffectivePinPosition(col);
          const columnsToCheck = hasGroups ? groupChildColumns : columns;
          const isLastColumn = index === columnsToCheck.length - 1;

          return (
            <HeaderCell
              key={key}
              column={col}
              meta={meta}
              isSorted={isSorted}
              sortDirection={sortDirection}
              isSortable={isSortable}
              pinPosition={pinPosition}
              isLastColumn={isLastColumn}
              paddingClass={paddingClass}
              showColumnBorders={showColumnBorders}
              resizable={resizable}
              pinnable={pinnable}
              onSort={() => onSort(key)}
              onPin={(position) => onColumnPin?.(key, position)}
              onResize={(colKey, width) => onColumnResize?.(colKey, width)}
              onHide={() => onColumnHide?.(key)}
              onFilter={(value) => onColumnFilter?.(key, value)}
              currentFilter={columnFilters[key]}
              isLastPinnedLeft={key === lastPinnedLeftKey}
              isFirstPinnedRight={key === firstPinnedRightKey}
            />
          );
        })}
      </tr>
    </thead>
  );
}

export const DataTableHeader = memo(DataTableHeaderInner) as typeof DataTableHeaderInner;
