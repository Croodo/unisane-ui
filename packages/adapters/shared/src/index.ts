/**
 * Shared Adapter Utilities
 *
 * Common utilities used across multiple adapters to enforce DRY principles.
 * This package consolidates validation, error handling, and other shared logic.
 *
 * @example
 * ```typescript
 * import { validateEmailMessage, validateStorageKey, isRetryableError } from '@unisane/adapters-shared';
 * ```
 */

export * from './email-validation';
export * from './path-validation';
export * from './error-classification';
export * from './timeout-helpers';
