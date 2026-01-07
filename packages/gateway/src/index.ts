/**
 * @unisane/gateway
 *
 * HTTP API gateway layer providing:
 * - Request/response handling
 * - Authentication middleware
 * - Rate limiting
 * - Error handling
 * - Query DSL parsing
 * - RBAC integration
 */

// Handler
export * from './handler/httpHandler';
export * from './handler/httpWebhook';
export { withGuards } from './handler/tsrest';
export type { GuardOpts } from './handler/tsrest';

// Auth
export * from './auth/auth';
export * from './auth/jwt';
export * from './auth/config';

// Middleware
export * from './middleware/rateLimit';
export * from './middleware/idempotency';
export { assertCsrfForCookieAuth } from './middleware/csrf';
export * from './middleware/cookies';
export * from './middleware/rawBody';
export { guard } from './middleware/guard';
export type { GuardOpts as InternalGuardOpts } from './middleware/guard';
export { PERM, ROLE_PERMS, hasPerm, requireTenantScope } from './middleware/rbac';
export type { Permission } from './middleware/rbac';
// Re-export AuthCtx from auth module (not rbac which has a duplicate definition)
export type { AuthCtx } from './auth/auth';
export * from './middleware/validate';

// Errors
export * from './errors/errors';
export * from './errors/errorCatalog';

// Query
export * from './query/query';
export * from './query/queryDsl';
export * from './query/sort';
export * from './query/sortHelpers';
export * from './query/filterParams';

// Request/Response utilities
export * from './request';
export * from './headers';
export * from './logger';
export * from './telemetry';

// Registry types
export * from './registry/types';
