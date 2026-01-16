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
// Re-export AuthCtx and AuthMethod from auth module (not rbac which has a duplicate definition)
export type { AuthCtx, AuthMethod } from './auth/auth';
export * from './middleware/validate';

// Request Logging
export {
  configureRequestLogging,
  getRequestLoggingConfig,
  resetRequestLoggingConfig,
  shouldLogRequest,
  shouldLogBodies,
  redactSensitiveFields,
  prepareBodyForLogging,
  logRequestStart,
  logRequestCompleted,
  logRequestError,
  createRequestLogger,
} from './middleware/requestLogger';
export type { RequestLoggingConfig, RequestLogData } from './middleware/requestLogger';

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
export * from './rate-limits';
export * from './logger';
export * from './telemetry';

// API Versioning
export {
  CURRENT_API_VERSION,
  buildDeprecationHeaders,
  buildVersionHeader,
  isPastSunset,
  daysUntilSunset,
  formatDeprecationWarning,
  Version,
} from './versioning';
export type { DeprecationInfo } from './versioning';

// Note: client.ts provides browser-safe alternatives for the same functions.
// Import from '@unisane/gateway/client' for browser environments.

// Webhook utilities (signing, verification)
export * from './webhooks';
