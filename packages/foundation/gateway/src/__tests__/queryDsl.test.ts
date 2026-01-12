/**
 * Query DSL Tests
 *
 * Tests for query parsing, filtering, and validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  parseListParams,
  parseFilters,
  applyFilters,
  validateRange,
  extractDateRange,
  type Filter,
} from '../query/queryDsl';
import type { FieldDef } from '../registry/types';

// Test field registry
const testRegistry: Record<string, FieldDef> = {
  status: { key: 'status', type: 'string', ops: ['eq', 'in'] },
  name: { key: 'name', type: 'string', ops: ['eq', 'contains'] },
  count: { key: 'count', type: 'number', ops: ['eq', 'gte', 'lte'] },
  createdAt: { key: 'createdAt', type: 'date', ops: ['gte', 'lte'] },
  tags: { key: 'tags', type: 'string', ops: ['in'] },
};

describe('parseListParams()', () => {
  it('should parse limit with defaults', () => {
    const qp = new URLSearchParams('limit=50');
    const result = parseListParams(qp);

    expect(result.limit).toBe(50);
  });

  it('should use default limit when not specified', () => {
    const qp = new URLSearchParams('');
    const result = parseListParams(qp, { defaultLimit: 25 });

    expect(result.limit).toBe(25);
  });

  it('should clamp limit to max', () => {
    const qp = new URLSearchParams('limit=500');
    const result = parseListParams(qp, { maxLimit: 100 });

    expect(result.limit).toBe(100);
  });

  it('should clamp limit to min', () => {
    const qp = new URLSearchParams('limit=0');
    const result = parseListParams(qp, { minLimit: 1 });

    expect(result.limit).toBe(1);
  });

  it('should handle invalid limit', () => {
    const qp = new URLSearchParams('limit=abc');
    const result = parseListParams(qp, { defaultLimit: 20 });

    expect(result.limit).toBe(20);
  });

  it('should parse cursor', () => {
    const qp = new URLSearchParams('cursor=abc123');
    const result = parseListParams(qp);

    expect(result.cursor).toBe('abc123');
  });

  it('should parse offset', () => {
    const qp = new URLSearchParams('offset=100');
    const result = parseListParams(qp);

    expect(result.offset).toBe(100);
  });

  it('should parse sort', () => {
    const qp = new URLSearchParams('sort=-createdAt');
    const result = parseListParams(qp);

    expect(result.sort).toBe('-createdAt');
  });

  it('should parse filters raw string', () => {
    const filtersJson = JSON.stringify([{ field: 'status', op: 'eq', value: 'active' }]);
    const qp = new URLSearchParams(`filters=${encodeURIComponent(filtersJson)}`);
    const result = parseListParams(qp);

    expect(result.filtersRaw).toBe(filtersJson);
  });
});

describe('parseFilters()', () => {
  it('should return empty array for undefined filters', () => {
    const result = parseFilters(undefined, testRegistry);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const result = parseFilters('', testRegistry);
    expect(result).toEqual([]);
  });

  it('should parse valid JSON filters', () => {
    const filtersJson = JSON.stringify([
      { field: 'status', op: 'eq', value: 'active' },
      { field: 'name', op: 'contains', value: 'test' },
    ]);

    const result = parseFilters(filtersJson, testRegistry);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ field: 'status', op: 'eq', value: 'active' });
    expect(result[1]).toEqual({ field: 'name', op: 'contains', value: 'test' });
  });

  it('should parse base64url-encoded filters', () => {
    const filtersJson = JSON.stringify([{ field: 'status', op: 'eq', value: 'active' }]);
    const base64Filters = Buffer.from(filtersJson).toString('base64url');

    const result = parseFilters(base64Filters, testRegistry);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ field: 'status', op: 'eq', value: 'active' });
  });

  it('should throw for invalid JSON', () => {
    expect(() => parseFilters('{invalid', testRegistry)).toThrow('not valid JSON');
  });

  it('should throw for non-array input', () => {
    expect(() => parseFilters('{"foo":"bar"}', testRegistry)).toThrow('must be an array');
  });

  it('should throw for too many filters', () => {
    const manyFilters = Array(51)
      .fill(null)
      .map((_, i) => ({ field: 'status', op: 'eq', value: `val${i}` }));

    expect(() => parseFilters(JSON.stringify(manyFilters), testRegistry)).toThrow('Too many filters');
  });

  it('should throw for unknown field', () => {
    const filtersJson = JSON.stringify([{ field: 'unknown', op: 'eq', value: 'x' }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow("Unknown filter field: 'unknown'");
  });

  it('should throw for unsupported operator', () => {
    const filtersJson = JSON.stringify([{ field: 'status', op: 'gte', value: 'x' }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow("Unsupported operator 'gte'");
  });

  it('should throw for invalid op value', () => {
    const filtersJson = JSON.stringify([{ field: 'status', op: 'invalid', value: 'x' }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow('op must be one of');
  });

  it('should validate in operator requires array', () => {
    const filtersJson = JSON.stringify([{ field: 'status', op: 'in', value: 'single' }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow("'in' operator requires an array");
  });

  it('should validate in operator array size limit', () => {
    const filtersJson = JSON.stringify([
      { field: 'status', op: 'in', value: Array(101).fill('x') },
    ]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow('array too large');
  });

  it('should validate date field format', () => {
    const filtersJson = JSON.stringify([{ field: 'createdAt', op: 'gte', value: 123 }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow('requires a string value');
  });

  it('should validate date field is parseable', () => {
    const filtersJson = JSON.stringify([{ field: 'createdAt', op: 'gte', value: 'not-a-date' }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow('Invalid date format');
  });

  it('should validate number field format', () => {
    const filtersJson = JSON.stringify([{ field: 'count', op: 'gte', value: 'not-a-number' }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow('Invalid number value');
  });

  it('should validate contains operator requires string', () => {
    const filtersJson = JSON.stringify([{ field: 'name', op: 'contains', value: 123 }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow("'contains' operator requires a string");
  });

  it('should throw for oversized filters payload', () => {
    const largeValue = 'x'.repeat(15000);
    const filtersJson = JSON.stringify([{ field: 'status', op: 'eq', value: largeValue }]);

    expect(() => parseFilters(filtersJson, testRegistry)).toThrow('exceeds maximum size');
  });
});

describe('applyFilters()', () => {
  const items = [
    { status: 'active', name: 'Alpha Test', count: 10, createdAt: '2024-01-01' },
    { status: 'inactive', name: 'Beta Project', count: 20, createdAt: '2024-02-01' },
    { status: 'active', name: 'Test Gamma', count: 30, createdAt: '2024-03-01' },
    { status: 'pending', name: 'Delta', count: 5, createdAt: '2024-04-01' },
  ];

  it('should filter with eq operator', () => {
    const filters: Filter[] = [{ field: 'status', op: 'eq', value: 'active' }];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(2);
    expect(result.every((i) => i.status === 'active')).toBe(true);
  });

  it('should filter with contains operator (case insensitive)', () => {
    const filters: Filter[] = [{ field: 'name', op: 'contains', value: 'test' }];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toContain('Alpha Test');
    expect(result.map((i) => i.name)).toContain('Test Gamma');
  });

  it('should filter with in operator', () => {
    const filters: Filter[] = [{ field: 'status', op: 'in', value: ['active', 'pending'] }];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(3);
  });

  it('should filter with gte operator (number)', () => {
    const filters: Filter[] = [{ field: 'count', op: 'gte', value: 20 }];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(2);
    expect(result.every((i) => i.count >= 20)).toBe(true);
  });

  it('should filter with lte operator (number)', () => {
    const filters: Filter[] = [{ field: 'count', op: 'lte', value: 10 }];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(2);
    expect(result.every((i) => i.count <= 10)).toBe(true);
  });

  it('should filter with gte operator (date)', () => {
    const filters: Filter[] = [{ field: 'createdAt', op: 'gte', value: '2024-03-01' }];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(2);
  });

  it('should filter with lte operator (date)', () => {
    const filters: Filter[] = [{ field: 'createdAt', op: 'lte', value: '2024-02-01' }];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(2);
  });

  it('should apply multiple filters (AND logic)', () => {
    const filters: Filter[] = [
      { field: 'status', op: 'eq', value: 'active' },
      { field: 'count', op: 'gte', value: 20 },
    ];
    const result = applyFilters(items, filters, testRegistry);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Gamma');
  });

  it('should return all items when no filters', () => {
    const result = applyFilters(items, [], testRegistry);
    expect(result).toHaveLength(4);
  });
});

describe('validateRange()', () => {
  it('should accept empty range by default', () => {
    expect(() => validateRange(undefined, undefined)).not.toThrow();
    expect(() => validateRange(null, null)).not.toThrow();
  });

  it('should throw when empty range not allowed', () => {
    expect(() => validateRange(undefined, undefined, { allowEmpty: false })).toThrow(
      'Date range is required'
    );
  });

  it('should accept valid from date', () => {
    expect(() => validateRange('2024-01-15T00:00:00Z', undefined)).not.toThrow();
  });

  it('should accept valid to date', () => {
    expect(() => validateRange(undefined, '2024-01-15T00:00:00Z')).not.toThrow();
  });

  it('should accept valid date range', () => {
    expect(() =>
      validateRange('2024-01-01T00:00:00Z', '2024-01-15T00:00:00Z')
    ).not.toThrow();
  });

  it('should throw for invalid from date format', () => {
    expect(() => validateRange('not-a-date', undefined)).toThrow("Invalid 'from' date format");
  });

  it('should throw for invalid to date format', () => {
    expect(() => validateRange(undefined, 'not-a-date')).toThrow("Invalid 'to' date format");
  });

  it('should throw when to is before from', () => {
    expect(() =>
      validateRange('2024-02-01T00:00:00Z', '2024-01-01T00:00:00Z')
    ).toThrow("'to' date must be after 'from' date");
  });

  it('should throw when range exceeds max days', () => {
    expect(() =>
      validateRange('2024-01-01T00:00:00Z', '2024-06-01T00:00:00Z', { maxDays: 30 })
    ).toThrow('Date range too large');
  });

  it('should accept range within max days', () => {
    expect(() =>
      validateRange('2024-01-01T00:00:00Z', '2024-01-15T00:00:00Z', { maxDays: 30 })
    ).not.toThrow();
  });
});

describe('extractDateRange()', () => {
  it('should extract from date', () => {
    const filters: Filter[] = [{ field: 'createdAt', op: 'gte', value: '2024-01-01T00:00:00Z' }];
    const result = extractDateRange(filters, 'createdAt');

    expect(result.from).toBe('2024-01-01T00:00:00Z');
    expect(result.to).toBeUndefined();
  });

  it('should extract to date', () => {
    const filters: Filter[] = [{ field: 'createdAt', op: 'lte', value: '2024-12-31T23:59:59Z' }];
    const result = extractDateRange(filters, 'createdAt');

    expect(result.from).toBeUndefined();
    expect(result.to).toBe('2024-12-31T23:59:59Z');
  });

  it('should extract both dates', () => {
    const filters: Filter[] = [
      { field: 'createdAt', op: 'gte', value: '2024-01-01T00:00:00Z' },
      { field: 'createdAt', op: 'lte', value: '2024-12-31T23:59:59Z' },
    ];
    const result = extractDateRange(filters, 'createdAt');

    expect(result.from).toBe('2024-01-01T00:00:00Z');
    expect(result.to).toBe('2024-12-31T23:59:59Z');
  });

  it('should return empty object for unrelated filters', () => {
    const filters: Filter[] = [{ field: 'status', op: 'eq', value: 'active' }];
    const result = extractDateRange(filters, 'createdAt');

    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });
});
