"use client";

import React, { useState, useCallback } from "react";
import {
  cn,
  Icon,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@unisane/ui";
import type { Column, PinPosition, FilterValue } from "../../types";

export interface ColumnMenuProps<T> {
  column: Column<T>;
  pinPosition: PinPosition;
  pinnable: boolean;
  currentFilter?: FilterValue;
  hasActiveFilter: boolean;
  onPin: (position: PinPosition) => void;
  onHide: () => void;
  onFilter?: (value: FilterValue) => void;
  /** Whether grouping is enabled for the table */
  groupingEnabled?: boolean;
  /** Current column(s) being grouped by */
  groupBy?: string | string[] | null;
  /** Normalized array of groupBy keys */
  groupByArray?: string[];
  /** Callback to set groupBy column(s) */
  onGroupBy?: (key: string | string[] | null) => void;
  /** Callback to add a column to multi-level grouping */
  onAddGroupBy?: (key: string) => void;
}

export function ColumnMenu<T>({
  column,
  pinPosition,
  pinnable,
  currentFilter,
  hasActiveFilter,
  onPin,
  onHide,
  onFilter,
  groupingEnabled = false,
  groupBy,
  groupByArray = [],
  onGroupBy,
  onAddGroupBy,
}: ColumnMenuProps<T>) {
  const [filterInputValue, setFilterInputValue] = useState(
    typeof currentFilter === "string" ? currentFilter : ""
  );

  const hasFilterOptions = column.filterable !== false;

  // Handle text filter submission
  const handleFilterSubmit = useCallback(() => {
    if (filterInputValue.trim()) {
      onFilter?.(filterInputValue.trim());
    }
  }, [filterInputValue, onFilter]);

  // Handle clearing the filter
  const handleFilterClear = useCallback(() => {
    setFilterInputValue("");
    onFilter?.(null);
  }, [onFilter]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded hover:bg-on-surface/10 transition-colors",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              "outline-none shrink-0"
            )}
          >
            <Icon symbol="more_vert" className="text-[18px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {/* Filter options */}
          {hasFilterOptions && (
            <>
              {column.filterType === "select" && column.filterOptions ? (
                <SelectFilter
                  column={column}
                  currentFilter={currentFilter}
                  hasActiveFilter={hasActiveFilter}
                  onFilter={onFilter}
                />
              ) : (
                <TextFilter
                  column={column}
                  filterInputValue={filterInputValue}
                  hasActiveFilter={hasActiveFilter}
                  onInputChange={setFilterInputValue}
                  onSubmit={handleFilterSubmit}
                  onClear={handleFilterClear}
                />
              )}
              {((pinnable && column.pinnable !== false) || column.hideable !== false) && (
                <DropdownMenuSeparator />
              )}
            </>
          )}

          {/* Pin options */}
          {pinnable && column.pinnable !== false && (
            <>
              <DropdownMenuItem
                onClick={() => onPin(pinPosition === "left" ? null : "left")}
                icon={<Icon symbol="push_pin" className="w-4 h-4 -rotate-45" />}
              >
                {pinPosition === "left" ? "Unpin from left" : "Pin to left"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onPin(pinPosition === "right" ? null : "right")}
                icon={<Icon symbol="push_pin" className="w-4 h-4 rotate-45" />}
              >
                {pinPosition === "right" ? "Unpin from right" : "Pin to right"}
              </DropdownMenuItem>
              {(column.hideable !== false || groupingEnabled) && <DropdownMenuSeparator />}
            </>
          )}

          {/* Group by this column */}
          {/* Only show grouping for columns that are explicitly groupable OR have select filter (categorical data) */}
          {groupingEnabled && (column.groupable === true || (column.groupable !== false && column.filterType === "select")) && (
            <>
              {(() => {
                const columnKey = String(column.key);
                const isColumnGrouped = groupByArray.includes(columnKey);
                const hasExistingGrouping = groupByArray.length > 0;

                return (
                  <>
                    {/* Primary grouping action */}
                    <DropdownMenuItem
                      onClick={() => {
                        if (isColumnGrouped) {
                          // Remove this column from grouping
                          if (groupByArray.length === 1) {
                            onGroupBy?.(null);
                          } else {
                            const newGroupBy = groupByArray.filter((k) => k !== columnKey);
                            onGroupBy?.(newGroupBy.length === 1 ? newGroupBy[0]! : newGroupBy);
                          }
                        } else {
                          // Set as the only grouping column
                          onGroupBy?.(columnKey);
                        }
                      }}
                      icon={<Icon symbol="workspaces" className="w-4 h-4" />}
                    >
                      {isColumnGrouped ? "Remove grouping" : "Group by this column"}
                    </DropdownMenuItem>

                    {/* Add to multi-level grouping (only show if there's existing grouping and this column isn't grouped) */}
                    {hasExistingGrouping && !isColumnGrouped && onAddGroupBy && (
                      <DropdownMenuItem
                        onClick={() => onAddGroupBy(columnKey)}
                        icon={<Icon symbol="add" className="w-4 h-4" />}
                      >
                        Add to grouping (Level {groupByArray.length + 1})
                      </DropdownMenuItem>
                    )}
                  </>
                );
              })()}
              {column.hideable !== false && <DropdownMenuSeparator />}
            </>
          )}

          {/* Hide column */}
          {column.hideable !== false && (
            <DropdownMenuItem
              onClick={onHide}
              icon={<Icon symbol="visibility_off" className="w-4 h-4" />}
            >
              Hide column
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── SELECT FILTER ───────────────────────────────────────────────────────────

interface SelectFilterProps<T> {
  column: Column<T>;
  currentFilter?: FilterValue;
  hasActiveFilter: boolean;
  onFilter?: (value: FilterValue) => void;
}

function SelectFilter<T>({
  column,
  currentFilter,
  hasActiveFilter,
  onFilter,
}: SelectFilterProps<T>) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        icon={<Icon symbol="filter_alt" className="w-4 h-4" />}
      >
        Filter by {column.header}
        {hasActiveFilter && (
          <span className="ml-auto text-primary text-xs">Active</span>
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-40">
        {column.filterOptions?.map((opt) => (
          <DropdownMenuItem
            key={String(opt.value)}
            onClick={() => onFilter?.(opt.value)}
            className={currentFilter === opt.value ? "bg-primary/8 text-primary" : ""}
          >
            <span className="flex items-center gap-2 w-full">
              {currentFilter === opt.value && (
                <Icon symbol="check" className="w-4 h-4" />
              )}
              <span className={currentFilter !== opt.value ? "ml-6" : ""}>
                {opt.label}
              </span>
              {opt.count !== undefined && (
                <span className="ml-auto text-on-surface-variant text-xs">
                  {opt.count}
                </span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
        {hasActiveFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFilter?.(null)}
              icon={<Icon symbol="close" className="w-4 h-4" />}
            >
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

// ─── TEXT FILTER ─────────────────────────────────────────────────────────────

interface TextFilterProps<T> {
  column: Column<T>;
  filterInputValue: string;
  hasActiveFilter: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

function TextFilter<T>({
  column,
  filterInputValue,
  hasActiveFilter,
  onInputChange,
  onSubmit,
  onClear,
}: TextFilterProps<T>) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        icon={<Icon symbol="filter_alt" className="w-4 h-4" />}
      >
        Filter by {column.header}
        {hasActiveFilter && (
          <span className="ml-auto text-primary text-xs">Active</span>
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-56 p-2">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={filterInputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
              // Stop propagation to prevent dropdown from closing
              e.stopPropagation();
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            placeholder={`Search ${column.header}...`}
            className={cn(
              "w-full px-3 py-2 text-body-medium",
              "bg-surface border border-outline-variant rounded-sm",
              "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
              "placeholder:text-on-surface-variant/60"
            )}
            autoFocus
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!filterInputValue.trim()}
              className={cn(
                "flex-1 px-3 py-1.5 text-label-medium rounded",
                "bg-primary text-on-primary",
                "hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Apply
            </button>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={onClear}
                className={cn(
                  "px-3 py-1.5 text-label-medium rounded",
                  "bg-surface-container text-on-surface",
                  "hover:bg-surface-container-high transition-colors"
                )}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
