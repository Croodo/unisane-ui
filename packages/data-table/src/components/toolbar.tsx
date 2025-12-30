"use client";

import { memo, useState, useEffect, useRef, type ReactNode } from "react";
import {
  cn,
  Button,
  Icon,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
} from "@unisane/ui";
import type { BulkAction, Density } from "../types";
import { useFiltering, useColumns } from "../context";
import { useDebounce } from "../hooks/use-debounce";

// ─── DENSITY OPTIONS ────────────────────────────────────────────────────────

const densityOptions: { value: Density; label: string; icon: string }[] = [
  { value: "compact", label: "Compact", icon: "density_small" },
  { value: "dense", label: "Dense", icon: "density_medium" },
  { value: "standard", label: "Standard", icon: "density_medium" },
  { value: "comfortable", label: "Comfortable", icon: "density_large" },
];

// ─── TOOLBAR ACTION TYPES ───────────────────────────────────────────────────

/** Action button displayed in the toolbar */
export interface ToolbarAction {
  /** Unique key for React */
  key: string;
  /** Button label */
  label: string;
  /** Material Symbols icon name */
  icon?: string;
  /** Click handler */
  onClick: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant - primary shows filled, others show outlined */
  variant?: "primary" | "secondary" | "danger";
  /** If true, shows only icon on mobile */
  iconOnly?: boolean;
}

/** Dropdown option for toolbar dropdowns */
export interface ToolbarDropdownOption {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Material Symbols icon name */
  icon?: string;
}

/** Dropdown menu displayed in the toolbar */
export interface ToolbarDropdown {
  /** Unique key for React */
  key: string;
  /** Dropdown label prefix (e.g., "Columns:") */
  label?: string;
  /** Current selected value to display */
  value: string;
  /** Available options */
  options: ToolbarDropdownOption[];
  /** Change handler */
  onChange: (value: string) => void;
  /** Material Symbols icon name */
  icon?: string;
}

/** Icon-only button in toolbar */
export interface ToolbarIconAction {
  /** Unique key for React */
  key: string;
  /** Material Symbols icon name */
  icon: string;
  /** Tooltip/aria label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether active state */
  active?: boolean;
  /** Whether disabled */
  disabled?: boolean;
}

// ─── TOOLBAR PROPS ─────────────────────────────────────────────────────────

interface DataTableToolbarProps<T> {
  title?: string;
  searchable?: boolean;
  selectedCount?: number;
  selectedIds?: string[];
  bulkActions?: BulkAction[];
  onClearSelection?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  density?: Density;
  onDensityChange?: (density: Density) => void;
  startItem?: number;
  endItem?: number;
  totalItems?: number;
  /** Primary action buttons (left side) */
  actions?: ToolbarAction[];
  /** "More" dropdown actions for overflow */
  moreActions?: ToolbarAction[];
  /** Dropdown menus (right side, before icons) */
  dropdowns?: ToolbarDropdown[];
  /** Additional icon buttons (right side) */
  iconActions?: ToolbarIconAction[];
  /** Custom content to render in the left section */
  leftContent?: ReactNode;
  /** Custom content to render in the right section */
  rightContent?: ReactNode;
  /** Whether to show column visibility toggle */
  showColumnToggle?: boolean;
  /** Whether to show density toggle */
  showDensityToggle?: boolean;
  /** Whether to show filter button */
  showFilter?: boolean;
  /** Filter click handler */
  onFilterClick?: () => void;
  /** Whether filters are active */
  filtersActive?: boolean;
  /** Use segmented button style for toolbar controls (Columns, Density, etc.) */
  segmentedControls?: boolean;
}

// ─── SEARCH INPUT ──────────────────────────────────────────────────────────

const SEARCH_DEBOUNCE_MS = 300;

