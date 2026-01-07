/**
 * Billing Domain Errors
 */

import { DomainError, ErrorCode } from '@unisane/kernel';

export class SubscriptionNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
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
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(tenantId: string) {
    super(`Subscription for tenant ${tenantId} has been cancelled`);
    this.name = 'SubscriptionCancelledError';
  }
}

export class InvalidPlanError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(planId: string) {
    super(`Invalid plan: ${planId}`);
    this.name = 'InvalidPlanError';
  }
}

export class PlanDowngradeNotAllowedError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

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

export class PaymentAlreadyRefundedError extends DomainError {
  readonly code = ErrorCode.CONFLICT;
  readonly status = 409;

  constructor(paymentId: string) {
    super(`Payment ${paymentId} has already been refunded`);
    this.name = 'PaymentAlreadyRefundedError';
  }
}

export class RefundAmountExceededError extends DomainError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly status = 400;

  constructor(requested: number, available: number, currency: string) {
    super(`Refund amount ${requested} ${currency} exceeds available ${available} ${currency}`);
    this.name = 'RefundAmountExceededError';
  }
}

export class InvoiceNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(invoiceId: string) {
    super(`Invoice not found: ${invoiceId}`);
    this.name = 'InvoiceNotFoundError';
  }
}

export class BillingProviderError extends DomainError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly status = 500;

  constructor(provider: string, operation: string, reason: string) {
    super(`${provider} ${operation} failed: ${reason}`);
    this.name = 'BillingProviderError';
  }
}

export class CustomerNotFoundError extends DomainError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = 404;

  constructor(tenantId: string) {
    super(`Billing customer not found for tenant: ${tenantId}`);
    this.name = 'CustomerNotFoundError';
  }
}

export class InsufficientCreditsError extends DomainError {
  readonly code = ErrorCode.PRECONDITION_FAILED;
  readonly status = 412;

  constructor(required: number, available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = 'InsufficientCreditsError';
  }
}
