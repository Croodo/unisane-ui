import * as React from "react";
import { cn } from "@/lib/utils";
import {
  getStatusConfig,
  getStatusStyles,
  getHttpStatusStyle,
  HTTP_STATUS_STYLES,
  type StatusCategory,
} from "@/src/shared/constants/status";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Circle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

const CATEGORY_ICONS: Record<StatusCategory, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  pending: Clock,
  neutral: Circle,
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
  const Icon = CATEGORY_ICONS[config.category];

  if (dotOnly) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className={cn("w-2 h-2 rounded-full", styles.dot)} />
        <span className="capitalize">{displayLabel}</span>
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
      {showIcon && (icon ?? <Icon className="h-3 w-3" />)}
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
 *
 * @example
 * <DirectionBadge direction="inbound" />
 * <DirectionBadge direction="outbound" />
 */
export function DirectionBadge({ direction, className }: DirectionBadgeProps) {
  const isInbound = direction.toLowerCase() === "inbound";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        isInbound
          ? "text-blue-700 border-blue-300 bg-blue-50"
          : "text-purple-700 border-purple-300 bg-purple-50",
        className
      )}
    >
      {isInbound ? (
        <ArrowDownLeft className="h-3 w-3" />
      ) : (
        <ArrowUpRight className="h-3 w-3" />
      )}
      {direction}
    </span>
  );
}

export interface HttpStatusBadgeProps {
  /** HTTP status code */
  code: number | null | undefined;
  /** Additional className */
  className?: string;
}

/**
 * HttpStatusBadge - For HTTP status codes
 *
 * @example
 * <HttpStatusBadge code={200} />
 * <HttpStatusBadge code={404} />
 * <HttpStatusBadge code={500} />
 */
export function HttpStatusBadge({ code, className }: HttpStatusBadgeProps) {
  if (typeof code !== "number") {
    return <span className="text-muted-foreground">—</span>;
  }

  const style = getHttpStatusStyle(code) ?? HTTP_STATUS_STYLES.default;

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-xs font-mono font-medium border",
        style?.badge,
        className
      )}
    >
      {code}
    </span>
  );
}

/**
 * Plan styles for pricing tiers
 */
const PLAN_STYLES: Record<string, string> = {
  enterprise: "text-purple-700 bg-purple-100 border-purple-200",
  business: "text-purple-700 bg-purple-100 border-purple-200",
  pro: "text-blue-700 bg-blue-100 border-blue-200",
  starter: "text-green-700 bg-green-100 border-green-200",
  free: "text-gray-700 bg-gray-100 border-gray-200",
};

export interface PlanBadgeProps {
  /** Plan name (e.g., "free", "pro", "enterprise") */
  plan: string;
  /** Additional className */
  className?: string;
}

/**
 * PlanBadge - For subscription/pricing plans
 *
 * @example
 * <PlanBadge plan="free" />
 * <PlanBadge plan="pro" />
 * <PlanBadge plan="enterprise" />
 */
export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const key = plan.toLowerCase();
  const style = PLAN_STYLES[key] ?? PLAN_STYLES.free;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        style,
        className
      )}
    >
      {plan}
    </span>
  );
}

export interface CountBadgeProps {
  /** Count value */
  count: number;
  /** Show warning styling when count > 0 */
  warnIfPositive?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * CountBadge - For displaying counts with optional warning styling
 *
 * @example
 * <CountBadge count={5} />
 * <CountBadge count={3} warnIfPositive />
 */
export function CountBadge({
  count,
  warnIfPositive = false,
  className,
}: CountBadgeProps) {
  const showWarning = warnIfPositive && count > 0;

  return (
    <span
      className={cn(
        showWarning ? "text-red-600 font-bold" : "text-muted-foreground",
        className
      )}
    >
      {count}
    </span>
  );
}
