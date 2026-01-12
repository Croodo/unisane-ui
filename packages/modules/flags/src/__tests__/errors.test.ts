/**
 * Flags Errors Tests
 *
 * Tests for domain error classes in the flags module.
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@unisane/kernel';
import {
  FlagNotFoundError,
  FlagDisabledError,
  InvalidFlagValueError,
} from '../domain/errors';

describe('FlagNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new FlagNotFoundError('new_feature');

    expect(error.name).toBe('FlagNotFoundError');
    expect(error.message).toBe('Feature flag not found: new_feature');
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should accept various flag keys', () => {
    const keys = ['feature_x', 'beta_dashboard', 'dark_mode', 'v2_api'];

    for (const key of keys) {
      const error = new FlagNotFoundError(key);
      expect(error.message).toBe(`Feature flag not found: ${key}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new FlagNotFoundError('test');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('FlagDisabledError', () => {
  it('should have correct error properties', () => {
    const error = new FlagDisabledError('premium_feature');

    expect(error.name).toBe('FlagDisabledError');
    expect(error.message).toBe('Feature flag is disabled: premium_feature');
    expect(error.code).toBe(ErrorCode.FEATURE_NOT_AVAILABLE);
    expect(error.status).toBe(403);
  });

  it('should accept various flag keys', () => {
    const keys = ['beta_api', 'new_checkout', 'ai_assistant'];

    for (const key of keys) {
      const error = new FlagDisabledError(key);
      expect(error.message).toBe(`Feature flag is disabled: ${key}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new FlagDisabledError('test');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvalidFlagValueError', () => {
  it('should have correct error properties', () => {
    const error = new InvalidFlagValueError('my_flag', 'boolean', 'string');

    expect(error.name).toBe('InvalidFlagValueError');
    expect(error.message).toBe('Invalid value for flag my_flag: expected boolean, got string');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.status).toBe(400);
  });

  it('should handle various type mismatches', () => {
    const cases = [
      { flagKey: 'flag_a', expected: 'boolean', received: 'number' },
      { flagKey: 'flag_b', expected: 'string', received: 'undefined' },
      { flagKey: 'flag_c', expected: 'number', received: 'object' },
    ];

    for (const { flagKey, expected, received } of cases) {
      const error = new InvalidFlagValueError(flagKey, expected, received);
      expect(error.message).toBe(`Invalid value for flag ${flagKey}: expected ${expected}, got ${received}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new InvalidFlagValueError('test', 'a', 'b');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use 404 for not found errors', () => {
    expect(new FlagNotFoundError('key').status).toBe(404);
  });

  it('should use 403 for disabled/feature not available errors', () => {
    expect(new FlagDisabledError('key').status).toBe(403);
  });

  it('should use 400 for validation errors', () => {
    expect(new InvalidFlagValueError('key', 'a', 'b').status).toBe(400);
  });
});
