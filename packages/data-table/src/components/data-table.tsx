"use client";

import React from "react";
import type { DataTableProps } from "../types/index";
import { DataTableProvider } from "../context/provider";
import { DataTableInner } from "./data-table-inner";

/**
 * DataTable - Feature-rich, highly scalable data table component for Unisane UI
 *
 * Architecture:
 * - DataTable: Slim wrapper that connects props to context
 * - DataTableProvider: Manages all state (selection, sorting, filtering, etc.)
 * - DataTableInner: Renders the actual table UI using context hooks
 *
 * Features:
 * - Sorting (tri-state: asc → desc → none, supports multi-sort)
 * - Filtering (search + column filters)
 * - Pagination (offset & cursor-based)
 * - Column pinning (left/right)
 * - Column resizing
 * - Column visibility toggle
 * - Row selection with bulk actions
 * - Row expansion with sub-components
 * - Virtual scrolling for large datasets
 * - Keyboard navigation & accessibility
 * - Export to CSV
 * - Persistent settings via localStorage
 * - Remote data support via useRemoteDataTable hook
 *
 * @example
 * ```tsx
 * import { DataTable } from "@unisane/data-table";
 *
 * const columns = [
 *   { key: "name", header: "Name", sortable: true },
 *   { key: "email", header: "Email", sortable: true },
 *   { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   selectable
 *   bulkActions={[{ label: "Delete", onClick: handleDelete }]}
 * />
 * ```
 */
export function DataTable<T extends { id: string }>({
  // Required
  data,
  columns,

  // Identification
  tableId,

  // Visual
  variant = "list",
  selectable,
  columnBorders,
  zebra = false,
  stickyHeader = true,
  density = "standard",

  // Features
  resizable = true,
  pinnable = true,
  virtualize = true,
  virtualizeThreshold = 50,

  // Pagination
  pagination = "offset",
  pageSize = 25,

  // Remote data
  mode = "local",
  loading = false,
  totalCount,

  // Bulk actions & expansion
  bulkActions = [],
  renderExpandedRow,
  getRowCanExpand,

  // Events
  onRowClick,
  onRowContextMenu,
  onSelectionChange,
  onSortChange,
  onFilterChange,
  onSearchChange,
  onColumnPinChange,
  onRowReorder,

  // Row reordering
  reorderableRows = false,

  // Controlled state
  selectedIds,
  sortState,
  maxSortColumns,
  filters: controlledFilters,
  searchValue,
  columnPinState,

  // UI
  className,
  style,
  activeRowId,
  emptyMessage,
  emptyIcon,

  // Layout
  estimateRowHeight,
}: DataTableProps<T>) {
  // Compute effective settings based on variant
  const effectiveSelectable = selectable ?? (variant === "grid" || bulkActions.length > 0);
  const effectiveColumnBorders = columnBorders ?? variant === "grid";

  return (
    <DataTableProvider
      tableId={tableId}
      columns={columns}
      mode={mode}
      paginationMode={pagination}
      variant={variant}
      selectable={effectiveSelectable}
      columnBorders={effectiveColumnBorders}
      zebra={zebra}
      stickyHeader={stickyHeader}
      resizable={resizable}
      pinnable={pinnable}
      initialPageSize={pageSize}
      maxSortColumns={maxSortColumns}
      // Controlled props
      sortState={sortState}
      onSortChange={onSortChange}
      controlledFilters={controlledFilters}
      onFilterChange={onFilterChange}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      columnPinState={columnPinState}
      onColumnPinChange={onColumnPinChange}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
    >
      <DataTableInner
        data={data}
        isLoading={loading}
        bulkActions={bulkActions}
        renderExpandedRow={renderExpandedRow}
        getRowCanExpand={getRowCanExpand}
        className={className}
        style={style}
        totalItems={totalCount}
        onRowClick={onRowClick}
        onRowContextMenu={onRowContextMenu}
        activeRowId={activeRowId}
        density={density}
        virtualize={virtualize}
        virtualizeThreshold={virtualizeThreshold}
        emptyMessage={emptyMessage}
        emptyIcon={emptyIcon}
        estimateRowHeight={estimateRowHeight}
        reorderableRows={reorderableRows}
        onRowReorder={onRowReorder}
      />
    </DataTableProvider>
  );
}

export default DataTable;
