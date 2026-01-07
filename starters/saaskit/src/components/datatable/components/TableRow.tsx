import React, { memo } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Column, PinPosition } from "../types";
import type { UseInlineEditingReturn } from "../hooks/useInlineEditing";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getNestedValue } from "../utils/getNestedValue";
import { getRowClassName, getCellBgClass } from "../hooks/useRowStyles";
import { COLUMN_WIDTHS } from "../constants";

type DensityClasses = { px: string; py: string };

interface ColumnMeta {
  [key: string]: { width: number; left?: number; right?: number };
}

interface TableRowProps<T extends { id: string }> {
  row: T;
  index: number;
  visibleColumns: Column<T>[];
  columnMeta: ColumnMeta;
  density: DensityClasses;
  isSelected: boolean;
  isExpanded: boolean;
  isActive: boolean;
  canExpand: boolean;
  isLastRow: boolean;
  onSelectRow: (id: string, checked: boolean) => void;
  onToggleExpand: (id: string) => void;
  getEffectivePinState: (col: Column<T>) => PinPosition;
  onRowClick?: ((row: T, event: React.MouseEvent) => void) | undefined;
  rowClassName?: ((row: T) => string) | undefined;
  renderSubComponent?: ((row: T) => ReactNode) | undefined;
  // Variant styling
  selectable: boolean;
  showColumnBorders: boolean;
  zebra: boolean;
  inlineEditing?: UseInlineEditingReturn<T> | undefined;
}

/**
 * Memoized table row component to prevent unnecessary re-renders
 */
