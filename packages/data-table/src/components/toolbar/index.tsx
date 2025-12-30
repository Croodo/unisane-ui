"use client";

import { memo } from "react";
import { cn } from "@unisane/ui";
import { SearchInput } from "./search-input";
import {
  ActionButton,
  ToolbarTextButton,
  SegmentedIconButton,
  CompactIconButton,
} from "./buttons";
import {
  ColumnVisibilityDropdown,
  DensityDropdown,
  MoreActionsDropdown,
  LabeledDropdown,
} from "./dropdowns";
import { ExportDropdown } from "./export-dropdown";
import { SelectionBar, TitleBar, ActiveFiltersBar } from "./sections";
import type { DataTableToolbarProps } from "./types";

// Re-export types and sub-components for direct use
export * from "./types";
export { SearchInput } from "./search-input";
export {
  ToolbarDropdownButton,
  ToolbarTextButton,
  SegmentedDropdownButton,
  SegmentedIconButton,
  ActionButton,
  CompactIconButton,
} from "./buttons";
export {
  ColumnVisibilityDropdown,
  DensityDropdown,
  MoreActionsDropdown,
  LabeledDropdown,
} from "./dropdowns";
export { ExportDropdown } from "./export-dropdown";
export { SelectionBar, TitleBar, ActiveFiltersBar } from "./sections";

// ─── TOOLBAR COMPONENT ──────────────────────────────────────────────────────

function DataTableToolbarInner<T extends { id: string }>({
  title,
  searchable = true,
  selectedCount = 0,
  selectedIds = [],
  bulkActions = [],
  onClearSelection,
  onExport,
  exportHandler,
  onRefresh,
  refreshing = false,
  density = "standard",
  onDensityChange,
  startItem,
  endItem,
  totalItems,
  actions = [],
  moreActions = [],
  dropdowns = [],
  iconActions = [],
  leftContent,
  rightContent,
  showColumnToggle = true,
  showDensityToggle = true,
  showFilter = false,
  onFilterClick,
  filtersActive = false,
  segmentedControls = false,
}: DataTableToolbarProps<T>) {
  const hasSelection = selectedCount > 0;
  const hasActions = actions.length > 0 || moreActions.length > 0;
  const hasDropdowns = dropdowns.length > 0;
  const hasIconActions = iconActions.length > 0;
  const hasExport = onExport !== undefined || exportHandler !== undefined;

  // Calculate segmented button positions
  const segmentedItems: Array<{ type: "filter" | "columns" | "density" | "export" | "refresh" }> = [];
  if (showFilter) segmentedItems.push({ type: "filter" });
  if (showColumnToggle) segmentedItems.push({ type: "columns" });
  if (showDensityToggle) segmentedItems.push({ type: "density" });
  if (hasExport) segmentedItems.push({ type: "export" });
  if (onRefresh) segmentedItems.push({ type: "refresh" });

  const getSegmentedPosition = (type: string) => {
    const index = segmentedItems.findIndex((item) => item.type === type);
    return {
      isFirst: index === 0,
      isLast: index === segmentedItems.length - 1,
    };
  };

  return (
    <>
      {/* Main toolbar row */}
      <div
        className={cn(
          "relative flex items-center justify-between gap-3 px-3 h-12 bg-surface transition-shadow",
          hasSelection && "shadow-1"
        )}
      >
        {/* Left section */}
        <div className="flex items-center gap-3 min-w-0">
          {hasSelection ? (
            <SelectionBar
              selectedCount={selectedCount}
              selectedIds={selectedIds}
              bulkActions={bulkActions}
              onClearSelection={onClearSelection}
            />
          ) : (
            <>
              {/* Title and info */}
              {(title || totalItems !== undefined) && (
                <div className="flex items-center gap-3 shrink-0">
                  <TitleBar
                    title={title}
                    startItem={startItem}
                    endItem={endItem}
                    totalItems={totalItems}
                  />
                </div>
              )}

              {/* Custom left content */}
              {leftContent}

              {/* Action buttons */}
              {hasActions && (
                <>
                  {(title || totalItems !== undefined || leftContent) && (
                    <div className="h-6 w-px bg-outline-variant/50 hidden sm:block" />
                  )}
                  <div className="flex items-center gap-2">
                    {actions.map((action) => (
                      <ActionButton key={action.key} action={action} />
                    ))}
                    {moreActions.length > 0 && (
                      <MoreActionsDropdown actions={moreActions} />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Custom right content */}
          {rightContent}

          {/* Labeled dropdowns */}
          {hasDropdowns && !hasSelection && (
            <div className="flex items-center gap-2">
              {dropdowns.map((dropdown) => (
                <LabeledDropdown key={dropdown.key} dropdown={dropdown} />
              ))}
            </div>
          )}

          {/* Search input */}
          {searchable && !hasSelection && <SearchInput />}

          {/* Divider before controls */}
          {segmentedItems.length > 0 && (
            <div className="h-6 w-px bg-outline-variant/50 hidden sm:block" />
          )}

          {/* Segmented controls */}
          {segmentedControls ? (
            <div className="flex items-center">
              {showFilter && (
                <SegmentedIconButton
                  icon="filter_list"
                  label="Filter"
                  onClick={onFilterClick}
                  active={filtersActive}
                  {...getSegmentedPosition("filter")}
                />
              )}
              {showColumnToggle && (
                <ColumnVisibilityDropdown
                  segmented
                  {...getSegmentedPosition("columns")}
                />
              )}
              {showDensityToggle && (
                <DensityDropdown
                  density={density}
                  onDensityChange={onDensityChange}
                  segmented
                  {...getSegmentedPosition("density")}
                />
              )}
              {exportHandler ? (
                <ExportDropdown
                  handler={exportHandler}
                  segmented
                  {...getSegmentedPosition("export")}
                />
              ) : onExport ? (
                <SegmentedIconButton
                  icon="download"
                  label="Download"
                  onClick={onExport}
                  {...getSegmentedPosition("export")}
                />
              ) : null}
              {onRefresh && (
                <SegmentedIconButton
                  icon="refresh"
                  label="Refresh"
                  onClick={onRefresh}
                  disabled={refreshing}
                  {...getSegmentedPosition("refresh")}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {showFilter && (
                <ToolbarTextButton
                  label="Filters"
                  icon="filter_list"
                  onClick={onFilterClick}
                  active={filtersActive}
                />
              )}
              {showColumnToggle && <ColumnVisibilityDropdown />}
              {showDensityToggle && (
                <DensityDropdown density={density} onDensityChange={onDensityChange} />
              )}
              {exportHandler ? (
                <ExportDropdown handler={exportHandler} />
              ) : onExport ? (
                <ToolbarTextButton label="Export" icon="download" onClick={onExport} />
              ) : null}
              {onRefresh && (
                <ToolbarTextButton
                  label="Refresh"
                  icon="refresh"
                  onClick={onRefresh}
                  disabled={refreshing}
                />
              )}
            </div>
          )}

          {/* Custom icon actions */}
          {hasIconActions && (
            <div className="flex items-center gap-1">
              {iconActions.map((action) => (
                <CompactIconButton
                  key={action.key}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                  active={action.active}
                  disabled={action.disabled}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <ActiveFiltersBar />
    </>
  );
}

export const DataTableToolbar = memo(DataTableToolbarInner) as typeof DataTableToolbarInner;
