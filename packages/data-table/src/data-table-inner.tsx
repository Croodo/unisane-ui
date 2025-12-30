"use client";

import React, { useMemo, useRef, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@unisane/ui";
import type { Column, BulkAction, ColumnMetaMap, PinPosition, InlineEditingController } from "./types";
import { DataTableHeader } from "./components/header";
import { DataTableBody } from "./components/body";
import { VirtualizedBody } from "./components/virtualized-body";
import { Table, TableContainer } from "./components/table";
import { TableColgroup } from "./components/colgroup";
import { useProcessedData } from "./hooks/use-processed-data";
import { useVirtualizedRows } from "./hooks/use-virtualized-rows";
import { useKeyboardNavigation } from "./hooks/use-keyboard-navigation";
import { useDensityScale } from "./hooks/use-density-scale";
import {
  useSelection,
  useSorting,
  useFiltering,
  usePagination,
  useColumns,
  useTableUI,
} from "./context";
import { ensureRowIds } from "./utils/ensure-row-ids";
import { DENSITY_CONFIG, COLUMN_WIDTHS, type Density } from "./constants";

// ─── INNER PROPS ───────────────────────────────────────────────────────────

export interface DataTableInnerProps<T extends { id: string }> {
  data: T[];
  isLoading?: boolean;
  bulkActions?: BulkAction[];
  renderExpandedRow?: (row: T) => ReactNode;
  getRowCanExpand?: (row: T) => boolean;
  className?: string;
  style?: CSSProperties;
  totalItems?: number;
  disableLocalProcessing?: boolean;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  /** Callback when row is right-clicked (context menu) */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  onRowHover?: (row: T | null) => void;
  activeRowId?: string;
  density?: Density;
  virtualize?: boolean;
  virtualizeThreshold?: number;
  emptyMessage?: string;
  emptyIcon?: string;
  /** Inline editing controller from useInlineEditing hook */
  inlineEditing?: InlineEditingController<T>;
  /** Tailwind class for sticky header offset */
  headerOffsetClassName?: string;
  /** Estimated row height for virtualization (overrides density-based height) */
  estimateRowHeight?: number;
}

// ─── INNER COMPONENT ───────────────────────────────────────────────────────

export function DataTableInner<T extends { id: string }>({
  data,
  isLoading = false,
  bulkActions = [],
  renderExpandedRow,
  getRowCanExpand,
  className = "",
  style,
  totalItems,
  disableLocalProcessing = false,
  onRowClick,
  onRowContextMenu,
  onRowHover,
  activeRowId,
  density = "standard",
  virtualize = true,
  virtualizeThreshold = 50,
  emptyMessage,
  emptyIcon,
  inlineEditing,
  headerOffsetClassName,
  estimateRowHeight,
}: DataTableInnerProps<T>) {
  // Context hooks
  const { selectedRows, expandedRows, selectAll, deselectAll, toggleSelect, toggleExpand } =
    useSelection();
  const { sortKey, sortDirection, cycleSort } = useSorting();
  const { searchText, columnFilters, setFilter } = useFiltering();
  const { page, pageSize } = usePagination();
  const {
    columns,
    visibleColumns,
    columnWidths,
    getEffectivePinPosition,
    setColumnPin,
    setColumnWidth,
    hideColumn,
  } = useColumns<T>();
  const { config } = useTableUI();

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Computed values
  const effectiveSelectable = config.selectable || bulkActions.length > 0;
  const effectiveColumnBorders = config.columnBorders;
  const effectiveZebra = config.zebra;
  const enableExpansion = !!renderExpandedRow;

  // ─── SORTED COLUMNS (pinned-left → unpinned → pinned-right) ────────────────
  // This ensures pinned columns are rendered in correct DOM order for sticky positioning
  const sortedVisibleColumns = useMemo(() => {
    const pinnedLeft: Column<T>[] = [];
    const unpinned: Column<T>[] = [];
    const pinnedRight: Column<T>[] = [];

    (visibleColumns as Column<T>[]).forEach((col) => {
      const pin = getEffectivePinPosition(col);
      if (pin === "left") pinnedLeft.push(col);
      else if (pin === "right") pinnedRight.push(col);
      else unpinned.push(col);
    });

    return [...pinnedLeft, ...unpinned, ...pinnedRight];
  }, [visibleColumns, getEffectivePinPosition]);

  // ─── COLUMN METADATA ──────────────────────────────────────────────────────

  const columnMeta = useMemo<ColumnMetaMap>(() => {
    const meta: ColumnMetaMap = {};
    const expanderWidth = enableExpansion ? COLUMN_WIDTHS.expander : 0;
    let leftAcc = (effectiveSelectable ? COLUMN_WIDTHS.checkbox : 0) + expanderWidth;

    // Initialize all column widths (use sorted columns for consistency)
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
  }, [sortedVisibleColumns, columnWidths, enableExpansion, getEffectivePinPosition, effectiveSelectable]);

  // Calculate total table width for consistent header/body alignment
  const totalTableWidth = useMemo(() => {
    const checkboxWidth = effectiveSelectable ? COLUMN_WIDTHS.checkbox : 0;
    const expanderWidth = enableExpansion ? COLUMN_WIDTHS.expander : 0;
    const columnsWidth = sortedVisibleColumns.reduce((acc, col) => {
      const key = String(col.key);
      const width = columnMeta[key]?.width ?? (typeof col.width === "number" ? col.width : 150);
      return acc + width;
    }, 0);
    return checkboxWidth + expanderWidth + columnsWidth;
  }, [effectiveSelectable, enableExpansion, sortedVisibleColumns, columnMeta]);

  // ─── DATA PROCESSING ──────────────────────────────────────────────────────

  const safeData = useMemo(() => ensureRowIds(data), [data]) as T[];

  const processedData = useProcessedData<T>({
    data: safeData,
    searchText,
    columnFilters,
    sortKey,
    sortDirection,
    columns: columns as Column<T>[],
    disableLocalProcessing,
  });

  const paginatedData = useMemo(() => {
    if (config.paginationMode === "cursor" || config.mode === "remote") {
      return processedData;
    }
    const totalPages = Math.max(1, Math.ceil(processedData.length / Math.max(pageSize, 1)));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize, config.paginationMode, config.mode]);

  // ─── VIRTUALIZATION ───────────────────────────────────────────────────────

  // Get the global theme density scale factor (0.75 - 1.1)
  const densityScale = useDensityScale();

  // Use custom estimateRowHeight if provided, otherwise use density-based height
  // Scale by the global theme density factor for proper virtualization
  const baseRowHeight = estimateRowHeight ?? DENSITY_CONFIG[density].rowHeight;
  const rowHeight = Math.round(baseRowHeight * densityScale);

  const {
    containerRef: virtualContainerRef,
    virtualRows,
    isVirtualized,
    getInnerContainerStyle,
    getRowStyle,
  } = useVirtualizedRows({
    data: paginatedData,
    estimateRowHeight: rowHeight,
    enabled: virtualize,
    threshold: virtualizeThreshold,
  });

  // ─── SELECTION HELPERS ────────────────────────────────────────────────────

  const allSelected =
    processedData.length > 0 && selectedRows.size === processedData.length;
  const isIndeterminate =
    selectedRows.size > 0 && selectedRows.size < processedData.length;

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const handleSort = useCallback(
    (key: string) => cycleSort(key),
    [cycleSort]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        selectAll(processedData.map((item) => item.id));
      } else {
        deselectAll();
      }
    },
    [processedData, selectAll, deselectAll]
  );

  const handleSelectRow = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        selectAll([...Array.from(selectedRows), id]);
      } else {
        const next = new Set(selectedRows);
        next.delete(id);
        selectAll(Array.from(next));
      }
    },
    [selectedRows, selectAll]
  );

  // ─── KEYBOARD NAVIGATION ─────────────────────────────────────────────────

  const handleKeyboardSelect = useCallback(
    (index: number) => {
      const row = paginatedData[index];
      if (row && effectiveSelectable) {
        toggleSelect(row.id);
      }
    },
    [paginatedData, effectiveSelectable, toggleSelect]
  );

  const handleKeyboardActivate = useCallback(
    (index: number) => {
      const row = paginatedData[index];
      if (row && onRowClick) {
        // Create a synthetic mouse event for consistency
        const syntheticEvent = new MouseEvent("click") as unknown as React.MouseEvent;
        onRowClick(row, syntheticEvent);
      }
    },
    [paginatedData, onRowClick]
  );

  const { focusedIndex, getContainerProps, isFocused } = useKeyboardNavigation({
    rowCount: paginatedData.length,
    onSelect: effectiveSelectable ? handleKeyboardSelect : undefined,
    onActivate: onRowClick ? handleKeyboardActivate : undefined,
    enabled: !isLoading && paginatedData.length > 0,
    containerRef: tableContainerRef,
  });

  // ─── STATUS ANNOUNCEMENTS ─────────────────────────────────────────────────

  const statusMessage = useMemo(() => {
    if (isLoading) return "Loading data...";
    if (paginatedData.length === 0) return "No results found";
    const selectedCount = selectedRows.size;
    if (selectedCount > 0) {
      return `${selectedCount} row${selectedCount === 1 ? "" : "s"} selected. Showing ${paginatedData.length} of ${processedData.length} rows.`;
    }
    return `Showing ${paginatedData.length} of ${processedData.length} rows.`;
  }, [isLoading, paginatedData.length, processedData.length, selectedRows.size]);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const keyboardProps = getContainerProps();

  return (
    <div
      className={cn(
        "flex flex-col bg-surface isolate",
        isFocused && "ring-2 ring-primary/20",
        className
      )}
      style={style}
      {...keyboardProps}
    >
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
      {/* Single table container with synchronized header/body */}
      <TableContainer ref={tableContainerRef}>
        {isVirtualized ? (
          <VirtualizedBody
            virtualContainerRef={virtualContainerRef}
            isLoading={isLoading}
            isEmpty={paginatedData.length === 0}
            emptyMessage={emptyMessage}
            emptyIcon={emptyIcon}
            getInnerContainerStyle={getInnerContainerStyle}
            virtualRows={virtualRows}
            columns={sortedVisibleColumns}
            columnDefinitions={config.columnDefinitions}
            hasGroups={config.hasGroups}
            columnMeta={columnMeta}
            getEffectivePinPosition={getEffectivePinPosition as (col: Column<T>) => PinPosition}
            selectedRows={selectedRows}
            expandedRows={expandedRows}
            activeRowId={activeRowId}
            focusedIndex={focusedIndex}
            selectable={effectiveSelectable}
            showColumnBorders={effectiveColumnBorders}
            zebra={effectiveZebra}
            enableExpansion={enableExpansion}
            getRowCanExpand={getRowCanExpand}
            renderExpandedRow={renderExpandedRow}
            onSelect={handleSelectRow}
            onToggleExpand={toggleExpand}
            onRowClick={onRowClick}
            onRowContextMenu={onRowContextMenu}
            onRowHover={onRowHover}
            density={density}
            getRowStyle={getRowStyle}
            inlineEditing={inlineEditing}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            allSelected={allSelected}
            indeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
            resizable={config.resizable}
            pinnable={config.pinnable}
            onColumnPin={setColumnPin}
            onColumnResize={setColumnWidth}
            onColumnHide={hideColumn}
            onColumnFilter={setFilter}
            columnFilters={columnFilters}
            headerOffsetClassName={headerOffsetClassName}
            tableWidth={totalTableWidth}
          />
        ) : (
          <Table style={{ minWidth: `${totalTableWidth}px` }}>
            <TableColgroup
              columns={sortedVisibleColumns}
              columnMeta={columnMeta}
              selectable={effectiveSelectable}
              enableExpansion={enableExpansion}
              getEffectivePinPosition={getEffectivePinPosition as (col: Column<T>) => PinPosition}
            />
            <DataTableHeader
              columns={sortedVisibleColumns}
              columnDefinitions={config.columnDefinitions}
              hasGroups={config.hasGroups}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              columnMeta={columnMeta}
              getEffectivePinPosition={getEffectivePinPosition as (col: Column<T>) => PinPosition}
              selectable={effectiveSelectable}
              allSelected={allSelected}
              indeterminate={isIndeterminate}
              onSelectAll={handleSelectAll}
              showColumnBorders={effectiveColumnBorders}
              enableExpansion={enableExpansion}
              density={density}
              resizable={config.resizable}
              pinnable={config.pinnable}
              onColumnPin={setColumnPin}
              onColumnResize={setColumnWidth}
              onColumnHide={hideColumn}
              onColumnFilter={setFilter}
              columnFilters={columnFilters}
              headerOffsetClassName={headerOffsetClassName}
            />
            <DataTableBody
              data={paginatedData}
              columns={sortedVisibleColumns}
              columnMeta={columnMeta}
              getEffectivePinPosition={getEffectivePinPosition as (col: Column<T>) => PinPosition}
              selectedRows={selectedRows}
              expandedRows={expandedRows}
              isLoading={isLoading}
              selectable={effectiveSelectable}
              showColumnBorders={effectiveColumnBorders}
              zebra={effectiveZebra}
              enableExpansion={enableExpansion}
              density={density}
              onSelect={handleSelectRow}
              onToggleExpand={toggleExpand}
              onRowClick={onRowClick}
              onRowContextMenu={onRowContextMenu}
              onRowHover={onRowHover}
              renderExpandedRow={renderExpandedRow}
              getRowCanExpand={getRowCanExpand}
              activeRowId={activeRowId}
              emptyMessage={emptyMessage}
              emptyIcon={emptyIcon}
              focusedIndex={focusedIndex}
              inlineEditing={inlineEditing}
            />
          </Table>
        )}
      </TableContainer>
    </div>
  );
}