function SearchInput() {
  const { searchText, setSearch } = useFiltering();
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(searchText);
  // Debounced value for actual filtering
  const debouncedValue = useDebounce(localValue, SEARCH_DEBOUNCE_MS);
  // Track previous searchText to detect external clears
  const prevSearchTextRef = useRef(searchText);

  // Sync debounced value to context
  useEffect(() => {
    if (debouncedValue !== searchText) {
      setSearch(debouncedValue);
    }
  }, [debouncedValue, searchText, setSearch]);

  // Sync external changes (e.g., clear from filter chips)
  // Only reset when searchText was externally changed to empty
  useEffect(() => {
    // Check if searchText was externally cleared (not by us typing)
    if (prevSearchTextRef.current !== "" && searchText === "") {
      setLocalValue("");
    }
    prevSearchTextRef.current = searchText;
  }, [searchText]);

  const handleClear = () => {
    setLocalValue("");
    setSearch("");
  };

  return (
    <div className="relative flex items-center w-56 h-9 bg-surface border border-outline-variant rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
      {/* Search icon - positioned with padding */}
      <span className="flex items-center justify-center w-9 h-full shrink-0">
        <Icon
          symbol="search"
          className="w-[18px] h-[18px] text-[18px] text-on-surface-variant"
        />
      </span>
      <input
        type="text"
        placeholder="Search..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="flex-1 min-w-0 h-full pr-2 text-body-medium bg-transparent text-on-surface placeholder:text-on-surface-variant/70 outline-none"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="flex items-center justify-center w-8 h-full shrink-0 hover:bg-on-surface/8 transition-colors"
          aria-label="Clear search"
        >
          <Icon
            symbol="close"
            className="w-4 h-4 text-[16px] text-on-surface-variant"
          />
        </button>
      )}
    </div>
  );
}

// ─── TOOLBAR DROPDOWN BUTTON (Facebook Ads Manager style) ─────────────────

/** Dropdown button with icon, label, and dropdown arrow */
function ToolbarDropdownButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
  className,
  as: Component = "button",
  badge,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  as?: "button" | "div";
  /** Badge count to show on the icon */
  badge?: number;
}) {
  return (
    <Component
      onClick={onClick}
      disabled={Component === "button" ? disabled : undefined}
      className={cn(
        "inline-flex items-center gap-2 h-9 px-3 transition-colors",
        "text-body-medium font-medium rounded border border-outline-variant",
        "text-on-surface hover:bg-on-surface/5",
        "disabled:opacity-50 disabled:pointer-events-none",
        active && "text-primary border-primary/30",
        Component === "div" && "cursor-pointer",
        disabled && Component === "div" && "opacity-50 pointer-events-none",
        className
      )}
      aria-label={label}
    >
      {icon && (
        <span className="relative inline-flex">
          <Icon symbol={icon} className={cn("w-5 h-5", active ? "text-primary" : "text-on-surface-variant")} />
          {/* Badge count indicator - positioned at top-left of icon */}
          {badge !== undefined && badge > 0 && (
            <Badge size="sm" className="absolute -top-2 -left-2 z-10 !px-1 !py-0 min-w-[18px] h-[18px]">
              {badge}
            </Badge>
          )}
          {/* Active dot indicator (when active but no badge) */}
          {active && (badge === undefined || badge === 0) && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full ring-1 ring-surface" />
          )}
        </span>
      )}
      <span>{label}</span>
      <Icon symbol="arrow_drop_down" className={cn("w-5 h-5", active ? "text-primary" : "text-on-surface-variant")} />
    </Component>
  );
}

// ─── TOOLBAR TEXT BUTTON (simple action) ───────────────────────────────────

/** Simple text button for actions like Export - matches Facebook Ads Manager style */
function ToolbarTextButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
  badge,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  /** Badge count to show on the icon */
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 h-9 px-3 transition-colors",
        "text-body-medium font-medium rounded border border-outline-variant",
        "text-on-surface hover:bg-on-surface/5",
        "disabled:opacity-50 disabled:pointer-events-none",
        active && "text-primary border-primary/30"
      )}
      aria-label={label}
    >
      {icon && (
        <span className="relative inline-flex">
          <Icon symbol={icon} className={cn("w-5 h-5", active ? "text-primary" : "text-on-surface-variant")} />
          {/* Badge count indicator - positioned at top-left of icon */}
          {badge !== undefined && badge > 0 && (
            <Badge size="sm" className="absolute -top-2 -left-2 z-10 !px-1 !py-0 min-w-[18px] h-[18px]">
              {badge}
            </Badge>
          )}
          {/* Active dot indicator (when active but no badge) */}
          {active && (badge === undefined || badge === 0) && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full ring-1 ring-surface" />
          )}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}

// ─── SEGMENTED DROPDOWN BUTTON ─────────────────────────────────────────────

