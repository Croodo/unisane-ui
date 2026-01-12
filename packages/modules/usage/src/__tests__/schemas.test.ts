/**
 * Usage Schemas Tests
 *
 * Tests for Zod validation schemas in the usage module.
 */

import { describe, it, expect } from 'vitest';
import { ZUsageIncrement, ZGetWindow } from '../domain/schemas';

describe('ZUsageIncrement', () => {
  describe('valid data', () => {
    it('should accept increment with feature only (default n=1)', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'api_calls',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feature).toBe('api_calls');
        expect(result.data.n).toBe(1);
      }
    });

    it('should accept increment with custom n', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'storage_bytes',
        n: 1024,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.n).toBe(1024);
      }
    });

    it('should accept increment with timestamp', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'requests',
        at: '2025-01-15T12:00:00Z',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.at).toBe('2025-01-15T12:00:00Z');
      }
    });

    it('should accept increment with idempotency key', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'messages_sent',
        idem: 'msg_12345678', // ZIdem requires min 8 chars
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idem).toBe('msg_12345678');
      }
    });

    it('should accept increment with all fields', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'tokens',
        n: 500,
        at: '2025-01-15T12:00:00Z',
        idem: 'token_usage_12345',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feature).toBe('tokens');
        expect(result.data.n).toBe(500);
        expect(result.data.at).toBe('2025-01-15T12:00:00Z');
        expect(result.data.idem).toBe('token_usage_12345');
      }
    });

    it('should accept various feature names', () => {
      const features = ['api_calls', 'storage', 'bandwidth', 'tokens', 'messages'];

      for (const feature of features) {
        const result = ZUsageIncrement.safeParse({ feature });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject empty feature', () => {
      const result = ZUsageIncrement.safeParse({
        feature: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject zero n', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'api_calls',
        n: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative n', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'api_calls',
        n: -10,
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer n', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'api_calls',
        n: 5.5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject short idempotency key', () => {
      const result = ZUsageIncrement.safeParse({
        feature: 'api_calls',
        idem: 'short', // less than 8 chars
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing feature', () => {
      const result = ZUsageIncrement.safeParse({
        n: 10,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZGetWindow', () => {
  describe('valid data', () => {
    it('should accept required fields', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_123',
        feature: 'api_calls',
        window: 'hour',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tenantId).toBe('tenant_123');
        expect(result.data.feature).toBe('api_calls');
        expect(result.data.window).toBe('hour');
      }
    });

    it('should accept with timestamp', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_456',
        feature: 'storage',
        window: 'day',
        at: '2025-01-15T12:00:00Z',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.at).toBe('2025-01-15T12:00:00Z');
      }
    });

    it('should accept minute window', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_123',
        feature: 'requests',
        window: 'minute',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.window).toBe('minute');
      }
    });

    it('should accept hour window', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_123',
        feature: 'requests',
        window: 'hour',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.window).toBe('hour');
      }
    });

    it('should accept day window', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_123',
        feature: 'requests',
        window: 'day',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.window).toBe('day');
      }
    });
  });

  describe('invalid data', () => {
    it('should reject invalid window', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_123',
        feature: 'api_calls',
        window: 'month', // month not in enum for ZGetWindow
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty tenantId', () => {
      const result = ZGetWindow.safeParse({
        tenantId: '',
        feature: 'api_calls',
        window: 'hour',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty feature', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_123',
        feature: '',
        window: 'hour',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = ZGetWindow.safeParse({
        tenantId: 'tenant_123',
      });

      expect(result.success).toBe(false);
    });
  });
});
