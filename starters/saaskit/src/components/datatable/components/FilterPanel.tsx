import React, { useState } from "react";
import type { Column, FilterState, FilterValue } from "../types";
import { ColumnFilter } from "./ColumnFilter";
import { X } from "lucide-react";

interface FilterPanelProps<T> {
  columns: Column<T>[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

export function FilterPanel<T>({
  columns,
  filters,
  onFiltersChange,
  onClose,
}: FilterPanelProps<T>) {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  const filterableColumns = columns.filter((col) => col.filterable);

  const handleFilterChange = (key: string, value: FilterValue) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  const handleClearAll = () => {
    setTempFilters({});
    onFiltersChange({});
  };

  const handleClearColumn = (key: string) => {
    const { [key]: _, ...rest } = tempFilters;
    setTempFilters(rest);
  };

  const getActiveFilterCount = (key: string) => {
    const value = tempFilters[key];
    if (!value) return 0;
    if (Array.isArray(value)) return value.length;
    if (typeof value === "string") return value.trim() ? 1 : 0;
    if (typeof value === "object") {
      // For custom filters (date range, number range)
      return Object.values(value).some((v) => v !== "" && v !== null && v !== undefined) ? 1 : 0;
    }
    return 0;
  };

  const totalActiveFilters = Object.keys(tempFilters).reduce((acc, key) => {
    return acc + getActiveFilterCount(key);
  }, 0);

  // Sync tempFilters when external filters change
  React.useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  if (filterableColumns.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No filterable columns available
      </div>
    );
  }

  return (
    <div className="w-96 max-w-[90vw]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-medium text-foreground">Filters</h3>
          {totalActiveFilters > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalActiveFilters} active {totalActiveFilters === 1 ? "filter" : "filters"}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Filters List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {filterableColumns.map((column) => {
          const key = String(column.key);
          const activeCount = getActiveFilterCount(key);

          return (
            <div key={key} className="border-b border-border last:border-b-0">
              <div className="px-4 py-3 bg-background">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {column.header}
                    </span>
                    {activeCount > 0 && (
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {activeCount}
                      </span>
                    )}
                  </div>
                  {activeCount > 0 && (
                    <button
                      onClick={() => handleClearColumn(key)}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ColumnFilter
                  column={column}
                  value={tempFilters[key] || (column.type === "select" ? [] : "")}
                  onChange={(value) => handleFilterChange(key, value)}
                  onApply={handleApply}
                  onClear={() => handleClearColumn(key)}
                  immediate={true}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border flex justify-between gap-3 bg-background">
        <button
          onClick={handleClearAll}
          disabled={totalActiveFilters === 0}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
        >
          Clear all
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-all flex-1"
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}
