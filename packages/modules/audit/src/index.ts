/**
 * @module @unisane/audit
 * @description Immutable audit logging with tenant isolation
 * @layer 3
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas
// ════════════════════════════════════════════════════════════════════════════

export * from "./domain/schemas";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export { AuditLogNotFoundError, AuditLogImmutableError } from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { AUDIT_EVENTS, AUDIT_DEFAULTS, AUDIT_COLLECTIONS } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { auditKeys } from './domain/keys';
export type { AuditKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export * from "./service/append";
export * from "./service/list";
export * from "./service/admin/list";
export { getTenantLastActivity } from "./service/admin/stats";
