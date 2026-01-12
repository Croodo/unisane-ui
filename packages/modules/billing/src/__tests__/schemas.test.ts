/**
 * Billing Schemas Tests
 *
 * Tests for Zod validation schemas in the billing module.
 */

import { describe, it, expect } from 'vitest';
import {
  ZSubscribe,
  ZPortal,
  ZCancel,
  ZTopup,
  ZRefund,
  ZChangeQuantity,
  ZChangePlan,
} from '../domain/schemas';

describe('ZSubscribe', () => {
  describe('valid data', () => {
    it('should accept valid subscription with required fields', () => {
      const result = ZSubscribe.safeParse({
        planId: 'pro',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.planId).toBe('pro');
        expect(result.data.quantity).toBeUndefined();
      }
    });

    it('should accept subscription with quantity', () => {
      const result = ZSubscribe.safeParse({
        planId: 'enterprise',
        quantity: 10,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(10);
      }
    });

    it('should accept various plan IDs', () => {
      const plans = ['pro', 'starter', 'enterprise', 'team', 'business'];

      for (const planId of plans) {
        const result = ZSubscribe.safeParse({
          planId,
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject plan ID shorter than 2 characters', () => {
      const result = ZSubscribe.safeParse({
        planId: 'x',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid successUrl', () => {
      const result = ZSubscribe.safeParse({
        planId: 'pro',
        successUrl: 'not-a-url',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid cancelUrl', () => {
      const result = ZSubscribe.safeParse({
        planId: 'pro',
        successUrl: 'https://example.com/success',
        cancelUrl: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const result = ZSubscribe.safeParse({
        planId: 'pro',
        quantity: -1,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(false);
    });

    it('should reject zero quantity', () => {
      const result = ZSubscribe.safeParse({
        planId: 'pro',
        quantity: 0,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = ZSubscribe.safeParse({
        planId: 'pro',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZPortal', () => {
  it('should accept empty object', () => {
    const result = ZPortal.safeParse({});

    expect(result.success).toBe(true);
  });

  it('should strip extra fields', () => {
    const result = ZPortal.safeParse({
      extra: 'field',
    });

    expect(result.success).toBe(true);
  });
});

describe('ZCancel', () => {
  describe('valid data', () => {
    it('should accept empty object with default atPeriodEnd', () => {
      const result = ZCancel.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.atPeriodEnd).toBe(true);
      }
    });

    it('should accept explicit atPeriodEnd true', () => {
      const result = ZCancel.safeParse({ atPeriodEnd: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.atPeriodEnd).toBe(true);
      }
    });

    it('should accept atPeriodEnd false', () => {
      const result = ZCancel.safeParse({ atPeriodEnd: false });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.atPeriodEnd).toBe(false);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject non-boolean atPeriodEnd', () => {
      const result = ZCancel.safeParse({ atPeriodEnd: 'yes' });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZTopup', () => {
  describe('valid data', () => {
    it('should accept valid topup with amount only', () => {
      const result = ZTopup.safeParse({
        amount: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(50);
        expect(result.data.currency).toBe('USD');
      }
    });

    it('should accept topup with all fields', () => {
      const result = ZTopup.safeParse({
        amount: 100,
        currency: 'EUR',
        description: 'Monthly credit topup',
        successUrl: '/billing/success',
        cancelUrl: '/billing/cancel',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(100);
        expect(result.data.currency).toBe('EUR');
        expect(result.data.description).toBe('Monthly credit topup');
      }
    });

    it('should accept various currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];

      for (const currency of currencies) {
        const result = ZTopup.safeParse({
          amount: 10,
          currency,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject zero amount', () => {
      const result = ZTopup.safeParse({
        amount: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = ZTopup.safeParse({
        amount: -50,
      });

      expect(result.success).toBe(false);
    });

    it('should reject currency not exactly 3 characters', () => {
      const result = ZTopup.safeParse({
        amount: 50,
        currency: 'US',
      });

      expect(result.success).toBe(false);
    });

    it('should reject currency longer than 3 characters', () => {
      const result = ZTopup.safeParse({
        amount: 50,
        currency: 'USDD',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty successUrl', () => {
      const result = ZTopup.safeParse({
        amount: 50,
        successUrl: '',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZRefund', () => {
  describe('valid data', () => {
    it('should accept refund with payment ID only (full refund)', () => {
      const result = ZRefund.safeParse({
        providerPaymentId: 'pi_12345',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.providerPaymentId).toBe('pi_12345');
        expect(result.data.amount).toBeUndefined();
      }
    });

    it('should accept partial refund with amount', () => {
      const result = ZRefund.safeParse({
        providerPaymentId: 'pi_12345',
        amount: 25.50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(25.50);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject payment ID shorter than 4 characters', () => {
      const result = ZRefund.safeParse({
        providerPaymentId: 'pi_',
      });

      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = ZRefund.safeParse({
        providerPaymentId: 'pi_12345',
        amount: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = ZRefund.safeParse({
        providerPaymentId: 'pi_12345',
        amount: -10,
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing payment ID', () => {
      const result = ZRefund.safeParse({
        amount: 25,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZChangeQuantity', () => {
  describe('valid data', () => {
    it('should accept quantity of 1', () => {
      const result = ZChangeQuantity.safeParse({ quantity: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(1);
      }
    });

    it('should accept larger quantities', () => {
      const quantities = [5, 10, 100, 500, 1000];

      for (const quantity of quantities) {
        const result = ZChangeQuantity.safeParse({ quantity });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject zero quantity', () => {
      const result = ZChangeQuantity.safeParse({ quantity: 0 });

      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const result = ZChangeQuantity.safeParse({ quantity: -5 });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer quantity', () => {
      const result = ZChangeQuantity.safeParse({ quantity: 5.5 });

      expect(result.success).toBe(false);
    });

    it('should reject missing quantity', () => {
      const result = ZChangeQuantity.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});

describe('ZChangePlan', () => {
  describe('valid data', () => {
    it('should accept valid plan ID', () => {
      const result = ZChangePlan.safeParse({ planId: 'enterprise' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.planId).toBe('enterprise');
      }
    });

    it('should accept various plan IDs', () => {
      const plans = ['pro', 'team', 'starter', 'business'];

      for (const planId of plans) {
        const result = ZChangePlan.safeParse({ planId });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject plan ID shorter than 2 characters', () => {
      const result = ZChangePlan.safeParse({ planId: 'x' });

      expect(result.success).toBe(false);
    });

    it('should reject empty plan ID', () => {
      const result = ZChangePlan.safeParse({ planId: '' });

      expect(result.success).toBe(false);
    });

    it('should reject missing plan ID', () => {
      const result = ZChangePlan.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});
