/**
 * Webhooks Errors Tests
 *
 * Tests for domain error classes in the webhooks module.
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@unisane/kernel';
import {
  WebhookNotFoundError,
  WebhookDeliveryError,
  WebhookSignatureError,
  WebhookLimitExceededError,
} from '../domain/errors';

describe('WebhookNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new WebhookNotFoundError('wh_123456');

    expect(error.name).toBe('WebhookNotFoundError');
    expect(error.message).toBe('Webhook not found: wh_123456');
    expect(error.code).toBe(ErrorCode.WEBHOOK_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should accept various webhook IDs', () => {
    const ids = ['wh_abc', 'webhook_123', 'hook_xyz'];

    for (const id of ids) {
      const error = new WebhookNotFoundError(id);
      expect(error.message).toBe(`Webhook not found: ${id}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new WebhookNotFoundError('id');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('WebhookDeliveryError', () => {
  it('should have correct error properties', () => {
    const error = new WebhookDeliveryError('wh_123', 500);

    expect(error.name).toBe('WebhookDeliveryError');
    expect(error.message).toBe('Webhook delivery failed with status 500');
    expect(error.code).toBe(ErrorCode.WEBHOOK_DELIVERY_FAILED);
    expect(error.status).toBe(502);
  });

  it('should handle various HTTP status codes', () => {
    const statusCodes = [400, 401, 403, 404, 500, 502, 503, 504];

    for (const code of statusCodes) {
      const error = new WebhookDeliveryError('wh_test', code);
      expect(error.message).toBe(`Webhook delivery failed with status ${code}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new WebhookDeliveryError('id', 500);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('WebhookSignatureError', () => {
  it('should have correct error properties', () => {
    const error = new WebhookSignatureError();

    expect(error.name).toBe('WebhookSignatureError');
    expect(error.message).toBe('Invalid webhook signature');
    expect(error.code).toBe(ErrorCode.INVALID_WEBHOOK_SIGNATURE);
    expect(error.status).toBe(401);
  });

  it('should be an instance of Error', () => {
    const error = new WebhookSignatureError();

    expect(error).toBeInstanceOf(Error);
  });
});

describe('WebhookLimitExceededError', () => {
  it('should have correct error properties', () => {
    const error = new WebhookLimitExceededError('tenant_123', 10);

    expect(error.name).toBe('WebhookLimitExceededError');
    expect(error.message).toBe('Webhook limit 10 exceeded for tenant tenant_123');
    expect(error.code).toBe(ErrorCode.WEBHOOK_LIMIT_EXCEEDED);
    expect(error.status).toBe(403);
  });

  it('should handle various limits', () => {
    const limits = [5, 10, 20, 50];

    for (const limit of limits) {
      const error = new WebhookLimitExceededError('tenant_test', limit);
      expect(error.message).toBe(`Webhook limit ${limit} exceeded for tenant tenant_test`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new WebhookLimitExceededError('t', 1);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use 404 for not found errors', () => {
    expect(new WebhookNotFoundError('id').status).toBe(404);
  });

  it('should use 401 for signature errors', () => {
    expect(new WebhookSignatureError().status).toBe(401);
  });

  it('should use 403 for limit exceeded errors', () => {
    expect(new WebhookLimitExceededError('t', 1).status).toBe(403);
  });

  it('should use 502 for delivery errors', () => {
    expect(new WebhookDeliveryError('id', 500).status).toBe(502);
  });
});
