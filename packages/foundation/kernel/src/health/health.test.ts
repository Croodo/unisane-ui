import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerHealthCheck,
  unregisterHealthCheck,
  getRegisteredChecks,
  healthCheck,
  livenessCheck,
  readinessCheck,
  createMongoHealthCheck,
  createRedisHealthCheck,
  createHttpHealthCheck,
} from './index';

describe('Health Check Module', () => {
  beforeEach(() => {
    // Clear all registered checks
    for (const name of getRegisteredChecks()) {
      unregisterHealthCheck(name);
    }
  });

  describe('registerHealthCheck / unregisterHealthCheck', () => {
    it('registers and unregisters checks', () => {
      expect(getRegisteredChecks()).toEqual([]);

      registerHealthCheck('test', async () => ({ status: 'up', latencyMs: 1 }));
      expect(getRegisteredChecks()).toEqual(['test']);

      unregisterHealthCheck('test');
      expect(getRegisteredChecks()).toEqual([]);
    });
  });

  describe('healthCheck', () => {
    it('returns healthy when all checks pass', async () => {
      registerHealthCheck('db', async () => ({ status: 'up', latencyMs: 5 }));
      registerHealthCheck('cache', async () => ({ status: 'up', latencyMs: 2 }));

      const result = await healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.checks.db.status).toBe('up');
      expect(result.checks.cache.status).toBe('up');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('returns degraded when any check is degraded', async () => {
      registerHealthCheck('db', async () => ({ status: 'up', latencyMs: 5 }));
      registerHealthCheck('cache', async () => ({ status: 'degraded', latencyMs: 2, message: 'Slow' }));

      const result = await healthCheck();

      expect(result.status).toBe('degraded');
    });

    it('returns unhealthy when any check is down', async () => {
      registerHealthCheck('db', async () => ({ status: 'up', latencyMs: 5 }));
      registerHealthCheck('cache', async () => ({ status: 'down', latencyMs: 0, message: 'Connection failed' }));

      const result = await healthCheck();

      expect(result.status).toBe('unhealthy');
    });

    it('handles check timeout', async () => {
      registerHealthCheck('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds
        return { status: 'up', latencyMs: 10000 };
      });

      const result = await healthCheck({ timeoutMs: 100 });

      expect(result.checks.slow.status).toBe('down');
      expect(result.checks.slow.message).toContain('timeout');
    });

    it('respects only filter', async () => {
      registerHealthCheck('db', async () => ({ status: 'up', latencyMs: 5 }));
      registerHealthCheck('cache', async () => ({ status: 'up', latencyMs: 2 }));

      const result = await healthCheck({ only: ['db'] });

      expect(Object.keys(result.checks)).toEqual(['db']);
    });

    it('respects skip filter', async () => {
      registerHealthCheck('db', async () => ({ status: 'up', latencyMs: 5 }));
      registerHealthCheck('cache', async () => ({ status: 'up', latencyMs: 2 }));

      const result = await healthCheck({ skip: ['cache'] });

      expect(Object.keys(result.checks)).toEqual(['db']);
    });

    it('handles check errors', async () => {
      registerHealthCheck('failing', async () => {
        throw new Error('Check failed');
      });

      const result = await healthCheck();

      expect(result.checks.failing.status).toBe('down');
      expect(result.checks.failing.message).toBe('Check failed');
    });
  });

  describe('livenessCheck', () => {
    it('always returns ok', () => {
      const result = livenessCheck();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readinessCheck', () => {
    it('returns ready: true when healthy', async () => {
      registerHealthCheck('db', async () => ({ status: 'up', latencyMs: 5 }));

      const result = await readinessCheck();

      expect(result.ready).toBe(true);
      expect(result.health.status).toBe('healthy');
    });

    it('returns ready: true when degraded', async () => {
      registerHealthCheck('db', async () => ({ status: 'degraded', latencyMs: 5 }));

      const result = await readinessCheck();

      expect(result.ready).toBe(true);
    });

    it('returns ready: false when unhealthy', async () => {
      registerHealthCheck('db', async () => ({ status: 'down', latencyMs: 0 }));

      const result = await readinessCheck();

      expect(result.ready).toBe(false);
    });
  });

  describe('createMongoHealthCheck', () => {
    it('returns up when ping succeeds', async () => {
      const mockDb = { command: vi.fn().mockResolvedValue({ ok: 1 }) };
      const check = createMongoHealthCheck(() => mockDb);

      const result = await check();

      expect(result.status).toBe('up');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(mockDb.command).toHaveBeenCalledWith({ ping: 1 });
    });

    it('returns down when ping fails', async () => {
      const mockDb = { command: vi.fn().mockRejectedValue(new Error('Connection lost')) };
      const check = createMongoHealthCheck(() => mockDb);

      const result = await check();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Connection lost');
    });
  });

  describe('createRedisHealthCheck', () => {
    it('returns up when ping succeeds', async () => {
      const mockRedis = { ping: vi.fn().mockResolvedValue('PONG') };
      const check = createRedisHealthCheck(() => mockRedis);

      const result = await check();

      expect(result.status).toBe('up');
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('returns up with message when redis is null', async () => {
      const check = createRedisHealthCheck(() => null);

      const result = await check();

      expect(result.status).toBe('up');
      expect(result.message).toContain('not configured');
    });

    it('returns down when ping fails', async () => {
      const mockRedis = { ping: vi.fn().mockRejectedValue(new Error('Redis error')) };
      const check = createRedisHealthCheck(() => mockRedis);

      const result = await check();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Redis error');
    });
  });

  describe('createHttpHealthCheck', () => {
    it('returns up for successful response', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const check = createHttpHealthCheck('https://example.com/health');

      const result = await check();

      expect(result.status).toBe('up');
    });

    it('returns degraded for unexpected status', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      const check = createHttpHealthCheck('https://example.com/health');

      const result = await check();

      expect(result.status).toBe('degraded');
      expect(result.message).toContain('500');
    });

    it('returns down for network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const check = createHttpHealthCheck('https://example.com/health');

      const result = await check();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Network error');
    });
  });
});
