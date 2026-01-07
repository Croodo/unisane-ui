/**
 * Usage Cache Keys
 */

import { KV } from '@unisane/kernel';

// ════════════════════════════════════════════════════════════════════════════
// Time Label Helpers
// ════════════════════════════════════════════════════════════════════════════

export function minuteLabel(d: Date) {
  const y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}${M}${D}${h}${m}`;
}

export function hourLabel(d: Date) {
  const y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  return `${y}${M}${D}${h}`;
}

// ════════════════════════════════════════════════════════════════════════════
// Cache Key Builders
// ════════════════════════════════════════════════════════════════════════════

export const usageKeys = {
  metric: (tenantId: string, metric: string, window: string) =>
    `usage:${tenantId}:${metric}:${window}` as const,
  tenantUsage: (tenantId: string) => `usage:tenant:${tenantId}` as const,
  /** Minute-level usage counter key */
  minute: (tenantId: string, feature: string, d: Date) =>
    `${KV.USAGE}${tenantId}:${feature}:${minuteLabel(d)}` as const,
  /** Idempotency key for usage deduplication */
  idem: (idem: string) => `u_idem:${idem}` as const,
  /** Pattern for scanning all minutes in an hour */
  hourScanPattern: (label: string) =>
    `${KV.USAGE}*:*:${label}[0-5][0-9]` as const,
} as const;

export type UsageKeyBuilder = typeof usageKeys;

// ════════════════════════════════════════════════════════════════════════════
// Legacy Exports (for backwards compatibility)
// ════════════════════════════════════════════════════════════════════════════

/** @deprecated Use usageKeys.minute() instead */
export function usageMinuteKey(tenantId: string, feature: string, d: Date) {
  return usageKeys.minute(tenantId, feature, d);
}

/** @deprecated Use usageKeys.idem() instead */
export function usageIdemKey(idem: string) {
  return usageKeys.idem(idem);
}

/** @deprecated Use usageKeys.hourScanPattern() instead */
export function usageHourScanPattern(label: string) {
  return usageKeys.hourScanPattern(label);
}
