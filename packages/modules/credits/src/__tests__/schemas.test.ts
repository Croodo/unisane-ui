/**
 * Credits Schemas Tests
 *
 * Tests for Zod validation schemas in the credits module.
 */

import { describe, it, expect } from 'vitest';
import { ZGrantTokens, ZBurnTokens, ZListCursor } from '../domain/schemas';

describe('ZGrantTokens', () => {
  describe('valid data', () => {
    it('should accept valid grant with required fields', () => {
      const result = ZGrantTokens.safeParse({
        amount: 100,
        reason: 'Monthly bonus',
        idem: 'grant_123456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(100);
        expect(result.data.reason).toBe('Monthly bonus');
        expect(result.data.idem).toBe('grant_123456');
        expect(result.data.expiresAt).toBeUndefined();
      }
    });

    it('should accept grant with expiration', () => {
      const expiresAt = Date.now() + 86400000; // 1 day from now
      const result = ZGrantTokens.safeParse({
        amount: 50,
        reason: 'Promotional credits',
        expiresAt,
        idem: 'promo_abc123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiresAt).toBe(expiresAt);
      }
    });

    it('should accept various amounts', () => {
      const amounts = [1, 10, 100, 1000, 10000, 1000000];

      for (const amount of amounts) {
        const result = ZGrantTokens.safeParse({
          amount,
          reason: 'Test grant',
          idem: `grant_amount_${amount}`, // ZIdem requires min 8 chars
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject zero amount', () => {
      const result = ZGrantTokens.safeParse({
        amount: 0,
        reason: 'Test',
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = ZGrantTokens.safeParse({
        amount: -100,
        reason: 'Test',
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer amount', () => {
      const result = ZGrantTokens.safeParse({
        amount: 50.5,
        reason: 'Test',
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject reason shorter than 2 characters', () => {
      const result = ZGrantTokens.safeParse({
        amount: 100,
        reason: 'x',
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing idem', () => {
      const result = ZGrantTokens.safeParse({
        amount: 100,
        reason: 'Test grant',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing amount', () => {
      const result = ZGrantTokens.safeParse({
        reason: 'Test grant',
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZBurnTokens', () => {
  describe('valid data', () => {
    it('should accept valid burn with required fields', () => {
      const result = ZBurnTokens.safeParse({
        amount: 50,
        idem: 'burn_123456',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(50);
        expect(result.data.reason).toBe('usage'); // default
        expect(result.data.idem).toBe('burn_123456');
      }
    });

    it('should accept burn with custom reason', () => {
      const result = ZBurnTokens.safeParse({
        amount: 25,
        reason: 'API call',
        idem: 'burn_789',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe('API call');
      }
    });

    it('should accept burn with feature', () => {
      const result = ZBurnTokens.safeParse({
        amount: 10,
        reason: 'Feature usage',
        feature: 'image_generation',
        idem: 'burn_feature_123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feature).toBe('image_generation');
      }
    });

    it('should accept various amounts', () => {
      const amounts = [1, 5, 10, 100, 500];

      for (const amount of amounts) {
        const result = ZBurnTokens.safeParse({
          amount,
          idem: `burn_amount_${amount}`, // ZIdem requires min 8 chars
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject zero amount', () => {
      const result = ZBurnTokens.safeParse({
        amount: 0,
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = ZBurnTokens.safeParse({
        amount: -10,
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer amount', () => {
      const result = ZBurnTokens.safeParse({
        amount: 5.5,
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing idem', () => {
      const result = ZBurnTokens.safeParse({
        amount: 50,
        reason: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty reason when provided', () => {
      const result = ZBurnTokens.safeParse({
        amount: 50,
        reason: '',
        idem: 'test_123',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZListCursor', () => {
  describe('valid data', () => {
    it('should accept empty object with defaults', () => {
      const result = ZListCursor.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBeUndefined();
        expect(result.data.limit).toBe(50);
      }
    });

    it('should accept cursor string', () => {
      const result = ZListCursor.safeParse({
        cursor: 'abc123xyz',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('abc123xyz');
      }
    });

    it('should accept custom limit', () => {
      const result = ZListCursor.safeParse({
        limit: 100,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should accept minimum limit of 1', () => {
      const result = ZListCursor.safeParse({
        limit: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it('should accept maximum limit of 200', () => {
      const result = ZListCursor.safeParse({
        limit: 200,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(200);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject limit of 0', () => {
      const result = ZListCursor.safeParse({
        limit: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const result = ZListCursor.safeParse({
        limit: -1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding 200', () => {
      const result = ZListCursor.safeParse({
        limit: 201,
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer limit', () => {
      const result = ZListCursor.safeParse({
        limit: 50.5,
      });

      expect(result.success).toBe(false);
    });
  });
});
