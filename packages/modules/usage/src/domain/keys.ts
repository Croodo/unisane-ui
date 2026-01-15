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
  metric: (scopeId: string, metric: string, window: string) =>
    `usage:${scopeId}:${metric}:${window}` as const,
  scopeUsage: (scopeId: string) => `usage:scope:${scopeId}` as const,
  /** Minute-level usage counter key */
  minute: (scopeId: string, feature: string, d: Date) =>
    `${KV.USAGE}${scopeId}:${feature}:${minuteLabel(d)}` as const,
  /** Idempotency key for usage deduplication */
  idem: (idem: string) => `u_idem:${idem}` as const,
  /** Pattern for scanning all minutes in an hour */
  hourScanPattern: (label: string) =>
    `${KV.USAGE}*:*:${label}[0-5][0-9]` as const,
} as const;

export type UsageKeyBuilder = typeof usageKeys;
