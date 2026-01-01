"use client";

import React from "react";
import type { ReactNode, RefObject, CSSProperties } from "react";
import { Icon } from "@unisane/ui";
import type { Column, ColumnGroup, PinPosition, ColumnMetaMap, InlineEditingController, MultiSortState, FilterValue } from "../types/index";
import { Table } from "./table";
import { TableColgroup } from "./colgroup";
import { DataTableHeader } from "./header/index";
import { DataTableRow } from "./row";
import type { VirtualRow } from "../hooks";
import type { Density } from "../constants/index";
import { useI18n } from "../i18n";

// ─── PROPS ──────────────────────────────────────────────────────────────────

interface VirtualizedBodyProps<T extends { id: string }> {
  virtualContainerRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  isEmpty: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  getInnerContainerStyle: () => CSSProperties;
  virtualRows: VirtualRow<T>[];
  columns: Column<T>[];
  /** Original column definitions (may include groups) */
  columnDefinitions?: Array<Column<T> | ColumnGroup<T>>;
  /** Whether column groups exist */
  hasGroups?: boolean;
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  selectedRows: Set<string>;
  expandedRows: Set<string>;
  activeRowId?: string;
  focusedIndex: number | null;
  selectable: boolean;
  showColumnBorders: boolean;
  zebra: boolean;
  enableExpansion: boolean;
  getRowCanExpand?: (row: T) => boolean;
  renderExpandedRow?: (row: T) => ReactNode;
  onSelect: (id: string, checked: boolean) => void;
  onToggleExpand: (id: string) => void;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  /** Callback when row is right-clicked (context menu) */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  onRowHover?: (row: T | null) => void;
  density?: Density;
  getRowStyle: (vRow: VirtualRow<T>) => CSSProperties;
  inlineEditing?: InlineEditingController<T>;
  // Header props
  sortState: MultiSortState;
  onSort: (key: string, addToMultiSort?: boolean) => void;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
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
  /** Tailwind class for sticky header offset */
  headerOffsetClassName?: string;
  /** Total calculated table width for proper column resizing */
  tableWidth?: number;
}

// ─── LOADING STATE ──────────────────────────────────────────────────────────

function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-body-medium text-on-surface-variant mt-3">{t("loading")}</span>
    </div>
  );
}

// ─── EMPTY STATE ────────────────────────────────────────────────────────────

function EmptyState({
  message,
  icon = "search_off",
}: {
  message?: string;
  icon?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon symbol={icon} className="w-8 h-8 text-on-surface-variant mb-2" />
      <span className="text-title-medium text-on-surface">{message ?? t("noResults")}</span>
      <span className="text-body-small text-on-surface-variant mt-1">
        {t("noResultsHint")}
      </span>
    </div>
  );
}

// ─── VIRTUALIZED BODY ───────────────────────────────────────────────────────

export function VirtualizedBody<T extends { id: string }>({
  virtualContainerRef,
  isLoading,
  isEmpty,
  emptyMessage,
  emptyIcon,
  getInnerContainerStyle,
  virtualRows,
  columns,
  columnDefinitions,
  hasGroups,
  columnMeta,
  getEffectivePinPosition,
  selectedRows,
  expandedRows,
  activeRowId,
  focusedIndex,
  selectable,
  showColumnBorders,
  zebra,
  enableExpansion,
  getRowCanExpand,
  renderExpandedRow,
  onSelect,
  onToggleExpand,
  onRowClick,
  onRowContextMenu,
  onRowHover,
  density = "standard",
  getRowStyle,
  inlineEditing,
  sortState,
  onSort,
  allSelected,
  indeterminate,
  onSelectAll,
  resizable,
  pinnable,
  reorderable,
  onColumnPin,
  onColumnResize,
  onColumnHide,
  onColumnFilter,
  onColumnReorder,
  columnFilters,
  headerOffsetClassName,
  tableWidth,
}: VirtualizedBodyProps<T>) {
  return (
    <div ref={virtualContainerRef} style={{ height: "100%", overflow: "auto" }}>
      {isLoading ? (
        <LoadingState />
      ) : isEmpty ? (
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      ) : (
        <div style={getInnerContainerStyle()}>
          <Table style={tableWidth ? { minWidth: `${tableWidth}px` } : undefined}>
            <TableColgroup
              columns={columns}
              columnMeta={columnMeta}
              selectable={selectable}
              enableExpansion={enableExpansion}
              getEffectivePinPosition={getEffectivePinPosition}
            />
            <DataTableHeader
              columns={columns}
              columnDefinitions={columnDefinitions}
              hasGroups={hasGroups}
              sortState={sortState}
              onSort={onSort}
              columnMeta={columnMeta}
              getEffectivePinPosition={getEffectivePinPosition}
              selectable={selectable}
              allSelected={allSelected}
              indeterminate={indeterminate}
              onSelectAll={onSelectAll}
              showColumnBorders={showColumnBorders}
              enableExpansion={enableExpansion}
              density={density}
              resizable={resizable}
              pinnable={pinnable}
              reorderable={reorderable}
              onColumnPin={onColumnPin}
              onColumnResize={onColumnResize}
              onColumnHide={onColumnHide}
              onColumnFilter={onColumnFilter}
              onColumnReorder={onColumnReorder}
              columnFilters={columnFilters}
              headerOffsetClassName={headerOffsetClassName}
            />
            <tbody className="bg-surface">
              {virtualRows.map((vRow, idx) => (
                <DataTableRow
                  key={vRow.key}
                  row={vRow.data}
                  rowIndex={vRow.index}
                  columns={columns}
                  columnMeta={columnMeta}
                  getEffectivePinPosition={getEffectivePinPosition}
                  isSelected={selectedRows.has(vRow.data.id)}
                  isExpanded={expandedRows.has(vRow.data.id)}
                  isActive={activeRowId === vRow.data.id}
                  isFocused={focusedIndex === vRow.index}
                  isLastRow={idx === virtualRows.length - 1}
                  selectable={selectable}
                  showColumnBorders={showColumnBorders}
                  zebra={zebra}
                  enableExpansion={enableExpansion}
                  canExpand={getRowCanExpand ? getRowCanExpand(vRow.data) : !!renderExpandedRow}
                  onSelect={onSelect}
                  onToggleExpand={onToggleExpand}
                  onRowClick={onRowClick}
                  onRowContextMenu={onRowContextMenu}
                  onRowHover={onRowHover}
                  renderExpandedRow={renderExpandedRow}
                  density={density}
                  style={getRowStyle(vRow)}
                  data-index={vRow.index}
                  inlineEditing={inlineEditing}
                />
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default VirtualizedBody;
