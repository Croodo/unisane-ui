"use client";

import { memo } from "react";
import { cn } from "@unisane/ui";
import { useI18n } from "../../i18n";
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
import {
  SelectionBar,
  TitleBar,
  ActiveFiltersBar,
  GroupingPillsBar,
  FrozenColumnsIndicator,
} from "./sections";
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
export {
  SelectionBar,
  TitleBar,
  ActiveFiltersBar,
  GroupingPillsBar,
  FrozenColumnsIndicator,
} from "./sections";
export type {
  GroupingPillsBarProps,
  FrozenColumnsIndicatorProps,
} from "./sections";

// ─── TOOLBAR COMPONENT ──────────────────────────────────────────────────────

function DataTableToolbarInner<T extends { id: string }>({
  title,
  searchable = true,
  selectedCount = 0,
  selectedIds = [],
  bulkActions = [],
  onClearSelection,
  exportHandler,
  printHandler,
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
  isGrouped = false,
  allGroupsExpanded = false,
  onToggleAllGroups,
  showGroupingPills = false,
  frozenLeftCount = 0,
  frozenRightCount = 0,
  onUnfreezeAll,
}: DataTableToolbarProps<T>) {
  const { t } = useI18n();
  const hasSelection = selectedCount > 0;
  const hasActions = actions.length > 0 || moreActions.length > 0;
  const hasDropdowns = dropdowns.length > 0;
  const hasIconActions = iconActions.length > 0;
  const hasExport = exportHandler !== undefined;
  const hasPrint = printHandler !== undefined;
  const hasFrozenColumns = frozenLeftCount > 0 || frozenRightCount > 0;

  // Calculate segmented button positions
  const segmentedItems: Array<{
    type: "filter" | "columns" | "density" | "export" | "print" | "refresh";
  }> = [];
  if (showFilter) segmentedItems.push({ type: "filter" });
  if (showColumnToggle) segmentedItems.push({ type: "columns" });
  if (showDensityToggle) segmentedItems.push({ type: "density" });
  if (hasExport) segmentedItems.push({ type: "export" });
  if (hasPrint) segmentedItems.push({ type: "print" });
  if (onRefresh) segmentedItems.push({ type: "refresh" });

  const getSegmentedPosition = (type: string) => {
    const index = segmentedItems.findIndex((item) => item.type === type);
    return {
      isFirst: index === 0,
      isLast: index === segmentedItems.length - 1,
    };
  };

  // Build overflow actions for smaller containers (< @xl)
  // Secondary actions (export, print, refresh) and user actions go in overflow
  // Primary actions (filter, columns, density) are shown as icons directly
  const overflowActions: Array<{
    key: string;
    label: string;
    icon: string;
    onClick: () => void;
    disabled?: boolean;
  }> = [];

  // Add print action
  if (printHandler) {
    overflowActions.push({
      key: "print",
      label: t("print"),
      icon: "print",
      onClick: printHandler.onPrint,
      disabled: printHandler.isPrinting,
    });
  }

  // Add refresh action
  if (onRefresh) {
    overflowActions.push({
      key: "refresh",
      label: t("refresh"),
      icon: "refresh",
      onClick: onRefresh,
      disabled: refreshing,
    });
  }

  // Add user-provided actions to overflow (shown inline at @xl+)
  actions.forEach((action) => {
    overflowActions.push({
      key: action.key,
      label: action.label,
      icon: action.icon || "more_horiz",
      onClick: action.onClick,
      disabled: action.disabled,
    });
  });

  // Add moreActions to overflow
  moreActions.forEach((action) => {
    overflowActions.push({
      key: action.key,
      label: action.label,
      icon: action.icon || "more_horiz",
      onClick: action.onClick,
      disabled: action.disabled,
    });
  });

  return (
    <>
      {/* Container query wrapper for responsive toolbar */}
      <div className="@container w-full shrink-0 relative">
        {/* Main toolbar row */}
        <div
          className={cn(
            // z-10: Within table context, below sticky zone (z-20) and sidebar (z-30)
            "relative flex items-center justify-between gap-2 @md:gap-3 px-2 @md:px-3 min-h-12 bg-surface border-b border-outline-variant/50 transition-shadow z-10",
            hasSelection && "shadow-1"
          )}
         
        >
          {/* Left section */}
          <div className="flex items-center gap-2 @md:gap-3 min-w-0 flex-1">
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
                  <TitleBar
                    title={title}
                    startItem={startItem}
                    endItem={endItem}
                    totalItems={totalItems}
                  />
                )}

                {/* Custom left content - visible @md+ */}
                {leftContent && (
                  <div className="hidden @md:flex items-center">
                    {leftContent}
                  </div>
                )}

                {/* Frozen columns indicator - visible @lg+ */}
                {hasFrozenColumns && (
                  <div className="hidden @lg:flex items-center gap-3">
                    <div className="h-6 w-px bg-outline-variant/30" />
                    <FrozenColumnsIndicator
                      frozenLeftCount={frozenLeftCount}
                      frozenRightCount={frozenRightCount}
                      onUnfreezeAll={onUnfreezeAll}
                    />
                  </div>
                )}

                {/* Action buttons - visible @xl+ */}
                {hasActions && (
                  <div className="hidden @xl:flex items-center gap-2">
                    <div className="h-6 w-px bg-outline-variant/30" />
                    {actions.map((action) => (
                      <ActionButton key={action.key} action={action} />
                    ))}
                    {moreActions.length > 0 && (
                      <MoreActionsDropdown actions={moreActions} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right section - progressive disclosure based on container width */}
          <div className="flex items-center gap-1 @md:gap-2 shrink-0">
            {/* Custom right content - visible @lg+ */}
            {rightContent && (
              <div className="hidden @lg:flex items-center">
                {rightContent}
              </div>
            )}

            {/* Labeled dropdowns - visible @xl+ */}
            {hasDropdowns && !hasSelection && (
              <div className="hidden @xl:flex items-center gap-2">
                {dropdowns.map((dropdown) => (
                  <LabeledDropdown key={dropdown.key} dropdown={dropdown} />
                ))}
              </div>
            )}

            {/* Search - icon on small, input on @3xl+ */}
            {searchable && !hasSelection && <SearchInput />}

            {/* PRIMARY ACTIONS - Always visible as icons, text labels on larger containers */}
            {/* Filter - icon always visible, text label @xl+ */}
            {showFilter && onFilterClick && !hasSelection && (
              <>
                {/* Icon only (< @xl) */}
                <div className="@xl:hidden">
                  <CompactIconButton
                    icon="filter_list"
                    label={t("filtersLabel")}
                    onClick={onFilterClick}
                    active={filtersActive}
                  />
                </div>
                {/* With text label (@xl+) - shown in full controls section below */}
              </>
            )}

            {/* Columns dropdown - compact icon on mobile */}
            {showColumnToggle && !hasSelection && (
              <div className="@xl:hidden">
                <ColumnVisibilityDropdown compact />
              </div>
            )}

            {/* Density dropdown - hidden on mobile (compact is forced), visible @md to @xl as icon */}
            {showDensityToggle && !hasSelection && (
              <div className="hidden @md:block @xl:hidden">
                <DensityDropdown
                  density={density}
                  onDensityChange={onDensityChange}
                  compact
                />
              </div>
            )}

            {/* Export dropdown - compact icon on mobile (when exportHandler is provided) */}
            {exportHandler && !hasSelection && (
              <div className="@xl:hidden">
                <ExportDropdown handler={exportHandler} compact />
              </div>
            )}

            {/* Group expand/collapse toggle - visible on all sizes */}
            {isGrouped && !hasSelection && onToggleAllGroups && (
              <CompactIconButton
                icon={allGroupsExpanded ? "unfold_less" : "unfold_more"}
                label={allGroupsExpanded ? t("collapseAllGroups") : t("expandAllGroups")}
                onClick={onToggleAllGroups}
              />
            )}

            {/* Divider before secondary controls - visible @xl+ */}
            {(hasExport || hasPrint || onRefresh) && (
              <div className="h-6 w-px bg-outline-variant/30 hidden @xl:block" />
            )}

            {/* SECONDARY ACTIONS - In overflow on small, inline with text on @xl+ */}

            {/* @xl+: Secondary actions with text labels */}
            {segmentedControls ? (
              <div className="hidden @xl:flex items-center">
                {showFilter && (
                  <SegmentedIconButton
                    icon="filter_list"
                    label={t("filter")}
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
                {exportHandler && (
                  <ExportDropdown
                    handler={exportHandler}
                    segmented
                    {...getSegmentedPosition("export")}
                  />
                )}
                {printHandler && (
                  <SegmentedIconButton
                    icon="print"
                    label={t("print")}
                    onClick={printHandler.onPrint}
                    disabled={printHandler.isPrinting}
                    {...getSegmentedPosition("print")}
                  />
                )}
                {onRefresh && (
                  <SegmentedIconButton
                    icon="refresh"
                    label={t("refresh")}
                    onClick={onRefresh}
                    disabled={refreshing}
                    {...getSegmentedPosition("refresh")}
                  />
                )}
              </div>
            ) : (
              <div className="hidden @xl:flex items-center gap-2">
                {showFilter && (
                  <ToolbarTextButton
                    label={t("filtersLabel")}
                    icon="filter_list"
                    onClick={onFilterClick}
                    active={filtersActive}
                  />
                )}
                {showColumnToggle && <ColumnVisibilityDropdown />}
                {showDensityToggle && (
                  <DensityDropdown
                    density={density}
                    onDensityChange={onDensityChange}
                  />
                )}
                {exportHandler && (
                  <ExportDropdown handler={exportHandler} />
                )}
                {printHandler && (
                  <ToolbarTextButton
                    label={t("print")}
                    icon="print"
                    onClick={printHandler.onPrint}
                    disabled={printHandler.isPrinting}
                  />
                )}
                {onRefresh && (
                  <ToolbarTextButton
                    label={t("refresh")}
                    icon="refresh"
                    onClick={onRefresh}
                    disabled={refreshing}
                  />
                )}
              </div>
            )}

            {/* < @xl: Secondary actions in overflow menu (vertical ellipsis icon) */}
            {overflowActions.length > 0 && !hasSelection && (
              <div className="@xl:hidden">
                <MoreActionsDropdown actions={overflowActions} compact />
              </div>
            )}

            {/* Custom icon actions - visible @md+ */}
            {hasIconActions && (
              <div className="hidden @md:flex items-center gap-1">
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
      </div>
      <ActiveFiltersBar />
      {showGroupingPills && <GroupingPillsBar />}
    </>
  );
}

export const DataTableToolbar = memo(
  DataTableToolbarInner
) as typeof DataTableToolbarInner;
