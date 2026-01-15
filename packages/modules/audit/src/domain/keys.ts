/**
 * Audit Cache Keys
 */

export const auditKeys = {
  log: (logId: string) => `audit:log:${logId}` as const,
  scopeLogs: (scopeId: string) => `audit:scope:${scopeId}` as const,
} as const;

export type AuditKeyBuilder = typeof auditKeys;
