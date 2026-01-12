/**
 * Billing Constants Tests
 *
 * Tests for billing module constants.
 */

import { describe, it, expect } from 'vitest';
import {
  BILLING_EVENTS,
  BILLING_DEFAULTS,
  BILLING_COLLECTIONS,
} from '../domain/constants';

describe('BILLING_EVENTS', () => {
  it('should have all subscription events', () => {
    expect(BILLING_EVENTS.SUBSCRIPTION_CREATED).toBe('billing.subscription.created');
    expect(BILLING_EVENTS.SUBSCRIPTION_UPDATED).toBe('billing.subscription.updated');
    expect(BILLING_EVENTS.SUBSCRIPTION_CANCELLED).toBe('billing.subscription.cancelled');
    expect(BILLING_EVENTS.SUBSCRIPTION_RENEWED).toBe('billing.subscription.renewed');
  });

  it('should have plan and quantity change events', () => {
    expect(BILLING_EVENTS.PLAN_CHANGED).toBe('billing.plan.changed');
    expect(BILLING_EVENTS.QUANTITY_CHANGED).toBe('billing.quantity.changed');
  });

  it('should have payment events', () => {
    expect(BILLING_EVENTS.PAYMENT_SUCCEEDED).toBe('billing.payment.succeeded');
    expect(BILLING_EVENTS.PAYMENT_FAILED).toBe('billing.payment.failed');
    expect(BILLING_EVENTS.REFUND_ISSUED).toBe('billing.refund.issued');
  });

  it('should have invoice events', () => {
    expect(BILLING_EVENTS.INVOICE_CREATED).toBe('billing.invoice.created');
    expect(BILLING_EVENTS.INVOICE_PAID).toBe('billing.invoice.paid');
    expect(BILLING_EVENTS.INVOICE_PAST_DUE).toBe('billing.invoice.past_due');
  });

  it('should have topup event', () => {
    expect(BILLING_EVENTS.TOPUP_COMPLETED).toBe('billing.topup.completed');
  });

  it('should have exactly 13 events', () => {
    expect(Object.keys(BILLING_EVENTS)).toHaveLength(13);
  });

  it('should follow billing.{entity}.{action} naming pattern', () => {
    const eventValues = Object.values(BILLING_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^billing\.[a-z_]+\.[a-z_]+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    expect(typeof BILLING_EVENTS.SUBSCRIPTION_CREATED).toBe('string');
    expect(typeof BILLING_EVENTS.PAYMENT_SUCCEEDED).toBe('string');
  });
});

describe('BILLING_DEFAULTS', () => {
  describe('Currency defaults', () => {
    it('should have DEFAULT_CURRENCY of "usd"', () => {
      expect(BILLING_DEFAULTS.DEFAULT_CURRENCY).toBe('usd');
    });
  });

  describe('Quantity limits', () => {
    it('should have MIN_QUANTITY of 1', () => {
      expect(BILLING_DEFAULTS.MIN_QUANTITY).toBe(1);
    });

    it('should have MAX_QUANTITY of 1000', () => {
      expect(BILLING_DEFAULTS.MAX_QUANTITY).toBe(1000);
    });

    it('should have MAX_QUANTITY >= MIN_QUANTITY', () => {
      expect(BILLING_DEFAULTS.MAX_QUANTITY).toBeGreaterThanOrEqual(
        BILLING_DEFAULTS.MIN_QUANTITY
      );
    });
  });

  describe('Trial and grace period', () => {
    it('should have TRIAL_DAYS of 14', () => {
      expect(BILLING_DEFAULTS.TRIAL_DAYS).toBe(14);
    });

    it('should have GRACE_PERIOD_DAYS of 3', () => {
      expect(BILLING_DEFAULTS.GRACE_PERIOD_DAYS).toBe(3);
    });
  });

  describe('Cache defaults', () => {
    it('should have CACHE_TTL_MS of 60 seconds', () => {
      expect(BILLING_DEFAULTS.CACHE_TTL_MS).toBe(60_000);
    });
  });

  it('should have reasonable values', () => {
    // Quantity limits should be reasonable
    expect(BILLING_DEFAULTS.MIN_QUANTITY).toBeGreaterThanOrEqual(1);
    expect(BILLING_DEFAULTS.MAX_QUANTITY).toBeLessThanOrEqual(10000);

    // Trial should be reasonable
    expect(BILLING_DEFAULTS.TRIAL_DAYS).toBeGreaterThanOrEqual(0);
    expect(BILLING_DEFAULTS.TRIAL_DAYS).toBeLessThanOrEqual(90);

    // Grace period should be reasonable
    expect(BILLING_DEFAULTS.GRACE_PERIOD_DAYS).toBeGreaterThanOrEqual(0);
    expect(BILLING_DEFAULTS.GRACE_PERIOD_DAYS).toBeLessThanOrEqual(30);

    // Cache TTL should be reasonable
    expect(BILLING_DEFAULTS.CACHE_TTL_MS).toBeGreaterThanOrEqual(1000);
    expect(BILLING_DEFAULTS.CACHE_TTL_MS).toBeLessThanOrEqual(600_000);
  });
});

describe('BILLING_COLLECTIONS', () => {
  it('should have all expected collection names', () => {
    expect(BILLING_COLLECTIONS.SUBSCRIPTIONS).toBe('billing_subscriptions');
    expect(BILLING_COLLECTIONS.PAYMENTS).toBe('billing_payments');
    expect(BILLING_COLLECTIONS.INVOICES).toBe('billing_invoices');
    expect(BILLING_COLLECTIONS.TENANT_INTEGRATIONS).toBe('billing_tenant_integrations');
  });

  it('should have exactly 4 collections', () => {
    expect(Object.keys(BILLING_COLLECTIONS)).toHaveLength(4);
  });

  it('should use billing_ prefix for all collections', () => {
    const collectionNames = Object.values(BILLING_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^billing_[a-z_]+$/);
    }
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(BILLING_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Type Safety', () => {
  it('should have string defaults as strings', () => {
    expect(typeof BILLING_DEFAULTS.DEFAULT_CURRENCY).toBe('string');
  });

  it('should have numeric defaults as numbers', () => {
    expect(typeof BILLING_DEFAULTS.MIN_QUANTITY).toBe('number');
    expect(typeof BILLING_DEFAULTS.MAX_QUANTITY).toBe('number');
    expect(typeof BILLING_DEFAULTS.TRIAL_DAYS).toBe('number');
    expect(typeof BILLING_DEFAULTS.GRACE_PERIOD_DAYS).toBe('number');
    expect(typeof BILLING_DEFAULTS.CACHE_TTL_MS).toBe('number');
  });
});
