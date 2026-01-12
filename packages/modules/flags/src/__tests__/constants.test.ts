/**
 * Flags Constants Tests
 *
 * Tests for flags module constants.
 */

import { describe, it, expect } from 'vitest';
import {
  FLAGS_EVENTS,
  FLAGS_DEFAULTS,
  FLAGS_COLLECTIONS,
} from '../domain/constants';

describe('FLAGS_EVENTS', () => {
  it('should have all expected events', () => {
    expect(FLAGS_EVENTS.FLAG_EVALUATED).toBe('flags.evaluated');
    expect(FLAGS_EVENTS.OVERRIDE_SET).toBe('flags.override.set');
    expect(FLAGS_EVENTS.OVERRIDE_REMOVED).toBe('flags.override.removed');
  });

  it('should have exactly 3 events', () => {
    expect(Object.keys(FLAGS_EVENTS)).toHaveLength(3);
  });

  it('should follow flags.{entity}.{action} naming pattern', () => {
    const eventValues = Object.values(FLAGS_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^flags(\.[a-z_]+)+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    expect(typeof FLAGS_EVENTS.FLAG_EVALUATED).toBe('string');
    expect(typeof FLAGS_EVENTS.OVERRIDE_SET).toBe('string');
  });
});

describe('FLAGS_DEFAULTS', () => {
  describe('Cache defaults', () => {
    it('should have CACHE_TTL_MS of 60 seconds', () => {
      expect(FLAGS_DEFAULTS.CACHE_TTL_MS).toBe(60_000);
    });
  });

  it('should have reasonable values', () => {
    // Cache TTL should be reasonable
    expect(FLAGS_DEFAULTS.CACHE_TTL_MS).toBeGreaterThanOrEqual(1000);
    expect(FLAGS_DEFAULTS.CACHE_TTL_MS).toBeLessThanOrEqual(600_000);
  });
});

describe('FLAGS_COLLECTIONS', () => {
  it('should have all expected collection names', () => {
    expect(FLAGS_COLLECTIONS.FLAGS).toBe('flags');
    expect(FLAGS_COLLECTIONS.OVERRIDES).toBe('flag_overrides');
  });

  it('should have exactly 2 collections', () => {
    expect(Object.keys(FLAGS_COLLECTIONS)).toHaveLength(2);
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(FLAGS_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Type Safety', () => {
  it('should have numeric defaults as numbers', () => {
    expect(typeof FLAGS_DEFAULTS.CACHE_TTL_MS).toBe('number');
  });
});
