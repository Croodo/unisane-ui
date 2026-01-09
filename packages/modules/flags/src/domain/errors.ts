/**
 * Flags Domain Errors
 *
 * Module-specific error classes using generic E1xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a feature flag is not found.
 */
export class FlagNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(flagKey: string) {
    super(`Feature flag not found: ${flagKey}`);
    this.name = 'FlagNotFoundError';
  }
}

/**
 * Thrown when a feature flag is disabled.
 */
export class FlagDisabledError extends DomainError {
  readonly code = ErrorCode.FEATURE_NOT_AVAILABLE;
  readonly status = 403;

  constructor(flagKey: string) {
    super(`Feature flag is disabled: ${flagKey}`);
    this.name = 'FlagDisabledError';
  }
}

/**
 * Thrown when a feature flag value is invalid.
 */
export class InvalidFlagValueError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(flagKey: string, expected: string, received: string) {
    super(`Invalid value for flag ${flagKey}: expected ${expected}, got ${received}`);
    this.name = 'InvalidFlagValueError';
  }
}
