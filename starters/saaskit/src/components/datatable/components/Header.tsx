import React, { useState } from "react";
import type { CSSProperties } from "react";
import { ColumnFilter } from "./ColumnFilter";
import type { Column, SortDirection, FilterState, PinPosition } from "../types";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Filter as FilterIcon,
  Pin,
  PinOff,
  MoreVertical,
} from "lucide-react";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useColumnResize } from "../hooks/useColumnResize";
import { COLUMN_WIDTHS, Z_INDEX } from "../constants";

interface ColumnMeta {
  [key: string]: { width: number; left?: number; right?: number };
}

interface DataTableHeaderProps<T> {
  columns: Column<T>[];
  sortColumn: keyof T | string | null;
  sortDirection: SortDirection;
  filters: FilterState;
  onSort: (key: keyof T | string) => void;
  onFilter: (key: string, value: unknown) => void;
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  indeterminate: boolean;
  columnMeta: ColumnMeta;
  onColumnResize: (key: string, newWidth: number) => void;
  enableExpansion: boolean;
  getEffectivePinState: (col: Column<T>) => PinPosition;
  onColumnPinChange: (columnKey: string, pinned: PinPosition) => void;
  // Variant styling props
  selectable?: boolean;
  showColumnBorders?: boolean;
}

export const DataTableHeader = <T,>({
  columns,
  sortColumn,
  sortDirection,
  filters,
  onSort,
  onFilter,
  onSelectAll,
  allSelected,
  indeterminate,
  columnMeta,
  onColumnResize,
  enableExpansion,
  getEffectivePinState,
  onColumnPinChange,
  // Variant styling
  selectable = true,
  showColumnBorders = true,
}: DataTableHeaderProps<T>) => {
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const { startResize } = useColumnResize(onColumnResize);

  return (
    <TooltipProvider>
      <thead className="bg-background border-b border-border shadow-sm">
        <tr>
          {/* Checkbox header - conditional */}
          {selectable && (
            <th
              className={`md:sticky left-0 z-30 w-12 px-4 py-3 bg-background ${showColumnBorders ? "border-r border-border" : ""}`}
              style={{
                minWidth: COLUMN_WIDTHS.checkbox,
                maxWidth: COLUMN_WIDTHS.checkbox,
              }}
            >
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = indeterminate;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer transition-colors"
                  aria-label="Select all rows"
                />
              </div>
            </th>
          )}

          {/* Expander header */}
          {enableExpansion && (
            <th
              className={`md:sticky z-30 w-10 px-0 py-3 bg-background ${showColumnBorders ? "border-r border-border" : ""}`}
              style={{
                left: selectable ? COLUMN_WIDTHS.checkbox : 0,
                minWidth: COLUMN_WIDTHS.expander,
                maxWidth: COLUMN_WIDTHS.expander,
              }}
            />
          )}

          {columns.map((col, colIndex) => {
            const colKey = String(col.key);
            const isSorted = sortColumn === colKey;
            const currentFilter = filters[colKey];
            const isFiltered = Array.isArray(currentFilter)
              ? currentFilter.length > 0
              : Boolean(currentFilter);
            const actionsForcedVisible =
              isFiltered || activeFilterCol === colKey || isSorted;

            const meta = columnMeta[colKey] || { width: 150 };
            const effectivePin = getEffectivePinState(col);
            const isPinnedLeft = effectivePin === "left";
            const isPinnedRight = effectivePin === "right";
            const isLastColumn = colIndex === columns.length - 1;

            const stickyStyle: CSSProperties = {
              width: meta.width,
              minWidth: meta.width,
              maxWidth: meta.width,
            };

            // Pinned columns always have borders for visual separation
            let stickyClass = "";
            if (isPinnedLeft) {
              stickyClass =
                "md:sticky z-30 border-r border-border md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-right";
              stickyStyle.left = meta.left;
            } else if (isPinnedRight) {
              stickyClass =
                "md:sticky z-30 border-l border-border md:shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] clip-left";
              stickyStyle.right = meta.right;
            }

            // Column border: apply if showColumnBorders is true, except for last column
            const cellBorderClass =
              showColumnBorders &&
              !isLastColumn &&
              !isPinnedLeft &&
              !isPinnedRight
                ? "border-r border-border"
                : "";

            return (
              <th
                key={colKey}
                scope="col"
                aria-sort={
                  isSorted
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className={`group px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-background select-none relative ${stickyClass} ${cellBorderClass} ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
                style={{ ...stickyStyle }}
              >
                <div className="relative flex items-center min-w-0">
                  <div
                    className={`flex items-center gap-2 min-w-0 transition-[padding-right] ${actionsForcedVisible ? "pr-16" : "pr-0"}`}
                  >
                    <span className="truncate">{col.header}</span>
                  </div>

                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background pl-1 ${
                      actionsForcedVisible
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    } transition-opacity`}
                  >
                    {col.sortable && (
                      <button
                        onClick={() => onSort(col.key)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground"
                        aria-label={`Sort by ${col.header}`}
                      >
                        {isSorted ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Filter button */}
                    {col.filterable && (
                      <Popover
                        open={activeFilterCol === colKey}
                        onOpenChange={(open) =>
                          setActiveFilterCol(open ? colKey : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <button
                            className={`p-1 rounded hover:bg-accent transition-colors text-muted-foreground ${
                              isFiltered ? "text-primary" : ""
                            }`}
                            aria-label={`Filter ${col.header}`}
                          >
                            <FilterIcon className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 p-0">
                          <ColumnFilter
                            column={col}
                            value={currentFilter}
                            onChange={(value) => {
                              onFilter(colKey, value);
                            }}
                            onApply={() => setActiveFilterCol(null)}
                            onClear={() => setActiveFilterCol(null)}
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Column menu with pin options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 p-1 rounded hover:bg-accent text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onColumnPinChange(colKey, "left")}
                          disabled={isPinnedLeft}
                        >
                          <Pin className="w-4 h-4 mr-2" />
                          {isPinnedLeft ? "✓ " : ""}Pin Left
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onColumnPinChange(colKey, "right")}
                          disabled={isPinnedRight}
                        >
                          <Pin className="w-4 h-4 mr-2" />
                          {isPinnedRight ? "✓ " : ""}Pin Right
                        </DropdownMenuItem>
                        {effectivePin && (
                          <DropdownMenuItem
                            onClick={() => onColumnPinChange(colKey, null)}
                          >
                            <PinOff className="w-4 h-4 mr-2" />
                            Unpin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div
                  className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 cursor-col-resize bg-transparent hover:bg-primary/10 z-40 transition-all"
                  onMouseDown={(e) => startResize(e, colKey, meta.width)}
                  onClick={(e) => e.stopPropagation()}
                  title="Resize column"
                />
              </th>
            );
          })}
        </tr>
      </thead>
    </TooltipProvider>
  );
};
