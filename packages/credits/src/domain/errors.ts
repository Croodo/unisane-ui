/**
 * Credits Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class InsufficientCreditsError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(required: number, available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = 'InsufficientCreditsError';
  }
}

export class NegativeCreditsError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor() {
    super('Credit amount cannot be negative');
    this.name = 'NegativeCreditsError';
  }
}

export class CreditLedgerError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(reason: string) {
    super(`Credit ledger error: ${reason}`);
    this.name = 'CreditLedgerError';
  }
}