/** Segmented button with icon on left and dropdown arrow on right */
function SegmentedDropdownButton({
  icon,
  label,
  active = false,
  isFirst = false,
  isLast = false,
  badge,
}: {
  icon: string;
  label?: string;
  active?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  /** Badge count to show on the icon */
  badge?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-10 border border-outline-variant bg-surface transition-colors",
        "hover:bg-on-surface/5",
        active && "border-primary/30",
        isFirst && "rounded-l-lg",
        isLast && "rounded-r-lg",
        !isFirst && "-ml-px"
      )}
    >
      {/* Icon section */}
      <div className={cn(
        "flex items-center justify-center h-full px-3",
        "text-on-surface-variant",
        active && "text-primary"
      )}>
        <span className="relative inline-flex">
          <Icon symbol={icon} className="w-5 h-5" />
          {/* Badge count indicator - positioned at top-left of icon */}
          {badge !== undefined && badge > 0 && (
            <Badge size="sm" className="absolute -top-2 -left-2 z-10 !px-1 !py-0 min-w-[18px] h-[18px]">
              {badge}
            </Badge>
          )}
          {/* Active dot indicator (when active but no badge) */}
          {active && (badge === undefined || badge === 0) && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full ring-1 ring-surface" />
          )}
        </span>
        {label && (
          <span className="ml-2 text-label-large font-medium text-on-surface">{label}</span>
        )}
      </div>
      {/* Dropdown arrow section */}
      <div className={cn(
        "flex items-center justify-center h-full px-2 border-l border-outline-variant/50",
        active ? "text-primary" : "text-on-surface-variant"
      )}>
        <Icon symbol="arrow_drop_down" className="w-5 h-5" />
      </div>
    </div>
  );
}

// ─── SEGMENTED ICON BUTTON (no dropdown) ───────────────────────────────────

/** Segmented button with just icon (for actions like export, refresh) */
function SegmentedIconButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  isFirst = false,
  isLast = false,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center h-10 px-3 border border-outline-variant bg-surface transition-colors",
        "hover:bg-on-surface/5",
        "disabled:opacity-50 disabled:pointer-events-none",
        active && "bg-primary/8 border-primary/30 text-primary",
        !active && "text-on-surface-variant",
        isFirst && "rounded-l-lg",
        isLast && "rounded-r-lg",
        !isFirst && "-ml-px"
      )}
      aria-label={label}
      title={label}
    >
      <Icon symbol={icon} className="w-5 h-5" />
    </button>
  );
}

// ─── COLUMN VISIBILITY DROPDOWN ─────────────────────────────────────────────

