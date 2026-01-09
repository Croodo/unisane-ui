/**
 * Flags Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class FlagNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(flagKey: string) {
    super(`Feature flag not found: ${flagKey}`);
    this.name = 'FlagNotFoundError';
  }
}

export class FlagDisabledError extends DomainError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly status = 403;

  constructor(flagKey: string) {
    super(`Feature flag is disabled: ${flagKey}`);
    this.name = 'FlagDisabledError';
  }
}

export class InvalidFlagValueError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(flagKey: string, expected: string, received: string) {
    super(`Invalid value for flag ${flagKey}: expected ${expected}, got ${received}`);
    this.name = 'InvalidFlagValueError';
  }
}
