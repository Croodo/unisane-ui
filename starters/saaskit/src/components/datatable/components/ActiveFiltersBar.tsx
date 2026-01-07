import React from "react";
import type { FilterState, Column } from "../types";
import { FilterPill } from "./FilterPill";
import { formatFilterValue } from "../utils/formatFilterValue";
import { Button } from "@/src/components/ui/button";

interface ActiveFiltersBarProps<T> {
  searchText: string;
  columnFilters: FilterState;
  columns: Column<T>[];
  onClearSearch: () => void;
  onRemoveFilter: (key: string, value: null) => void;
  onClearAll: () => void;
}

export const ActiveFiltersBar = <T,>({
  searchText,
  columnFilters,
  columns,
  onClearSearch,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersBarProps<T>) => {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-muted min-h-[38px]">
      <span className="text-xs font-semibold text-muted-foreground uppercase mr-1">Active Filters:</span>
      {searchText && <FilterPill label="Global" value={searchText} onClear={onClearSearch} />}
      {Object.entries(columnFilters).map(([key, val]) => {
        const col = columns.find((c) => String(c.key) === key);
        const label = col?.header || key;
        return (
          <FilterPill
            key={key}
            label={label}
            value={formatFilterValue(val)}
            onClear={() => onRemoveFilter(key, null)}
          />
        );
      })}
      <Button variant="link" className="text-xs ml-auto px-0" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
};
