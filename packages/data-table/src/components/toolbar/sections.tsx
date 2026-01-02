"use client";

import { cn, Icon } from "@unisane/ui";
import type { BulkAction } from "../../types";
import { useFiltering, useColumns, useGrouping } from "../../context";
import { useI18n } from "../../i18n";

// ─── SELECTION BAR ────────────────────────────────────────────────────────

export function SelectionBar({
  selectedCount,
  selectedIds,
  bulkActions,
  onClearSelection,
}: {
  selectedCount: number;
  selectedIds: string[];
  bulkActions: BulkAction[];
  onClearSelection?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex items-center gap-2">
        <span className="text-body-medium font-semibold text-primary whitespace-nowrap">
          {t("selectedCount", { count: selectedCount })}
        </span>
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="inline-flex items-center justify-center w-6 h-6 hover:bg-primary/10 rounded text-primary/60 hover:text-primary transition-colors"
            aria-label={t("deselectAll")}
          >
            <Icon symbol="close" className="text-[18px]" />
          </button>
        )}
      </div>
      <div className="h-6 w-px bg-primary/20 hidden sm:block" />
      <div className="flex items-center gap-2 flex-wrap">
        {bulkActions.map((action, idx) => {
          const isDisabled = typeof action.disabled === "function"
            ? action.disabled(selectedIds)
            : action.disabled;
          const isDanger = action.variant === "danger";

          return (
            <button
              key={idx}
              onClick={() => action.onClick(selectedIds)}
              disabled={isDisabled}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 transition-colors",
                "text-body-medium font-medium rounded border",
                "disabled:opacity-50 disabled:pointer-events-none",
                isDanger
                  ? "border-error/30 text-error hover:bg-error/8"
                  : "border-primary/30 text-primary hover:bg-primary/8"
              )}
            >
              {typeof action.icon === "string" ? (
                <Icon symbol={action.icon} className="text-[18px]" />
              ) : action.icon ? (
                <span>{action.icon}</span>
              ) : null}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── TITLE BAR ────────────────────────────────────────────────────────────

export function TitleBar({
  title,
  startItem,
  endItem,
  totalItems,
}: {
  title?: string;
  startItem?: number;
  endItem?: number;
  totalItems?: number;
}) {
  const { t, formatNumber } = useI18n();
  return (
    <>
      {title && (
        <h2 className="text-title-medium text-on-surface font-medium truncate">
          {title}
        </h2>
      )}
      {title && (startItem !== undefined || totalItems !== undefined) && (
        <div className="h-6 w-px bg-outline-variant/30 hidden sm:block" />
      )}
      <span className="text-body-small text-on-surface-variant">
        {startItem !== undefined && endItem !== undefined && totalItems !== undefined
          ? t("rangeOfTotal", { start: formatNumber(startItem), end: formatNumber(endItem), total: formatNumber(totalItems) })
          : totalItems !== undefined
          ? t("itemCount", { count: totalItems })
          : t("allItems")}
      </span>
    </>
  );
}

// ─── ACTIVE FILTERS BAR ────────────────────────────────────────────────────

export function ActiveFiltersBar<T>() {
  const { t } = useI18n();
  const { searchText, columnFilters, setSearch, removeFilter, clearAllFilters, hasActiveFilters } =
    useFiltering();
  const { columns } = useColumns<T>();

  if (!hasActiveFilters) return null;

  const getColumnHeader = (key: string) => {
    const col = columns.find((c) => String(c.key) === key);
    return col?.header ?? key;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border-b border-outline-variant/30">
      <span className="text-label-small text-on-surface-variant">{t("filtersLabel")}:</span>

      {searchText && (
        <button
          onClick={() => setSearch("")}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-small hover:bg-primary/20 transition-colors"
        >
          {t("searchLabel")}: &quot;{searchText}&quot;
          <Icon symbol="close" className="w-3 h-3" />
        </button>
      )}

      {Object.entries(columnFilters).map(([key, value]) => (
        <button
          key={key}
          onClick={() => removeFilter(key)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-small hover:bg-primary/20 transition-colors"
        >
          {getColumnHeader(key)}: {String(value)}
          <Icon symbol="close" className="w-3 h-3" />
        </button>
      ))}

      <button
        onClick={clearAllFilters}
        className="text-label-small text-error hover:underline ml-2"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}

// ─── GROUPING PILLS BAR ─────────────────────────────────────────────────────

export interface GroupingPillsBarProps {
  /** Whether to show the bar even when no grouping is active (shows "No grouping" state) */
  showEmpty?: boolean;
}

/**
 * Displays active row groupings as removable chips/pills.
 * Shows grouping hierarchy with drag handles for reordering (future).
 */
export function GroupingPillsBar<T>({ showEmpty = false }: GroupingPillsBarProps = {}) {
  const { t } = useI18n();
  const { groupByArray, removeGroupBy, setGroupBy, isGrouped } = useGrouping();
  const { columns } = useColumns<T>();

  // Don't render if no grouping and showEmpty is false
  if (!isGrouped && !showEmpty) return null;

  const getColumnHeader = (key: string) => {
    const col = columns.find((c) => String(c.key) === key);
    return col?.header ?? key;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border-b border-outline-variant/30">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        <Icon symbol="account_tree" className="text-[16px]" />
        <span className="text-label-small font-medium">{t("groupedByLabel")}:</span>
      </div>

      {isGrouped ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {groupByArray.map((key, index) => (
            <div key={key} className="flex items-center">
              {/* Hierarchy arrow for multi-level grouping */}
              {index > 0 && (
                <Icon
                  symbol="chevron_right"
                  className="text-[16px] text-on-surface-variant/50 mx-0.5"
                />
              )}
              <GroupingPill
                label={getColumnHeader(key)}
                level={index + 1}
                onRemove={() => removeGroupBy(key)}
              />
            </div>
          ))}

          {/* Clear all grouping button */}
          {groupByArray.length > 1 && (
            <button
              onClick={() => setGroupBy(null)}
              className="text-label-small text-error hover:underline ml-2"
            >
              {t("clearAll")}
            </button>
          )}
        </div>
      ) : (
        <span className="text-label-small text-on-surface-variant/60 italic">
          {t("none")}
        </span>
      )}
    </div>
  );
}

// ─── GROUPING PILL ──────────────────────────────────────────────────────────

interface GroupingPillProps {
  label: string;
  level: number;
  onRemove: () => void;
}

function GroupingPill({ label, level, onRemove }: GroupingPillProps) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full",
        "text-label-small font-medium transition-colors",
        "bg-secondary-container text-on-secondary-container",
        "hover:bg-secondary-container/80"
      )}
    >
      {/* Level indicator for multi-level grouping */}
      {level > 1 && (
        <span className="text-[10px] font-bold opacity-60">{level}</span>
      )}
      <span>{label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-on-secondary-container/10 transition-colors"
        aria-label={t("removeGroupingLabel", { label })}
      >
        <Icon symbol="close" className="text-[12px]" />
      </button>
    </span>
  );
}

