/**
 * Flags Schemas Tests
 *
 * Tests for Zod validation schemas in the flags module.
 */

import { describe, it, expect } from 'vitest';
import {
  ZRuleCondition,
  ZRule,
  ZFlagWrite,
  ZFlagOut,
  ZOverrideWrite,
  ZOverrideOut,
  ZFlagGetQuery,
  ZFlagsListQuery,
} from '../domain/schemas';

describe('ZRuleCondition', () => {
  describe('planIn condition', () => {
    it('should accept valid planIn condition', () => {
      const result = ZRuleCondition.safeParse({
        planIn: ['pro', 'business'],
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty planIn array', () => {
      const result = ZRuleCondition.safeParse({
        planIn: [],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('countryIn condition', () => {
    it('should accept valid countryIn condition', () => {
      const result = ZRuleCondition.safeParse({
        countryIn: ['US', 'CA', 'UK'],
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty countryIn array', () => {
      const result = ZRuleCondition.safeParse({
        countryIn: [],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('emailDomainIn condition', () => {
    it('should accept valid emailDomainIn condition', () => {
      const result = ZRuleCondition.safeParse({
        emailDomainIn: ['example.com', 'test.org'],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('tenantTagIn condition', () => {
    it('should accept valid tenantTagIn condition', () => {
      const result = ZRuleCondition.safeParse({
        tenantTagIn: ['beta', 'early_adopter'],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('timeWindow condition', () => {
    it('should accept valid timeWindow with from and to', () => {
      const result = ZRuleCondition.safeParse({
        timeWindow: {
          from: '2025-01-01T00:00:00Z',
          to: '2025-12-31T23:59:59Z',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should accept timeWindow with only from', () => {
      const result = ZRuleCondition.safeParse({
        timeWindow: {
          from: '2025-01-01T00:00:00Z',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should accept timeWindow with only to', () => {
      const result = ZRuleCondition.safeParse({
        timeWindow: {
          to: '2025-12-31T23:59:59Z',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty timeWindow', () => {
      const result = ZRuleCondition.safeParse({
        timeWindow: {},
      });

      expect(result.success).toBe(true);
    });
  });

  describe('percentage condition', () => {
    it('should accept valid percentage', () => {
      const result = ZRuleCondition.safeParse({
        percentage: 50,
      });

      expect(result.success).toBe(true);
    });

    it('should accept 0 percentage', () => {
      const result = ZRuleCondition.safeParse({
        percentage: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should accept 100 percentage', () => {
      const result = ZRuleCondition.safeParse({
        percentage: 100,
      });

      expect(result.success).toBe(true);
    });

    it('should reject percentage over 100', () => {
      const result = ZRuleCondition.safeParse({
        percentage: 101,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative percentage', () => {
      const result = ZRuleCondition.safeParse({
        percentage: -1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer percentage', () => {
      const result = ZRuleCondition.safeParse({
        percentage: 50.5,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('ZRule', () => {
  it('should accept valid rule with single condition', () => {
    const result = ZRule.safeParse({
      if: [{ planIn: ['pro'] }],
      then: { value: true },
    });

    expect(result.success).toBe(true);
  });

  it('should accept valid rule with multiple conditions', () => {
    const result = ZRule.safeParse({
      if: [
        { planIn: ['pro', 'business'] },
        { countryIn: ['US'] },
      ],
      then: { value: true },
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty conditions array', () => {
    const result = ZRule.safeParse({
      if: [],
      then: { value: true },
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing then clause', () => {
    const result = ZRule.safeParse({
      if: [{ planIn: ['pro'] }],
    });

    expect(result.success).toBe(false);
  });
});

describe('ZFlagWrite', () => {
  it('should accept valid flag with required fields', () => {
    const result = ZFlagWrite.safeParse({
      env: 'prod',
      key: 'new_feature',
      enabledDefault: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.env).toBe('prod');
      expect(result.data.key).toBe('new_feature');
      expect(result.data.enabledDefault).toBe(false);
      expect(result.data.rules).toEqual([]);
    }
  });

  it('should accept flag with rules', () => {
    const result = ZFlagWrite.safeParse({
      env: 'stage',
      key: 'beta_feature',
      enabledDefault: false,
      rules: [
        {
          if: [{ planIn: ['pro'] }],
          then: { value: true },
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rules).toHaveLength(1);
    }
  });

  it('should accept flag with expected version', () => {
    const result = ZFlagWrite.safeParse({
      env: 'dev',
      key: 'test_flag',
      enabledDefault: true,
      expectedVersion: 5,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expectedVersion).toBe(5);
    }
  });

  it('should accept various environments', () => {
    const envs = ['dev', 'stage', 'prod', 'test'];

    for (const env of envs) {
      const result = ZFlagWrite.safeParse({
        env,
        key: 'test',
        enabledDefault: true,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject empty key', () => {
    const result = ZFlagWrite.safeParse({
      env: 'prod',
      key: '',
      enabledDefault: false,
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid environment', () => {
    const result = ZFlagWrite.safeParse({
      env: 'invalid',
      key: 'test',
      enabledDefault: true,
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative expected version', () => {
    const result = ZFlagWrite.safeParse({
      env: 'prod',
      key: 'test',
      enabledDefault: true,
      expectedVersion: -1,
    });

    expect(result.success).toBe(false);
  });
});

describe('ZFlagOut', () => {
  it('should accept valid flag output', () => {
    const result = ZFlagOut.safeParse({
      env: 'prod',
      key: 'feature_x',
      enabledDefault: true,
      rules: [],
      snapshotVersion: 1,
      updatedAt: '2025-01-15T12:00:00Z',
    });

    expect(result.success).toBe(true);
  });

  it('should accept flag output with rules', () => {
    const result = ZFlagOut.safeParse({
      env: 'stage',
      key: 'beta_feature',
      enabledDefault: false,
      rules: [
        {
          if: [{ percentage: 50 }],
          then: { value: true },
        },
      ],
      snapshotVersion: 5,
      updatedAt: '2025-01-15T12:00:00Z',
    });

    expect(result.success).toBe(true);
  });
});

describe('ZOverrideWrite', () => {
  it('should accept override with value only', () => {
    const result = ZOverrideWrite.safeParse({
      value: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(true);
    }
  });

  it('should accept override with expiration', () => {
    const result = ZOverrideWrite.safeParse({
      value: false,
      expiresAt: '2025-12-31T23:59:59Z',
    });

    expect(result.success).toBe(true);
  });

  it('should accept override with null expiration', () => {
    const result = ZOverrideWrite.safeParse({
      value: true,
      expiresAt: null,
    });

    expect(result.success).toBe(true);
  });

  it('should reject missing value', () => {
    const result = ZOverrideWrite.safeParse({
      expiresAt: '2025-12-31T23:59:59Z',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZOverrideOut', () => {
  it('should accept valid override output', () => {
    const result = ZOverrideOut.safeParse({
      value: true,
      expiresAt: '2025-12-31T23:59:59Z',
    });

    expect(result.success).toBe(true);
  });
});

describe('ZFlagGetQuery', () => {
  it('should accept empty query', () => {
    const result = ZFlagGetQuery.safeParse({});

    expect(result.success).toBe(true);
  });

  it('should accept query with env', () => {
    const result = ZFlagGetQuery.safeParse({
      env: 'prod',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid env', () => {
    const result = ZFlagGetQuery.safeParse({
      env: 'invalid',
    });

    expect(result.success).toBe(false);
  });
});

describe('ZFlagsListQuery', () => {
  it('should accept empty query with defaults', () => {
    const result = ZFlagsListQuery.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keys).toEqual([]);
    }
  });

  it('should accept keys as array', () => {
    const result = ZFlagsListQuery.safeParse({
      keys: ['feature_a', 'feature_b'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keys).toEqual(['feature_a', 'feature_b']);
    }
  });

  it('should accept keys as comma-separated string', () => {
    const result = ZFlagsListQuery.safeParse({
      keys: 'feature_a,feature_b,feature_c',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keys).toEqual(['feature_a', 'feature_b', 'feature_c']);
    }
  });

  it('should trim whitespace from comma-separated keys', () => {
    const result = ZFlagsListQuery.safeParse({
      keys: 'feature_a , feature_b , feature_c',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keys).toEqual(['feature_a', 'feature_b', 'feature_c']);
    }
  });

  it('should filter empty keys from comma-separated string', () => {
    const result = ZFlagsListQuery.safeParse({
      keys: 'feature_a,,feature_b,',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keys).toEqual(['feature_a', 'feature_b']);
    }
  });

  it('should accept query with env', () => {
    const result = ZFlagsListQuery.safeParse({
      env: 'stage',
      keys: ['feature_x'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.env).toBe('stage');
    }
  });
});
