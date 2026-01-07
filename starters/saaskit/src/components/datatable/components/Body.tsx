import React from "react";
import type { ReactNode } from "react";
import type { Column, PinPosition } from "../types";
import type { UseInlineEditingReturn } from "../hooks/useInlineEditing";
import { Search } from "lucide-react";
import { TableRow } from "./TableRow";

type DensityClasses = { px: string; py: string };

interface ColumnMeta {
  [key: string]: { width: number; left?: number; right?: number };
}

interface BodyProps<T extends { id: string }> {
  columns: Column<T>[];
  visibleColumns: Column<T>[];
  columnMeta: ColumnMeta;
  density: DensityClasses;
  data: T[];
  isLoading: boolean;
  renderSubComponent?: ((row: T) => ReactNode) | undefined;
  getRowCanExpand?: ((row: T) => boolean) | undefined;
  selectedRows: Set<string>;
  expandedRows: Set<string>;
  onSelectRow: (id: string, checked: boolean) => void;
  onToggleExpand: (id: string) => void;
  onClearAllFilters: () => void;
  getEffectivePinState: (col: Column<T>) => PinPosition;
  onRowClick?: ((row: T, event: React.MouseEvent) => void) | undefined;
  activeRowId?: string | undefined;
  rowClassName?: ((row: T) => string) | undefined;
  // Variant styling props
  selectable?: boolean;
  showColumnBorders?: boolean;
  zebra?: boolean;
  compact?: boolean;
  inlineEditing?: UseInlineEditingReturn<T> | undefined;
}

export function DataTableBody<T extends { id: string }>({
  columns,
  visibleColumns,
  columnMeta,
  density,
  data,
  isLoading,
  renderSubComponent,
  getRowCanExpand,
  selectedRows,
  expandedRows,
  onSelectRow,
  onToggleExpand,
  onClearAllFilters,
  getEffectivePinState,
  onRowClick,
  activeRowId,
  rowClassName,
  // Variant styling
  selectable = true,
  showColumnBorders = true,
  zebra = false,
  compact = false,
  inlineEditing,
}: BodyProps<T>) {
  // Compute column count for colspan (accounts for checkbox and expander columns)
  const colspanTotal =
    visibleColumns.length + (selectable ? 1 : 0) + (renderSubComponent ? 1 : 0);

  const normalizeRow = (row: T, index: number): T => {
    const anyRow = row as unknown as Record<string, unknown>;
    const rawId = anyRow.id ?? anyRow._id;
    const id =
      typeof rawId === "string" ? rawId : rawId != null ? String(rawId) : "";
    if (typeof anyRow.id === "string" && anyRow.id.trim().length) return row;
    if (id.trim().length) return { ...(row as unknown as object), id } as T;
    return { ...(row as unknown as object), id: `row_${index}` } as T;
  };

  if (isLoading) {
    return (
      <tbody className="bg-background">
        <tr>
          <td
            colSpan={colspanTotal}
            className="px-4 py-20 text-center text-muted-foreground"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading data...</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody className="bg-background">
        <tr>
          <td
            colSpan={colspanTotal}
            className="px-4 py-16 text-center text-muted-foreground"
          >
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search size={32} className="text-muted-foreground mb-2" />
              <span className="font-medium text-foreground">
                No results found
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  const seen = new Set<string>();
  return (
    <tbody className="bg-background">
      {data.map((row, index) => {
        const safeRow = normalizeRow(row, index);
        const key = seen.has(safeRow.id) ? `${safeRow.id}__${index}` : safeRow.id;
        seen.add(safeRow.id);
        return (
          <TableRow
            key={key}
            row={safeRow}
            index={index}
            visibleColumns={visibleColumns}
            columnMeta={columnMeta}
            density={density}
            isSelected={selectedRows.has(safeRow.id)}
            isExpanded={expandedRows.has(safeRow.id)}
            isActive={activeRowId === safeRow.id}
            canExpand={getRowCanExpand ? getRowCanExpand(safeRow) : true}
            isLastRow={index === data.length - 1}
            onSelectRow={onSelectRow}
            onToggleExpand={onToggleExpand}
            getEffectivePinState={getEffectivePinState}
            onRowClick={onRowClick}
            rowClassName={rowClassName}
            renderSubComponent={renderSubComponent}
            selectable={selectable}
            showColumnBorders={showColumnBorders}
            zebra={zebra}
            inlineEditing={inlineEditing}
          />
        );
      })}
    </tbody>
  );
}
