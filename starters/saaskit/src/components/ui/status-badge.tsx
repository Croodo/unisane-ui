"use client";

import * as React from "react";
import { cn } from "@unisane/ui/lib/utils";
import { Icon } from "@unisane/ui/primitives/icon";
import { Typography } from "@unisane/ui/components/typography";
import {
  getStatusConfig,
  getStatusStyles,
  type StatusCategory,
} from "@unisane/kernel/client";

/** Material Symbol icons for each status category */
const CATEGORY_ICONS: Record<StatusCategory, string> = {
  success: "check_circle",
  warning: "warning",
  error: "cancel",
  info: "info",
  pending: "schedule",
  neutral: "circle",
};

export interface StatusBadgeProps {
  /** Status string (e.g., "success", "failed", "pending") */
  status: string;
  /** Show icon alongside text */
  showIcon?: boolean;
  /** Custom icon override */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Render as dot only (no text) */
  dotOnly?: boolean;
  /** Override display label */
  label?: string;
}

/**
 * StatusBadge - Consistent status badge styling across the app
 *
 * Uses SSOT from src/shared/constants/status.ts
 *
 * @example
 * <StatusBadge status="success" />
 * <StatusBadge status="failed" showIcon />
 * <StatusBadge status="pending" dotOnly />
 */
export function StatusBadge({
  status,
  showIcon = false,
  icon,
  className,
  dotOnly = false,
  label,
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const styles = getStatusStyles(status);
  const displayLabel = label ?? config.label ?? status;
  const iconSymbol = CATEGORY_ICONS[config.category];

  if (dotOnly) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className={cn("w-2 h-2 rounded-full", styles.dot)} />
        <Typography variant="bodySmall" className="capitalize">{displayLabel}</Typography>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles.badge,
        className
      )}
    >
      {showIcon && (icon ?? <Icon symbol={iconSymbol} size="xs" />)}
      {displayLabel}
    </span>
  );
}

export interface DirectionBadgeProps {
  /** Direction string (e.g., "inbound", "outbound") */
  direction: string;
  /** Additional className */
  className?: string;
}

/**
 * DirectionBadge - For webhook/event directions
 */
export function DirectionBadge({ direction, className }: DirectionBadgeProps) {
  const isOutbound =
    direction === "outbound" || direction === "out" || direction === "egress";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        isOutbound
          ? "border-primary/30 bg-primary-container text-on-primary-container"
          : "border-secondary/30 bg-secondary-container text-on-secondary-container",
        className
      )}
    >
      <Icon symbol={isOutbound ? "north_east" : "south_west"} size="xs" />
      {direction}
    </span>
  );
}

export interface PlanBadgeProps {
  plan: string;
  className?: string;
}

/**
 * PlanBadge - For subscription plans
 */
export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const planStyles: Record<string, string> = {
    free: "border-outline-variant bg-surface-container text-on-surface-variant",
    pro: "border-primary/30 bg-primary-container text-on-primary-container",
    enterprise:
      "border-tertiary/30 bg-tertiary-container text-on-tertiary-container",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        planStyles[plan.toLowerCase()] ?? planStyles.free,
        className
      )}
    >
      {plan}
    </span>
  );
}

export interface CountBadgeProps {
  count: number;
  className?: string;
  warnIfPositive?: boolean;
}

/**
 * CountBadge - For numeric counts with optional warning state
 */
export function CountBadge({
  count,
  className,
  warnIfPositive = false,
}: CountBadgeProps) {
  const isWarning = warnIfPositive && count > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        isWarning
          ? "bg-error-container text-on-error-container"
          : "bg-surface-container text-on-surface-variant",
        className
      )}
    >
      {count}
    </span>
  );
}

export interface HttpStatusBadgeProps {
  code: number | string | null | undefined;
  className?: string;
}

/**
 * HttpStatusBadge - For HTTP status codes
 */
export function HttpStatusBadge({ code, className }: HttpStatusBadgeProps) {
  const statusCode = code ? Number(code) : 0;

  let statusStyle = "bg-surface-container text-on-surface-variant border-outline-variant";
  let statusText = String(code ?? "N/A");

  if (statusCode >= 200 && statusCode < 300) {
    statusStyle = "bg-primary-container text-on-primary-container border-primary/30";
  } else if (statusCode >= 300 && statusCode < 400) {
    statusStyle = "bg-secondary-container text-on-secondary-container border-secondary/30";
  } else if (statusCode >= 400 && statusCode < 500) {
    statusStyle = "bg-tertiary-container text-on-tertiary-container border-tertiary/30";
  } else if (statusCode >= 500) {
    statusStyle = "bg-error-container text-on-error-container border-error/30";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
        statusStyle,
        className
      )}
    >
      {statusText}
    </span>
  );
}
