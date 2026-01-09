/**
 * Webhooks Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class WebhookNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(webhookId: string) {
    super(`Webhook not found: ${webhookId}`);
    this.name = 'WebhookNotFoundError';
  }
}

export class WebhookDeliveryError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(webhookId: string, statusCode: number) {
    super(`Webhook delivery failed with status ${statusCode}`);
    this.name = 'WebhookDeliveryError';
  }
}

export class WebhookSignatureError extends DomainError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly status = 401;

  constructor() {
    super('Invalid webhook signature');
    this.name = 'WebhookSignatureError';
  }
}

export class WebhookLimitExceededError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(tenantId: string, limit: number) {
    super(`Webhook limit ${limit} exceeded for tenant ${tenantId}`);
    this.name = 'WebhookLimitExceededError';
  }
}