function ColumnVisibilityDropdown<T>({
  segmented = false,
  isFirst = false,
  isLast = false,
}: {
  segmented?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const { columns, hiddenColumns, toggleVisibility } = useColumns<T>();

  const hasHiddenColumns = hiddenColumns.size > 0;

  const trigger = segmented ? (
    <SegmentedDropdownButton
      icon="view_column"
      active={hasHiddenColumns}
      badge={hiddenColumns.size}
      isFirst={isFirst}
      isLast={isLast}
    />
  ) : (
    <ToolbarDropdownButton
      label="Columns"
      icon="view_column"
      active={hasHiddenColumns}
      badge={hiddenColumns.size}
      as="div"
    />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {columns.map((col) => {
          const key = String(col.key);
          const isVisible = !hiddenColumns.has(key);
          return (
            <DropdownMenuCheckboxItem
              key={key}
              checked={isVisible}
              onCheckedChange={() => toggleVisibility(key)}
            >
              {col.header}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── DENSITY DROPDOWN ───────────────────────────────────────────────────────

function DensityDropdown({
  density,
  onDensityChange,
  segmented = false,
  isFirst = false,
  isLast = false,
}: {
  density: Density;
  onDensityChange?: (density: Density) => void;
  segmented?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const isActive = density !== "standard";

  const trigger = segmented ? (
    <SegmentedDropdownButton
      icon="density_medium"
      active={isActive}
      isFirst={isFirst}
      isLast={isLast}
    />
  ) : (
    <ToolbarDropdownButton label="Density" icon="density_medium" active={isActive} as="div" />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {densityOptions.map((option) => (
          <DropdownMenuRadioItem
            key={option.value}
            checked={density === option.value}
            onCheckedChange={() => onDensityChange?.(option.value)}
          >
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── ACTION BUTTON ─────────────────────────────────────────────────────────

function ActionButton({ action }: { action: ToolbarAction }) {
  const isPrimary = action.variant === "primary";
  const isDanger = action.variant === "danger";

  return (
    <Button
      variant={isPrimary ? "filled" : "outlined"}
      size="sm"
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        "h-9 gap-2 text-body-medium font-medium rounded",
        isDanger && "border-error text-error hover:bg-error/8",
        !isPrimary && !isDanger && "border border-outline-variant"
      )}
    >
      {action.icon && <Icon symbol={action.icon} className="w-5 h-5" />}
      <span className={action.iconOnly ? "hidden sm:inline" : undefined}>
        {action.label}
      </span>
    </Button>
  );
}

// ─── MORE ACTIONS DROPDOWN ─────────────────────────────────────────────────

function MoreActionsDropdown({ actions }: { actions: ToolbarAction[] }) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outlined" size="sm" className="h-9 gap-2 rounded border border-outline-variant">
          <span>More</span>
          <Icon symbol="arrow_drop_down" className="w-5 h-5 text-on-surface-variant" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {actions.map((action) => {
          const isDanger = action.variant === "danger";
          return (
            <DropdownMenuItem
              key={action.key}
              onClick={action.onClick}
              disabled={action.disabled}
              icon={action.icon ? <Icon symbol={action.icon} className="w-5 h-5" /> : undefined}
              className={isDanger ? "text-error" : undefined}
            >
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── LABELED DROPDOWN BUTTON ───────────────────────────────────────────────

function LabeledDropdown({ dropdown }: { dropdown: ToolbarDropdown }) {
  const selectedLabel = dropdown.options.find(o => o.value === dropdown.value)?.label ?? dropdown.value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded",
            "text-body-medium font-medium",
            "border border-outline-variant bg-surface",
            "hover:bg-on-surface/5 transition-colors"
          )}
        >
          {dropdown.icon && <Icon symbol={dropdown.icon} className="w-5 h-5 text-on-surface-variant" />}
          {dropdown.label && (
            <span className="text-on-surface-variant">{dropdown.label}</span>
          )}
          <span className="text-on-surface">{selectedLabel}</span>
          <Icon symbol="arrow_drop_down" className="w-5 h-5 text-on-surface-variant" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {dropdown.options.map((option) => (
          <DropdownMenuRadioItem
            key={option.value}
            checked={option.value === dropdown.value}
            onCheckedChange={() => dropdown.onChange(option.value)}
          >
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── COMPACT ICON BUTTON ───────────────────────────────────────────────────

function CompactIconButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
        "text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8",
        "disabled:opacity-50 disabled:pointer-events-none",
        active && "text-primary bg-primary/8"
      )}
      aria-label={label}
      title={label}
    >
      <Icon symbol={icon} className="w-5 h-5" />
    </button>
  );
}

// ─── SELECTION BAR ────────────────────────────────────────────────────────

function SelectionBar({
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

function TitleBar({
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

function ActiveFiltersBar<T>() {
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

// ─── TOOLBAR COMPONENT ──────────────────────────────────────────────────────

function DataTableToolbarInner<T extends { id: string }>({
  title,
  searchable = true,
  selectedCount = 0,
  selectedIds = [],
  bulkActions = [],
  onClearSelection,
  onExport,
  onRefresh,
  refreshing = false,
  density = "standard",
  onDensityChange,
  startItem,
  endItem,
  totalItems,
  // New props
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

  // Calculate segmented button positions
  const segmentedItems: Array<{ type: "filter" | "columns" | "density" | "export" | "refresh" }> = [];
  if (showFilter) segmentedItems.push({ type: "filter" });
  if (showColumnToggle) segmentedItems.push({ type: "columns" });
  if (showDensityToggle) segmentedItems.push({ type: "density" });
  if (onExport) segmentedItems.push({ type: "export" });
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
      {/* Main toolbar row - relative positioning for dropdowns */}
      <div
        className={cn(
          "relative flex items-center justify-between gap-3 px-3 h-12 bg-surface transition-shadow",
          hasSelection && "shadow-1"
        )}
      >
        {/* Left section - Title/Selection or Actions */}
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

        {/* Right section - Dropdowns, Search, Icons */}
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
            /* Segmented button style - connected buttons */
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
              {onExport && (
                <SegmentedIconButton
                  icon="download"
                  label="Download"
                  onClick={onExport}
                  {...getSegmentedPosition("export")}
                />
              )}
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
            /* Standard text buttons - Facebook Ads Manager style */
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
              {onExport && (
                <ToolbarTextButton label="Export" icon="download" onClick={onExport} />
              )}
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

          {/* Custom icon actions (always separate) */}
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
