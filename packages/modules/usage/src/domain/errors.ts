/**
 * Usage Domain Errors
 *
 * Module-specific error classes using E3xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when usage limit is exceeded.
 */
export class UsageLimitExceededError extends DomainError {
  readonly code = ErrorCode.QUOTA_EXCEEDED;
  readonly status = 403;

  constructor(metric: string, limit: number, current: number) {
    super(`Usage limit exceeded for ${metric}: ${current}/${limit}`);
    this.name = 'UsageLimitExceededError';
  }
}

/**
 * Thrown when usage metric is invalid.
 */
export class InvalidMetricError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(metric: string) {
    super(`Invalid usage metric: ${metric}`);
    this.name = 'InvalidMetricError';
  }
}
