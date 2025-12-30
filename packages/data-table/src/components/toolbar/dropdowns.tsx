"use client";

import { cn, Icon, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem } from "@unisane/ui";
import type { Density } from "../../types";
import { useColumns } from "../../context";
import { ToolbarDropdownButton, SegmentedDropdownButton } from "./buttons";
import type { ToolbarAction, ToolbarDropdown } from "./types";

// ─── DENSITY OPTIONS ────────────────────────────────────────────────────────

const densityOptions: { value: Density; label: string; icon: string }[] = [
  { value: "compact", label: "Compact", icon: "density_small" },
  { value: "dense", label: "Dense", icon: "density_medium" },
  { value: "standard", label: "Standard", icon: "density_medium" },
  { value: "comfortable", label: "Comfortable", icon: "density_large" },
];

// ─── COLUMN VISIBILITY DROPDOWN ─────────────────────────────────────────────

export function ColumnVisibilityDropdown<T>({
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

export function DensityDropdown({
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

// ─── MORE ACTIONS DROPDOWN ─────────────────────────────────────────────────

export function MoreActionsDropdown({ actions }: { actions: ToolbarAction[] }) {
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

export function LabeledDropdown({ dropdown }: { dropdown: ToolbarDropdown }) {
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
