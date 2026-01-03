"use client";

import React, { useMemo, useRef, useCallback, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@unisane/ui";
import type { Column, BulkAction, InlineEditingController, GroupHeaderProps, CellSelectionContext, RowActivationEvent } from "../types/index";
import { DataTableHeader } from "./header/index";
import { DataTableBody } from "./body";
import { DataTableFooter } from "./footer";
import { VirtualizedBody } from "./virtualized-body";
import { TableColgroup } from "./colgroup";
import { CustomScrollbar } from "./custom-scrollbar";
import { StatusAnnouncer } from "./status-announcer";
import {
  SyncedScrollContainer,
  StickyHeaderScrollContainer,
  HeaderTable,
  BodyTable,
} from "./layout";
import { useProcessedData } from "../hooks/data/use-processed-data";
import { useGroupedData } from "../hooks/data/use-grouped-data";
import { useVirtualizedRows } from "../hooks/features/use-virtualized-rows";
import { useVirtualizedColumns } from "../hooks/features/use-virtualized-columns";
import { useKeyboardNavigation } from "../hooks/ui/use-keyboard-navigation";
import { useDensityScale } from "../hooks/ui/use-density-scale";
import { useRowDrag } from "../hooks/ui/use-row-drag";
import { useColumnLayout } from "../hooks/ui/use-column-layout";
import { useAnnouncements } from "../hooks/ui/use-announcements";
import {
  useSelection,
  useSorting,
  useFiltering,
  usePagination,
  useColumns,
  useTableUI,
  useGrouping,
} from "../context";
import { ensureRowIds } from "../utils/ensure-row-ids";
import { getTotalPages, clampPage } from "../utils/pagination";
import { DENSITY_CONFIG, type Density } from "../constants/index";
import { useI18n } from "../i18n";

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
  onRowClick?: (row: T, activation: RowActivationEvent) => void;
  /** Callback when row is right-clicked (context menu) */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  onRowHover?: (row: T | null) => void;
  activeRowId?: string;
  density?: Density;
  virtualize?: boolean;
  virtualizeThreshold?: number;
  /** Enable column virtualization for wide tables */
  virtualizeColumns?: boolean;
  /** Column count threshold before column virtualization kicks in */
  virtualizeColumnsThreshold?: number;
  emptyMessage?: string;
  emptyIcon?: string;
  /** Inline editing controller from useInlineEditing hook */
  inlineEditing?: InlineEditingController<T>;
  /** Estimated row height for virtualization (overrides density-based height) */
  estimateRowHeight?: number;
  /** Custom renderer for group headers */
  renderGroupHeader?: (props: GroupHeaderProps<T>) => ReactNode;
  /** Cell selection: whether cell selection is enabled */
  cellSelectionEnabled?: boolean;
  /** Cell selection: get cell selection context for a specific cell */
  getCellSelectionContext?: (rowId: string, columnKey: string) => CellSelectionContext;
  /** Cell selection: handle cell click */
  onCellClick?: (rowId: string, columnKey: string, event: React.MouseEvent) => void;
  /** Cell selection: handle keyboard navigation */
  onCellKeyDown?: (event: React.KeyboardEvent) => void;
  /** Row reordering: whether drag-to-reorder is enabled */
  reorderableRows?: boolean;
  /** Row reordering: callback when row order changes */
  onRowReorder?: (fromIndex: number, toIndex: number, newOrder: string[]) => void;
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
  virtualizeColumns = false,
  virtualizeColumnsThreshold = 20,
  emptyMessage,
  emptyIcon,
  inlineEditing,
  estimateRowHeight,
  renderGroupHeader,
  cellSelectionEnabled = false,
  getCellSelectionContext,
  onCellClick,
  onCellKeyDown,
  reorderableRows = false,
  onRowReorder,
}: DataTableInnerProps<T>) {
  // Context hooks
  const { selectedRows, expandedRows, selectAll, deselectAll, toggleSelect, toggleExpand } =
    useSelection();
  const { sortState, cycleSort } = useSorting();
  const { searchText, columnFilters, setFilter } = useFiltering();
  const { page, pageSize, setPage } = usePagination();
  const {
    columns,
    visibleColumns,
    columnWidths,
    getEffectivePinPosition,
    setColumnPin,
    setColumnWidth,
    hideColumn,
    reorderColumn,
    reorderable,
    observeContainer,
  } = useColumns<T>();
  const { config } = useTableUI();
  const { groupBy, groupByArray, setGroupBy, isGrouped, isMultiLevel, toggleGroupExpand, isGroupExpanded, addGroupBy } = useGrouping();
  const { t, formatNumber } = useI18n();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dataTableRootRef = useRef<HTMLDivElement>(null);

  // Observe container for accurate responsive width detection
  useEffect(() => {
    return observeContainer(tableContainerRef);
  }, [observeContainer]);

  // ─── SCREEN READER ANNOUNCEMENTS ─────────────────────────────────────────────
  // Use extracted hook for announcements (handles sort/filter changes automatically)
  const { announcerRegionId } = useAnnouncements({
    sortState,
    columns: columns as Column<T>[],
    columnFilters,
    searchText,
    selectedCount: selectedRows.size,
  });

  // Computed values
  const effectiveSelectable = config.rowSelectionEnabled || bulkActions.length > 0;
  const effectiveColumnBorders = config.showColumnDividers;
  const effectiveZebra = config.zebra;
  const enableExpansion = !!renderExpandedRow;

  // ─── COLUMN LAYOUT ──────────────────────────────────────────────────────────
  // Use extracted hook for all pin-related calculations (eliminates duplication)
  const {
    sortedVisibleColumns,
    columnMeta,
    totalTableWidth,
    pinnedLeftWidth,
    pinnedRightWidth,
  } = useColumnLayout({
    visibleColumns: visibleColumns as Column<T>[],
    columnWidths,
    getEffectivePinPosition,
    selectable: effectiveSelectable,
    enableExpansion,
    reorderableRows,
    isGrouped,
  });

  // ─── COLUMN VIRTUALIZATION ─────────────────────────────────────────────────
  // Helper to get pin position by column key (for virtualized columns hook)
  const getEffectivePinPositionByKey = useCallback(
    (columnKey: string) => getEffectivePinPosition({ key: columnKey } as Column<T>),
    [getEffectivePinPosition]
  );

  const {
    virtualColumns,
    scrollableColumns,
    isVirtualized: isColumnVirtualized,
    leftPadding: columnLeftPadding,
    rightPadding: columnRightPadding,
    onScroll: onColumnScroll,
    getScrollableContainerStyle,
  } = useVirtualizedColumns({
    columns: sortedVisibleColumns,
    columnMeta,
    getEffectivePinPosition: getEffectivePinPositionByKey,
    scrollContainerRef: tableContainerRef,
    enabled: virtualizeColumns,
    threshold: virtualizeColumnsThreshold,
  });

  // Use virtualized columns when enabled, otherwise use all columns
  const effectiveColumns = isColumnVirtualized ? virtualColumns.map(vc => vc.column) : sortedVisibleColumns;

  // ─── DATA PROCESSING ──────────────────────────────────────────────────────

  // ensureRowIds returns T[] when T already extends { id: string }
  const safeData = useMemo(() => ensureRowIds(data), [data]);

  const processedData = useProcessedData<T>({
    data: safeData,
    searchText,
    columnFilters,
    sortState,
    columns: columns as Column<T>[],
    disableLocalProcessing,
  });

  const paginatedData = useMemo(() => {
    // Defensive check - processedData should always be an array
    if (!processedData) {
      return [];
    }
    if (config.paginationMode === "cursor" || config.mode === "remote") {
      return processedData;
    }
    const totalPages = getTotalPages(processedData.length, pageSize);
    const safePage = clampPage(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize, config.paginationMode, config.mode]);

  // Sync page state when filtering reduces data below current page
  useEffect(() => {
    if (config.paginationMode === "cursor" || config.mode === "remote") {
      return; // Skip for cursor/remote mode - server handles pagination
    }
    const totalPages = getTotalPages(processedData.length, pageSize);
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [processedData.length, pageSize, page, setPage, config.paginationMode, config.mode]);

  // ─── ROW DRAG-TO-REORDER ─────────────────────────────────────────────────────

  const handleRowReorder = useCallback(
    (fromIndex: number, toIndex: number, newOrder: string[]) => {
      onRowReorder?.(fromIndex, toIndex, newOrder);
    },
    [onRowReorder]
  );

  const {
    getRowDragProps,
    getDragHandleProps,
    isDraggingRow,
    isDropTarget,
    getDropPosition,
  } = useRowDrag({
    enabled: reorderableRows && !isGrouped, // Disable when grouped
    data: paginatedData,
    onReorder: handleRowReorder,
  });

  // ─── ROW GROUPING ───────────────────────────────────────────────────────────
  // Use extracted hook for memoized grouping (eliminates duplication with utils/grouping.ts)

  const { groupedData: groupedRows } = useGroupedData({
    data: paginatedData,
    groupByKeys: groupByArray,
    isGroupExpanded,
    columns: columns as Column<T>[],
    enabled: isGrouped,
  });

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
    (key: string, addToMultiSort?: boolean) => cycleSort(key, addToMultiSort),
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

  const handleSelectGroup = useCallback(
    (rowIds: string[], selected: boolean) => {
      if (selected) {
        // Add all group rows to selection
        const next = new Set(selectedRows);
        rowIds.forEach((id) => next.add(id));
        selectAll(Array.from(next));
      } else {
        // Remove all group rows from selection
        const next = new Set(selectedRows);
        rowIds.forEach((id) => next.delete(id));
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
    (index: number, event: React.KeyboardEvent) => {
      const row = paginatedData[index];
      if (row && onRowClick) {
        // Pass the actual keyboard event with proper discriminated union type
        onRowClick(row, { source: "keyboard", event });
      }
    },
    [paginatedData, onRowClick]
  );

  // Generate row DOM ID based on row data ID for proper ARIA linking
  const getRowDomId = useCallback(
    (index: number) => {
      const row = paginatedData[index];
      return row ? `data-table-row-${row.id}` : `data-table-row-${index}`;
    },
    [paginatedData]
  );

  const { focusedIndex, getContainerProps } = useKeyboardNavigation({
    rowCount: paginatedData.length,
    onSelect: effectiveSelectable ? handleKeyboardSelect : undefined,
    onActivate: onRowClick ? handleKeyboardActivate : undefined,
    enabled: !isLoading && paginatedData.length > 0,
    containerRef: tableContainerRef,
    getRowId: getRowDomId,
  });

  // ─── STATUS ANNOUNCEMENTS ─────────────────────────────────────────────────

  const statusMessage = useMemo(() => {
    if (isLoading) return t("loading");
    if (paginatedData.length === 0) return t("noResults");
    const selectedCount = selectedRows.size;
    const rangeInfo = t("rangeOfTotal", {
      start: formatNumber(1),
      end: formatNumber(paginatedData.length),
      total: formatNumber(processedData.length),
    });
    if (selectedCount > 0) {
      return `${t("selectedCount", { count: selectedCount })}. ${rangeInfo}`;
    }
    return rangeInfo;
  }, [isLoading, paginatedData.length, processedData.length, selectedRows.size, t, formatNumber]);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const keyboardProps = getContainerProps();

  // Combine keyboard handlers for row navigation and cell selection
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Cell selection keyboard handling takes priority if enabled
      if (cellSelectionEnabled && onCellKeyDown) {
        onCellKeyDown(event);
        if (event.defaultPrevented) return;
      }
      // Fall through to default keyboard navigation
      keyboardProps.onKeyDown?.(event);
    },
    [cellSelectionEnabled, onCellKeyDown, keyboardProps]
  );

  // Common header props for both virtualized and non-virtualized modes
  const headerProps = {
    columns: effectiveColumns,
    columnDefinitions: config.columnDefinitions,
    hasGroups: config.hasGroups,
    sortState,
    onSort: handleSort,
    columnMeta,
    getEffectivePinPosition,
    selectable: effectiveSelectable,
    allSelected,
    indeterminate: isIndeterminate,
    onSelectAll: handleSelectAll,
    showColumnBorders: effectiveColumnBorders,
    enableExpansion,
    density,
    resizable: config.resizable,
    pinnable: config.pinnable,
    reorderable,
    onColumnPin: setColumnPin,
    onColumnResize: setColumnWidth,
    onColumnHide: hideColumn,
    onColumnFilter: setFilter,
    onColumnReorder: reorderColumn,
    columnFilters,
    groupingEnabled: config.groupingEnabled,
    groupBy,
    groupByArray,
    onGroupBy: setGroupBy,
    onAddGroupBy: addGroupBy,
    reorderableRows: reorderableRows && !isGrouped,
  };

  // Extract keyboard props but override role for proper semantics
  const { role: _keyboardRole, ...restKeyboardProps } = keyboardProps;

  return (
    <div
      ref={dataTableRootRef}
      {...restKeyboardProps}
      role="region"
      aria-label={t("srTableDescription", {
        rowCount: totalItems ?? processedData.length,
        columnCount: effectiveColumns.length,
      })}
      aria-busy={isLoading}
      className={cn(
        "flex flex-col bg-surface isolate",
        className
      )}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Screen reader status and announcements */}
      <StatusAnnouncer
        statusMessage={statusMessage}
        announcerRegionId={announcerRegionId}
      />

      {/* Sticky header - uses overflow:hidden + transform to avoid breaking sticky */}
      {/* Shadow is applied dynamically by StickyHeaderScrollContainer when header becomes stuck */}
      <StickyHeaderScrollContainer className="sticky top-[var(--data-table-header-offset,0px)] z-20 bg-surface">
        <HeaderTable
          tableWidth={totalTableWidth}
          style={isColumnVirtualized ? getScrollableContainerStyle() : undefined}
        >
          <TableColgroup
            columns={effectiveColumns}
            columnMeta={columnMeta}
            selectable={effectiveSelectable}
            enableExpansion={enableExpansion}
            getEffectivePinPosition={getEffectivePinPosition}
            reorderableRows={reorderableRows && !isGrouped}
          />
          <DataTableHeader {...headerProps} />
        </HeaderTable>
      </StickyHeaderScrollContainer>

      {/* Scrollable body zone - synced horizontal scroll with header */}
      <SyncedScrollContainer scrollId="body" ref={tableContainerRef}>
        {isVirtualized ? (
          <VirtualizedBody
            virtualContainerRef={virtualContainerRef}
            isLoading={isLoading}
            isEmpty={paginatedData.length === 0}
            emptyMessage={emptyMessage}
            emptyIcon={emptyIcon}
            getInnerContainerStyle={getInnerContainerStyle}
            virtualRows={virtualRows}
            columns={effectiveColumns}
            columnDefinitions={config.columnDefinitions}
            hasGroups={config.hasGroups}
            columnMeta={columnMeta}
            getEffectivePinPosition={getEffectivePinPosition}
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
            sortState={sortState}
            onSort={handleSort}
            allSelected={allSelected}
            indeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
            resizable={config.resizable}
            pinnable={config.pinnable}
            reorderable={reorderable}
            onColumnPin={setColumnPin}
            onColumnResize={setColumnWidth}
            onColumnHide={hideColumn}
            onColumnFilter={setFilter}
            onColumnReorder={reorderColumn}
            columnFilters={columnFilters}
            tableWidth={totalTableWidth}
            hideHeader={true}
          />
        ) : (
          <BodyTable
            tableWidth={totalTableWidth}
            style={isColumnVirtualized ? getScrollableContainerStyle() : undefined}
            aria-rowcount={totalItems ?? processedData.length}
            aria-colcount={effectiveColumns.length + (effectiveSelectable ? 1 : 0) + (enableExpansion ? 1 : 0)}
            aria-label={t("srTableDescription", {
              rowCount: totalItems ?? processedData.length,
              columnCount: effectiveColumns.length,
            })}
          >
            <TableColgroup
              columns={effectiveColumns}
              columnMeta={columnMeta}
              selectable={effectiveSelectable}
              enableExpansion={enableExpansion}
              getEffectivePinPosition={getEffectivePinPosition}
              reorderableRows={reorderableRows && !isGrouped}
            />
            <DataTableBody
              data={paginatedData}
              columns={effectiveColumns}
              columnMeta={columnMeta}
              getEffectivePinPosition={getEffectivePinPosition}
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
              isGrouped={isGrouped}
              groupedRows={groupedRows}
              onToggleGroupExpand={toggleGroupExpand}
              renderGroupHeader={renderGroupHeader}
              onSelectGroup={handleSelectGroup}
              cellSelectionEnabled={cellSelectionEnabled}
              getCellSelectionContext={getCellSelectionContext}
              onCellClick={onCellClick}
              onCellKeyDown={onCellKeyDown}
              reorderableRows={reorderableRows && !isGrouped}
              getRowDragProps={getRowDragProps}
              getDragHandleProps={getDragHandleProps}
              isDraggingRow={isDraggingRow}
              isDropTarget={isDropTarget}
              getDropPosition={getDropPosition}
            />
            <DataTableFooter
              data={processedData}
              columns={effectiveColumns}
              columnMeta={columnMeta}
              getEffectivePinPosition={getEffectivePinPosition}
              selectable={effectiveSelectable}
              enableExpansion={enableExpansion}
              showColumnBorders={effectiveColumnBorders}
              density={density}
              showSummary={config.showSummary}
              summaryLabel={config.summaryLabel}
              reorderableRows={reorderableRows && !isGrouped}
            />
          </BodyTable>
        )}
      </SyncedScrollContainer>

      {/* Custom scrollbar that respects pinned columns */}
      <CustomScrollbar
        tableContainerRef={tableContainerRef}
        pinnedLeftWidth={pinnedLeftWidth}
        pinnedRightWidth={pinnedRightWidth}
        dependencies={[effectiveColumns, columnMeta, paginatedData.length]}
        dataTableRef={dataTableRootRef}
      />
    </div>
  );
}
