"use client";

import React, { useMemo, useRef, useCallback, useEffect, useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@unisane/ui";
import type { Column, BulkAction, InlineEditingController, RowGroup, GroupHeaderProps, CellSelectionContext } from "../types/index";
import { DataTableHeader } from "./header/index";
import { DataTableBody } from "./body";
import { DataTableFooter } from "./footer";
import { VirtualizedBody } from "./virtualized-body";
import { TableColgroup } from "./colgroup";
import { CustomScrollbar } from "./custom-scrollbar";
import {
  SyncedScrollContainer,
  StickyHeaderScrollContainer,
  HeaderTable,
  BodyTable,
} from "./layout";
import { useProcessedData } from "../hooks/data/use-processed-data";
import { useVirtualizedRows } from "../hooks/features/use-virtualized-rows";
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
import { buildGroupedData } from "../utils/grouping";
import { DENSITY_CONFIG, TIMING, type Density } from "../constants/index";
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
  const announcerRegionId = useId();
  const announcementRef = useRef<string>("");
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previous values for change detection
  const prevSortStateRef = useRef(sortState);
  const prevSelectedCountRef = useRef(selectedRows.size);
  const prevFilterCountRef = useRef(Object.keys(columnFilters).length + (searchText ? 1 : 0));

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
    const totalPages = Math.max(1, Math.ceil(processedData.length / Math.max(pageSize, 1)));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize, config.paginationMode, config.mode]);

  // Sync page state when filtering reduces data below current page
  useEffect(() => {
    if (config.paginationMode === "cursor" || config.mode === "remote") {
      return; // Skip for cursor/remote mode - server handles pagination
    }
    const totalPages = Math.max(1, Math.ceil(processedData.length / Math.max(pageSize, 1)));
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

  // Helper to get nested value for grouping
  const getNestedValue = useCallback((obj: T, path: string): unknown => {
    const keys = path.split(".");
    let value: unknown = obj;
    for (const key of keys) {
      if (value == null) return undefined;
      value = (value as Record<string, unknown>)[key];
    }
    return value;
  }, []);

  // Calculate aggregation for a set of rows
  const calculateAggregation = useCallback(
    (rows: T[], columnKey: string, aggregationType: "sum" | "average" | "count" | "min" | "max"): number | null => {
      const values = rows
        .map((row) => {
          const val = getNestedValue(row, columnKey);
          return typeof val === "number" ? val : null;
        })
        .filter((v): v is number => v !== null);

      if (values.length === 0) return null;

      switch (aggregationType) {
        case "sum":
          return values.reduce((acc, v) => acc + v, 0);
        case "average":
          return values.reduce((acc, v) => acc + v, 0) / values.length;
        case "count":
          return values.length;
        case "min":
          return Math.min(...values);
        case "max":
          return Math.max(...values);
        default:
          return null;
      }
    },
    [getNestedValue]
  );

  // Get columns with aggregations configured
  const aggregationColumns = useMemo(() => {
    return (columns as Column<T>[]).filter((col) => col.aggregation);
  }, [columns]);

  // Helper to create a group label from a value
  const formatGroupLabel = useCallback((value: unknown): string => {
    if (value == null) return "(Empty)";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  }, []);

  // Recursive function to build nested groups
  const buildNestedGroups = useCallback(
    (
      rows: T[],
      groupByKeys: string[],
      depth: number,
      parentGroupId: string | null
    ): RowGroup<T>[] => {
      if (groupByKeys.length === 0 || rows.length === 0) {
        return [];
      }

      const currentKey = groupByKeys[0]!;
      const remainingKeys = groupByKeys.slice(1);
      const isDeepestLevel = remainingKeys.length === 0;

      // Group rows by the current groupBy column value
      const groupMap = new Map<string, T[]>();
      const groupValues = new Map<string, unknown>();

      for (const row of rows) {
        const value = getNestedValue(row, currentKey);
        const valueKey = String(value ?? "__null__");

        if (!groupMap.has(valueKey)) {
          groupMap.set(valueKey, []);
          groupValues.set(valueKey, value);
        }
        groupMap.get(valueKey)!.push(row);
      }

      // Convert to array and sort alphabetically
      const groupEntries = Array.from(groupMap.entries());
      groupEntries.sort(([a], [b]) => a.localeCompare(b));

      // Build group objects
      return groupEntries.map(([valueKey, groupRows]) => {
        // Create compound group ID for nested groups
        const groupId = parentGroupId ? `${parentGroupId}::${valueKey}` : valueKey;
        const groupValue = groupValues.get(valueKey) as string | number | boolean | null;
        const groupLabel = formatGroupLabel(groupValue);

        // Calculate aggregations for columns that have aggregation configured
        const aggregations: Record<string, unknown> = {};
        for (const col of aggregationColumns) {
          const key = String(col.key);
          const result = calculateAggregation(groupRows, key, col.aggregation!);
          if (result !== null) {
            aggregations[col.header] = result;
          }
        }

        // Recursively build child groups if not at deepest level
        const childGroups = isDeepestLevel
          ? undefined
          : buildNestedGroups(groupRows, remainingKeys, depth + 1, groupId);

        return {
          type: "group" as const,
          groupId,
          groupValue,
          groupLabel,
          // Only include rows at the deepest level
          rows: isDeepestLevel ? groupRows : [],
          isExpanded: isGroupExpanded(groupId),
          aggregations,
          depth,
          groupByKey: currentKey,
          childGroups,
          parentGroupId,
        };
      });
    },
    [getNestedValue, formatGroupLabel, isGroupExpanded, aggregationColumns, calculateAggregation]
  );

  // Build grouped data structure (supports multi-level)
  const groupedRows = useMemo((): RowGroup<T>[] => {
    if (!isGrouped || groupByArray.length === 0) {
      return [];
    }

    return buildNestedGroups(paginatedData, groupByArray, 0, null);
  }, [paginatedData, groupByArray, isGrouped, buildNestedGroups]);

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
    (index: number) => {
      const row = paginatedData[index];
      if (row && onRowClick) {
        // Create a synthetic keyboard event since activation came from keyboard
        // Using KeyboardEvent is more accurate than faking a MouseEvent
        const nativeEvent = new KeyboardEvent("keydown", { key: "Enter" });
        const syntheticEvent = {
          type: "keydown",
          key: "Enter",
          target: document.activeElement,
          currentTarget: document.activeElement,
          preventDefault: () => nativeEvent.preventDefault(),
          stopPropagation: () => nativeEvent.stopPropagation(),
          nativeEvent,
          // Flag to indicate keyboard activation
          detail: 0, // 0 indicates keyboard, non-zero indicates mouse clicks
        } as unknown as React.MouseEvent;
        onRowClick(row, syntheticEvent);
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

  // ─── LIVE REGION ANNOUNCEMENTS ─────────────────────────────────────────────

  // Helper to announce changes to screen readers
  const announce = useCallback((message: string) => {
    const region = document.getElementById(announcerRegionId);
    if (region && message) {
      // Clear any pending timeout
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
      }

      // Add non-breaking space for repeated messages to force re-announcement
      const finalMessage = message === announcementRef.current
        ? `${message}\u00A0`
        : message;
      announcementRef.current = message;
      region.textContent = finalMessage;

      // Clear after delay to allow for new announcements
      announceTimeoutRef.current = setTimeout(() => {
        // Check if region still exists before modifying (component may have unmounted)
        const currentRegion = document.getElementById(announcerRegionId);
        if (currentRegion) {
          currentRegion.textContent = "";
        }
        announceTimeoutRef.current = null;
      }, TIMING.ANNOUNCEMENT_CLEAR_MS);
    }
  }, [announcerRegionId]);

  // Cleanup announcement timeout on unmount
  useEffect(() => {
    return () => {
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
        announceTimeoutRef.current = null;
      }
    };
  }, []);

  // Announce sort changes
  useEffect(() => {
    const prevSort = prevSortStateRef.current;
    prevSortStateRef.current = sortState;

    // Skip initial render
    if (prevSort === sortState) return;

    // Check if sort changed
    if (sortState.length > 0) {
      const firstSort = sortState[0];
      if (firstSort) {
        // Find column header for the sorted column
        const sortedColumn = columns.find((c) => String(c.key) === firstSort.key);
        const columnName = sortedColumn?.header ?? firstSort.key;
        const message = firstSort.direction === "asc"
          ? t("srSortedAsc", { column: columnName })
          : t("srSortedDesc", { column: columnName });
        announce(message);
      }
    } else if (prevSort.length > 0) {
      announce(t("srNotSorted"));
    }
  }, [sortState, columns, t, announce]);

  // Announce filter changes
  useEffect(() => {
    const currentFilterCount = Object.keys(columnFilters).length + (searchText ? 1 : 0);
    const prevFilterCount = prevFilterCountRef.current;
    prevFilterCountRef.current = currentFilterCount;

    // Skip initial render
    if (prevFilterCount === currentFilterCount) return;

    if (currentFilterCount > prevFilterCount) {
      announce(t("srFilterApplied", { count: currentFilterCount }));
    } else if (currentFilterCount === 0 && prevFilterCount > 0) {
      announce(t("srFilterCleared"));
    }
  }, [columnFilters, searchText, t, announce]);

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
    columns: sortedVisibleColumns,
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

  return (
    <div
      ref={dataTableRootRef}
      className={cn(
        "flex flex-col bg-surface isolate",
        className
      )}
      style={style}
      {...keyboardProps}
      onKeyDown={handleKeyDown}
    >
      {/* Screen reader status (polite) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
      {/* Screen reader announcements for state changes (assertive) */}
      <div
        id={announcerRegionId}
        role="log"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Sticky header - uses overflow:hidden + transform to avoid breaking sticky */}
      <StickyHeaderScrollContainer className="sticky top-[var(--data-table-header-offset,0px)] z-20 bg-surface">
        <HeaderTable tableWidth={totalTableWidth}>
          <TableColgroup
            columns={sortedVisibleColumns}
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
            columns={sortedVisibleColumns}
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
            aria-rowcount={totalItems ?? processedData.length}
            aria-colcount={sortedVisibleColumns.length + (effectiveSelectable ? 1 : 0) + (enableExpansion ? 1 : 0)}
            aria-label={t("srTableDescription", {
              rowCount: totalItems ?? processedData.length,
              columnCount: sortedVisibleColumns.length,
            })}
          >
            <TableColgroup
              columns={sortedVisibleColumns}
              columnMeta={columnMeta}
              selectable={effectiveSelectable}
              enableExpansion={enableExpansion}
              getEffectivePinPosition={getEffectivePinPosition}
              reorderableRows={reorderableRows && !isGrouped}
            />
            <DataTableBody
              data={paginatedData}
              columns={sortedVisibleColumns}
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
              reorderableRows={reorderableRows && !isGrouped}
              getRowDragProps={getRowDragProps}
              getDragHandleProps={getDragHandleProps}
              isDraggingRow={isDraggingRow}
              isDropTarget={isDropTarget}
              getDropPosition={getDropPosition}
            />
            <DataTableFooter
              data={processedData}
              columns={sortedVisibleColumns}
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
        dependencies={[sortedVisibleColumns, columnMeta, paginatedData.length]}
        dataTableRef={dataTableRootRef}
      />
    </div>
  );
}
