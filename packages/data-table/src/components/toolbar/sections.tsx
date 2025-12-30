"use client";

import { cn, Icon } from "@unisane/ui";
import type { BulkAction } from "../../types";
import { useFiltering, useColumns } from "../../context";

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
  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex items-center gap-2">
        <span className="text-body-medium font-semibold text-primary whitespace-nowrap">
          {selectedCount} selected
        </span>
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="inline-flex items-center justify-center w-6 h-6 hover:bg-primary/10 rounded text-primary/60 hover:text-primary transition-colors"
            aria-label="Clear selection"
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
  return (
    <>
      {title && (
        <h2 className="text-title-medium text-on-surface font-medium truncate">
          {title}
        </h2>
      )}
      {title && (startItem !== undefined || totalItems !== undefined) && (
        <div className="h-6 w-px bg-outline-variant hidden sm:block" />
      )}
      <span className="text-body-small text-on-surface-variant">
        {startItem !== undefined && endItem !== undefined && totalItems !== undefined
          ? `${startItem}-${endItem} of ${totalItems}`
          : totalItems !== undefined
          ? `${totalItems} items`
          : "All items"}
      </span>
    </>
  );
}

// ─── ACTIVE FILTERS BAR ────────────────────────────────────────────────────

export function ActiveFiltersBar<T>() {
  const { searchText, columnFilters, setSearch, removeFilter, clearAllFilters, hasActiveFilters } =
    useFiltering();
  const { columns } = useColumns<T>();

  if (!hasActiveFilters) return null;

  const getColumnHeader = (key: string) => {
    const col = columns.find((c) => String(c.key) === key);
    return col?.header ?? key;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low">
      <span className="text-label-small text-on-surface-variant">Filters:</span>

      {searchText && (
        <button
          onClick={() => setSearch("")}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-small hover:bg-primary/20 transition-colors"
        >
          Search: &quot;{searchText}&quot;
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
        Clear all
      </button>
    </div>
  );
}
