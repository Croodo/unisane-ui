/**
 * Errors Module Tests
 *
 * Tests for domain error hierarchy and error utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  DomainError,
  isDomainError,
  wrapError,
  createDomainError,
  ErrorCode,
  getErrorInfo,
  getErrorStatus,
  getErrorMessage,
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
  InternalError,
  RateLimitError,
  TimeoutError,
  ServiceUnavailableError,
  PreconditionFailedError,
  UnprocessableError,
  ProviderError,
} from '../errors';

describe('DomainError Base Class', () => {
  // Create a concrete implementation for testing
  class TestError extends DomainError {
    readonly code = 'TEST_ERROR';
    readonly status = 500;
  }

  describe('constructor', () => {
    it('should set message correctly', () => {
      const error = new TestError('Test message');
      expect(error.message).toBe('Test message');
    });

    it('should set name to constructor name', () => {
      const error = new TestError('Test');
      expect(error.name).toBe('TestError');
    });

    it('should accept details option', () => {
      const error = new TestError('Test', { details: { key: 'value' } });
      expect(error.details).toEqual({ key: 'value' });
    });

    it('should accept cause option', () => {
      const cause = new Error('Original error');
      const error = new TestError('Wrapped error', { cause });
      expect(error.cause).toBe(cause);
    });

    it('should accept fields option', () => {
      const fields = [{ field: 'email', message: 'Invalid format' }];
      const error = new TestError('Validation failed', { fields });
      expect(error.fields).toEqual(fields);
    });

    it('should default retryable to false', () => {
      const error = new TestError('Test');
      expect(error.retryable).toBe(false);
    });

    it('should accept retryable option', () => {
      const error = new TestError('Test', { retryable: true });
      expect(error.retryable).toBe(true);
    });
  });

  describe('toJSON()', () => {
    it('should serialize basic properties', () => {
      const error = new TestError('Test message');
      const json = error.toJSON();

      expect(json.code).toBe('TEST_ERROR');
      expect(json.message).toBe('Test message');
      expect(json.status).toBe(500);
    });

    it('should include details when present', () => {
      const error = new TestError('Test', { details: { userId: '123' } });
      const json = error.toJSON();

      expect(json.details).toEqual({ userId: '123' });
    });

    it('should include fields when present', () => {
      const fields = [{ field: 'email', message: 'Required' }];
      const error = new TestError('Test', { fields });
      const json = error.toJSON();

      expect(json.fields).toEqual(fields);
    });

    it('should include retryable when true', () => {
      const error = new TestError('Test', { retryable: true });
      const json = error.toJSON();

      expect(json.retryable).toBe(true);
    });

    it('should not include retryable when false', () => {
      const error = new TestError('Test');
      const json = error.toJSON();

      expect(json.retryable).toBeUndefined();
    });

    it('should not include stack trace', () => {
      const error = new TestError('Test');
      const json = error.toJSON();

      expect(json).not.toHaveProperty('stack');
    });
  });

  describe('toString()', () => {
    it('should format error string', () => {
      const error = new TestError('Something went wrong');
      expect(error.toString()).toBe('TestError [TEST_ERROR]: Something went wrong');
    });

    it('should include cause when present', () => {
      const cause = new Error('Original error');
      const error = new TestError('Wrapped error', { cause });
      const str = error.toString();

      expect(str).toContain('TestError [TEST_ERROR]: Wrapped error');
      expect(str).toContain('Caused by: Error: Original error');
    });
  });
});

describe('isDomainError()', () => {
  class TestError extends DomainError {
    readonly code = 'TEST';
    readonly status = 500;
  }

  it('should return true for DomainError instances', () => {
    expect(isDomainError(new TestError('Test'))).toBe(true);
  });

  it('should return false for regular Error', () => {
    expect(isDomainError(new Error('Test'))).toBe(false);
  });

  it('should return false for non-Error objects', () => {
    expect(isDomainError({ message: 'Not an error' })).toBe(false);
    expect(isDomainError('string error')).toBe(false);
    expect(isDomainError(null)).toBe(false);
    expect(isDomainError(undefined)).toBe(false);
  });
});

describe('wrapError()', () => {
  class WrapperError extends DomainError {
    readonly code = 'WRAPPED';
    readonly status = 500;
  }

  it('should return DomainError as-is', () => {
    const original = new WrapperError('Original');
    const wrapped = wrapError(original, WrapperError);

    expect(wrapped).toBe(original);
  });

  it('should wrap regular Error', () => {
    const original = new Error('Original message');
    const wrapped = wrapError(original, WrapperError);

    expect(wrapped).toBeInstanceOf(WrapperError);
    expect(wrapped.message).toBe('Original message');
    expect(wrapped.cause).toBe(original);
  });

  it('should wrap string error', () => {
    const wrapped = wrapError('String error', WrapperError);

    expect(wrapped).toBeInstanceOf(WrapperError);
    expect(wrapped.message).toBe('String error');
    expect(wrapped.cause).toBeUndefined();
  });

  it('should wrap unknown values', () => {
    const wrapped = wrapError({ code: 123 }, WrapperError);

    expect(wrapped).toBeInstanceOf(WrapperError);
    expect(wrapped.message).toBe('[object Object]');
  });
});

describe('createDomainError()', () => {
  it('should create error class with specified code and status', () => {
    const CustomError = createDomainError({
      code: 'CUSTOM_ERROR',
      status: 418,
    });

    const error = new CustomError('Test message');
    expect(error.code).toBe('CUSTOM_ERROR');
    expect(error.status).toBe(418);
    expect(error.message).toBe('Test message');
  });

  it('should use defaultMessage when no message provided', () => {
    const CustomError = createDomainError({
      code: 'CUSTOM',
      status: 400,
      defaultMessage: 'Default error message',
    });

    const error = new CustomError();
    expect(error.message).toBe('Default error message');
  });

  it('should allow message override', () => {
    const CustomError = createDomainError({
      code: 'CUSTOM',
      status: 400,
      defaultMessage: 'Default message',
    });

    const error = new CustomError('Custom message');
    expect(error.message).toBe('Custom message');
  });

  it('should support default retryable setting', () => {
    const RetryableError = createDomainError({
      code: 'RETRYABLE',
      status: 503,
      retryable: true,
    });

    const error = new RetryableError('Service unavailable');
    expect(error.retryable).toBe(true);
  });

  it('should allow retryable override per instance', () => {
    const DefaultRetryable = createDomainError({
      code: 'TEST',
      status: 500,
      retryable: true,
    });

    const error = new DefaultRetryable('Test', { retryable: false });
    expect(error.retryable).toBe(false);
  });

  it('should be instanceof DomainError', () => {
    const CustomError = createDomainError({
      code: 'CUSTOM',
      status: 500,
    });

    const error = new CustomError('Test');
    expect(error).toBeInstanceOf(DomainError);
    expect(isDomainError(error)).toBe(true);
  });
});

describe('Common Error Classes', () => {
  describe('NotFoundError', () => {
    it('should format message with resource and id', () => {
      const error = new NotFoundError('User', 'user_123');
      expect(error.message).toBe("User with id 'user_123' not found");
      expect(error.status).toBe(404);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('should format message without id', () => {
      const error = new NotFoundError('User');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ValidationError', () => {
    it('should accept message and details', () => {
      const error = new ValidationError('Invalid input', {
        email: 'Invalid format',
        password: 'Too short',
      });

      expect(error.message).toBe('Invalid input');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ email: 'Invalid format', password: 'Too short' });
    });

    it('should support fromZod static method', () => {
      const error = ValidationError.fromZod([
        { path: ['email'], message: 'Invalid format' },
        { path: ['password'], message: 'Too short' },
      ]);

      expect(error.message).toBe('Validation failed');
      expect(error.fields).toHaveLength(2);
      expect(error.fields).toContainEqual({ field: 'email', message: 'Invalid format' });
      expect(error.fields).toContainEqual({ field: 'password', message: 'Too short' });
    });

    it('should work without details', () => {
      const error = new ValidationError('Validation failed');
      expect(error.details).toBeUndefined();
    });
  });

  describe('ConflictError', () => {
    it('should have correct status and code', () => {
      const error = new ConflictError('Resource already exists');
      expect(error.status).toBe(409);
      expect(error.code).toBe(ErrorCode.CONFLICT);
    });
  });

  describe('ForbiddenError', () => {
    it('should have correct status and code', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.status).toBe(403);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  describe('UnauthorizedError', () => {
    it('should have correct status and code', () => {
      const error = new UnauthorizedError('Not authenticated');
      expect(error.status).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    });
  });

  describe('BadRequestError', () => {
    it('should have correct status and code', () => {
      const error = new BadRequestError('Invalid request format');
      expect(error.status).toBe(400);
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    });
  });

  describe('InternalError', () => {
    it('should have correct status and code', () => {
      const error = new InternalError('Something went wrong');
      expect(error.status).toBe(500);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    });

    it('should be retryable by default', () => {
      const error = new InternalError('Server error');
      expect(error.retryable).toBe(true);
    });
  });

  describe('RateLimitError', () => {
    it('should have correct status and code', () => {
      const error = new RateLimitError(60, 100);
      expect(error.status).toBe(429);
      expect(error.code).toBe(ErrorCode.RATE_LIMITED);
      expect(error.retryAfter).toBe(60);
    });

    it('should be retryable by default', () => {
      const error = new RateLimitError(30);
      expect(error.retryable).toBe(true);
    });
  });

  describe('TimeoutError', () => {
    it('should have correct status and code', () => {
      const error = new TimeoutError('Database query', 5000);
      expect(error.status).toBe(408);
      expect(error.code).toBe(ErrorCode.TIMEOUT);
      expect(error.message).toContain('5000ms');
    });

    it('should be retryable by default', () => {
      const error = new TimeoutError('Operation', 1000);
      expect(error.retryable).toBe(true);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should have correct status and code', () => {
      const error = new ServiceUnavailableError('Database');
      expect(error.status).toBe(503);
      expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    });

    it('should be retryable by default', () => {
      const error = new ServiceUnavailableError();
      expect(error.retryable).toBe(true);
    });
  });

  describe('PreconditionFailedError', () => {
    it('should have correct status and code', () => {
      const error = new PreconditionFailedError('Precondition not met');
      expect(error.status).toBe(412);
      expect(error.code).toBe(ErrorCode.PRECONDITION_FAILED);
    });
  });

  describe('UnprocessableError', () => {
    it('should have correct status and code', () => {
      const error = new UnprocessableError('Cannot process request');
      expect(error.status).toBe(422);
      expect(error.code).toBe(ErrorCode.UNPROCESSABLE);
    });
  });

  describe('ProviderError', () => {
    it('should have correct status and code', () => {
      const error = new ProviderError('stripe', new Error('API error'));
      expect(error.status).toBe(502);
      expect(error.code).toBe(ErrorCode.EXTERNAL_API_ERROR);
      expect(error.provider).toBe('stripe');
      expect(error.message).toContain('stripe error');
    });

    it('should be retryable by default', () => {
      const error = new ProviderError('aws', 'Service unavailable');
      expect(error.retryable).toBe(true);
    });

    it('should support nonRetryable static method', () => {
      const error = ProviderError.nonRetryable('stripe', 'Invalid card number');
      expect(error.retryable).toBe(false);
    });
  });
});

describe('Error Catalog', () => {
  describe('getErrorInfo()', () => {
    it('should return error info for valid code', () => {
      const info = getErrorInfo(ErrorCode.NOT_FOUND);
      expect(info).toBeDefined();
      expect(info.status).toBe(404);
    });
  });

  describe('getErrorStatus()', () => {
    it('should return status for valid code', () => {
      expect(getErrorStatus(ErrorCode.UNAUTHORIZED)).toBe(401);
      expect(getErrorStatus(ErrorCode.FORBIDDEN)).toBe(403);
      expect(getErrorStatus(ErrorCode.NOT_FOUND)).toBe(404);
    });
  });

  describe('getErrorMessage()', () => {
    it('should return default message for valid code', () => {
      const message = getErrorMessage(ErrorCode.NOT_FOUND);
      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
      expect(message).toBe('Resource not found');
    });
  });
});
