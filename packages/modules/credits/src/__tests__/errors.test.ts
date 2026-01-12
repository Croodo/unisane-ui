/**
 * Credits Errors Tests
 *
 * Tests for domain error classes in the credits module.
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@unisane/kernel';
import {
  InsufficientCreditsError,
  NegativeCreditsError,
  CreditLedgerError,
} from '../domain/errors';

describe('InsufficientCreditsError', () => {
  it('should have correct error properties', () => {
    const error = new InsufficientCreditsError(100, 50);

    expect(error.name).toBe('InsufficientCreditsError');
    expect(error.message).toBe('Insufficient credits: required 100, available 50');
    expect(error.code).toBe(ErrorCode.INSUFFICIENT_CREDITS);
    expect(error.status).toBe(402);
  });

  it('should work with various values', () => {
    const cases = [
      { required: 10, available: 5 },
      { required: 1000, available: 0 },
      { required: 50, available: 49 },
      { required: 1, available: 0 },
    ];

    for (const { required, available } of cases) {
      const error = new InsufficientCreditsError(required, available);
      expect(error.message).toBe(`Insufficient credits: required ${required}, available ${available}`);
      expect(error.status).toBe(402);
    }
  });

  it('should be an instance of Error', () => {
    const error = new InsufficientCreditsError(1, 0);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('NegativeCreditsError', () => {
  it('should have correct error properties', () => {
    const error = new NegativeCreditsError();

    expect(error.name).toBe('NegativeCreditsError');
    expect(error.message).toBe('Credit amount cannot be negative');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.status).toBe(400);
  });

  it('should be an instance of Error', () => {
    const error = new NegativeCreditsError();

    expect(error).toBeInstanceOf(Error);
  });
});

describe('CreditLedgerError', () => {
  it('should have correct error properties', () => {
    const error = new CreditLedgerError('Database write failed');

    expect(error.name).toBe('CreditLedgerError');
    expect(error.message).toBe('Credit ledger error: Database write failed');
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.status).toBe(500);
  });

  it('should accept various reasons', () => {
    const reasons = [
      'Database write failed',
      'Concurrent modification',
      'Balance mismatch',
      'Transaction rollback',
    ];

    for (const reason of reasons) {
      const error = new CreditLedgerError(reason);
      expect(error.message).toBe(`Credit ledger error: ${reason}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new CreditLedgerError('reason');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use 402 for payment required errors', () => {
    expect(new InsufficientCreditsError(1, 0).status).toBe(402);
  });

  it('should use 400 for validation errors', () => {
    expect(new NegativeCreditsError().status).toBe(400);
  });

  it('should use 500 for internal errors', () => {
    expect(new CreditLedgerError('reason').status).toBe(500);
  });
});
