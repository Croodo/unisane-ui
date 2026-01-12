/**
 * API Versioning Tests
 *
 * Tests for versioning utilities and deprecation header handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CURRENT_API_VERSION,
  buildDeprecationHeaders,
  buildVersionHeader,
  isPastSunset,
  daysUntilSunset,
  formatDeprecationWarning,
  Version,
  type DeprecationInfo,
} from '../versioning';

describe('CURRENT_API_VERSION', () => {
  it('should be defined', () => {
    expect(CURRENT_API_VERSION).toBeDefined();
    expect(typeof CURRENT_API_VERSION).toBe('string');
  });

  it('should match version format', () => {
    expect(CURRENT_API_VERSION).toMatch(/^v\d+$/);
  });
});

describe('buildDeprecationHeaders()', () => {
  const baseInfo: DeprecationInfo = {
    date: '2025-06-01',
    sunsetDate: '2025-12-01',
  };

  it('should include deprecation date', () => {
    const headers = buildDeprecationHeaders(baseInfo);

    expect(headers['deprecation']).toBe('2025-06-01');
  });

  it('should include sunset date in HTTP format', () => {
    const headers = buildDeprecationHeaders(baseInfo);

    expect(headers['sunset']).toBeDefined();
    // HTTP date format: "Mon, 01 Dec 2025 HH:MM:SS GMT"
    // Note: The time varies based on local timezone (setHours uses local time, then converts to UTC)
    expect(headers['sunset']).toMatch(/\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT/);
  });

  it('should include link header when successor provided', () => {
    const headers = buildDeprecationHeaders({
      ...baseInfo,
      successor: '/api/rest/v2/users',
    });

    expect(headers['link']).toBe('</api/rest/v2/users>; rel="successor-version"');
  });

  it('should not include link header when no successor', () => {
    const headers = buildDeprecationHeaders(baseInfo);

    expect(headers['link']).toBeUndefined();
  });
});

describe('buildVersionHeader()', () => {
  it('should include current version by default', () => {
    const headers = buildVersionHeader();

    expect(headers['x-api-version']).toBe(CURRENT_API_VERSION);
  });

  it('should use custom version when provided', () => {
    const headers = buildVersionHeader('v2');

    expect(headers['x-api-version']).toBe('v2');
  });
});

describe('isPastSunset()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false before sunset date', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    expect(isPastSunset('2025-12-01')).toBe(false);
  });

  it('should return false on sunset date (before end of day)', () => {
    vi.setSystemTime(new Date('2025-12-01T12:00:00Z'));

    expect(isPastSunset('2025-12-01')).toBe(false);
  });

  it('should return true after sunset date', () => {
    vi.setSystemTime(new Date('2025-12-02T00:00:01Z'));

    expect(isPastSunset('2025-12-01')).toBe(true);
  });

  it('should return true well after sunset date', () => {
    vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));

    expect(isPastSunset('2025-12-01')).toBe(true);
  });
});

describe('daysUntilSunset()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return positive days before sunset', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const days = daysUntilSunset('2025-12-01');

    expect(days).toBeGreaterThan(0);
    expect(days).toBe(183); // Approximately 6 months
  });

  it('should return 0 on sunset date (at start of day)', () => {
    // daysUntilSunset parses sunsetDate as midnight UTC, so at midnight on the day
    // the difference is exactly 0 days
    vi.setSystemTime(new Date('2025-12-01T00:00:00Z'));

    const days = daysUntilSunset('2025-12-01');

    expect(days).toBe(0);
  });

  it('should return -1 on sunset date (at noon)', () => {
    // At noon on sunset day, we're already -0.5 days from midnight, which floors to -1
    vi.setSystemTime(new Date('2025-12-01T12:00:00Z'));

    const days = daysUntilSunset('2025-12-01');

    expect(days).toBe(-1);
  });

  it('should return negative days after sunset', () => {
    vi.setSystemTime(new Date('2025-12-15T00:00:00Z'));

    const days = daysUntilSunset('2025-12-01');

    expect(days).toBeLessThan(0);
    expect(days).toBe(-14);
  });
});

describe('formatDeprecationWarning()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should include endpoint path', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const warning = formatDeprecationWarning('/api/rest/v1/users', {
      date: '2025-06-01',
      sunsetDate: '2025-12-01',
    });

    expect(warning).toContain('/api/rest/v1/users');
  });

  it('should include days remaining', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const warning = formatDeprecationWarning('/api/rest/v1/users', {
      date: '2025-06-01',
      sunsetDate: '2025-12-01',
    });

    expect(warning).toContain('days remaining');
  });

  it('should show PAST SUNSET when past sunset date', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const warning = formatDeprecationWarning('/api/rest/v1/users', {
      date: '2025-06-01',
      sunsetDate: '2025-12-01',
    });

    expect(warning).toContain('PAST SUNSET');
  });

  it('should include reason when provided', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const warning = formatDeprecationWarning('/api/rest/v1/users', {
      date: '2025-06-01',
      sunsetDate: '2025-12-01',
      reason: 'Pagination format changed',
    });

    expect(warning).toContain('Reason: Pagination format changed');
  });

  it('should include successor when provided', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const warning = formatDeprecationWarning('/api/rest/v1/users', {
      date: '2025-06-01',
      sunsetDate: '2025-12-01',
      successor: '/api/rest/v2/users',
    });

    expect(warning).toContain('Use: /api/rest/v2/users');
  });
});

describe('Version utilities', () => {
  describe('Version.parse()', () => {
    it('should parse version with v prefix', () => {
      expect(Version.parse('v1')).toBe(1);
      expect(Version.parse('v2')).toBe(2);
      expect(Version.parse('v10')).toBe(10);
    });

    it('should parse version without prefix', () => {
      expect(Version.parse('1')).toBe(1);
      expect(Version.parse('2')).toBe(2);
    });

    it('should be case insensitive', () => {
      expect(Version.parse('V1')).toBe(1);
      expect(Version.parse('V2')).toBe(2);
    });

    it('should return 0 for invalid version', () => {
      expect(Version.parse('invalid')).toBe(0);
      expect(Version.parse('')).toBe(0);
    });
  });

  describe('Version.compare()', () => {
    it('should return negative when a < b', () => {
      expect(Version.compare('v1', 'v2')).toBeLessThan(0);
    });

    it('should return positive when a > b', () => {
      expect(Version.compare('v2', 'v1')).toBeGreaterThan(0);
    });

    it('should return 0 when equal', () => {
      expect(Version.compare('v1', 'v1')).toBe(0);
    });
  });

  describe('Version.isNewer()', () => {
    it('should return true when a is newer', () => {
      expect(Version.isNewer('v2', 'v1')).toBe(true);
    });

    it('should return false when a is older', () => {
      expect(Version.isNewer('v1', 'v2')).toBe(false);
    });

    it('should return false when equal', () => {
      expect(Version.isNewer('v1', 'v1')).toBe(false);
    });
  });

  describe('Version.isOlder()', () => {
    it('should return true when a is older', () => {
      expect(Version.isOlder('v1', 'v2')).toBe(true);
    });

    it('should return false when a is newer', () => {
      expect(Version.isOlder('v2', 'v1')).toBe(false);
    });

    it('should return false when equal', () => {
      expect(Version.isOlder('v1', 'v1')).toBe(false);
    });
  });
});
