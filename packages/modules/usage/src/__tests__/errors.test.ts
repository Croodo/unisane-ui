/**
 * Usage Errors Tests
 *
 * Tests for domain error classes in the usage module.
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@unisane/kernel';
import { UsageLimitExceededError, InvalidMetricError } from '../domain/errors';

describe('UsageLimitExceededError', () => {
  it('should have correct error properties', () => {
    const error = new UsageLimitExceededError('api_calls', 1000, 1001);

    expect(error.name).toBe('UsageLimitExceededError');
    expect(error.message).toBe('Usage limit exceeded for api_calls: 1001/1000');
    expect(error.code).toBe(ErrorCode.QUOTA_EXCEEDED);
    expect(error.status).toBe(403);
  });

  it('should handle various metrics and limits', () => {
    const cases = [
      { metric: 'storage_gb', limit: 100, current: 105 },
      { metric: 'requests', limit: 10000, current: 10001 },
      { metric: 'tokens', limit: 1000000, current: 1500000 },
    ];

    for (const { metric, limit, current } of cases) {
      const error = new UsageLimitExceededError(metric, limit, current);
      expect(error.message).toBe(`Usage limit exceeded for ${metric}: ${current}/${limit}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new UsageLimitExceededError('test', 10, 11);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvalidMetricError', () => {
  it('should have correct error properties', () => {
    const error = new InvalidMetricError('unknown_metric');

    expect(error.name).toBe('InvalidMetricError');
    expect(error.message).toBe('Invalid usage metric: unknown_metric');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.status).toBe(400);
  });

  it('should accept various metric names', () => {
    const metrics = ['bad_metric', 'not_supported', 'invalid_feature'];

    for (const metric of metrics) {
      const error = new InvalidMetricError(metric);
      expect(error.message).toBe(`Invalid usage metric: ${metric}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new InvalidMetricError('test');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use 403 for quota exceeded errors', () => {
    expect(new UsageLimitExceededError('test', 10, 11).status).toBe(403);
  });

  it('should use 400 for validation errors', () => {
    expect(new InvalidMetricError('test').status).toBe(400);
  });
});
