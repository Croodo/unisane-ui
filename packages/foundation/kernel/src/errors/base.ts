/**
 * Domain Error Base Class
 *
 * Abstract base class for all domain errors in the application.
 * Provides consistent error structure for API responses and logging.
 */

/**
 * Field-level validation error.
 * Used to map errors to specific form fields.
 */
export interface FieldError {
  /** Field path (e.g., 'email', 'address.city') */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Optional error code for field-specific errors */
  code?: string;
}

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
  /** Field-level validation errors */
  fields?: FieldError[];
  /** Whether this error can be retried */
  retryable?: boolean;
}

/**
 * Options for constructing a domain error.
 */
export interface DomainErrorOptions {
  /** Additional context/details about the error */
  details?: Record<string, unknown>;
  /** The underlying cause of this error */
  cause?: Error;
  /** Field-level validation errors */
  fields?: FieldError[];
  /** Whether this error can be retried (overrides default for error type) */
  retryable?: boolean;
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

  /**
   * Whether this error can be safely retried.
   * Override in subclass or set via options.
   * Default: false for most errors, true for 5xx and timeout errors.
   */
  readonly retryable: boolean;

  /** Additional error details */
  readonly details?: Record<string, unknown>;

  /** Field-level validation errors */
  readonly fields?: FieldError[];

  /** The underlying cause of this error */
  override readonly cause?: Error;

  constructor(message: string, options?: DomainErrorOptions) {
    super(message);
    this.name = this.constructor.name;
    this.details = options?.details;
    this.fields = options?.fields;
    this.cause = options?.cause;
    // Default retryable based on status, can be overridden
    this.retryable = options?.retryable ?? this.isRetryableByDefault();

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Determine if this error is retryable by default.
   * Override in subclasses for custom logic.
   * @internal
   */
  isRetryableByDefault(): boolean {
    return false;
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
      ...(this.fields?.length && { fields: this.fields }),
      ...(this.retryable && { retryable: this.retryable }),
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

/**
 * Configuration for creating a domain error class.
 */
export interface CreateErrorConfig {
  /** Error code from ErrorCode enum */
  code: string;
  /** HTTP status code */
  status: number;
  /** Default message (can be overridden in constructor) */
  defaultMessage?: string;
  /** Default retryable status (can be overridden per instance) */
  retryable?: boolean;
}

/**
 * Factory function to create domain error classes with minimal boilerplate.
 *
 * @example
 * ```typescript
 * // Simple error with static message
 * export const InvalidCredentialsError = createDomainError({
 *   code: ErrorCode.INVALID_CREDENTIALS,
 *   status: 401,
 *   defaultMessage: 'Invalid email or password',
 * });
 *
 * // Error with dynamic message
 * export const FileNotFoundError = createDomainError({
 *   code: ErrorCode.FILE_NOT_FOUND,
 *   status: 404,
 * });
 * throw new FileNotFoundError(`File not found: ${fileId}`);
 *
 * // Retryable error
 * export const ServiceTemporarilyUnavailable = createDomainError({
 *   code: ErrorCode.SERVICE_UNAVAILABLE,
 *   status: 503,
 *   retryable: true,
 * });
 * ```
 */
export function createDomainError(config: CreateErrorConfig) {
  const { code, status, defaultMessage, retryable: defaultRetryable } = config;

  return class extends DomainError {
    readonly code = code;
    readonly status = status;

    constructor(message?: string, options?: DomainErrorOptions) {
      super(message ?? defaultMessage ?? 'An error occurred', {
        ...options,
        retryable: options?.retryable ?? defaultRetryable,
      });
    }
  };
}
