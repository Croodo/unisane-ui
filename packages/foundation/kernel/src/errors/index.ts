/**
 * Errors Module
 *
 * Provides a domain error hierarchy for consistent error handling.
 *
 * @example
 * ```typescript
 * import { NotFoundError, ValidationError, ErrorCode, DomainError } from '@unisane/kernel';
 *
 * // Throwing errors
 * throw new NotFoundError('User', userId);
 * throw new ValidationError('Invalid input', { email: 'Invalid format' });
 *
 * // Creating custom module errors
 * export class SubscriptionNotFoundError extends DomainError {
 *   readonly code = ErrorCode.SUBSCRIPTION_NOT_FOUND;
 *   readonly status = 404;
 *
 *   constructor(tenantId: string) {
 *     super(`No subscription found for tenant ${tenantId}`);
 *   }
 * }
 *
 * // Checking error type
 * try {
 *   await getUser(id);
 * } catch (error) {
 *   if (isDomainError(error)) {
 *     console.log(error.code, error.status);
 *   }
 * }
 * ```
 */

// Base class and utilities
export {
  DomainError,
  isDomainError,
  wrapError,
  createDomainError,
} from './base';
export type { ErrorResponse, DomainErrorOptions, CreateErrorConfig, FieldError } from './base';

// Error catalog
export {
  ErrorCode,
  ErrorCatalog,
  getErrorInfo,
  getErrorStatus,
  getErrorMessage,
} from './catalog';
export type { ErrorCatalogEntry } from './catalog';

// Common error classes
export {
  InternalError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  RateLimitError,
  TimeoutError,
  ServiceUnavailableError,
  BadRequestError,
  PreconditionFailedError,
  UnprocessableError,
  ProviderError,
} from './common';
