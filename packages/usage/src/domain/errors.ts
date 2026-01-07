/**
 * Usage Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class UsageLimitExceededError extends DomainError {
  readonly code = ErrorCode.RATE_LIMITED;
  readonly status = 429;

  constructor(metric: string, limit: number, current: number) {
    super(`Usage limit exceeded for ${metric}: ${current}/${limit}`);
    this.name = 'UsageLimitExceededError';
  }
}

export class InvalidMetricError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(metric: string) {
    super(`Invalid usage metric: ${metric}`);
    this.name = 'InvalidMetricError';
  }
}
