"use client";

import { cn, Icon, Badge, Button } from "@unisane/ui";
import type { ToolbarAction } from "./types";

// ─── TOOLBAR DROPDOWN BUTTON (Facebook Ads Manager style) ─────────────────

/** Dropdown button with icon, label, and dropdown arrow */
export function ToolbarDropdownButton({
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
export function ToolbarTextButton({
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
export function SegmentedDropdownButton({
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
export function SegmentedIconButton({
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

// ─── ACTION BUTTON ─────────────────────────────────────────────────────────

export function ActionButton({ action }: { action: ToolbarAction }) {
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

// ─── COMPACT ICON BUTTON ───────────────────────────────────────────────────

export function CompactIconButton({
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
