/**
 * @unisane/kernel
 *
 * Core infrastructure layer providing:
 * - Context system (AsyncLocalStorage-based request scoping)
 * - Event system (typed domain events with Zod validation)
 * - Error classes (domain error hierarchy with error catalog)
 * - Observability (pino logger, tracer, metrics)
 * - Database connections and utilities
 * - Cache/KV store abstraction
 * - RBAC (Role-Based Access Control)
 * - Pagination utilities
 * - Common utilities (crypto, ids, money, etc.)
 * - Environment configuration
 * - Constants
 */

// Context (request-scoped data via AsyncLocalStorage)
export * from './context';

// Events (typed domain event system)
export * from './events';

// Errors (domain error hierarchy)
export * from './errors';

// Observability (logging, tracing, metrics)
export * from './observability';

// Database
export * from './database';

// Cache/KV
export * from './cache';

// Pagination
export * from './pagination';

// RBAC
export * from './rbac';

// Constants
export * from './constants';

// Schema utilities
export * from './schema/types';
export * from './schema/utils';

// Encoding
export * from './encoding/base64url';
export * from './encoding/base64urlJson';

// Environment
export { getEnv } from './env';
export type { Env } from './env';

// Utilities
export * from './utils/crypto';
export * from './utils/ids';
export * from './utils/money';
export * from './utils/currency';
export * from './utils/time';
export * from './utils/slug';
export * from './utils/normalize';
export * from './utils/dto';
export * from './utils/csv';
export * from './utils/metrics';
export * from './utils/ratelimit';
export * from './utils/jobs';
export * from './utils/storage';

// Inngest
export * from './inngest';

// Platform (injectable implementations)
export * from './platform';

// Contracts (API schemas)
export * from './contracts';
