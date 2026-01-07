"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  Column,
  BulkAction,
  PaginationState,
  FilterState,
} from "./types";
import type { UseInlineEditingReturn } from "./hooks/useInlineEditing";
import { DataTableHeader } from "./components/Header";
import { DataTablePagination } from "./components/Pagination";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { densityConfig, PAGE_SIZE_OPTIONS, CONFIG, COLUMN_WIDTHS } from "./constants";
import { useProcessedData } from "./hooks/useProcessedData";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { getNestedValue } from "./utils/getNestedValue";
import { exportCsv } from "./utils/csvExport";
import { ensureRowIds } from "./utils/ensureRowIds";
import { ActiveFiltersBar } from "./components/ActiveFiltersBar";
import { Toolbar } from "./components/Toolbar";
import { DataTableBody } from "./components/Body";
import { Table, TableContainer } from "./components/Table";
import { SummaryFooter } from "./components/SummaryFooter";
import { CustomScrollbar } from "./components/CustomScrollbar";
import {
  useSelection,
  useSorting,
  useFiltering,
  usePagination,
  useColumns,
  useTableUI,
} from "./context";

type ColumnMeta = Record<
  string,
  { width: number; left?: number; right?: number }
>;

export interface DataTableInnerProps<T extends { id: string }> {
  data: T[];
  title?: string | undefined;
  isLoading?: boolean | undefined;
  refreshing?: boolean | undefined;
  searchable?: boolean | undefined;
  onRefresh?: (() => void) | undefined;
  bulkActions?: BulkAction[] | undefined;
  renderSubComponent?: ((row: T) => ReactNode) | undefined;
  getRowCanExpand?: ((row: T) => boolean) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  totalItems?: number | undefined;
  cursorPagination?:
    | {
        nextCursor?: string | undefined;
        prevCursor?: string | undefined;
        onNext: () => void;
        onPrev: () => void;
        limit: number;
        onLimitChange: (n: number) => void;
        pageIndex?: number | undefined;
      }
    | undefined;
  disableLocalProcessing?: boolean | undefined;
  onRowClick?: ((row: T, event: React.MouseEvent) => void) | undefined;
  activeRowId?: string | undefined;
  rowClassName?: ((row: T) => string) | undefined;
  inlineEditing?: UseInlineEditingReturn<T> | undefined;
}

