/**
 * Audit Cache Keys
 */

export const auditKeys = {
  log: (logId: string) => `audit:log:${logId}` as const,
  tenantLogs: (tenantId: string) => `audit:tenant:${tenantId}` as const,
} as const;

export type AuditKeyBuilder = typeof auditKeys;
