/**
 * @unisane/kernel/client
 *
 * Client-safe exports that can be used in browser environments.
 * These exports don't depend on Node.js-only modules like AsyncLocalStorage.
 *
 * Use this entry point for:
 * - ts-rest contracts that need Zod schemas
 * - React Query hooks
 * - Any client-side code that needs kernel types/constants
 */

// Constants (all browser-safe)
export * from './constants';

// RBAC (Zod schemas and permission constants)
export * from './rbac';

// DTO utilities (Zod schemas for pagination, etc.)
export * from './utils/dto';

// Value Objects (Money, Email, Phone, etc.)
export * from './value-objects';

// Encoding utilities (browser-safe base64)
export * from './encoding/base64url';
export * from './encoding/base64urlJson';

// Schema utilities
export * from './schema/types';
export * from './schema/utils';

// Error classes (browser-safe)
export * from './errors';

// Currency utilities (browser-safe)
export * from './utils/currency';
