/**
 * Billing Domain Errors
 *
 * Module-specific error classes using E3xxx error codes.
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class SubscriptionNotFoundError extends DomainError {
  readonly code = ErrorCode.SUBSCRIPTION_NOT_FOUND;
  readonly status = 404;

  constructor(tenantId: string) {
    super(`No subscription found for tenant: ${tenantId}`);
    this.name = 'SubscriptionNotFoundError';
  }
}

export class SubscriptionAlreadyExistsError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(tenantId: string) {
    super(`Tenant ${tenantId} already has an active subscription`);
    this.name = 'SubscriptionAlreadyExistsError';
  }
}

export class SubscriptionCancelledError extends DomainError {
  readonly code = ErrorCode.SUBSCRIPTION_CANCELLED;
  readonly status = 403;

  constructor(tenantId: string) {
    super(`Subscription for tenant ${tenantId} has been cancelled`);
    this.name = 'SubscriptionCancelledError';
  }
}

export class InvalidPlanError extends DomainError {
  readonly code = ErrorCode.PLAN_NOT_FOUND;
  readonly status = 404;

  constructor(planId: string) {
    super(`Invalid plan: ${planId}`);
    this.name = 'InvalidPlanError';
  }
}

export class PlanDowngradeNotAllowedError extends DomainError {
  readonly code = ErrorCode.FEATURE_NOT_AVAILABLE;
  readonly status = 403;

  constructor(currentPlan: string, targetPlan: string, reason: string) {
    super(`Cannot downgrade from ${currentPlan} to ${targetPlan}: ${reason}`);
    this.name = 'PlanDowngradeNotAllowedError';
  }
}

export class PaymentNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`);
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentFailedError extends DomainError {
  readonly code = ErrorCode.PAYMENT_FAILED;
  readonly status = 402;

  constructor(reason: string) {
    super(`Payment failed: ${reason}`);
    this.name = 'PaymentFailedError';
  }
}

export class PaymentAlreadyRefundedError extends DomainError {
  readonly code = ErrorCode.ALREADY_REFUNDED;
  readonly status = 409;

  constructor(paymentId: string) {
    super(`Payment ${paymentId} has already been refunded`);
    this.name = 'PaymentAlreadyRefundedError';
  }
}

export class RefundAmountExceededError extends DomainError {
  readonly code = ErrorCode.REFUND_EXCEEDED;
  readonly status = 400;

  constructor(requested: number, available: number, currency: string) {
    super(`Refund amount ${requested} ${currency} exceeds available ${available} ${currency}`);
    this.name = 'RefundAmountExceededError';
  }
}

export class InvoiceNotFoundError extends DomainError {
  readonly code = ErrorCode.INVOICE_NOT_FOUND;
  readonly status = 404;

  constructor(invoiceId: string) {
    super(`Invoice not found: ${invoiceId}`);
    this.name = 'InvoiceNotFoundError';
  }
}

export class BillingProviderError extends DomainError {
  readonly code = ErrorCode.EXTERNAL_API_ERROR;
  readonly status = 502;

  constructor(provider: string, operation: string, reason: string) {
    super(`${provider} ${operation} failed: ${reason}`, { retryable: true });
    this.name = 'BillingProviderError';
  }
}

export class CustomerNotFoundError extends DomainError {
  readonly code = ErrorCode.CUSTOMER_NOT_FOUND;
  readonly status = 404;

  constructor(tenantId: string) {
    super(`Billing customer not found for tenant: ${tenantId}`);
    this.name = 'CustomerNotFoundError';
  }
}

export class InsufficientCreditsError extends DomainError {
  readonly code = ErrorCode.INSUFFICIENT_CREDITS;
  readonly status = 402;

  constructor(required: number, available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = 'InsufficientCreditsError';
  }
}

export class PaymentMethodRequiredError extends DomainError {
  readonly code = ErrorCode.PAYMENT_METHOD_REQUIRED;
  readonly status = 402;

  constructor() {
    super('Payment method required');
    this.name = 'PaymentMethodRequiredError';
  }
}

export class QuotaExceededError extends DomainError {
  readonly code = ErrorCode.QUOTA_EXCEEDED;
  readonly status = 403;

  constructor(resource: string, limit: number) {
    super(`Quota exceeded for ${resource}. Limit: ${limit}`);
    this.name = 'QuotaExceededError';
  }
}
