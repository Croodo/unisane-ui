import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initOpenTelemetry, isOTelInitialized, flushOTelSpans } from './otel';
import { tracer } from './tracer';

describe('OpenTelemetry Integration', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    // Reset state
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  describe('initOpenTelemetry', () => {
    it('initializes with service name', () => {
      cleanup = initOpenTelemetry({
        serviceName: 'test-service',
      });

      expect(isOTelInitialized()).toBe(true);
    });

    it('returns cleanup function', () => {
      cleanup = initOpenTelemetry({
        serviceName: 'test-service',
      });

      expect(typeof cleanup).toBe('function');
      cleanup();
      cleanup = null;

      expect(isOTelInitialized()).toBe(false);
    });

    it('prevents re-initialization', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      cleanup = initOpenTelemetry({
        serviceName: 'test-service',
      });

      // Try to initialize again
      const cleanup2 = initOpenTelemetry({
        serviceName: 'test-service-2',
      });

      // Should still be initialized with first config
      expect(isOTelInitialized()).toBe(true);

      cleanup2(); // Cleanup is a no-op
      expect(isOTelInitialized()).toBe(true);

      warnSpy.mockRestore();
    });
  });

  describe('span export', () => {
    it('exports spans to console when exporterType is console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      cleanup = initOpenTelemetry({
        serviceName: 'test-service',
        exporterType: 'console',
        sampleRate: 1,
      });

      // Create a traced operation
      await tracer.trace('test.operation', async () => {
        return 'result';
      });

      // Flush spans
      await flushOTelSpans();

      // Check that span was logged
      expect(consoleSpy).toHaveBeenCalled();
      const lastCall = consoleSpy.mock.calls.find((call) => call[0] === '[OTEL]');
      expect(lastCall).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('respects sample rate', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      cleanup = initOpenTelemetry({
        serviceName: 'test-service',
        exporterType: 'console',
        sampleRate: 0, // 0% sampling = no spans exported
      });

      // Create a traced operation
      await tracer.trace('test.operation', async () => {
        return 'result';
      });

      // Flush spans
      await flushOTelSpans();

      // Check that no spans were logged
      const otelCalls = consoleSpy.mock.calls.filter((call) => call[0] === '[OTEL]');
      expect(otelCalls.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('flushOTelSpans', () => {
    it('flushes pending spans', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      cleanup = initOpenTelemetry({
        serviceName: 'test-service',
        exporterType: 'console',
      });

      // Create multiple traced operations
      await tracer.trace('op1', async () => 1);
      await tracer.trace('op2', async () => 2);

      // Flush all at once
      await flushOTelSpans();

      // Both should be exported
      const otelCalls = consoleSpy.mock.calls.filter((call) => call[0] === '[OTEL]');
      expect(otelCalls.length).toBeGreaterThanOrEqual(2);

      consoleSpy.mockRestore();
    });
  });
});
