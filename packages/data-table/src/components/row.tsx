"use client";

import React, { memo, useState, useCallback, useEffect, type ReactNode, type CSSProperties } from "react";
import { cn, Icon, Checkbox } from "@unisane/ui";
import type { Column, PinPosition, ColumnMetaMap, CellContext, InlineEditingController, CellSelectionContext, RowActivationEvent } from "../types/index";
import type { RowDragProps } from "../hooks/ui/use-row-drag";
import { getNestedValue } from "../utils/get-nested-value";
import { DENSITY_STYLES, type Density, createCellId } from "../constants/index";
import { useI18n } from "../i18n";
import { DragHandle } from "./drag-handle";

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
  onRowClick?: (row: T, activation: RowActivationEvent) => void;
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
  /** Depth level for row indentation in grouped data (used for visual hierarchy) */
  groupDepth?: number;
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
  /** Row reordering: whether this row is being dragged */
  isDragging?: boolean;
  /** Row reordering: whether this row is a drop target */
  isDropTarget?: boolean;
  /** Row reordering: drop position relative to this row */
  dropPosition?: "before" | "after" | null;
  /** Row reordering: drag props for the row element */
  rowDragProps?: RowDragProps;
  /** Row reordering: drag handle props */
  dragHandleProps?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    tabIndex: number;
    role: string;
    "aria-label": string;
    "aria-grabbed": boolean | undefined;
  };
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
  groupDepth = 0,
  cellSelectionEnabled = false,
  getCellSelectionContext,
  onCellClick,
  onCellKeyDown,
  reorderableRows = false,
  isDragging = false,
  isDropTarget = false,
  dropPosition = null,
  rowDragProps,
  dragHandleProps,
}: DataTableRowProps<T>) {
  const { t } = useI18n();
  const isOddRow = rowIndex % 2 === 1;
  const paddingClass = DENSITY_STYLES[density];

  // State for showing "not editable" tooltip on non-editable cells
  const [notEditableCell, setNotEditableCell] = useState<string | null>(null);

  // Clear the tooltip after a delay
  useEffect(() => {
    if (notEditableCell) {
      const timer = setTimeout(() => setNotEditableCell(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notEditableCell]);

  // Show "not editable" feedback when user tries to edit a non-editable cell
  const showNotEditableFeedback = useCallback((columnKey: string) => {
    setNotEditableCell(columnKey);
  }, []);

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
    onRowClick?.(row, { source: "mouse", event: e });
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

  // Sticky cell background - includes drop target state
  const getStickyBgClass = () => {
    if (isDropTarget) return "bg-primary/5";
    return bgClass;
  };
  const stickyBgClass = getStickyBgClass();

  return (
    <>
      <tr
        onClick={onRowClick ? handleRowClick : undefined}
        onContextMenu={onRowContextMenu ? handleContextMenu : undefined}
        onMouseEnter={onRowHover ? () => onRowHover(row) : undefined}
        onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
        className={cn(
          "group/row group transition-colors duration-snappy",
          bgClass,
          onRowClick && "cursor-pointer",
          !isSelected && !isActive && "hover:bg-surface-container-low",
          // Elevate row slightly on hover so tooltips appear above other rows
          // z-[5] is lower than sticky header (z-20) so row won't overlap header
          "hover:z-[5]",
          isFocused && "ring-2 ring-inset ring-primary/50",
          // Drag state styling
          isDragging && "opacity-50 scale-[0.98]",
          // Drop target highlight
          isDropTarget && "bg-primary/5"
        )}
        style={style}
        data-index={dataIndex}
        aria-selected={isSelected || isFocused}
        aria-rowindex={rowIndex + 2}
        id={`data-table-row-${row.id}`}
        {...rowDragProps}
      >
        {/* Drag handle column - fixed 40px width, scrolls with content */}
        {reorderableRows && (
          <td
            className={cn(
              "relative",
              bgClass,
              !isSelected && !isActive && !isDropTarget && "group-hover:bg-surface-container-low",
              "transition-colors",
              !isLastRow && "border-b border-outline-variant/50",
              showColumnBorders && "border-r border-outline-variant/50"
            )}
            style={{ width: 40, minWidth: 40, maxWidth: 40 }}
          >
            {/* Drop indicator line - spans full table width */}
            {isDropTarget && dropPosition && (
              <div
                className={cn(
                  "absolute left-0 z-50 pointer-events-none",
                  "h-0.5 bg-primary",
                  dropPosition === "before" ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2"
                )}
                style={{ width: "calc(100vw - var(--scrollbar-width, 0px))", maxWidth: "9999px" }}
                aria-hidden="true"
              >
                {/* Circle indicator at the start */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border-2 border-surface" />
              </div>
            )}
            <div className="flex items-center justify-center h-full">
              <DragHandle
                size="sm"
                isDragging={isDragging}
                {...dragHandleProps}
              />
            </div>
          </td>
        )}

        {/* Checkbox column - NO padding, fixed 48px width */}
        {selectable && (
          <td
            className={cn(
              // z-[15] to stay above pinned data columns (z-10) but below sticky header (z-20)
              "@md:sticky left-0 z-[15] isolate",
              stickyBgClass,
              !isSelected && !isActive && !isDropTarget && "group-hover:bg-surface-container-low",
              "transition-colors",
              !isLastRow && "border-b border-outline-variant/50",
              // Only show border-r if there are no more sticky columns after this
              showColumnBorders && !enableExpansion && !hasPinnedLeftData && "border-r border-outline-variant/50"
            )}
            style={{
              width: 48,
              minWidth: 48,
              maxWidth: 48,
            }}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={isSelected}
                onChange={() => onSelect(row.id, !isSelected)}
                aria-label={t("selectRowLabel", { id: row.id })}
                className="[&>div]:w-8 [&>div]:h-8"
              />
            </div>
          </td>
        )}

        {/* Expander column - NO padding, fixed 40px width */}
        {enableExpansion && (
          <td
            className={cn(
              // z-[15] to stay above pinned data columns (z-10) but below sticky header (z-20)
              "@md:sticky z-[15] isolate text-center",
              stickyBgClass,
              !isSelected && !isActive && !isDropTarget && "group-hover:bg-surface-container-low",
              "transition-colors",
              !isLastRow && "border-b border-outline-variant/50",
              // Only show border-r if there are no pinned-left data columns after this
              showColumnBorders && !hasPinnedLeftData && "border-r border-outline-variant/50"
            )}
            style={{
              width: 40,
              minWidth: 40,
              maxWidth: 40,
              // Position after checkbox (48px) if selectable, otherwise at 0
              left: selectable ? 48 : 0,
            }}
          >
            {canExpand && (
              <button
                onClick={() => onToggleExpand(row.id)}
                className={cn(
                  // Touch-friendly: min 44px touch target with padding trick
                  "p-2 -m-1 rounded-full text-on-surface-variant transition-all",
                  "hover:bg-on-surface/8 hover:text-on-surface",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? t("collapseRow") : t("expandRow")}
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
          const rawValue = getNestedValue(row, key);

          // Create cell context
          const cellContext: CellContext<T> = {
            row,
            rowIndex,
            columnKey: key,
            value: rawValue,
            isSelected,
            isExpanded,
          };

          // Check if this cell is editable and currently being edited
          const isEditable = col.editable && inlineEditing;
          const isEditing = isEditable && inlineEditing?.isCellEditing(row.id, key);

          // Check if this is an actions column (needs overflow-visible for dropdown)
          const isActionsColumn = key.startsWith("__actions");
          const editProps = isEditable ? inlineEditing?.getCellEditProps(row.id, key, rawValue) : null;

          // Get cell selection context if enabled
          const cellSelectionCtx = cellSelectionEnabled && getCellSelectionContext
            ? getCellSelectionContext(row.id, key)
            : null;

          // Render content
          let content: ReactNode;
          if (isEditing && inlineEditing) {
            const inputProps = inlineEditing.getInputProps();
            const inputType = col.inputType ?? "text";
            content = (
              <>
                <input
                  {...inputProps}
                  type={inputType}
                  step={inputType === "number" ? "any" : undefined}
                  className={cn(
                    "absolute inset-0 w-full h-full text-body-medium",
                    "border-2 bg-surface text-on-surface",
                    "focus:outline-none",
                    col.align === "center" && "text-center",
                    col.align === "end" && "text-right pr-4",
                    col.align !== "center" && col.align !== "end" && "text-left pl-4",
                    inlineEditing.validationError
                      ? "border-error"
                      : "border-primary"
                  )}
                />
                {inlineEditing.validationError && (
                  <div
                    id={inlineEditing.getErrorMessageId()}
                    role="alert"
                    className="absolute top-full left-0 mt-1 text-label-small text-error bg-error-container px-2 py-0.5 rounded z-[5] whitespace-nowrap"
                  >
                    {inlineEditing.validationError}
                  </div>
                )}
              </>
            );
          } else {
            content = col.render
              ? col.render(row, cellContext)
              : (rawValue as ReactNode);
          }

          // Handle cell click for cell selection
          const handleCellClick = (e: React.MouseEvent) => {
            if (cellSelectionEnabled && onCellClick) {
              e.stopPropagation(); // Prevent row click
              onCellClick(row.id, key, e);
            }
          };

          // Combined keyboard handler: cell selection takes priority, then inline editing
          const handleCellKeyDown = (e: React.KeyboardEvent) => {
            // Cell selection keyboard handler takes priority
            if (cellSelectionEnabled && onCellKeyDown) {
              onCellKeyDown(e);
              // If cell selection handled it (e.g., navigation keys), don't pass to inline editing
              if (e.defaultPrevented) return;
            }
            // Then inline editing (Enter to start edit, etc.)
            if (isEditable) {
              editProps?.onKeyDown?.(e);
            } else if (inlineEditing && !col.editable) {
              // Show "not editable" feedback when user tries to edit a non-editable cell
              const isEditAttempt =
                e.key === "Enter" ||
                e.key === "F2" ||
                ((e.metaKey || e.ctrlKey) && e.key === "e") ||
                (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);
              if (isEditAttempt) {
                showNotEditableFeedback(key);
              }
            }
          };

          // Handle double-click for non-editable cells
          const handleDoubleClick = () => {
            if (isEditable) {
              editProps?.onDoubleClick?.();
            } else if (inlineEditing && !col.editable) {
              // Show feedback when user tries to edit a non-editable cell
              showNotEditableFeedback(key);
            }
          };

          // Check if this cell should show the "not editable" tooltip
          const showNotEditableTooltip = notEditableCell === key;

          // Width is handled by colgroup - only set left/right for pinned columns
          return (
            <td
              key={key}
              className={cn(
                "text-body-medium text-on-surface whitespace-nowrap",
                // Actions columns need overflow-visible for dropdown, others use overflow-hidden
                // Use group-hover/row to allow overflow on hover for tooltips
                isActionsColumn ? "overflow-visible" : "overflow-hidden text-ellipsis group-hover/row:overflow-visible",
                // Pinned cells use stickyBgClass for drop target state, others use bgClass
                pinPosition ? stickyBgClass : bgClass,
                !isSelected && !isActive && !isDropTarget && "group-hover:bg-surface-container-low",
                "transition-colors",
                !isLastRow && "border-b border-outline-variant/50",
                col.align === "center" && "text-center",
                col.align === "end" && "text-right",
                col.align !== "center" && col.align !== "end" && "text-left",
                // Pinned columns: sticky with z-10 (below header z-20) (shadow applied via inline style)
                // Only enable sticky on tablet+ (≥768px container width) - mobile scrolls everything together
                // Actions columns skip 'isolate' to allow dropdown to escape stacking context
                pinPosition && !isActionsColumn && "@md:sticky z-10 isolate",
                pinPosition && isActionsColumn && "@md:sticky z-10",
                // Column borders: show on non-pinned columns (except last), and on last pinned-left column
                showColumnBorders && !isLastColumn && !pinPosition && "border-r border-outline-variant/50",
                showColumnBorders && pinPosition === "left" && key === lastPinnedLeftKey && "border-r border-outline-variant/50",
                showColumnBorders && pinPosition === "right" && key === firstPinnedRightKey && "border-l border-outline-variant/50",
                paddingClass,
                isEditable && !isEditing && "cursor-cell",
                isEditing && "relative overflow-visible z-[3] !p-0",
                !isEditing && isActionsColumn && "overflow-visible z-[3]",
                showNotEditableTooltip && "relative overflow-visible",
                // Cell selection styling
                cellSelectionEnabled && "cursor-cell select-none",
                cellSelectionCtx?.isSelected && "bg-secondary-container/30",
                cellSelectionCtx?.isActive && "outline outline-1 outline-primary -outline-offset-1",
                // Range edge borders (Excel-like selection border) - subtle borders
                cellSelectionCtx?.isSelected && cellSelectionCtx.isRangeEdge.top && "border-t border-t-primary/70",
                cellSelectionCtx?.isSelected && cellSelectionCtx.isRangeEdge.right && "border-r border-r-primary/70",
                cellSelectionCtx?.isSelected && cellSelectionCtx.isRangeEdge.bottom && "border-b border-b-primary/70",
                cellSelectionCtx?.isSelected && cellSelectionCtx.isRangeEdge.left && "border-l border-l-primary/70"
              )}
              style={{
                left: pinPosition === "left" ? meta?.left : undefined,
                right: pinPosition === "right" ? meta?.right : undefined,
                // Pinned column elevation shadow
                boxShadow: pinPosition === "left"
                  ? "4px 0 6px -2px rgba(0, 0, 0, 0.1)"
                  : pinPosition === "right"
                  ? "-4px 0 6px -2px rgba(0, 0, 0, 0.1)"
                  : undefined,
              }}
              onClick={cellSelectionEnabled ? handleCellClick : undefined}
              onDoubleClick={(inlineEditing || editProps) ? handleDoubleClick : undefined}
              onKeyDown={(cellSelectionEnabled || isEditable || inlineEditing) ? handleCellKeyDown : undefined}
              tabIndex={isEditable || cellSelectionEnabled ? 0 : undefined}
              data-cell-id={(cellSelectionEnabled || isEditable) ? createCellId(row.id, key) : undefined}
            >
              {content}
              {/* "Not editable" tooltip */}
              {showNotEditableTooltip && (
                <div
                  role="tooltip"
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-label-small text-on-surface-variant bg-surface-container-high px-2 py-1 rounded shadow-1 z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {t("cellNotEditable")}
                </div>
              )}
            </td>
          );
        })}
      </tr>

      {/* Expanded content */}
      {isExpanded && renderExpandedRow && (
        <tr className="bg-surface-container-lowest animate-in slide-in-from-top-1 duration-snappy">
          {/* Drag handle placeholder - scrolls with content */}
          {reorderableRows && (
            <td
              className="bg-surface-container-lowest border-b border-outline-variant/50"
              style={{ width: 40, minWidth: 40, maxWidth: 40 }}
            />
          )}
          {selectable && (
            <td
              className="@md:sticky left-0 z-10 isolate bg-surface-container-lowest border-b border-outline-variant/50"
              style={{
                width: 48,
                minWidth: 48,
                maxWidth: 48,
              }}
            />
          )}
          {enableExpansion && (
            <td
              className="@md:sticky z-10 isolate bg-surface-container-lowest border-b border-outline-variant/50"
              style={{
                // Position after checkbox (48px) if selectable, otherwise at 0
                left: selectable ? 48 : 0,
                width: 40,
                minWidth: 40,
                maxWidth: 40,
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

/**
 * Memoized row component with optimized comparison.
 *
 * We compare:
 * 1. Row data and state (must re-render if changed)
 * 2. Visual config props (density, zebra, etc.)
 * 3. Structural props (columns, columnMeta)
 *
 * We intentionally skip comparing callback props (onSelect, onRowClick, etc.)
 * because:
 * - They should be stable references from parent (via useCallback)
 * - If parent re-renders, row will re-render anyway
 * - Comparing function references is cheap (===) but often causes false negatives
 */
export const DataTableRow = memo(DataTableRowInner, (prev, next) => {
  // Fast path: if row data changed, definitely re-render
  if (prev.row !== next.row) return false;

  // Row state changes
  if (
    prev.isSelected !== next.isSelected ||
    prev.isExpanded !== next.isExpanded ||
    prev.isActive !== next.isActive ||
    prev.isFocused !== next.isFocused
  ) {
    return false;
  }

  // Position and index changes
  if (
    prev.rowIndex !== next.rowIndex ||
    prev.isLastRow !== next.isLastRow ||
    prev["data-index"] !== next["data-index"]
  ) {
    return false;
  }

  // Visual configuration changes
  if (
    prev.density !== next.density ||
    prev.zebra !== next.zebra ||
    prev.selectable !== next.selectable ||
    prev.showColumnBorders !== next.showColumnBorders ||
    prev.cellSelectionEnabled !== next.cellSelectionEnabled ||
    prev.reorderableRows !== next.reorderableRows ||
    prev.groupDepth !== next.groupDepth
  ) {
    return false;
  }

  // Drag state changes (high-frequency updates during drag)
  if (
    prev.isDragging !== next.isDragging ||
    prev.isDropTarget !== next.isDropTarget ||
    prev.dropPosition !== next.dropPosition
  ) {
    return false;
  }

  // Structural changes (reference equality is intentional - parent should memoize)
  if (
    prev.columns !== next.columns ||
    prev.columnMeta !== next.columnMeta ||
    prev.style !== next.style
  ) {
    return false;
  }

  // Inline editing controller change (reference check)
  if (prev.inlineEditing !== next.inlineEditing) {
    return false;
  }

  // All checks passed - props are equal
  return true;
}) as typeof DataTableRowInner;