export function DataTableInner<T extends { id: string }>({
  data,
  title = "Data Table",
  isLoading = false,
  refreshing = false,
  searchable = true,
  onRefresh,
  bulkActions = [],
  renderSubComponent,
  getRowCanExpand,
  className = "",
  style,
  totalItems,
  cursorPagination,
  disableLocalProcessing = false,
  onRowClick,
  activeRowId,
  rowClassName,
  inlineEditing,
}: DataTableInnerProps<T>) {
  // Use context hooks
  const { selectedRows, expandedRows, selectAll, deselectAll, toggleExpand } =
    useSelection();
  const { sortKey, sortDirection, cycleSort } = useSorting();
  const {
    searchText,
    columnFilters,
    setSearch,
    setFilter,
    clearAllFilters,
    activeFiltersCount,
  } = useFiltering();
  const { pagination, setPage, setPageSize } = usePagination();
  const {
    columns,
    visibleColumns,
    hiddenColumns,
    columnWidths,
    pinState,
    toggleVisibility,
    showAllColumns,
    setColumnWidth,
    resetColumnWidths,
    setColumnPin,
    resetColumnPins,
    getEffectivePinState,
  } = useColumns();
  const { density, isMobile, config, setDensity, resetAll } = useTableUI();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableHeaderRef = useRef<HTMLDivElement>(null);
  const keyboardContainerRef = useRef<HTMLDivElement>(null);

  // Computed values
  const effectiveSelectable = config.selectable || bulkActions.length > 0;
  const effectiveColumnBorders = config.showColumnBorders;
  const effectiveZebra = config.zebra;
  const effectiveCompact = config.compact;

  // Sync pageSize from cursorPagination
  useEffect(() => {
    if (
      cursorPagination?.limit &&
      cursorPagination.limit !== pagination.pageSize
    ) {
      setPageSize(cursorPagination.limit);
    }
  }, [cursorPagination?.limit, pagination.pageSize, setPageSize]);

  // Pagination display values
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(
    pagination.page * pagination.pageSize,
    totalItems ?? 0
  );
  const effectiveStartItem = cursorPagination?.pageIndex
    ? (cursorPagination.pageIndex - 1) *
        (cursorPagination.limit ?? pagination.pageSize) +
      1
    : startItem;
  const effectiveEndItem = cursorPagination?.pageIndex
    ? Math.min(
        cursorPagination.pageIndex *
          (cursorPagination.limit ?? pagination.pageSize),
        totalItems ?? 0
      )
    : endItem;

  // Column metadata for pinning
  const columnMeta = useMemo<ColumnMeta>(() => {
    const meta: ColumnMeta = {};
    const expanderWidth = renderSubComponent ? COLUMN_WIDTHS.expander : 0;
    let leftAcc = COLUMN_WIDTHS.checkbox + expanderWidth;

    visibleColumns.forEach((col) => {
      const key = String(col.key);
      meta[key] = {
        width:
          columnWidths[key] ??
          (typeof col.width === "number" ? col.width : 150),
      };
    });

    visibleColumns.forEach((col) => {
      const key = String(col.key);
      const target = meta[key];
      if (
        getEffectivePinState({ key, pinned: col.pinned }) === "left" &&
        target
      ) {
        target.left = leftAcc;
        leftAcc += target.width;
      }
    });

    let rightAcc = 0;
    [...visibleColumns].reverse().forEach((col) => {
      const key = String(col.key);
      const target = meta[key];
      if (
        getEffectivePinState({ key, pinned: col.pinned }) === "right" &&
        target
      ) {
        target.right = rightAcc;
        rightAcc += target.width;
      }
    });

    return meta;
  }, [visibleColumns, columnWidths, renderSubComponent, getEffectivePinState]);

  // Data processing
  const rawRows = useMemo(() => {
    if (Array.isArray(data)) return data as unknown as Record<string, unknown>[];
    const d = data as unknown as Record<string, unknown> | null | undefined;
    const items = d && typeof d === "object" ? (d as Record<string, unknown>).items : undefined;
    if (Array.isArray(items)) return items as Record<string, unknown>[];
    return [] as Record<string, unknown>[];
  }, [data]);

  const safeData = useMemo(() => ensureRowIds(rawRows), [rawRows]) as T[];

  const processedData = useProcessedData<T>({
    data: Array.isArray(safeData) ? safeData : [],
    searchText,
    columnFilters,
    sortColumn: sortKey,
    sortDirection,
    columns: columns as Column<T>[],
    disableLocalProcessing,
  });

  const paginatedData = useMemo(() => {
    if (config.paginationMode === "cursor" || config.mode === "remote") {
      return processedData;
    }
    const { page, pageSize } = pagination;
    const totalPages = Math.max(
      1,
      Math.ceil(processedData.length / Math.max(pageSize, 1))
    );
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, pagination, config.paginationMode, config.mode]);

  // Summary row calculation
  const summaryRow = useMemo(() => {
    const hasSummary = columns.some((c) => c.summary);
    if (!hasSummary || processedData.length === 0) return null;

    return visibleColumns.map((col) => {
      if (!col.summary) return null;
      if (typeof col.summary === "function") {
        return col.summary(processedData as T[]);
      }

      const values = processedData.map((row) => {
        const val = getNestedValue(row, String(col.key));
        return typeof val === "number" ? val : Number(val) || 0;
      });

      if (col.summary === "count") return processedData.length;
      if (col.summary === "sum") {
        const sum = values.reduce((a, b) => a + b, 0);
        return sum.toLocaleString();
      }
      if (col.summary === "average") {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = values.length > 0 ? sum / values.length : 0;
        return avg.toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
      return null;
    });
  }, [processedData, visibleColumns, columns]);

  // Selection helpers
  const allSelected =
    processedData.length > 0 && selectedRows.size === processedData.length;
  const isIndeterminate =
    selectedRows.size > 0 && selectedRows.size < processedData.length;

  // Pinned widths for scrollbar
  const pinnedLeftWidth = useMemo(() => {
    if (isMobile) return 0;
    return visibleColumns
      .filter(
        (col) =>
          getEffectivePinState({ key: String(col.key), pinned: col.pinned }) ===
          "left"
      )
      .reduce(
        (acc, col) => {
          const key = String(col.key);
          return (
            acc +
            (columnWidths[key] ??
              (typeof col.width === "number" ? col.width : 150))
          );
        },
        COLUMN_WIDTHS.checkbox +
          (renderSubComponent ? COLUMN_WIDTHS.expander : 0)
      );
  }, [
    visibleColumns,
    columnWidths,
    renderSubComponent,
    isMobile,
    getEffectivePinState,
  ]);

  const pinnedRightWidth = useMemo(() => {
    if (isMobile) return 0;
    return visibleColumns
      .filter(
        (col) =>
          getEffectivePinState({ key: String(col.key), pinned: col.pinned }) ===
          "right"
      )
      .reduce((acc, col) => {
        const key = String(col.key);
        return (
          acc +
          (columnWidths[key] ??
            (typeof col.width === "number" ? col.width : 150))
        );
      }, 0);
  }, [visibleColumns, columnWidths, isMobile, getEffectivePinState]);

  // View customizations check
  const hasViewCustomizations = useMemo(
    () =>
      Object.keys(pinState).length > 0 || Object.keys(columnWidths).length > 0,
    [pinState, columnWidths]
  );

  // Scroll sync
  useEffect(() => {
    const headerEl = tableHeaderRef.current;
    const bodyEl = tableContainerRef.current;
    if (!headerEl || !bodyEl) return;

    const syncHeaderScroll = () => {
      if (headerEl) headerEl.scrollLeft = bodyEl.scrollLeft;
    };
    const syncBodyScroll = () => {
      if (bodyEl) bodyEl.scrollLeft = headerEl.scrollLeft;
    };

    bodyEl.addEventListener("scroll", syncHeaderScroll);
    headerEl.addEventListener("scroll", syncBodyScroll);

    return () => {
      bodyEl.removeEventListener("scroll", syncHeaderScroll);
      headerEl.removeEventListener("scroll", syncBodyScroll);
    };
  }, []);

  // Handlers
  const handleSort = useCallback(
    (key: string | keyof T) => cycleSort(String(key)),
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

  const handleExportCSV = useCallback(() => {
    exportCsv(processedData as T[], visibleColumns as Column<T>[]);
  }, [processedData, visibleColumns]);

  const handlePaginationChange = useCallback(
    (next: PaginationState) => {
      if (next.page !== pagination.page) {
        setPage(next.page);
      }
      if (next.pageSize !== pagination.pageSize) {
        setPageSize(next.pageSize);
        if (
          config.paginationMode === "cursor" &&
          cursorPagination?.onLimitChange
        ) {
          cursorPagination.onLimitChange(next.pageSize);
        }
      }
    },
    [pagination, setPage, setPageSize, config.paginationMode, cursorPagination]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      Object.entries(newFilters).forEach(([key, value]) => {
        setFilter(key, value);
      });
    },
    [setFilter]
  );

  const currentDensity = densityConfig[density];

  // Keyboard navigation
  const keyboard = useKeyboardNavigation({
    data: paginatedData as T[],
    columns: visibleColumns as Column<T>[],
    selectable: effectiveSelectable,
    fixedColumnCount: renderSubComponent ? 1 : 0,
    onSelectRow: (id, _checked) => {
      // Toggle selection on Space
      const isCurrentlySelected = selectedRows.has(id);
      handleSelectRow(id, !isCurrentlySelected);
    },
    onRowActivate: onRowClick
      ? (row) => onRowClick(row, {} as React.MouseEvent)
      : undefined,
    onSelectAll: () => handleSelectAll(!allSelected),
    onNextPage: cursorPagination?.onNext,
    onPrevPage: cursorPagination?.onPrev,
    isLoading,
  });

  // Memoize aria props to avoid eslint refs-in-render warning
  const containerAriaProps = useMemo(
    () => ({
      role: "grid" as const,
      "aria-rowcount": (paginatedData as T[]).length,
      "aria-colcount":
        (effectiveSelectable ? 1 : 0) +
        (renderSubComponent ? 1 : 0) +
        visibleColumns.length,
    }),
    [
      paginatedData,
      effectiveSelectable,
      renderSubComponent,
      visibleColumns.length,
    ]
  );

  // Extract keyboard handler to avoid eslint false positive
  const { handleKeyDown: onKeyDownHandler, containerRef } = keyboard;

  return (
    <TooltipProvider>
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={`flex flex-col bg-background rounded-none border-y outline-none ${className}`}
        style={style as CSSProperties}
        tabIndex={0}
        onKeyDown={onKeyDownHandler}
        {...containerAriaProps}
      >
        {/* Sticky header */}
        <div
          className={`sticky ${CONFIG.layout.headerOffset} ${CONFIG.layout.zIndexHeader} bg-background`}
        >
          <Toolbar
            title={title}
            searchable={searchable}
            searchText={searchText}
            onSearchChange={setSearch}
            selectedCount={selectedRows.size}
            selectedIds={Array.from(selectedRows)}
            bulkActions={bulkActions}
            onClearSelection={deselectAll}
            columnFiltersCount={Object.keys(columnFilters).length}
            columns={columns as Column<T>[]}
            hiddenColumns={hiddenColumns}
            toggleColumnVisibility={toggleVisibility}
            resetColumns={showAllColumns}
            density={density}
            setDensity={setDensity}
            onExport={handleExportCSV}
            {...(onRefresh ? { onRefresh } : {})}
            refreshing={refreshing}
            filters={columnFilters}
            onFiltersChange={handleFiltersChange}
            startItem={effectiveStartItem}
            endItem={effectiveEndItem}
            totalItems={totalItems}
            onResetPins={resetColumnPins}
            onResetWidths={resetColumnWidths}
            onResetAll={resetAll}
            hasViewCustomizations={hasViewCustomizations}
          />

          {activeFiltersCount > 0 && (
            <ActiveFiltersBar
              searchText={searchText}
              columnFilters={columnFilters}
              columns={columns as Column<T>[]}
              onClearSearch={() => setSearch("")}
              onRemoveFilter={setFilter}
              onClearAll={clearAllFilters}
            />
          )}

          {/* Table header */}
          <div
            ref={tableHeaderRef}
            className="overflow-x-auto bg-background border-b shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] no-scrollbar"
          >
            <Table>
              <DataTableHeader
                columns={visibleColumns as Column<T>[]}
                sortColumn={sortKey}
                sortDirection={sortDirection}
                filters={columnFilters}
                onSort={handleSort}
                onFilter={setFilter}
                onSelectAll={handleSelectAll}
                allSelected={allSelected}
                indeterminate={isIndeterminate}
                columnMeta={columnMeta}
                onColumnResize={setColumnWidth}
                enableExpansion={!!renderSubComponent}
                getEffectivePinState={(col) =>
                  getEffectivePinState({
                    key: String(col.key),
                    pinned: col.pinned,
                  })
                }
                onColumnPinChange={setColumnPin}
                selectable={effectiveSelectable}
                showColumnBorders={effectiveColumnBorders}
              />
            </Table>
          </div>
        </div>

        {/* Table body */}
        <TableContainer ref={tableContainerRef}>
          <Table>
            <DataTableBody
              columns={columns as Column<T>[]}
              visibleColumns={visibleColumns as Column<T>[]}
              columnMeta={columnMeta}
              density={currentDensity}
              data={paginatedData as T[]}
              isLoading={isLoading}
              renderSubComponent={renderSubComponent}
              getRowCanExpand={getRowCanExpand}
              selectedRows={selectedRows}
              expandedRows={expandedRows}
              onSelectRow={handleSelectRow}
              onToggleExpand={toggleExpand}
              getEffectivePinState={(col) =>
                getEffectivePinState({
                  key: String(col.key),
                  pinned: col.pinned,
                })
              }
              onRowClick={onRowClick}
              activeRowId={activeRowId}
              rowClassName={rowClassName}
              selectable={effectiveSelectable}
              showColumnBorders={effectiveColumnBorders}
              zebra={effectiveZebra}
              compact={effectiveCompact}
              onClearAllFilters={clearAllFilters}
              inlineEditing={inlineEditing as UseInlineEditingReturn<T> | undefined}
            />
            {!isLoading && summaryRow && (
              <SummaryFooter
                visibleColumns={visibleColumns as Column<T>[]}
                columnMeta={columnMeta}
                summaryRow={summaryRow}
                renderSubComponent={renderSubComponent}
                density={currentDensity}
                selectable={effectiveSelectable}
                getEffectivePinState={(col) =>
                  getEffectivePinState({
                    key: String(col.key),
                    pinned: col.pinned,
                  })
                }
              />
            )}
          </Table>
        </TableContainer>

        <CustomScrollbar
          className="hidden md:block"
          tableContainerRef={tableContainerRef}
          pinnedLeftWidth={pinnedLeftWidth}
          pinnedRightWidth={pinnedRightWidth}
          dependencies={[
            processedData.length,
            visibleColumns,
            columnWidths,
            density,
          ]}
        />

        <DataTablePagination
          mode={config.paginationMode}
          {...(config.paginationMode === "cursor" && cursorPagination
            ? { cursor: cursorPagination }
            : {})}
          {...(totalItems !== undefined ? { totalItems } : {})}
          currentCount={paginatedData.length}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    </TooltipProvider>
  );
}
