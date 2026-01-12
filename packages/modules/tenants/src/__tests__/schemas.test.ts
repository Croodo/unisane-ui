/**
 * Tenant Schemas Tests
 *
 * Tests for Zod validation schemas in the tenants module.
 */

import { describe, it, expect } from 'vitest';
import { ZTenantAdminSubscription, ZTenantAdminView } from '../domain/schemas';

describe('ZTenantAdminSubscription', () => {
  describe('valid data', () => {
    it('should accept full subscription data', () => {
      const result = ZTenantAdminSubscription.safeParse({
        status: 'active',
        quantity: 5,
        currentPeriodEnd: '2025-12-31T23:59:59Z',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
        expect(result.data.quantity).toBe(5);
        expect(result.data.currentPeriodEnd).toBe('2025-12-31T23:59:59Z');
      }
    });

    it('should accept all null values', () => {
      const result = ZTenantAdminSubscription.safeParse({
        status: null,
        quantity: null,
        currentPeriodEnd: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeNull();
        expect(result.data.quantity).toBeNull();
        expect(result.data.currentPeriodEnd).toBeNull();
      }
    });

    it('should accept mixed null and non-null values', () => {
      const result = ZTenantAdminSubscription.safeParse({
        status: 'trialing',
        quantity: null,
        currentPeriodEnd: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('trialing');
        expect(result.data.quantity).toBeNull();
      }
    });

    it('should accept various subscription statuses', () => {
      const statuses = ['active', 'trialing', 'past_due', 'canceled', 'incomplete'];

      for (const status of statuses) {
        const result = ZTenantAdminSubscription.safeParse({
          status,
          quantity: 1,
          currentPeriodEnd: '2025-12-31',
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject missing fields', () => {
      const result = ZTenantAdminSubscription.safeParse({
        status: 'active',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid quantity type', () => {
      const result = ZTenantAdminSubscription.safeParse({
        status: 'active',
        quantity: 'five',
        currentPeriodEnd: null,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid status type', () => {
      const result = ZTenantAdminSubscription.safeParse({
        status: 123,
        quantity: 5,
        currentPeriodEnd: null,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZTenantAdminView', () => {
  const validTenantView = {
    id: 'tenant_123abc',
    slug: 'acme-corp',
    name: 'Acme Corporation',
    planId: 'pro',
    membersCount: 10,
    adminsCount: 2,
    apiKeysCount: 5,
    flagOverridesCount: 3,
    invoicesOpenCount: 1,
    webhooksFailed24h: 0,
    creditsAvailable: 1000,
    lastActivityAt: '2025-01-15T12:00:00Z',
    subscription: {
      status: 'active',
      quantity: 10,
      currentPeriodEnd: '2025-02-15T23:59:59Z',
    },
  };

  describe('valid data', () => {
    it('should accept complete valid tenant view', () => {
      const result = ZTenantAdminView.safeParse(validTenantView);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('tenant_123abc');
        expect(result.data.slug).toBe('acme-corp');
        expect(result.data.name).toBe('Acme Corporation');
        expect(result.data.planId).toBe('pro');
        expect(result.data.membersCount).toBe(10);
      }
    });

    it('should accept tenant view with null lastActivityAt', () => {
      const result = ZTenantAdminView.safeParse({
        ...validTenantView,
        lastActivityAt: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lastActivityAt).toBeNull();
      }
    });

    it('should accept tenant view with null subscription', () => {
      const result = ZTenantAdminView.safeParse({
        ...validTenantView,
        subscription: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subscription).toBeNull();
      }
    });

    it('should accept tenant view with both nulls', () => {
      const result = ZTenantAdminView.safeParse({
        ...validTenantView,
        lastActivityAt: null,
        subscription: null,
      });

      expect(result.success).toBe(true);
    });

    it('should accept zero counts', () => {
      const result = ZTenantAdminView.safeParse({
        ...validTenantView,
        membersCount: 0,
        adminsCount: 0,
        apiKeysCount: 0,
        flagOverridesCount: 0,
        invoicesOpenCount: 0,
        webhooksFailed24h: 0,
        creditsAvailable: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should accept various slug formats', () => {
      const slugs = ['acme', 'acme-corp', 'my_company', 'company123', 'test'];

      for (const slug of slugs) {
        const result = ZTenantAdminView.safeParse({
          ...validTenantView,
          slug,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject missing required fields', () => {
      const result = ZTenantAdminView.safeParse({
        id: 'tenant_123',
        slug: 'acme',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid count types', () => {
      const result = ZTenantAdminView.safeParse({
        ...validTenantView,
        membersCount: 'ten',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid id type', () => {
      const result = ZTenantAdminView.safeParse({
        ...validTenantView,
        id: 123,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid subscription object', () => {
      const result = ZTenantAdminView.safeParse({
        ...validTenantView,
        subscription: {
          status: 'active',
          // missing quantity and currentPeriodEnd
        },
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty object', () => {
      const result = ZTenantAdminView.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer TenantAdminViewDto type', () => {
      const result = ZTenantAdminView.safeParse(validTenantView);

      expect(result.success).toBe(true);
      if (result.success) {
        // These type assertions verify the inferred type
        const id: string = result.data.id;
        const membersCount: number = result.data.membersCount;
        const lastActivityAt: string | null = result.data.lastActivityAt;

        expect(typeof id).toBe('string');
        expect(typeof membersCount).toBe('number');
        expect(typeof lastActivityAt).toBe('string');
      }
    });
  });
});
