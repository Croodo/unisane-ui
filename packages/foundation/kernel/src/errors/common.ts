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
 * Retryable by default as it may be a transient issue.
 */
export class InternalError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(message = 'An unexpected error occurred', options?: DomainErrorOptions) {
    super(message, { retryable: true, ...options });
  }
}

/**
 * Validation error (400).
 * Use when request data fails validation.
 * Includes field-level errors for form integration.
 */
export class ValidationError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(message: string, details?: Record<string, unknown>, options?: DomainErrorOptions) {
    super(message, { details, ...options });
  }

  /**
   * Create from Zod validation errors.
   * Populates both legacy `details` (for backward compat) and new `fields` array.
   */
  static fromZod(errors: Array<{ path: (string | number)[]; message: string; code?: string }>): ValidationError {
    const details: Record<string, string> = {};
    const fields: Array<{ field: string; message: string; code?: string }> = [];

    for (const err of errors) {
      const path = err.path.join('.');
      details[path] = err.message;
      fields.push({
        field: path,
        message: err.message,
        ...(err.code && { code: err.code }),
      });
    }

    return new ValidationError('Validation failed', details, { fields });
  }

  /**
   * Create a validation error for a single field.
   */
  static forField(field: string, message: string, code?: string): ValidationError {
    return new ValidationError(`Invalid ${field}: ${message}`, { [field]: message }, {
      fields: [{ field, message, ...(code && { code }) }],
    });
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
 * Retryable after the specified delay.
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
    super(message, { details: { retryAfter, limit }, retryable: true });
    this.retryAfter = retryAfter;
  }
}

/**
 * Timeout error (408).
 * Use when an operation times out.
 * Retryable by default as timeouts are often transient.
 */
export class TimeoutError extends DomainError {
  readonly code = ErrorCode.TIMEOUT;
  readonly status = 408;

  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`, { retryable: true });
  }
}

/**
 * Service unavailable error (503).
 * Use when a service is temporarily unavailable.
 * Retryable by default as it indicates a transient condition.
 */
export class ServiceUnavailableError extends DomainError {
  readonly code = ErrorCode.SERVICE_UNAVAILABLE;
  readonly status = 503;

  constructor(service = 'Service', retryAfter?: number) {
    super(`${service} is temporarily unavailable`, {
      details: retryAfter ? { retryAfter } : undefined,
      retryable: true,
    });
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

/**
 * Provider/external service error.
 * Use when an external service (Stripe, AWS, etc.) returns an error.
 * Retryable by default as external service errors are often transient.
 *
 * @example
 * ```typescript
 * try {
 *   await stripe.customers.create({ email });
 * } catch (err) {
 *   throw new ProviderError('stripe', err);
 * }
 * ```
 */
export class ProviderError extends DomainError {
  readonly code = ErrorCode.EXTERNAL_API_ERROR;
  readonly status = 502;

  /** Name of the external provider (e.g., 'stripe', 'aws', 'mongodb') */
  readonly provider: string;

  /** Original error code from the provider, if available */
  readonly providerCode?: string;

  constructor(
    provider: string,
    cause: unknown,
    options?: { retryable?: boolean; providerCode?: string }
  ) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`${provider} error: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
      details: { provider, ...(options?.providerCode && { providerCode: options.providerCode }) },
      retryable: options?.retryable ?? true,
    });
    this.provider = provider;
    this.providerCode = options?.providerCode;
  }

  /**
   * Create a non-retryable provider error.
   * Use when the error is due to invalid input rather than transient issues.
   */
  static nonRetryable(provider: string, cause: unknown, providerCode?: string): ProviderError {
    return new ProviderError(provider, cause, { retryable: false, providerCode });
  }
}
