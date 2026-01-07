import React from "react";
import type { Column, BulkAction, FilterState } from "../types";
import { Search, Filter, Download, RefreshCw, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { FilterPanel } from "./FilterPanel";
import {
  ToolbarButton,
  ColumnsPopover,
  DensityPopover,
  ViewOptionsMenu,
} from "./toolbar-parts";

interface ToolbarProps<T> {
  title?: string;
  searchable?: boolean;
  searchText: string;
  onSearchChange: (val: string) => void;
  selectedCount: number;
  selectedIds?: string[];
  bulkActions?: BulkAction[];
  onClearSelection?: () => void;
  columnFiltersCount: number;
  columns: Column<T>[];
  hiddenColumns: Set<string>;
  toggleColumnVisibility: (key: string) => void;
  resetColumns: () => void;
  density: "compact" | "standard" | "comfortable";
  setDensity: (d: "compact" | "standard" | "comfortable") => void;
  onExport: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  startItem?: number;
  endItem?: number;
  totalItems?: number | undefined;
  onResetPins?: () => void;
  onResetWidths?: () => void;
  onResetAll?: () => void;
  hasViewCustomizations?: boolean;
}

export const Toolbar = <T,>({
  title,
  searchable,
  searchText,
  onSearchChange,
  selectedCount,
  selectedIds = [],
  bulkActions = [],
  onClearSelection,
  columnFiltersCount,
  columns,
  hiddenColumns,
  toggleColumnVisibility,
  resetColumns,
  density,
  setDensity,
  onExport,
  onRefresh,
  refreshing = false,
  filters,
  onFiltersChange,
  startItem,
  endItem,
  totalItems,
  onResetPins,
  onResetWidths,
  onResetAll,
  hasViewCustomizations = false,
}: ToolbarProps<T>) => {
  const filterActive = columnFiltersCount > 0;
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-center justify-between px-3 border-b border-border gap-3 min-h-14 transition-colors ${
        selectedCount > 0 ? "bg-primary/5" : "bg-background"
      }`}
    >
      {/* Left section */}
      <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
        {selectedCount > 0 ? (
          <SelectionBar
            selectedCount={selectedCount}
            selectedIds={selectedIds}
            bulkActions={bulkActions}
            onClearSelection={onClearSelection}
          />
        ) : (
          <TitleBar
            title={title}
            startItem={startItem}
            endItem={endItem}
            totalItems={totalItems}
          />
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Search input */}
        {searchable && selectedCount === 0 && (
          <SearchInput value={searchText} onChange={onSearchChange} />
        )}

        <div className="flex items-center border-l border-border pl-2 ml-2 gap-1">
          {/* Filter */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <div>
                <ToolbarButton
                  icon={Filter}
                  label="Filter"
                  active={filterActive}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 w-auto">
              <FilterPanel
                columns={columns}
                filters={filters}
                onFiltersChange={onFiltersChange}
                onClose={() => setIsFilterOpen(false)}
              />
            </PopoverContent>
          </Popover>

          {/* Columns */}
          <ColumnsPopover
            columns={columns}
            hiddenColumns={hiddenColumns}
            toggleColumnVisibility={toggleColumnVisibility}
            resetColumns={resetColumns}
          />

          {/* Density */}
          <DensityPopover density={density} setDensity={setDensity} />

          {/* Export */}
          <ToolbarButton icon={Download} label="Download" onClick={onExport} />

          {/* Refresh */}
          {onRefresh && (
            <ToolbarButton
              icon={RefreshCw}
              label="Refresh"
              onClick={onRefresh}
              disabled={refreshing}
              className={refreshing ? "[&_svg]:animate-spin" : ""}
            />
          )}

          {/* View Options */}
          <ViewOptionsMenu
            onResetPins={onResetPins}
            onResetWidths={onResetWidths}
            onResetAll={onResetAll}
            hasViewCustomizations={hasViewCustomizations}
          />
        </div>

        {/* Create button */}
        <Button className="ml-2 hidden sm:flex h-8 min-w-[90px] items-center justify-center gap-2 px-4 text-sm font-medium shadow-sm">
          <Plus size={16} />
          <span>Create</span>
        </Button>
      </div>
    </div>
  );
};

// Sub-components

interface SelectionBarProps {
  selectedCount: number;
  selectedIds: string[];
  bulkActions: BulkAction[];
  onClearSelection?: (() => void) | undefined;
}

const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  selectedIds,
  bulkActions,
  onClearSelection,
}) => (
  <div className="flex items-center gap-4 w-full">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-primary whitespace-nowrap">
        {selectedCount} selected
      </span>
      {onClearSelection && (
        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-primary/10 rounded-full text-primary/60 hover:text-primary transition-colors"
          aria-label="Clear selection"
        >
          <span className="sr-only">Clear selection</span>
          <div className="h-4 w-4 flex items-center justify-center">✕</div>
        </button>
      )}
    </div>
    <div className="h-6 w-px bg-primary/10 hidden sm:block" />
    <div className="flex items-center gap-2 flex-wrap">
      {bulkActions.map((action, idx) => (
        <Button
          key={idx}
          variant={action.variant === "danger" ? "destructive" : "outline"}
          size="sm"
          onClick={() => {
            action.onClick(selectedIds);
            onClearSelection?.();
          }}
          className={`h-8 text-xs font-medium ${
            action.variant === "danger"
              ? ""
              : "bg-background hover:bg-accent border-primary/20 text-primary hover:text-primary/80"
          }`}
        >
          {action.icon && <span className="w-4 h-4 mr-1.5">{action.icon}</span>}
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  </div>
);

interface TitleBarProps {
  title?: string | undefined;
  startItem?: number | undefined;
  endItem?: number | undefined;
  totalItems?: number | undefined;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title,
  startItem,
  endItem,
  totalItems,
}) => (
  <>
    {title && <h2 className="font-medium text-foreground truncate">{title}</h2>}
    <div className="h-6 w-px bg-border hidden sm:block" />
    <div className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
      <span className="text-muted-foreground hover:text-foreground transition-colors">
        {startItem !== undefined &&
        endItem !== undefined &&
        totalItems !== undefined
          ? `${startItem}-${endItem} of ${totalItems}`
          : "All items"}
      </span>
    </div>
  </>
);

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => (
  <div className="relative group w-full sm:w-64 transition-all">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search
        size={16}
        className="text-muted-foreground group-focus-within:text-primary"
      />
    </div>
    <input
      type="text"
      placeholder="Search this table"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full pl-10 pr-3 py-1.5 border-none bg-muted rounded-md text-sm text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
    />
  </div>
);
