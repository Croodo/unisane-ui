/**
 * @unisane/kernel
 *
 * Core infrastructure layer providing:
 * - Universal Scope system (AsyncLocalStorage-based request scoping for any platform)
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

// Scope (universal scope system for multi-tenant/user/merchant applications)
export * from './scope';

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

// Security (input sanitization, XSS protection)
export * from './security/sanitize';

// Health checks
export * from './health';

// Resilience (circuit breaker, retry, etc.)
export * from './resilience';

// Constants
export * from './constants';

// Schema utilities
export * from './schema/types';
export * from './schema/utils';

// Encoding
export * from './encoding/base64url';
export * from './encoding/base64urlJson';

// Environment
export { getEnv, EnvSchema, validateCriticalEnv, assertCriticalEnv } from './env';
export type { Env } from './env';
export { createEnvJsonCache } from './envJson';

// Value Objects (domain primitives)
export * from './value-objects';

// Utilities
export * from './utils/crypto';
export * from './utils/redact';
export * from './utils/ids';
export * from './utils/money';
export * from './utils/currency';
export * from './utils/time';
export * from './utils/dto';
export * from './utils/csv';
export * from './utils/ratelimit';
export * from './utils/jobs';
export * from './utils/timeout';

// Storage provider abstraction
export * from './storage';

// Metrics - re-export observabilityMetrics as 'metrics' for convenience
export { observabilityMetrics as metrics } from './observability';

// Platform (injectable implementations)
export * from './platform';

// Ports (hexagonal architecture interfaces)
export * from './ports';

// Contracts (API schemas)
export * from './contracts';

// Architecture Patterns (service layer, repository patterns)
export * from './patterns';

// ID Generation (database-agnostic ID generation)
export * from './id';

// Bootstrap readiness (for Next.js 16 Turbopack timing)
export * from './bootstrap';

// Distributed Locking
export * from './locks';

// Adapter Utilities (metrics wrapper, circuit breaker helpers)
export * from './adapters';

// SMS (port-based abstraction for SMS providers)
export * from './sms';
