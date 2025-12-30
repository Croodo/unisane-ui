"use client";

import React, { memo } from "react";
import type { ReactNode } from "react";
import { Icon } from "@unisane/ui";
import type { Column, PinPosition, ColumnMetaMap, InlineEditingController } from "../types";
import { DataTableRow } from "./row";
import type { Density } from "../constants";

// ─── BODY PROPS ─────────────────────────────────────────────────────────────

interface DataTableBodyProps<T> {
  data: T[];
  columns: Column<T>[];
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  selectedRows: Set<string>;
  expandedRows: Set<string>;
  isLoading: boolean;
  selectable: boolean;
  showColumnBorders: boolean;
  zebra: boolean;
  enableExpansion: boolean;
  density?: Density;
  onSelect: (id: string, checked: boolean) => void;
  onToggleExpand: (id: string) => void;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  /** Callback when row is right-clicked (context menu) */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  onRowHover?: (row: T | null) => void;
  renderExpandedRow?: (row: T) => ReactNode;
  getRowCanExpand?: (row: T) => boolean;
  activeRowId?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  /** Keyboard navigation: currently focused row index */
  focusedIndex?: number | null;
  /** Inline editing controller */
  inlineEditing?: InlineEditingController<T>;
}

// ─── LOADING STATE ─────────────────────────────────────────────────────────

function LoadingState({ colSpan }: { colSpan: number }) {
  return (
    <tbody className="bg-surface">
      <tr>
        <td
          colSpan={colSpan}
          className="px-4 py-20 text-center text-on-surface-variant"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-body-medium">Loading data...</span>
          </div>
        </td>
      </tr>
    </tbody>
  );
}

// ─── EMPTY STATE ───────────────────────────────────────────────────────────

function EmptyState({
  colSpan,
  message = "No results found",
  icon = "search_off",
}: {
  colSpan: number;
  message?: string;
  icon?: string;
}) {
  return (
    <tbody className="bg-surface">
      <tr>
        <td
          colSpan={colSpan}
          className="px-4 py-16 text-center text-on-surface-variant"
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon symbol={icon} className="w-8 h-8 text-on-surface-variant mb-2" />
            <span className="text-title-medium text-on-surface">{message}</span>
            <span className="text-body-small text-on-surface-variant mt-1">
              Try adjusting your search or filters
            </span>
          </div>
        </td>
      </tr>
    </tbody>
  );
}

// ─── BODY COMPONENT ─────────────────────────────────────────────────────────

function DataTableBodyInner<T extends { id: string }>({
  data,
  columns,
  columnMeta,
  getEffectivePinPosition,
  selectedRows,
  expandedRows,
  isLoading,
  selectable,
  showColumnBorders,
  zebra,
  enableExpansion,
  density = "standard",
  onSelect,
  onToggleExpand,
  onRowClick,
  onRowContextMenu,
  onRowHover,
  renderExpandedRow,
  getRowCanExpand,
  activeRowId,
  emptyMessage,
  emptyIcon,
  focusedIndex,
  inlineEditing,
}: DataTableBodyProps<T>) {
  // Calculate colspan
  const colSpan = columns.length + (selectable ? 1 : 0) + (enableExpansion ? 1 : 0);

  // Loading state
  if (isLoading) {
    return <LoadingState colSpan={colSpan} />;
  }

  // Empty state
  if (data.length === 0) {
    return <EmptyState colSpan={colSpan} message={emptyMessage} icon={emptyIcon} />;
  }

  // Render rows
  return (
    <tbody className="bg-surface">
      {data.map((row, index) => (
        <DataTableRow
          key={row.id}
          row={row}
          rowIndex={index}
          columns={columns}
          columnMeta={columnMeta}
          getEffectivePinPosition={getEffectivePinPosition}
          isSelected={selectedRows.has(row.id)}
          isExpanded={expandedRows.has(row.id)}
          isActive={activeRowId === row.id}
          isFocused={focusedIndex === index}
          isLastRow={index === data.length - 1}
          selectable={selectable}
          showColumnBorders={showColumnBorders}
          zebra={zebra}
          enableExpansion={enableExpansion}
          canExpand={getRowCanExpand ? getRowCanExpand(row) : !!renderExpandedRow}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
          onRowClick={onRowClick}
          onRowContextMenu={onRowContextMenu}
          onRowHover={onRowHover}
          renderExpandedRow={renderExpandedRow}
          density={density}
          inlineEditing={inlineEditing}
        />
      ))}
    </tbody>
  );
}

export const DataTableBody = memo(DataTableBodyInner) as typeof DataTableBodyInner;
