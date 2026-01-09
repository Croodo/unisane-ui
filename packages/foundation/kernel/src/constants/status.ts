/**
 * Status Colors - Single Source of Truth for status badge styling
 *
 * This file defines consistent status styling across the application.
 * Used by StatusBadge component and any other status-aware UI elements.
 */

export type StatusCategory =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending"
  | "neutral";

export type StatusConfig = {
  category: StatusCategory;
  label?: string; // Optional display override
};

/**
 * Status to category mapping
 * Keys are lowercase status strings that can appear from various sources
 */
export const STATUS_MAP: Record<string, StatusConfig> = {
  // Success states
  success: { category: "success" },
  delivered: { category: "success" },
  active: { category: "success" },
  completed: { category: "success" },
  paid: { category: "success" },
  verified: { category: "success" },
  enabled: { category: "success" },
  online: { category: "success" },
  healthy: { category: "success" },

  // Warning states
  warning: { category: "warning" },
  retry: { category: "warning" },
  retrying: { category: "warning" },
  trialing: { category: "warning" },
  past_due: { category: "warning", label: "Past Due" },
  expiring: { category: "warning" },
  degraded: { category: "warning" },

  // Error states
  error: { category: "error" },
  failed: { category: "error" },
  failure: { category: "error" },
  canceled: { category: "error" },
  cancelled: { category: "error" },
  rejected: { category: "error" },
  expired: { category: "error" },
  blocked: { category: "error" },
  revoked: { category: "error" },
  dead: { category: "error" },
  unhealthy: { category: "error" },

  // Pending/Processing states
  pending: { category: "pending" },
  queued: { category: "pending" },
  processing: { category: "pending" },
  scheduled: { category: "pending" },
  waiting: { category: "pending" },

  // Info states
  info: { category: "info" },
  inbound: { category: "info" },
  incoming: { category: "info" },
  outbound: { category: "info", label: "Outbound" },
  outgoing: { category: "info" },

  // Neutral states
  unknown: { category: "neutral" },
  draft: { category: "neutral" },
  inactive: { category: "neutral" },
  disabled: { category: "neutral" },
  paused: { category: "neutral" },
  archived: { category: "neutral" },
};

/**
 * CSS classes for each status category
 */
export const STATUS_STYLES: Record<
  StatusCategory,
  { badge: string; dot: string; text: string }
> = {
  success: {
    badge: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    text: "text-green-700",
  },
  warning: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  error: {
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    text: "text-red-700",
  },
  info: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    text: "text-blue-700",
  },
  pending: {
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
    text: "text-gray-600",
  },
  neutral: {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    text: "text-gray-500",
  },
};

/**
 * HTTP Status code color mapping
 */
export const HTTP_STATUS_STYLES: Record<
  string,
  { badge: string; category: StatusCategory }
> = {
  "2xx": {
    badge: "text-green-700 bg-green-100 border-green-200",
    category: "success",
  },
  "3xx": {
    badge: "text-blue-700 bg-blue-100 border-blue-200",
    category: "info",
  },
  "4xx": {
    badge: "text-amber-700 bg-amber-100 border-amber-200",
    category: "warning",
  },
  "5xx": {
    badge: "text-red-700 bg-red-100 border-red-200",
    category: "error",
  },
  default: {
    badge: "text-gray-700 bg-gray-100 border-gray-200",
    category: "neutral",
  },
};

/**
 * Get HTTP status style based on status code
 */
export function getHttpStatusStyle(code: number) {
  if (code >= 200 && code < 300) return HTTP_STATUS_STYLES["2xx"];
  if (code >= 300 && code < 400) return HTTP_STATUS_STYLES["3xx"];
  if (code >= 400 && code < 500) return HTTP_STATUS_STYLES["4xx"];
  if (code >= 500) return HTTP_STATUS_STYLES["5xx"];
  return HTTP_STATUS_STYLES.default;
}

/**
 * Get status config for a given status string
 */
export function getStatusConfig(status: string): StatusConfig {
  const key = status.toLowerCase().trim();
  return STATUS_MAP[key] ?? { category: "neutral" };
}

/**
 * Get status styles for a given status string
 */
export function getStatusStyles(status: string) {
  const config = getStatusConfig(status);
  return STATUS_STYLES[config.category];
}
