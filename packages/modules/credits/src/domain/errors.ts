/**
 * Credits Domain Errors
 *
 * Module-specific error classes using E3xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when there are insufficient credits for an operation.
 */
export class InsufficientCreditsError extends DomainError {
  readonly code = ErrorCode.INSUFFICIENT_CREDITS;
  readonly status = 402;

  constructor(required: number, available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Thrown when credit amount is negative.
 */
export class NegativeCreditsError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor() {
    super('Credit amount cannot be negative');
    this.name = 'NegativeCreditsError';
  }
}

/**
 * Thrown when credit ledger operation fails.
 */
export class CreditLedgerError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(reason: string) {
    super(`Credit ledger error: ${reason}`, { retryable: true });
    this.name = 'CreditLedgerError';
  }
}
