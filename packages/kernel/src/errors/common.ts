/**
 * Common Error Classes
 *
 * Pre-built error classes for common scenarios.
 * These are the E1xxx generic errors that can be used across all modules.
 */

import { DomainError, type DomainErrorOptions } from './base';
import { ErrorCode } from './catalog';

/**
 * Internal server error (500).
 * Use for unexpected errors that shouldn't happen.
 */
export class InternalError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(message = 'An unexpected error occurred', options?: DomainErrorOptions) {
    super(message, options);
  }
}

/**
 * Validation error (400).
 * Use when request data fails validation.
 */
export class ValidationError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { details });
  }

  /**
   * Create from Zod validation errors.
   */
  static fromZod(errors: Array<{ path: (string | number)[]; message: string }>): ValidationError {
    const details: Record<string, string> = {};
    for (const err of errors) {
      const path = err.path.join('.');
      details[path] = err.message;
    }
    return new ValidationError('Validation failed', details);
  }
}

/**
 * Not found error (404).
 * Use when a requested resource doesn't exist.
 */
export class NotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' not found` : `${resource} not found`);
  }
}

/**
 * Conflict error (409).
 * Use when an operation conflicts with existing state.
 */
export class ConflictError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Forbidden error (403).
 * Use when user is authenticated but lacks permission.
 */
export class ForbiddenError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor(message = 'Access forbidden') {
    super(message);
  }
}

/**
 * Unauthorized error (401).
 * Use when authentication is required but missing or invalid.
 */
export class UnauthorizedError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly status = 401;

  constructor(message = 'Authentication required') {
    super(message);
  }
}

/**
 * Rate limit error (429).
 * Use when rate limit is exceeded.
 */
export class RateLimitError extends DomainError {
  readonly code = ErrorCode.RATE_LIMITED;
  readonly status = 429;

  /** Seconds until the rate limit resets */
  readonly retryAfter: number;

  constructor(retryAfter: number, limit?: number) {
    const message = limit
      ? `Rate limit of ${limit} requests exceeded. Retry after ${retryAfter} seconds.`
      : `Rate limit exceeded. Retry after ${retryAfter} seconds.`;
    super(message, { details: { retryAfter, limit } });
    this.retryAfter = retryAfter;
  }
}

/**
 * Timeout error (408).
 * Use when an operation times out.
 */
export class TimeoutError extends DomainError {
  readonly code = ErrorCode.TIMEOUT;
  readonly status = 408;

  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`);
  }
}

/**
 * Service unavailable error (503).
 * Use when a service is temporarily unavailable.
 */
export class ServiceUnavailableError extends DomainError {
  readonly code = ErrorCode.SERVICE_UNAVAILABLE;
  readonly status = 503;

  constructor(service = 'Service', retryAfter?: number) {
    super(`${service} is temporarily unavailable`, retryAfter ? { details: { retryAfter } } : undefined);
  }
}

/**
 * Bad request error (400).
 * Use for generic bad request scenarios.
 */
export class BadRequestError extends DomainError {
  readonly code = ErrorCode.BAD_REQUEST;
  readonly status = 400;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Precondition failed error (412).
 * Use when a precondition (If-Match, etc.) fails.
 */
export class PreconditionFailedError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Unprocessable entity error (422).
 * Use when the request is syntactically correct but semantically wrong.
 */
export class UnprocessableError extends DomainError {
  readonly code = ErrorCode.UNPROCESSABLE;
  readonly status = 422;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { details });
  }
}
