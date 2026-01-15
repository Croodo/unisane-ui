/**
 * Webhooks Domain Errors
 *
 * Module-specific error classes using E7xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

/**
 * Thrown when a webhook endpoint is not found.
 */
export class WebhookNotFoundError extends DomainError {
  readonly code = ErrorCode.WEBHOOK_NOT_FOUND;
  readonly status = 404;

  constructor(webhookId: string) {
    super(`Webhook not found: ${webhookId}`);
    this.name = 'WebhookNotFoundError';
  }
}

/**
 * Thrown when webhook delivery fails.
 */
export class WebhookDeliveryError extends DomainError {
  readonly code = ErrorCode.WEBHOOK_DELIVERY_FAILED;
  readonly status = 502;

  constructor(webhookId: string, statusCode: number) {
    super(`Webhook delivery failed with status ${statusCode}`, { retryable: true });
    this.name = 'WebhookDeliveryError';
  }
}

/**
 * Thrown when webhook signature verification fails.
 */
export class WebhookSignatureError extends DomainError {
  readonly code = ErrorCode.INVALID_WEBHOOK_SIGNATURE;
  readonly status = 401;

  constructor() {
    super('Invalid webhook signature');
    this.name = 'WebhookSignatureError';
  }
}

/**
 * Thrown when webhook limit is exceeded for a tenant.
 */
export class WebhookLimitExceededError extends DomainError {
  readonly code = ErrorCode.WEBHOOK_LIMIT_EXCEEDED;
  readonly status = 403;

  constructor(scopeId: string, limit: number) {
    super(`Webhook limit ${limit} exceeded for tenant ${scopeId}`);
    this.name = 'WebhookLimitExceededError';
  }
}
