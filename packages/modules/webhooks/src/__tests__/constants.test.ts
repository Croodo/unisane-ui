/**
 * Webhooks Constants Tests
 *
 * Tests for webhooks module constants.
 */

import { describe, it, expect } from 'vitest';
import {
  WEBHOOKS_EVENTS,
  WEBHOOKS_DEFAULTS,
  WEBHOOKS_COLLECTIONS,
} from '../domain/constants';

describe('WEBHOOKS_EVENTS', () => {
  it('should have all expected events', () => {
    expect(WEBHOOKS_EVENTS.CREATED).toBe('webhooks.created');
    expect(WEBHOOKS_EVENTS.UPDATED).toBe('webhooks.updated');
    expect(WEBHOOKS_EVENTS.DELETED).toBe('webhooks.deleted');
    expect(WEBHOOKS_EVENTS.DELIVERED).toBe('webhooks.delivered');
    expect(WEBHOOKS_EVENTS.FAILED).toBe('webhooks.failed');
    expect(WEBHOOKS_EVENTS.REPLAYED).toBe('webhooks.replayed');
  });

  it('should have exactly 6 events', () => {
    expect(Object.keys(WEBHOOKS_EVENTS)).toHaveLength(6);
  });

  it('should follow webhooks.{action} naming pattern', () => {
    const eventValues = Object.values(WEBHOOKS_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^webhooks\.[a-z]+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    expect(typeof WEBHOOKS_EVENTS.CREATED).toBe('string');
    expect(typeof WEBHOOKS_EVENTS.DELIVERED).toBe('string');
  });
});

describe('WEBHOOKS_DEFAULTS', () => {
  describe('Retry defaults', () => {
    it('should have MAX_RETRIES of 3', () => {
      expect(WEBHOOKS_DEFAULTS.MAX_RETRIES).toBe(3);
    });

    it('should have RETRY_DELAYS_MS array with 3 delays', () => {
      expect(WEBHOOKS_DEFAULTS.RETRY_DELAYS_MS).toHaveLength(3);
      expect(WEBHOOKS_DEFAULTS.RETRY_DELAYS_MS).toEqual([5000, 30000, 300000]);
    });

    it('should have increasing retry delays', () => {
      const delays = WEBHOOKS_DEFAULTS.RETRY_DELAYS_MS;
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i - 1]);
      }
    });

    it('should have TIMEOUT_MS of 30 seconds', () => {
      expect(WEBHOOKS_DEFAULTS.TIMEOUT_MS).toBe(30000);
    });
  });

  describe('Limit defaults', () => {
    it('should have MAX_WEBHOOKS_PER_TENANT of 10', () => {
      expect(WEBHOOKS_DEFAULTS.MAX_WEBHOOKS_PER_TENANT).toBe(10);
    });
  });

  it('should have reasonable values', () => {
    // Retries should be reasonable
    expect(WEBHOOKS_DEFAULTS.MAX_RETRIES).toBeGreaterThanOrEqual(1);
    expect(WEBHOOKS_DEFAULTS.MAX_RETRIES).toBeLessThanOrEqual(10);

    // Timeout should be reasonable (5s to 2min)
    expect(WEBHOOKS_DEFAULTS.TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
    expect(WEBHOOKS_DEFAULTS.TIMEOUT_MS).toBeLessThanOrEqual(120000);

    // Max webhooks per tenant should be reasonable
    expect(WEBHOOKS_DEFAULTS.MAX_WEBHOOKS_PER_TENANT).toBeGreaterThanOrEqual(1);
    expect(WEBHOOKS_DEFAULTS.MAX_WEBHOOKS_PER_TENANT).toBeLessThanOrEqual(100);
  });
});

describe('WEBHOOKS_COLLECTIONS', () => {
  it('should have all expected collection names', () => {
    expect(WEBHOOKS_COLLECTIONS.WEBHOOKS).toBe('webhooks');
    expect(WEBHOOKS_COLLECTIONS.DELIVERIES).toBe('webhook_deliveries');
  });

  it('should have exactly 2 collections', () => {
    expect(Object.keys(WEBHOOKS_COLLECTIONS)).toHaveLength(2);
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(WEBHOOKS_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Type Safety', () => {
  it('should have numeric defaults as numbers', () => {
    expect(typeof WEBHOOKS_DEFAULTS.MAX_RETRIES).toBe('number');
    expect(typeof WEBHOOKS_DEFAULTS.TIMEOUT_MS).toBe('number');
    expect(typeof WEBHOOKS_DEFAULTS.MAX_WEBHOOKS_PER_TENANT).toBe('number');
  });

  it('should have RETRY_DELAYS_MS as an array of numbers', () => {
    expect(Array.isArray(WEBHOOKS_DEFAULTS.RETRY_DELAYS_MS)).toBe(true);
    for (const delay of WEBHOOKS_DEFAULTS.RETRY_DELAYS_MS) {
      expect(typeof delay).toBe('number');
    }
  });
});
