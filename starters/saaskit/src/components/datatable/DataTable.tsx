"use client";

import React from "react";
import type { DataTableProps } from "./types";
import { DataTableProvider } from "./context/DataTableProvider";
import { DataTableInner } from "./DataTableInner";

/**
 * DataTable - Feature-rich data table component
 *
 * Architecture:
 * - DataTable: Slim wrapper that connects props to context
 * - DataTableProvider: Manages all state (selection, sorting, filtering, etc.)
 * - DataTableInner: Renders the actual table UI using context hooks
 *
 * Features:
 * - Sorting, filtering, pagination (offset & cursor)
 * - Column pinning, resizing, visibility toggle
 * - Row selection with bulk actions
 * - Row expansion with sub-components
 * - Keyboard navigation & accessibility
 * - Export to CSV
 * - Persistent settings via localStorage
 */
export const DataTable = <T extends { id: string }>({
  data,
  columns,
  title = "Data Table",
  isLoading = false,
  refreshing = false,
  searchable = true,
  onRefresh,
  bulkActions = [],
  renderSubComponent,
  getRowCanExpand,
  tableId,
  className = "",
  style,
  mode = "local",
  paginationMode = "page",
  variant = "list",
  selectable,
  showColumnBorders,
  zebra = false,
  compact,
  totalItems,
  cursorPagination,
  controlledSort,
  onSortChange,
  controlledFilters,
  onFiltersChange,
  searchValue,
  onSearchChange,
  disableLocalProcessing = false,
  columnPinState,
  onColumnPinChange,
  onRowClick,
  activeRowId,
  rowClassName,
  inlineEditing,
}: DataTableProps<T>) => {
  // Compute effective variant settings
  const effectiveSelectable =
    selectable ?? (variant === "grid" || bulkActions.length > 0);
  const effectiveColumnBorders = showColumnBorders ?? variant !== "log";
  const effectiveCompact = compact ?? variant === "log";

  // Convert controlledSort key to string for provider
  const normalizedControlledSort = controlledSort
    ? {
        key: controlledSort.key ? String(controlledSort.key) : null,
        direction: controlledSort.direction,
      }
    : undefined;

  return (
    <DataTableProvider
      columns={columns}
      tableId={tableId}
      mode={mode}
      paginationMode={paginationMode}
      controlledSort={normalizedControlledSort}
      onSortChange={onSortChange}
      controlledFilters={controlledFilters}
      onFiltersChange={onFiltersChange}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      columnPinState={columnPinState}
      onColumnPinChange={onColumnPinChange}
      cursorLimit={cursorPagination?.limit}
      config={{
        selectable: effectiveSelectable,
        showColumnBorders: effectiveColumnBorders,
        zebra,
        compact: effectiveCompact,
        mode,
        paginationMode,
      }}
    >
      <DataTableInner
        data={data}
        title={title}
        isLoading={isLoading}
        refreshing={refreshing}
        searchable={searchable}
        onRefresh={onRefresh}
        bulkActions={bulkActions}
        renderSubComponent={renderSubComponent}
        getRowCanExpand={getRowCanExpand}
        className={className}
        style={style}
        totalItems={totalItems}
        cursorPagination={cursorPagination}
        disableLocalProcessing={disableLocalProcessing}
        onRowClick={onRowClick}
        activeRowId={activeRowId}
        rowClassName={rowClassName}
        inlineEditing={inlineEditing}
      />
    </DataTableProvider>
  );
};
