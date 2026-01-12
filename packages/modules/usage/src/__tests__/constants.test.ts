/**
 * Usage Constants Tests
 *
 * Tests for usage module constants.
 */

import { describe, it, expect } from 'vitest';
import {
  USAGE_EVENTS,
  USAGE_WINDOWS,
  USAGE_DEFAULTS,
  USAGE_COLLECTIONS,
  type UsageWindow,
} from '../domain/constants';

describe('USAGE_EVENTS', () => {
  it('should have all expected events', () => {
    expect(USAGE_EVENTS.INCREMENTED).toBe('usage.incremented');
    expect(USAGE_EVENTS.LIMIT_REACHED).toBe('usage.limit.reached');
    expect(USAGE_EVENTS.WINDOW_RESET).toBe('usage.window.reset');
  });

  it('should have exactly 3 events', () => {
    expect(Object.keys(USAGE_EVENTS)).toHaveLength(3);
  });

  it('should follow usage.{action} or usage.{entity}.{action} naming pattern', () => {
    const eventValues = Object.values(USAGE_EVENTS);

    for (const event of eventValues) {
      expect(event).toMatch(/^usage(\.[a-z_]+)+$/);
    }
  });

  it('should be immutable (const assertion)', () => {
    expect(typeof USAGE_EVENTS.INCREMENTED).toBe('string');
    expect(typeof USAGE_EVENTS.LIMIT_REACHED).toBe('string');
  });
});

describe('USAGE_WINDOWS', () => {
  it('should have all expected window values', () => {
    expect(USAGE_WINDOWS.MINUTE).toBe('minute');
    expect(USAGE_WINDOWS.HOUR).toBe('hour');
    expect(USAGE_WINDOWS.DAY).toBe('day');
    expect(USAGE_WINDOWS.MONTH).toBe('month');
  });

  it('should have exactly 4 windows', () => {
    expect(Object.keys(USAGE_WINDOWS)).toHaveLength(4);
  });

  it('should use lowercase values', () => {
    const windowValues = Object.values(USAGE_WINDOWS);

    for (const window of windowValues) {
      expect(window).toMatch(/^[a-z]+$/);
    }
  });
});

describe('USAGE_DEFAULTS', () => {
  describe('Window defaults', () => {
    it('should have DEFAULT_WINDOW of "month"', () => {
      expect(USAGE_DEFAULTS.DEFAULT_WINDOW).toBe('month');
    });

    it('should have DEFAULT_WINDOW be a valid UsageWindow', () => {
      const validWindows = Object.values(USAGE_WINDOWS);
      expect(validWindows).toContain(USAGE_DEFAULTS.DEFAULT_WINDOW);
    });
  });
});

describe('USAGE_COLLECTIONS', () => {
  it('should have all expected collection names', () => {
    expect(USAGE_COLLECTIONS.METRICS).toBe('usage_metrics');
  });

  it('should have exactly 1 collection', () => {
    expect(Object.keys(USAGE_COLLECTIONS)).toHaveLength(1);
  });

  it('should use usage_ prefix', () => {
    const collectionNames = Object.values(USAGE_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^usage_[a-z_]+$/);
    }
  });

  it('should use snake_case naming', () => {
    const collectionNames = Object.values(USAGE_COLLECTIONS);

    for (const name of collectionNames) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('Type Safety', () => {
  it('should have string defaults as strings', () => {
    expect(typeof USAGE_DEFAULTS.DEFAULT_WINDOW).toBe('string');
  });

  it('should export correct UsageWindow type', () => {
    const window: UsageWindow = 'month';
    expect(window).toBe('month');

    const hourWindow: UsageWindow = 'hour';
    expect(hourWindow).toBe('hour');
  });
});
