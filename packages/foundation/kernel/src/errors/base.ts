/**
 * Domain Error Base Class
 *
 * Abstract base class for all domain errors in the application.
 * Provides consistent error structure for API responses and logging.
 */

/**
 * Serialized error format for API responses.
 */
export interface ErrorResponse {
  /** Machine-readable error code (e.g., 'E1001') */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Additional error details (validation errors, etc.) */
  details?: Record<string, unknown>;
}

/**
 * Options for constructing a domain error.
 */
export interface DomainErrorOptions {
  /** Additional context/details about the error */
  details?: Record<string, unknown>;
  /** The underlying cause of this error */
  cause?: Error;
}

/**
 * Abstract base class for all domain errors.
 *
 * All module-specific errors should extend this class to ensure
 * consistent error handling throughout the application.
 *
 * @example
 * ```typescript
 * export class SubscriptionNotFoundError extends DomainError {
 *   readonly code = ErrorCode.SUBSCRIPTION_NOT_FOUND;
 *   readonly status = 404;
 *
 *   constructor(tenantId: string) {
 *     super(`No subscription found for tenant ${tenantId}`);
 *   }
 * }
 * ```
 */
export abstract class DomainError extends Error {
  /** Machine-readable error code */
  abstract readonly code: string;

  /** HTTP status code for this error */
  abstract readonly status: number;

  /** Additional error details */
  readonly details?: Record<string, unknown>;

  /** The underlying cause of this error */
  override readonly cause?: Error;

  constructor(message: string, options?: DomainErrorOptions) {
    super(message);
    this.name = this.constructor.name;
    this.details = options?.details;
    this.cause = options?.cause;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize the error for API responses.
   * Excludes sensitive information like stack traces.
   */
  toJSON(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      ...(this.details && { details: this.details }),
    };
  }

  /**
   * Create a string representation for logging.
   * Includes cause chain if present.
   */
  override toString(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;
    if (this.cause) {
      result += `\n  Caused by: ${this.cause.toString()}`;
    }
    return result;
  }
}

/**
 * Type guard to check if an error is a DomainError.
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Wrap an unknown error as a DomainError.
 * Useful for catch blocks where error type is unknown.
 */
export function wrapError(error: unknown, WrapperClass: new (message: string, options?: DomainErrorOptions) => DomainError): DomainError {
  if (error instanceof DomainError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;

  return new WrapperClass(message, { cause });
}
