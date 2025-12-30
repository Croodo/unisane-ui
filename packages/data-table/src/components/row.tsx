"use client";

import React, { memo, type ReactNode, type CSSProperties } from "react";
import { cn, Icon, Checkbox } from "@unisane/ui";
import type { Column, PinPosition, ColumnMetaMap, CellContext, InlineEditingController } from "../types";
import { getNestedValue } from "../utils/get-nested-value";
import { DENSITY_STYLES, type Density } from "../constants";

// ─── ROW PROPS ──────────────────────────────────────────────────────────────

interface DataTableRowProps<T> {
  row: T;
  rowIndex: number;
  columns: Column<T>[];
  columnMeta: ColumnMetaMap;
  getEffectivePinPosition: (col: Column<T>) => PinPosition;
  isSelected: boolean;
  isExpanded: boolean;
  isActive: boolean;
  isLastRow: boolean;
  selectable: boolean;
  showColumnBorders: boolean;
  zebra: boolean;
  enableExpansion: boolean;
  canExpand: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onToggleExpand: (id: string) => void;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  /** Callback when row is right-clicked (context menu) */
  onRowContextMenu?: (row: T, event: React.MouseEvent) => void;
  onRowHover?: (row: T | null) => void;
  renderExpandedRow?: (row: T) => ReactNode;
  density?: Density;
  /** Virtualization: inline styles for absolute positioning */
  style?: CSSProperties;
  /** Virtualization: data-index for measurement */
  "data-index"?: number;
  /** Keyboard navigation: whether this row is focused */
  isFocused?: boolean;
  /** Inline editing controller */
  inlineEditing?: InlineEditingController<T>;
}

// ─── ROW COMPONENT ──────────────────────────────────────────────────────────

