"use client";

import React, { memo } from "react";
import type { ReactNode } from "react";
import { Icon } from "@unisane/ui";
import type { Column, PinPosition, ColumnMetaMap, InlineEditingController, RowGroup, GroupHeaderProps, CellSelectionContext, RowActivationEvent } from "../types/index";
import type { RowDragProps } from "../hooks/ui/use-row-drag";
import { DataTableRow } from "./row";
import { GroupRow } from "./group-row";
import type { Density } from "../constants/index";
import { useI18n } from "../i18n";

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
  onRowClick?: (row: T, activation: RowActivationEvent) => void;
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
  /** Whether data is grouped */
  isGrouped?: boolean;
  /** Grouped row data (when isGrouped is true) */
  groupedRows?: RowGroup<T>[];
  /** Toggle group expand/collapse */
  onToggleGroupExpand?: (groupId: string) => void;
  /** Custom group header renderer */
  renderGroupHeader?: (props: GroupHeaderProps<T>) => ReactNode;
  /** Callback to select/deselect all rows in a group */
  onSelectGroup?: (rowIds: string[], selected: boolean) => void;
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
  /** Row reordering: get drag props for a row */
  getRowDragProps?: (rowId: string, rowIndex: number) => RowDragProps;
  /** Row reordering: get drag handle props */
  getDragHandleProps?: (rowId: string, rowIndex: number) => {
    onMouseDown: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    tabIndex: number;
    role: string;
    "aria-label": string;
    "aria-grabbed": boolean | undefined;
  };
  /** Row reordering: check if row is being dragged */
  isDraggingRow?: (id: string) => boolean;
  /** Row reordering: check if row is a drop target */
  isDropTarget?: (id: string) => boolean;
  /** Row reordering: get drop position for a row */
  getDropPosition?: (id: string) => "before" | "after" | null;
}

// ─── LOADING STATE ─────────────────────────────────────────────────────────

function LoadingState({ colSpan }: { colSpan: number }) {
  const { t } = useI18n();
  return (
    <tbody className="bg-surface">
      <tr>
        <td
          colSpan={colSpan}
          className="px-4 py-20 text-center text-on-surface-variant"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-body-medium">{t("loading")}</span>
          </div>
        </td>
      </tr>
    </tbody>
  );
}

// ─── EMPTY STATE ───────────────────────────────────────────────────────────

function EmptyState({
  colSpan,
  message,
  icon = "search_off",
}: {
  colSpan: number;
  message?: string;
  icon?: string;
}) {
  const { t } = useI18n();
  return (
    <tbody className="bg-surface">
      <tr>
        <td
          colSpan={colSpan}
          className="px-4 py-16 text-center text-on-surface-variant"
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon symbol={icon} className="w-8 h-8 text-on-surface-variant mb-2" />
            <span className="text-title-medium text-on-surface">{message ?? t("noResults")}</span>
            <span className="text-body-small text-on-surface-variant mt-1">
              {t("noResultsHint")}
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
  isGrouped = false,
  groupedRows = [],
  onToggleGroupExpand,
  renderGroupHeader,
  onSelectGroup,
  cellSelectionEnabled = false,
  getCellSelectionContext,
  onCellClick,
  onCellKeyDown,
  reorderableRows = false,
  getRowDragProps,
  getDragHandleProps,
  isDraggingRow,
  isDropTarget,
  getDropPosition,
}: DataTableBodyProps<T>) {
  // Calculate colspan
  const colSpan = columns.length + (selectable ? 1 : 0) + (enableExpansion ? 1 : 0) + (reorderableRows ? 1 : 0);

  // Loading state
  if (isLoading) {
    return <LoadingState colSpan={colSpan} />;
  }

  // Empty state
  if (data.length === 0) {
    return <EmptyState colSpan={colSpan} message={emptyMessage} icon={emptyIcon} />;
  }

  // Recursive function to render groups and their children (for multi-level grouping)
  const renderGroupsRecursively = (
    groups: RowGroup<T>[],
    isLastInParent: boolean[] = []
  ): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let globalRowIndex = 0;

    groups.forEach((group, groupIndex) => {
      const isLastGroup = groupIndex === groups.length - 1;
      const hasChildGroups = group.childGroups && group.childGroups.length > 0;
      const hasRows = group.rows.length > 0;

      // Render group header
      elements.push(
        <GroupRow
          key={group.groupId}
          group={group}
          columns={columns}
          selectable={selectable}
          enableExpansion={enableExpansion}
          onToggle={() => onToggleGroupExpand?.(group.groupId)}
          density={density}
          renderGroupHeader={renderGroupHeader}
          isLastGroup={isLastGroup && !group.isExpanded && !hasChildGroups}
          selectedRows={selectedRows}
          onSelectGroup={onSelectGroup}
        />
      );

      // If expanded, render child groups or rows
      if (group.isExpanded) {
        if (hasChildGroups) {
          // Recursively render child groups
          const childElements = renderGroupsRecursively(
            group.childGroups!,
            [...isLastInParent, isLastGroup]
          );
          elements.push(...childElements);
        } else if (hasRows) {
          // Render data rows at the deepest level
          group.rows.forEach((row, rowIndexInGroup) => {
            const currentRowIndex = globalRowIndex++;
            const isLastRow = isLastGroup && rowIndexInGroup === group.rows.length - 1;

            elements.push(
              <DataTableRow
                key={row.id}
                row={row}
                rowIndex={currentRowIndex}
                columns={columns}
                columnMeta={columnMeta}
                getEffectivePinPosition={getEffectivePinPosition}
                isSelected={selectedRows.has(row.id)}
                isExpanded={expandedRows.has(row.id)}
                isActive={activeRowId === row.id}
                isFocused={focusedIndex === currentRowIndex}
                isLastRow={isLastRow}
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
                groupDepth={group.depth + 1}
                cellSelectionEnabled={cellSelectionEnabled}
                getCellSelectionContext={getCellSelectionContext}
                onCellClick={onCellClick}
                onCellKeyDown={onCellKeyDown}
              />
            );
          });
        }
      }
    });

    return elements;
  };

  // Render grouped rows (supports multi-level)
  if (isGrouped && groupedRows.length > 0) {
    return (
      <tbody className="bg-surface">
        {renderGroupsRecursively(groupedRows)}
      </tbody>
    );
  }

  // Render ungrouped rows
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
          cellSelectionEnabled={cellSelectionEnabled}
          getCellSelectionContext={getCellSelectionContext}
          onCellClick={onCellClick}
          onCellKeyDown={onCellKeyDown}
          reorderableRows={reorderableRows}
          isDragging={isDraggingRow?.(row.id)}
          isDropTarget={isDropTarget?.(row.id)}
          dropPosition={getDropPosition?.(row.id)}
          rowDragProps={getRowDragProps?.(row.id, index)}
          dragHandleProps={getDragHandleProps?.(row.id, index)}
        />
      ))}
    </tbody>
  );
}

export const DataTableBody = memo(DataTableBodyInner) as typeof DataTableBodyInner;