// ─── FROZEN COLUMNS INDICATOR ───────────────────────────────────────────────

export interface FrozenColumnsIndicatorProps {
  /** Number of columns frozen on the left */
  frozenLeftCount: number;
  /** Number of columns frozen on the right */
  frozenRightCount: number;
  /** Callback to unfreeze all columns */
  onUnfreezeAll?: () => void;
}

/**
 * Displays a compact indicator showing the number of frozen columns.
 * Can be placed in the toolbar to inform users about column freezing state.
 */
export function FrozenColumnsIndicator({
  frozenLeftCount,
  frozenRightCount,
  onUnfreezeAll,
}: FrozenColumnsIndicatorProps) {
  const { t } = useI18n();
  const totalFrozen = frozenLeftCount + frozenRightCount;

  if (totalFrozen === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded",
          "text-label-small font-medium",
          "bg-tertiary-container/50 text-on-tertiary-container"
        )}
      >
        <Icon symbol="push_pin" className="text-[14px] -rotate-45" />
        <span>
          {frozenLeftCount > 0 && t("frozenLeft", { count: frozenLeftCount })}
          {frozenLeftCount > 0 && frozenRightCount > 0 && ", "}
          {frozenRightCount > 0 && t("frozenRight", { count: frozenRightCount })}
        </span>
        {onUnfreezeAll && (
          <button
            onClick={onUnfreezeAll}
            className="inline-flex items-center justify-center w-4 h-4 rounded hover:bg-on-tertiary-container/10 transition-colors ml-0.5"
            aria-label={t("unfreezeAll")}
          >
            <Icon symbol="close" className="text-[12px]" />
          </button>
        )}
      </span>
    </div>
  );
}