function DataTableRowInner<T extends { id: string }>({
  row,
  rowIndex,
  columns,
  columnMeta,
  getEffectivePinPosition,
  isSelected,
  isExpanded,
  isActive,
  isLastRow,
  selectable,
  showColumnBorders,
  zebra,
  enableExpansion,
  canExpand,
  onSelect,
  onToggleExpand,
  onRowClick,
  onRowContextMenu,
  onRowHover,
  renderExpandedRow,
  density = "standard",
  style,
  "data-index": dataIndex,
  isFocused = false,
  inlineEditing,
}: DataTableRowProps<T>) {
  const isOddRow = rowIndex % 2 === 1;
  const paddingClass = DENSITY_STYLES[density];

  // Determine pinned column info for border logic
  const pinnedLeftColumns = columns.filter((col) => getEffectivePinPosition(col) === "left");
  const pinnedRightColumns = columns.filter((col) => getEffectivePinPosition(col) === "right");
  const hasPinnedLeftData = pinnedLeftColumns.length > 0;
  const hasPinnedRightData = pinnedRightColumns.length > 0;
  const lastPinnedLeftKey = hasPinnedLeftData ? String(pinnedLeftColumns[pinnedLeftColumns.length - 1]!.key) : null;
  const firstPinnedRightKey = hasPinnedRightData ? String(pinnedRightColumns[0]!.key) : null;

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't trigger row click if clicking on interactive elements
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a") ||
      target.closest('[role="button"]') ||
      target.closest('[role="checkbox"]')
    ) {
      return;
    }
    onRowClick?.(row, e);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onRowContextMenu) {
      e.preventDefault();
      onRowContextMenu(row, e);
    }
  };

  // Background classes - using semantic Unisane UI tokens
  const getBgClass = () => {
    if (isSelected) return "bg-surface-container";
    if (isActive) return "bg-surface-container-high";
    if (isFocused) return "bg-surface-container-low";
    if (zebra && isOddRow) return "bg-surface-container-lowest";
    return "bg-surface";
  };

  const bgClass = getBgClass();

  return (
    <>
      <tr
        onClick={onRowClick ? handleRowClick : undefined}
        onContextMenu={onRowContextMenu ? handleContextMenu : undefined}
        onMouseEnter={onRowHover ? () => onRowHover(row) : undefined}
        onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
        className={cn(
          "group transition-colors duration-snappy",
          bgClass,
          onRowClick && "cursor-pointer",
          !isSelected && !isActive && "hover:bg-surface-container-low",
          isFocused && "ring-2 ring-inset ring-primary/50"
        )}
        style={style}
        data-index={dataIndex}
        aria-selected={isSelected || isFocused}
        id={`data-table-row-${row.id}`}
      >
        {/* Checkbox column - NO padding, fixed 48px width */}
        {selectable && (
          <td
            className={cn(
              "sticky left-0 z-20 isolate",
              bgClass,
              !isSelected && !isActive && "group-hover:bg-surface-container-low",
              "transition-colors",
              !isLastRow && "border-b border-outline-variant/50",
              // Only show border-r if there are no more sticky columns after this
              showColumnBorders && !enableExpansion && !hasPinnedLeftData && "border-r border-outline-variant/50"
            )}
            style={{ width: 48, minWidth: 48, maxWidth: 48 }}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={isSelected}
                onChange={() => onSelect(row.id, !isSelected)}
                aria-label={`Select row ${row.id}`}
                className="[&>div]:w-8 [&>div]:h-8"
              />
            </div>
          </td>
        )}

        {/* Expander column - NO padding, fixed 40px width */}
        {enableExpansion && (
          <td
            className={cn(
              "sticky z-20 isolate text-center",
              bgClass,
              !isSelected && !isActive && "group-hover:bg-surface-container-low",
              "transition-colors",
              !isLastRow && "border-b border-outline-variant/50",
              // Only show border-r if there are no pinned-left data columns after this
              showColumnBorders && !hasPinnedLeftData && "border-r border-outline-variant/50"
            )}
            style={{
              width: 40,
              minWidth: 40,
              maxWidth: 40,
              left: selectable ? 48 : 0
            }}
          >
            {canExpand && (
              <button
                onClick={() => onToggleExpand(row.id)}
                className={cn(
                  "p-1 rounded-full text-on-surface-variant transition-all",
                  "hover:bg-on-surface/8 hover:text-on-surface",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse row" : "Expand row"}
              >
                <Icon
                  symbol={isExpanded ? "expand_less" : "expand_more"}
                  className="w-5 h-5 transition-transform"
                />
              </button>
            )}
          </td>
        )}

        {/* Data cells */}
        {columns.map((col, colIndex) => {
          const key = String(col.key);
          const meta = columnMeta[key];
          const pinPosition = getEffectivePinPosition(col);
          const isLastColumn = colIndex === columns.length - 1;

          // Get cell value
          const rawValue = getNestedValue(row as unknown as Record<string, unknown>, key);

          // Create cell context
          const cellContext: CellContext<T> = {
            row,
            rowIndex,
            columnKey: key,
            isSelected,
            isExpanded,
          };

          // Check if this cell is editable and currently being edited
          const isEditable = col.editable && inlineEditing;
          const isEditing = isEditable && inlineEditing?.isCellEditing(row.id, key);
          const editProps = isEditable ? inlineEditing?.getCellEditProps(row.id, key, rawValue) : null;

          // Render content
          let content: ReactNode;
          if (isEditing && inlineEditing) {
            const inputProps = inlineEditing.getInputProps();
            const inputType = col.inputType ?? "text";
            content = (
              <div className="relative -mx-2 -my-1">
                <input
                  {...inputProps}
                  type={inputType}
                  step={inputType === "number" ? "any" : undefined}
                  className={cn(
                    "w-full px-2 py-1 text-body-medium rounded-sm",
                    "border bg-surface text-on-surface",
                    "focus:outline-none focus:ring-2",
                    inlineEditing.validationError
                      ? "border-error focus:ring-error/20"
                      : "border-primary focus:ring-primary/20"
                  )}
                />
                {inlineEditing.validationError && (
                  <div className="absolute top-full left-0 mt-1 text-label-small text-error bg-error-container px-2 py-0.5 rounded z-[3] whitespace-nowrap">
                    {inlineEditing.validationError}
                  </div>
                )}
              </div>
            );
          } else {
            content = col.render
              ? col.render(row, cellContext)
              : (rawValue as ReactNode);
          }

          // Width is handled by colgroup - only set left/right for pinned columns
          return (
            <td
              key={key}
              className={cn(
                "text-body-medium text-on-surface whitespace-nowrap overflow-hidden text-ellipsis",
                // All cells use dynamic bgClass for proper selection state
                bgClass,
                !isSelected && !isActive && "group-hover:bg-surface-container-low",
                "transition-colors",
                !isLastRow && "border-b border-outline-variant/50",
                col.align === "center" && "text-center",
                col.align === "end" && "text-right",
                col.align !== "center" && col.align !== "end" && "text-left",
                // Pinned columns: sticky with z-20 to match header (shadow applied via inline style)
                pinPosition && "sticky z-20 isolate",
                // Column borders: show on non-pinned columns (except last), and on last pinned-left column
                showColumnBorders && !isLastColumn && !pinPosition && "border-r border-outline-variant/50",
                showColumnBorders && pinPosition === "left" && key === lastPinnedLeftKey && "border-r border-outline-variant/50",
                showColumnBorders && pinPosition === "right" && key === firstPinnedRightKey && "border-l border-outline-variant/50",
                paddingClass,
                isEditable && !isEditing && "cursor-cell",
                isEditing && "overflow-visible z-[3]"
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
              onDoubleClick={editProps?.onDoubleClick}
              onKeyDown={editProps?.onKeyDown}
              tabIndex={isEditable ? 0 : undefined}
            >
              {content}
            </td>
          );
        })}
      </tr>

      {/* Expanded content */}
      {isExpanded && renderExpandedRow && (
        <tr className="bg-surface-container-lowest animate-in slide-in-from-top-1 duration-snappy">
          {selectable && (
            <td
              className="sticky left-0 z-20 isolate bg-surface-container-lowest"
              style={{ width: 48 }}
            />
          )}
          {enableExpansion && (
            <td
              className="sticky z-20 isolate bg-surface-container-lowest"
              style={{
                left: selectable ? 48 : 0,
                width: 40,
              }}
            />
          )}
          <td
            colSpan={columns.length}
            className="p-0 border-b border-outline-variant/50"
          >
            <div className="p-4 border-l-4 border-primary bg-surface">
              {renderExpandedRow(row)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export const DataTableRow = memo(DataTableRowInner, (prev, next) => {
  return (
    prev.row === next.row &&
    prev.isSelected === next.isSelected &&
    prev.isExpanded === next.isExpanded &&
    prev.isActive === next.isActive &&
    prev.isFocused === next.isFocused &&
    prev.rowIndex === next.rowIndex &&
    prev.isLastRow === next.isLastRow &&
    prev.columnMeta === next.columnMeta &&
    prev.columns === next.columns &&
    prev.density === next.density &&
    prev.zebra === next.zebra &&
    prev.selectable === next.selectable &&
    prev.showColumnBorders === next.showColumnBorders &&
    prev.style === next.style &&
    prev["data-index"] === next["data-index"] &&
    prev.inlineEditing === next.inlineEditing &&
    prev.onRowHover === next.onRowHover &&
    prev.onRowContextMenu === next.onRowContextMenu
  );
}) as typeof DataTableRowInner;
