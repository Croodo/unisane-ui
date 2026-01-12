/**
 * Rate Limit Tests
 *
 * Tests for rate limiting utilities and key building.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipFrom, buildRateKey } from '../middleware/rateLimit';

describe('ipFrom()', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' },
    });

    expect(ipFrom(req)).toBe('192.168.1.1');
  });

  it('should handle single IP in x-forwarded-for', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });

    expect(ipFrom(req)).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip header when x-forwarded-for missing', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-real-ip': '10.0.0.1' },
    });

    expect(ipFrom(req)).toBe('10.0.0.1');
  });

  it('should prefer x-forwarded-for over x-real-ip', () => {
    const req = new Request('http://example.com', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1',
      },
    });

    expect(ipFrom(req)).toBe('192.168.1.1');
  });

  it('should return 0.0.0.0 when no IP headers present', () => {
    const req = new Request('http://example.com');

    expect(ipFrom(req)).toBe('0.0.0.0');
  });

  it('should trim whitespace from IP', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-real-ip': '  192.168.1.1  ' },
    });

    expect(ipFrom(req)).toBe('192.168.1.1');
  });

  it('should handle empty x-forwarded-for gracefully', () => {
    const req = new Request('http://example.com', {
      headers: { 'x-forwarded-for': '' },
    });

    expect(ipFrom(req)).toBe('0.0.0.0');
  });
});

describe('buildRateKey()', () => {
  it('should build key with all components', () => {
    const key = buildRateKey({
      tenantId: 'tenant_123',
      userId: 'user_456',
      name: 'auth.signin',
    });

    expect(key).toBe('tenant_123:user_456:auth.signin');
  });

  it('should use anon for missing tenantId', () => {
    const key = buildRateKey({
      tenantId: undefined,
      userId: 'user_456',
      name: 'public.endpoint',
    });

    expect(key).toBe('anon:user_456:public.endpoint');
  });

  it('should use anon for null tenantId', () => {
    const key = buildRateKey({
      tenantId: null,
      userId: 'user_456',
      name: 'public.endpoint',
    });

    expect(key).toBe('anon:user_456:public.endpoint');
  });

  it('should use anon for missing userId', () => {
    const key = buildRateKey({
      tenantId: 'tenant_123',
      userId: undefined,
      name: 'auth.signin',
    });

    expect(key).toBe('tenant_123:anon:auth.signin');
  });

  it('should use IP hash for anonymous user with IP', () => {
    const key = buildRateKey({
      tenantId: undefined,
      userId: undefined,
      name: 'public.endpoint',
      ip: '192.168.1.1',
    });

    expect(key).toMatch(/^anon:ip:[a-z0-9]+:public\.endpoint$/);
  });

  it('should generate consistent IP hash for same IP', () => {
    const key1 = buildRateKey({
      tenantId: undefined,
      userId: undefined,
      name: 'test',
      ip: '192.168.1.1',
    });

    const key2 = buildRateKey({
      tenantId: undefined,
      userId: undefined,
      name: 'test',
      ip: '192.168.1.1',
    });

    expect(key1).toBe(key2);
  });

  it('should generate different hashes for different IPs', () => {
    const key1 = buildRateKey({
      tenantId: undefined,
      userId: undefined,
      name: 'test',
      ip: '192.168.1.1',
    });

    const key2 = buildRateKey({
      tenantId: undefined,
      userId: undefined,
      name: 'test',
      ip: '192.168.1.2',
    });

    expect(key1).not.toBe(key2);
  });

  it('should use anon:anon when both userId and IP missing', () => {
    const key = buildRateKey({
      tenantId: undefined,
      userId: undefined,
      name: 'public.endpoint',
    });

    expect(key).toBe('anon:anon:public.endpoint');
  });

  it('should handle operation names with dots', () => {
    const key = buildRateKey({
      tenantId: 'tenant_123',
      userId: 'user_456',
      name: 'users.list.v2',
    });

    expect(key).toBe('tenant_123:user_456:users.list.v2');
  });

  it('should prevent key collisions between authenticated and anonymous users', () => {
    const authenticatedKey = buildRateKey({
      tenantId: 'tenant_123',
      userId: 'user_456',
      name: 'api.call',
    });

    const anonymousKey = buildRateKey({
      tenantId: undefined,
      userId: undefined,
      name: 'api.call',
      ip: '192.168.1.1',
    });

    expect(authenticatedKey).not.toBe(anonymousKey);
  });
});
