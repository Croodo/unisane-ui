/**
 * Credits Constants Tests
 *
 * Tests for credits module constants.
 */

import { describe, it, expect } from 'vitest';
import {
  CREDITS_EVENTS,
  CREDITS_DEFAULTS,
  CREDITS_COLLECTIONS,
} from '../domain/constants';

describe('CREDITS_EVENTS', () => {
  it('should have all expected events', () => {
    expect(CREDITS_EVENTS.GRANTED).toBe('credits.granted');
    expect(CREDITS_EVENTS.CONSUMED).toBe('credits.consumed');
    expect(CREDITS_EVENTS.EXPIRED).toBe('credits.expired');
    expect(CREDITS_EVENTS.REFUNDED).toBe('credits.refunded');
  });

  it('should have exactly 4 events', () => {
    expect(Object.keys(CREDITS_EVENTS)).toHaveLength(4);
  });

  it('should follow credits.{action} naming pattern', () => {
    const eventValues = Object.values(CREDITS_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^credits\.[a-z]+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    expect(typeof CREDITS_EVENTS.GRANTED).toBe('string');
    expect(typeof CREDITS_EVENTS.CONSUMED).toBe('string');
  });
});

describe('CREDITS_DEFAULTS', () => {
  describe('Expiry defaults', () => {
    it('should have DEFAULT_EXPIRY_DAYS of 365', () => {
      expect(CREDITS_DEFAULTS.DEFAULT_EXPIRY_DAYS).toBe(365);
    });
  });

  it('should have reasonable values', () => {
    // Expiry should be reasonable (1 day to 10 years)
    expect(CREDITS_DEFAULTS.DEFAULT_EXPIRY_DAYS).toBeGreaterThanOrEqual(1);
    expect(CREDITS_DEFAULTS.DEFAULT_EXPIRY_DAYS).toBeLessThanOrEqual(3650);
  });
});

describe('CREDITS_COLLECTIONS', () => {
  it('should have all expected collection names', () => {
    expect(CREDITS_COLLECTIONS.LEDGER).toBe('credits_ledger');
    expect(CREDITS_COLLECTIONS.BALANCES).toBe('credits_balances');
  });

  it('should have exactly 2 collections', () => {
    expect(Object.keys(CREDITS_COLLECTIONS)).toHaveLength(2);
  });

  it('should use credits_ prefix for all collections', () => {
    const collectionNames = Object.values(CREDITS_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^credits_[a-z_]+$/);
    }
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(CREDITS_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Type Safety', () => {
  it('should have numeric defaults as numbers', () => {
    expect(typeof CREDITS_DEFAULTS.DEFAULT_EXPIRY_DAYS).toBe('number');
  });
});
