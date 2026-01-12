import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitOpenError,
  getCircuitBreaker,
  resetAllCircuitBreakers,
  withCircuitBreaker,
} from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    resetAllCircuitBreakers();
    breaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      resetTimeout: 100, // Fast reset for testing
      successThreshold: 2,
      callTimeout: 50,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('execute', () => {
    it('executes function when circuit is closed', async () => {
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('opens circuit after failure threshold', async () => {
      const failingFn = async () => {
        throw new Error('Service error');
      };

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('Service error');
      }

      expect(breaker.getState()).toBe('OPEN');
    });

    it('fast-fails when circuit is open', async () => {
      // Open the circuit
      const failingFn = async () => {
        throw new Error('Service error');
      };
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('Service error');
      }

      // Now it should throw CircuitOpenError
      await expect(breaker.execute(async () => 'success')).rejects.toThrow(CircuitOpenError);
    });

    it('transitions to half-open after reset timeout', async () => {
      vi.useFakeTimers();

      // Open the circuit
      const failingFn = async () => {
        throw new Error('Service error');
      };
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('Service error');
      }
      expect(breaker.getState()).toBe('OPEN');

      // Advance time past reset timeout
      vi.advanceTimersByTime(150);
      expect(breaker.getState()).toBe('HALF_OPEN');
    });

    it('closes circuit after success threshold in half-open', async () => {
      vi.useFakeTimers();

      // Open the circuit
      const failingFn = async () => {
        throw new Error('Service error');
      };
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('Service error');
      }

      // Transition to half-open
      vi.advanceTimersByTime(150);
      expect(breaker.getState()).toBe('HALF_OPEN');

      // Succeed twice (success threshold)
      await breaker.execute(async () => 'success1');
      expect(breaker.getState()).toBe('HALF_OPEN');

      await breaker.execute(async () => 'success2');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('reopens on failure in half-open state', async () => {
      vi.useFakeTimers();

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail'); })).rejects.toThrow();
      }

      // Transition to half-open
      vi.advanceTimersByTime(150);
      expect(breaker.getState()).toBe('HALF_OPEN');

      // Fail once - should reopen
      await expect(breaker.execute(async () => { throw new Error('fail again'); })).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');
    });

    it('times out slow calls', async () => {
      const slowFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'slow result';
      };

      await expect(breaker.execute(slowFn)).rejects.toThrow('timeout');
    });
  });

  describe('getStats', () => {
    it('returns circuit statistics', async () => {
      await breaker.execute(async () => 'success');
      const stats = breaker.getStats();

      expect(stats.name).toBe('test');
      expect(stats.state).toBe('CLOSED');
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(0);
      expect(stats.lastSuccess).toBeDefined();
    });

    it('tracks failures', async () => {
      await expect(breaker.execute(async () => { throw new Error('fail'); })).rejects.toThrow();
      const stats = breaker.getStats();

      expect(stats.failures).toBe(1);
      expect(stats.lastFailure).toBeDefined();
    });
  });

  describe('reset', () => {
    it('resets circuit to closed state', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail'); })).rejects.toThrow();
      }
      expect(breaker.getState()).toBe('OPEN');

      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');

      // Should work again
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
    });
  });

  describe('trip', () => {
    it('manually opens circuit', async () => {
      expect(breaker.getState()).toBe('CLOSED');
      breaker.trip();
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('callbacks', () => {
    it('calls onOpen when circuit opens', async () => {
      const onOpen = vi.fn();
      const b = new CircuitBreaker('test2', { failureThreshold: 1, onOpen });

      await expect(b.execute(async () => { throw new Error('fail'); })).rejects.toThrow();

      expect(onOpen).toHaveBeenCalledWith('test2');
    });

    it('calls onClose when circuit closes', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const b = new CircuitBreaker('test3', {
        failureThreshold: 1,
        resetTimeout: 50,
        successThreshold: 1,
        onClose,
      });

      await expect(b.execute(async () => { throw new Error('fail'); })).rejects.toThrow();
      vi.advanceTimersByTime(100);

      await b.execute(async () => 'success');

      expect(onClose).toHaveBeenCalledWith('test3');
    });
  });
});

describe('getCircuitBreaker', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
  });

  it('creates new circuit breaker', () => {
    const breaker = getCircuitBreaker('service1');
    expect(breaker.name).toBe('service1');
  });

  it('returns same circuit breaker for same name', () => {
    const b1 = getCircuitBreaker('service2');
    const b2 = getCircuitBreaker('service2');
    expect(b1).toBe(b2);
  });
});

describe('withCircuitBreaker', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
  });

  it('executes function with circuit breaker', async () => {
    const result = await withCircuitBreaker('service3', async () => 'result');
    expect(result).toBe('result');
  });

  it('uses same circuit breaker for same name', async () => {
    await withCircuitBreaker('service4', async () => 'first');

    const breaker = getCircuitBreaker('service4');
    const stats = breaker.getStats();
    expect(stats.successes).toBe(1);

    await withCircuitBreaker('service4', async () => 'second');
    expect(breaker.getStats().successes).toBe(2);
  });
});
