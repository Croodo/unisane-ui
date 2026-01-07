/**
 * Audit Domain Constants
 */

export const AUDIT_EVENTS = {
  LOG_CREATED: 'audit.log.created',
} as const;

export const AUDIT_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  RETENTION_DAYS: 90,
} as const;

export const AUDIT_COLLECTIONS = {
  LOGS: 'audit_logs',
} as const;
