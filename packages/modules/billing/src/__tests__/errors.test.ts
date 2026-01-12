/**
 * Billing Errors Tests
 *
 * Tests for domain error classes in the billing module.
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@unisane/kernel';
import {
  SubscriptionNotFoundError,
  SubscriptionAlreadyExistsError,
  SubscriptionCancelledError,
  InvalidPlanError,
  PlanDowngradeNotAllowedError,
  PaymentNotFoundError,
  PaymentFailedError,
  PaymentAlreadyRefundedError,
  RefundAmountExceededError,
  InvoiceNotFoundError,
  BillingProviderError,
  CustomerNotFoundError,
  InsufficientCreditsError,
  PaymentMethodRequiredError,
  QuotaExceededError,
} from '../domain/errors';

describe('SubscriptionNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new SubscriptionNotFoundError('tenant_123');

    expect(error.name).toBe('SubscriptionNotFoundError');
    expect(error.message).toBe('No subscription found for tenant: tenant_123');
    expect(error.code).toBe(ErrorCode.SUBSCRIPTION_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new SubscriptionNotFoundError('t');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('SubscriptionAlreadyExistsError', () => {
  it('should have correct error properties', () => {
    const error = new SubscriptionAlreadyExistsError('tenant_456');

    expect(error.name).toBe('SubscriptionAlreadyExistsError');
    expect(error.message).toBe('Tenant tenant_456 already has an active subscription');
    expect(error.code).toBe(ErrorCode.CONFLICT);
    expect(error.status).toBe(409);
  });

  it('should be an instance of Error', () => {
    const error = new SubscriptionAlreadyExistsError('t');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('SubscriptionCancelledError', () => {
  it('should have correct error properties', () => {
    const error = new SubscriptionCancelledError('tenant_789');

    expect(error.name).toBe('SubscriptionCancelledError');
    expect(error.message).toBe('Subscription for tenant tenant_789 has been cancelled');
    expect(error.code).toBe(ErrorCode.SUBSCRIPTION_CANCELLED);
    expect(error.status).toBe(403);
  });

  it('should be an instance of Error', () => {
    const error = new SubscriptionCancelledError('t');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvalidPlanError', () => {
  it('should have correct error properties', () => {
    const error = new InvalidPlanError('nonexistent_plan');

    expect(error.name).toBe('InvalidPlanError');
    expect(error.message).toBe('Invalid plan: nonexistent_plan');
    expect(error.code).toBe(ErrorCode.PLAN_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new InvalidPlanError('x');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('PlanDowngradeNotAllowedError', () => {
  it('should have correct error properties', () => {
    const error = new PlanDowngradeNotAllowedError('enterprise', 'starter', 'too many seats');

    expect(error.name).toBe('PlanDowngradeNotAllowedError');
    expect(error.message).toBe('Cannot downgrade from enterprise to starter: too many seats');
    expect(error.code).toBe(ErrorCode.FEATURE_NOT_AVAILABLE);
    expect(error.status).toBe(403);
  });

  it('should be an instance of Error', () => {
    const error = new PlanDowngradeNotAllowedError('a', 'b', 'reason');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('PaymentNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new PaymentNotFoundError('pi_123456');

    expect(error.name).toBe('PaymentNotFoundError');
    expect(error.message).toBe('Payment not found: pi_123456');
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new PaymentNotFoundError('p');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('PaymentFailedError', () => {
  it('should have correct error properties', () => {
    const error = new PaymentFailedError('Card declined');

    expect(error.name).toBe('PaymentFailedError');
    expect(error.message).toBe('Payment failed: Card declined');
    expect(error.code).toBe(ErrorCode.PAYMENT_FAILED);
    expect(error.status).toBe(402);
  });

  it('should accept various failure reasons', () => {
    const reasons = ['Card declined', 'Insufficient funds', 'Expired card', 'Invalid CVC'];

    for (const reason of reasons) {
      const error = new PaymentFailedError(reason);
      expect(error.message).toBe(`Payment failed: ${reason}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new PaymentFailedError('reason');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('PaymentAlreadyRefundedError', () => {
  it('should have correct error properties', () => {
    const error = new PaymentAlreadyRefundedError('pi_789');

    expect(error.name).toBe('PaymentAlreadyRefundedError');
    expect(error.message).toBe('Payment pi_789 has already been refunded');
    expect(error.code).toBe(ErrorCode.ALREADY_REFUNDED);
    expect(error.status).toBe(409);
  });

  it('should be an instance of Error', () => {
    const error = new PaymentAlreadyRefundedError('p');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('RefundAmountExceededError', () => {
  it('should have correct error properties', () => {
    const error = new RefundAmountExceededError(100, 50, 'USD');

    expect(error.name).toBe('RefundAmountExceededError');
    expect(error.message).toBe('Refund amount 100 USD exceeds available 50 USD');
    expect(error.code).toBe(ErrorCode.REFUND_EXCEEDED);
    expect(error.status).toBe(400);
  });

  it('should work with different currencies', () => {
    const error = new RefundAmountExceededError(200, 150, 'EUR');

    expect(error.message).toBe('Refund amount 200 EUR exceeds available 150 EUR');
  });

  it('should be an instance of Error', () => {
    const error = new RefundAmountExceededError(1, 0, 'X');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('InvoiceNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new InvoiceNotFoundError('inv_123');

    expect(error.name).toBe('InvoiceNotFoundError');
    expect(error.message).toBe('Invoice not found: inv_123');
    expect(error.code).toBe(ErrorCode.INVOICE_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new InvoiceNotFoundError('i');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('BillingProviderError', () => {
  it('should have correct error properties', () => {
    const error = new BillingProviderError('Stripe', 'createSubscription', 'API timeout');

    expect(error.name).toBe('BillingProviderError');
    expect(error.message).toBe('Stripe createSubscription failed: API timeout');
    expect(error.code).toBe(ErrorCode.EXTERNAL_API_ERROR);
    expect(error.status).toBe(502);
  });

  it('should accept various providers and operations', () => {
    const providers = ['Stripe', 'PayPal', 'Braintree'];
    const operations = ['createSubscription', 'processPayment', 'issueRefund'];

    for (const provider of providers) {
      for (const operation of operations) {
        const error = new BillingProviderError(provider, operation, 'error');
        expect(error.message).toBe(`${provider} ${operation} failed: error`);
      }
    }
  });

  it('should be an instance of Error', () => {
    const error = new BillingProviderError('P', 'op', 'r');

    expect(error).toBeInstanceOf(Error);
  });
});

describe('CustomerNotFoundError', () => {
  it('should have correct error properties', () => {
    const error = new CustomerNotFoundError('tenant_abc');

    expect(error.name).toBe('CustomerNotFoundError');
    expect(error.message).toBe('Billing customer not found for tenant: tenant_abc');
    expect(error.code).toBe(ErrorCode.CUSTOMER_NOT_FOUND);
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new CustomerNotFoundError('t');

    expect(error).toBeInstanceOf(Error);
  });
});

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
    ];

    for (const { required, available } of cases) {
      const error = new InsufficientCreditsError(required, available);
      expect(error.message).toBe(`Insufficient credits: required ${required}, available ${available}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new InsufficientCreditsError(1, 0);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('PaymentMethodRequiredError', () => {
  it('should have correct error properties', () => {
    const error = new PaymentMethodRequiredError();

    expect(error.name).toBe('PaymentMethodRequiredError');
    expect(error.message).toBe('Payment method required');
    expect(error.code).toBe(ErrorCode.PAYMENT_METHOD_REQUIRED);
    expect(error.status).toBe(402);
  });

  it('should be an instance of Error', () => {
    const error = new PaymentMethodRequiredError();

    expect(error).toBeInstanceOf(Error);
  });
});

describe('QuotaExceededError', () => {
  it('should have correct error properties', () => {
    const error = new QuotaExceededError('API calls', 10000);

    expect(error.name).toBe('QuotaExceededError');
    expect(error.message).toBe('Quota exceeded for API calls. Limit: 10000');
    expect(error.code).toBe(ErrorCode.QUOTA_EXCEEDED);
    expect(error.status).toBe(403);
  });

  it('should work with various resources', () => {
    const resources = [
      { name: 'storage', limit: 5000 },
      { name: 'team members', limit: 50 },
      { name: 'projects', limit: 10 },
    ];

    for (const { name, limit } of resources) {
      const error = new QuotaExceededError(name, limit);
      expect(error.message).toBe(`Quota exceeded for ${name}. Limit: ${limit}`);
    }
  });

  it('should be an instance of Error', () => {
    const error = new QuotaExceededError('r', 1);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use 404 for not found errors', () => {
    expect(new SubscriptionNotFoundError('t').status).toBe(404);
    expect(new InvalidPlanError('p').status).toBe(404);
    expect(new PaymentNotFoundError('p').status).toBe(404);
    expect(new InvoiceNotFoundError('i').status).toBe(404);
    expect(new CustomerNotFoundError('t').status).toBe(404);
  });

  it('should use 409 for conflict errors', () => {
    expect(new SubscriptionAlreadyExistsError('t').status).toBe(409);
    expect(new PaymentAlreadyRefundedError('p').status).toBe(409);
  });

  it('should use 402 for payment required errors', () => {
    expect(new PaymentFailedError('r').status).toBe(402);
    expect(new InsufficientCreditsError(1, 0).status).toBe(402);
    expect(new PaymentMethodRequiredError().status).toBe(402);
  });

  it('should use 403 for forbidden/cancelled errors', () => {
    expect(new SubscriptionCancelledError('t').status).toBe(403);
    expect(new PlanDowngradeNotAllowedError('a', 'b', 'r').status).toBe(403);
    expect(new QuotaExceededError('r', 1).status).toBe(403);
  });

  it('should use 400 for bad request errors', () => {
    expect(new RefundAmountExceededError(1, 0, 'X').status).toBe(400);
  });

  it('should use 502 for external API errors', () => {
    expect(new BillingProviderError('P', 'op', 'r').status).toBe(502);
  });
});