function TableRowInner<T extends { id: string }>({
  row,
  index,
  visibleColumns,
  columnMeta,
  density,
  isSelected,
  isExpanded,
  isActive,
  canExpand,
  isLastRow,
  onSelectRow,
  onToggleExpand,
  getEffectivePinState,
  onRowClick,
  rowClassName,
  renderSubComponent,
  selectable,
  showColumnBorders,
  zebra,
  inlineEditing,
}: TableRowProps<T>) {
  const isOddRow = index % 2 === 1;
  const borderBottomClass = isLastRow ? "border-b-0" : "border-b border-border";
  const customClassName = rowClassName?.(row);

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a") ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    onRowClick?.(row, e);
  };

  // Use helpers for styling
  const rowClass = getRowClassName({
    isSelected,
    isActive,
    isZebra: zebra,
    isOddRow,
    isClickable: !!onRowClick,
    customClassName,
  });

  const cellBgClass = getCellBgClass(isSelected, zebra, isOddRow);

  return (
    <>
      <tr
        onClick={onRowClick ? handleRowClick : undefined}
        className={rowClass}
      >
        {/* Checkbox column */}
        {selectable && (
          <td
            className={`md:sticky left-0 z-10 w-12 ${density.px} ${density.py} ${borderBottomClass} ${showColumnBorders ? "border-r border-border" : ""} ${cellBgClass} group-hover:bg-accent`}
            style={{
              minWidth: COLUMN_WIDTHS.checkbox,
              maxWidth: COLUMN_WIDTHS.checkbox,
            }}
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectRow(row.id, !isSelected)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                aria-label={`Select row ${row.id}`}
              />
            </div>
          </td>
        )}

        {/* Expander column */}
        {renderSubComponent && (
          <td
            className={`md:sticky z-10 w-10 ${density.px} ${density.py} ${borderBottomClass} ${showColumnBorders ? "border-r border-border" : ""} text-center ${cellBgClass} group-hover:bg-accent`}
            style={{
              left: selectable ? COLUMN_WIDTHS.checkbox : 0,
              minWidth: COLUMN_WIDTHS.expander,
              maxWidth: COLUMN_WIDTHS.expander,
            }}
          >
            {canExpand && (
              <button
                onClick={() => onToggleExpand(row.id)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
          </td>
        )}

        {/* Data columns */}
        {visibleColumns.map((col, colIndex) => {
          const colKey = String(col.key);
          const meta = columnMeta[colKey] ?? { width: 150 };
          const effectivePin = getEffectivePinState(col);
          const isPinnedLeft = effectivePin === "left";
          const isPinnedRight = effectivePin === "right";
          const isLastColumn = colIndex === visibleColumns.length - 1;

          const isEditable = !!inlineEditing && !!col.editable;

          // Determine the raw value used for editing
          const rawValue = getNestedValue(row, colKey);
          const editProps = isEditable
            ? inlineEditing?.getCellEditProps(row.id, colKey, rawValue)
            : undefined;
          const isCellEditing = editProps?.isEditing ?? false;

          let stickyClass = "";
          const stickyStyle: CSSProperties = {
            width: meta.width,
            minWidth: meta.width,
            maxWidth: meta.width,
          };

          if (isPinnedLeft) {
            stickyClass =
              "md:sticky z-10 border-r border-border md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-right";
            stickyStyle.left = meta.left;
          } else if (isPinnedRight) {
            stickyClass =
              "md:sticky z-10 border-l border-border md:shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-left";
            stickyStyle.right = meta.right;
          }

          const paddingClass = isCellEditing
            ? "px-0 py-0"
            : `${density.px} ${density.py}`;

          const baseAlignClass =
            col.align === "right"
              ? "text-right"
              : col.align === "center"
                ? "text-center"
                : "text-left";

          const nameHighlightClass =
            colKey === "name" && !isCellEditing
              ? "font-medium text-primary hover:underline cursor-pointer"
              : "";

          const cellBorderClass =
            showColumnBorders &&
            !isLastColumn &&
            !isPinnedLeft &&
            !isPinnedRight
              ? "border-r border-border"
              : "";

          const editingRingClass = isCellEditing
            ? "ring-[1.5px] ring-primary ring-inset "
            : "";

          let content: ReactNode;

          if (isEditable && isCellEditing && inlineEditing) {
            const hasError = !!inlineEditing.validationError;
            content = (
              <input
                {...inlineEditing.getInputProps()}
                className={`block w-full bg-transparent border-none outline-none px-2 py-0 text-sm leading-none ${
                  baseAlignClass
                } ${hasError ? "text-destructive" : ""}`}
              />
            );
          } else {
            const display = col.render
              ? col.render(row)
              : (rawValue as ReactNode);
            content = <>{display}</>;
          }

          return (
            <td
              key={`${row.id}-${colKey}`}
              className={`${paddingClass} text-sm text-foreground whitespace-nowrap ${borderBottomClass} overflow-hidden ${
                colKey !== "actions" ? "text-ellipsis" : ""
              } ${stickyClass} ${cellBgClass} group-hover:bg-accent ${cellBorderClass} ${baseAlignClass} ${nameHighlightClass} ${editingRingClass}`}
              style={stickyStyle}
              onDoubleClick={editProps?.onDoubleClick}
              onKeyDown={editProps?.onKeyDown}
            >
              {content}
            </td>
          );
        })}
      </tr>

      {/* Expanded sub-row */}
      {isExpanded && renderSubComponent && (
        <tr className="bg-muted/50 animate-in slide-in-from-top-2 duration-200">
          {selectable && (
            <td
              className={`sticky left-0 z-10 bg-muted ${showColumnBorders ? "border-r border-border" : ""}`}
              style={{ width: "48px", minWidth: "48px" }}
            />
          )}
          <td
            className={`sticky z-10 bg-muted ${showColumnBorders ? "border-r border-border" : ""}`}
            style={{
              left: selectable ? 48 : 0,
              width: "40px",
              minWidth: "40px",
            }}
          />
          <td
            colSpan={visibleColumns.length}
            className="p-0 border-b border-border"
          >
            <div className="p-4 border-l-4 border-primary bg-background shadow-inner">
              {renderSubComponent(row)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * Memoized TableRow - only re-renders when row data or selection state changes
 */
export const TableRow = memo(TableRowInner, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.row === nextProps.row &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.index === nextProps.index &&
    prevProps.isLastRow === nextProps.isLastRow &&
    prevProps.columnMeta === nextProps.columnMeta &&
    prevProps.visibleColumns === nextProps.visibleColumns &&
    prevProps.density === nextProps.density &&
    prevProps.zebra === nextProps.zebra &&
    prevProps.selectable === nextProps.selectable &&
    prevProps.showColumnBorders === nextProps.showColumnBorders &&
    prevProps.inlineEditing?.editingCell ===
      nextProps.inlineEditing?.editingCell &&
    prevProps.inlineEditing?.validationError ===
      nextProps.inlineEditing?.validationError
  );
}) as typeof TableRowInner;
