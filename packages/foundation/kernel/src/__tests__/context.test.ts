/**
 * Context Module Tests
 *
 * Tests for AsyncLocalStorage-based request context.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ctx,
  createContext,
  runInContext,
  getTenantId,
  getUserId,
  getRequestId,
  ContextNotInitializedError,
  ContextFieldRequiredError,
  setPlanLoader,
  setFlagsLoader,
} from '../context';

describe('Context Module', () => {
  describe('ctx.run()', () => {
    it('should make context available within the callback', async () => {
      const context = createContext({ tenantId: 'tenant_123', userId: 'user_456' });

      await ctx.run(context, async () => {
        const current = ctx.get();
        expect(current.tenantId).toBe('tenant_123');
        expect(current.userId).toBe('user_456');
      });
    });

    it('should isolate context between concurrent runs', async () => {
      const results: string[] = [];

      await Promise.all([
        ctx.run(createContext({ tenantId: 'tenant_A' }), async () => {
          await new Promise((r) => setTimeout(r, 10));
          results.push(`A: ${ctx.get().tenantId}`);
        }),
        ctx.run(createContext({ tenantId: 'tenant_B' }), async () => {
          results.push(`B: ${ctx.get().tenantId}`);
        }),
      ]);

      expect(results).toContain('A: tenant_A');
      expect(results).toContain('B: tenant_B');
    });

    it('should propagate context through async operations', async () => {
      const context = createContext({ tenantId: 'tenant_123' });

      await ctx.run(context, async () => {
        // Simulate nested async calls
        await nestedAsyncFunction();
      });

      async function nestedAsyncFunction() {
        await Promise.resolve();
        const current = ctx.get();
        expect(current.tenantId).toBe('tenant_123');
      }
    });

    it('should return the result from the callback', async () => {
      const context = createContext({ tenantId: 'tenant_123' });

      const result = await ctx.run(context, async () => {
        return { value: 42, tenantId: ctx.get().tenantId };
      });

      expect(result).toEqual({ value: 42, tenantId: 'tenant_123' });
    });
  });

  describe('ctx.get()', () => {
    it('should throw ContextNotInitializedError outside of ctx.run()', () => {
      expect(() => ctx.get()).toThrow(ContextNotInitializedError);
      expect(() => ctx.get()).toThrow('Context not initialized');
    });

    it('should return context within ctx.run()', async () => {
      const context = createContext({ tenantId: 'test' });

      await ctx.run(context, async () => {
        expect(() => ctx.get()).not.toThrow();
        expect(ctx.get().tenantId).toBe('test');
      });
    });
  });

  describe('ctx.tryGet()', () => {
    it('should return undefined outside of ctx.run()', () => {
      expect(ctx.tryGet()).toBeUndefined();
    });

    it('should return context within ctx.run()', async () => {
      const context = createContext({ tenantId: 'test' });

      await ctx.run(context, async () => {
        const current = ctx.tryGet();
        expect(current).toBeDefined();
        expect(current?.tenantId).toBe('test');
      });
    });
  });

  describe('createContext()', () => {
    it('should generate a request ID if not provided', () => {
      const context = createContext({});
      expect(context.requestId).toBeDefined();
      expect(context.requestId).toMatch(/^req_/);
    });

    it('should use provided request ID', () => {
      const context = createContext({ requestId: 'custom_req_123' });
      expect(context.requestId).toBe('custom_req_123');
    });

    it('should include startTime', () => {
      const before = Date.now();
      const context = createContext({});
      const after = Date.now();

      expect(context.startTime).toBeGreaterThanOrEqual(before);
      expect(context.startTime).toBeLessThanOrEqual(after);
    });

    it('should include metadata when provided', () => {
      const context = createContext({
        tenantId: 'tenant_123',
        metadata: { source: 'api', ip: '127.0.0.1' },
      });

      expect(context.metadata).toEqual({ source: 'api', ip: '127.0.0.1' });
    });

    it('should handle all optional fields', () => {
      const context = createContext({
        requestId: 'req_123',
        tenantId: 'tenant_123',
        userId: 'user_456',
        metadata: { key: 'value' },
      });

      expect(context.requestId).toBe('req_123');
      expect(context.tenantId).toBe('tenant_123');
      expect(context.userId).toBe('user_456');
      expect(context.metadata).toEqual({ key: 'value' });
    });
  });

  describe('runInContext()', () => {
    it('should create context and run callback', async () => {
      await runInContext({ tenantId: 'tenant_123' }, async () => {
        expect(ctx.get().tenantId).toBe('tenant_123');
      });
    });

    it('should return the callback result', async () => {
      const result = await runInContext({ tenantId: 'test' }, async () => {
        return { success: true };
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('getTenantId()', () => {
    it('should return tenant ID when set', async () => {
      await runInContext({ tenantId: 'tenant_123' }, async () => {
        expect(getTenantId()).toBe('tenant_123');
      });
    });

    it('should throw ContextNotInitializedError outside context', () => {
      expect(() => getTenantId()).toThrow(ContextNotInitializedError);
    });

    it('should throw ContextFieldRequiredError when tenantId not set', async () => {
      await runInContext({}, async () => {
        expect(() => getTenantId()).toThrow(ContextFieldRequiredError);
        expect(() => getTenantId()).toThrow("Context field 'tenantId' is required");
      });
    });
  });

  describe('getUserId()', () => {
    it('should return user ID when set', async () => {
      await runInContext({ userId: 'user_456' }, async () => {
        expect(getUserId()).toBe('user_456');
      });
    });

    it('should throw ContextNotInitializedError outside context', () => {
      expect(() => getUserId()).toThrow(ContextNotInitializedError);
    });

    it('should throw ContextFieldRequiredError when userId not set', async () => {
      await runInContext({ tenantId: 'tenant_123' }, async () => {
        expect(() => getUserId()).toThrow(ContextFieldRequiredError);
        expect(() => getUserId()).toThrow("Context field 'userId' is required");
      });
    });
  });

  describe('getRequestId()', () => {
    it('should return request ID', async () => {
      await runInContext({ requestId: 'req_custom' }, async () => {
        expect(getRequestId()).toBe('req_custom');
      });
    });

    it('should throw ContextNotInitializedError outside context', () => {
      expect(() => getRequestId()).toThrow(ContextNotInitializedError);
    });
  });

  describe('ctx.getPlan()', () => {
    beforeEach(() => {
      setPlanLoader(null as unknown as (tenantId: string) => Promise<string>);
    });

    it('should return cached plan if available', async () => {
      const context = createContext({ tenantId: 'tenant_123' });
      context.plan = 'pro';

      await ctx.run(context, async () => {
        const plan = await ctx.getPlan();
        expect(plan).toBe('pro');
      });
    });

    it('should return "free" when no loader registered', async () => {
      await runInContext({ tenantId: 'tenant_123' }, async () => {
        const plan = await ctx.getPlan();
        expect(plan).toBe('free');
      });
    });

    it('should use registered loader and cache result', async () => {
      const loader = vi.fn().mockResolvedValue('enterprise');
      setPlanLoader(loader);

      await runInContext({ tenantId: 'tenant_123' }, async () => {
        // First call - uses loader
        const plan1 = await ctx.getPlan();
        expect(plan1).toBe('enterprise');
        expect(loader).toHaveBeenCalledWith('tenant_123');
        expect(loader).toHaveBeenCalledTimes(1);

        // Second call - uses cache
        const plan2 = await ctx.getPlan();
        expect(plan2).toBe('enterprise');
        expect(loader).toHaveBeenCalledTimes(1); // Not called again
      });
    });

    it('should throw ContextFieldRequiredError when tenantId not set', async () => {
      await runInContext({}, async () => {
        await expect(ctx.getPlan()).rejects.toThrow(ContextFieldRequiredError);
      });
    });
  });

  describe('ctx.getFlags()', () => {
    beforeEach(() => {
      setFlagsLoader(null as unknown as (tenantId: string) => Promise<Record<string, boolean>>);
    });

    it('should return cached flags if available', async () => {
      const context = createContext({ tenantId: 'tenant_123' });
      context.flags = { feature_a: true, feature_b: false };

      await ctx.run(context, async () => {
        const flags = await ctx.getFlags();
        expect(flags).toEqual({ feature_a: true, feature_b: false });
      });
    });

    it('should return empty object when no loader registered', async () => {
      await runInContext({ tenantId: 'tenant_123' }, async () => {
        const flags = await ctx.getFlags();
        expect(flags).toEqual({});
      });
    });

    it('should use registered loader and cache result', async () => {
      const loader = vi.fn().mockResolvedValue({ feature_x: true });
      setFlagsLoader(loader);

      await runInContext({ tenantId: 'tenant_123' }, async () => {
        // First call - uses loader
        const flags1 = await ctx.getFlags();
        expect(flags1).toEqual({ feature_x: true });
        expect(loader).toHaveBeenCalledWith('tenant_123');
        expect(loader).toHaveBeenCalledTimes(1);

        // Second call - uses cache
        const flags2 = await ctx.getFlags();
        expect(flags2).toEqual({ feature_x: true });
        expect(loader).toHaveBeenCalledTimes(1); // Not called again
      });
    });

    it('should throw ContextFieldRequiredError when tenantId not set', async () => {
      await runInContext({}, async () => {
        await expect(ctx.getFlags()).rejects.toThrow(ContextFieldRequiredError);
      });
    });
  });
});

describe('Error Classes', () => {
  describe('ContextNotInitializedError', () => {
    it('should have correct name and message', () => {
      const error = new ContextNotInitializedError();
      expect(error.name).toBe('ContextNotInitializedError');
      expect(error.message).toBe('Context not initialized. Ensure ctx.run() wraps this call.');
    });

    it('should be instanceof Error', () => {
      const error = new ContextNotInitializedError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ContextFieldRequiredError', () => {
    it('should include field name in message', () => {
      const error = new ContextFieldRequiredError('tenantId');
      expect(error.name).toBe('ContextFieldRequiredError');
      expect(error.message).toBe("Context field 'tenantId' is required but not set.");
    });

    it('should be instanceof Error', () => {
      const error = new ContextFieldRequiredError('userId');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
