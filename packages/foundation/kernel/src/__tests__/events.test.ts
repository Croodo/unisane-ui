/**
 * Events Module Tests
 *
 * Tests for event emission, subscription, and handler management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  events,
  setOutboxAccessor,
  setMaxHandlersPerType,
  getHandlerStats,
  hasHandlerLeakRisk,
  UnregisteredEventError,
  EventValidationError,
} from '../events/emitter';
import { registerEvent, clearEventRegistry } from '../events/registry';
import { z } from 'zod';

describe('Events Module', () => {
  beforeEach(() => {
    // Clean up handlers between tests
    events.offAll();
    clearEventRegistry();

    // Register test events
    registerEvent('test.event', z.object({ value: z.string() }));
    registerEvent('test.complex', z.object({ id: z.string(), count: z.number() }));
    registerEvent('test.optional', z.object({ name: z.string().optional() }));
  });

  describe('events.emit()', () => {
    it('should emit event to registered handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      events.on('test.event', handler);

      await events.emit('test.event', { value: 'hello' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test.event',
          payload: { value: 'hello' },
          meta: expect.objectContaining({
            eventId: expect.stringMatching(/^evt_/),
            timestamp: expect.any(String),
            version: 1,
          }),
        })
      );
    });

    it('should call all handlers for an event type', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);
      const handler3 = vi.fn().mockResolvedValue(undefined);

      events.on('test.event', handler1);
      events.on('test.event', handler2);
      events.on('test.event', handler3);

      await events.emit('test.event', { value: 'test' });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers for different event types', async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const otherHandler = vi.fn().mockResolvedValue(undefined);

      events.on('test.event', testHandler);
      events.on('test.complex', otherHandler);

      await events.emit('test.event', { value: 'test' });

      expect(testHandler).toHaveBeenCalledTimes(1);
      expect(otherHandler).not.toHaveBeenCalled();
    });

    it('should throw UnregisteredEventError for unknown event type', async () => {
      await expect(events.emit('unknown.event', { data: 'test' })).rejects.toThrow(
        UnregisteredEventError
      );
      await expect(events.emit('unknown.event', { data: 'test' })).rejects.toThrow(
        "Event type 'unknown.event' is not registered"
      );
    });

    it('should throw EventValidationError for invalid payload', async () => {
      await expect(events.emit('test.event', { value: 123 })).rejects.toThrow(EventValidationError);
    });

    it('should continue calling other handlers if one fails', async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      const successHandler = vi.fn().mockResolvedValue(undefined);

      events.on('test.event', failingHandler);
      events.on('test.event', successHandler);

      // Should not throw
      await events.emit('test.event', { value: 'test' });

      expect(failingHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });

    it('should succeed with no handlers registered', async () => {
      // No handlers registered, should not throw
      await expect(events.emit('test.event', { value: 'test' })).resolves.toBeUndefined();
    });
  });

  describe('events.emitReliable()', () => {
    it('should throw if outbox not configured', async () => {
      await expect(events.emitReliable('test.event', { value: 'test' })).rejects.toThrow(
        'Outbox not configured'
      );
    });

    it('should insert into outbox when configured', async () => {
      const mockInsertOne = vi.fn();
      setOutboxAccessor(() => ({ insertOne: mockInsertOne }));

      await events.emitReliable('test.event', { value: 'reliable' });

      expect(mockInsertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test.event',
          payload: { value: 'reliable' },
          status: 'pending',
          attempts: 0,
        })
      );

      // Clean up
      setOutboxAccessor(null as unknown as () => { insertOne: () => Promise<void> });
    });

    it('should validate payload before inserting to outbox', async () => {
      const mockInsertOne = vi.fn();
      setOutboxAccessor(() => ({ insertOne: mockInsertOne }));

      await expect(events.emitReliable('test.event', { value: 123 })).rejects.toThrow(
        EventValidationError
      );

      expect(mockInsertOne).not.toHaveBeenCalled();

      // Clean up
      setOutboxAccessor(null as unknown as () => { insertOne: () => Promise<void> });
    });
  });

  describe('events.on()', () => {
    it('should return unsubscribe function', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const unsubscribe = events.on('test.event', handler);

      await events.emit('test.event', { value: 'before' });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await events.emit('test.event', { value: 'after' });
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should allow multiple subscriptions to same event', () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      events.on('test.event', handler1);
      events.on('test.event', handler2);

      expect(events.handlerCount('test.event')).toBe(2);
    });
  });

  describe('events.once()', () => {
    it('should only call handler once', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      events.once('test.event', handler);

      await events.emit('test.event', { value: 'first' });
      await events.emit('test.event', { value: 'second' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ payload: { value: 'first' } })
      );
    });

    it('should return unsubscribe function that works before event fires', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const unsubscribe = events.once('test.event', handler);

      unsubscribe();

      await events.emit('test.event', { value: 'test' });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('events.onAll()', () => {
    it('should receive all events', async () => {
      const globalHandler = vi.fn().mockResolvedValue(undefined);
      events.onAll(globalHandler);

      await events.emit('test.event', { value: 'test' });
      await events.emit('test.complex', { id: 'id1', count: 5 });

      expect(globalHandler).toHaveBeenCalledTimes(2);
    });

    it('should return unsubscribe function', async () => {
      const globalHandler = vi.fn().mockResolvedValue(undefined);
      const unsubscribe = events.onAll(globalHandler);

      await events.emit('test.event', { value: 'before' });
      expect(globalHandler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await events.emit('test.event', { value: 'after' });
      expect(globalHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('events.off()', () => {
    it('should remove all handlers for event type', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      events.on('test.event', handler1);
      events.on('test.event', handler2);

      events.off('test.event');

      await events.emit('test.event', { value: 'test' });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should not affect handlers for other event types', async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const complexHandler = vi.fn().mockResolvedValue(undefined);

      events.on('test.event', testHandler);
      events.on('test.complex', complexHandler);

      events.off('test.event');

      await events.emit('test.complex', { id: 'test', count: 1 });

      expect(complexHandler).toHaveBeenCalled();
    });
  });

  describe('events.offAll()', () => {
    it('should remove all handlers', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);
      const globalHandler = vi.fn().mockResolvedValue(undefined);

      events.on('test.event', handler1);
      events.on('test.complex', handler2);
      events.onAll(globalHandler);

      events.offAll();

      await events.emit('test.event', { value: 'test' });
      await events.emit('test.complex', { id: 'test', count: 1 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(globalHandler).not.toHaveBeenCalled();
    });
  });

  describe('events.handlerCount()', () => {
    it('should return count of handlers for event type', () => {
      expect(events.handlerCount('test.event')).toBe(0);

      events.on('test.event', vi.fn().mockResolvedValue(undefined));
      expect(events.handlerCount('test.event')).toBe(1);

      events.on('test.event', vi.fn().mockResolvedValue(undefined));
      expect(events.handlerCount('test.event')).toBe(2);
    });

    it('should include global handlers in count', () => {
      events.on('test.event', vi.fn().mockResolvedValue(undefined));
      events.onAll(vi.fn().mockResolvedValue(undefined));

      // 1 type-specific + 1 global
      expect(events.handlerCount('test.event')).toBe(2);
    });
  });

  describe('events.registeredTypes()', () => {
    it('should return types with handlers registered', () => {
      events.on('test.event', vi.fn().mockResolvedValue(undefined));
      events.on('test.complex', vi.fn().mockResolvedValue(undefined));

      const types = events.registeredTypes();
      expect(types).toContain('test.event');
      expect(types).toContain('test.complex');
    });

    it('should not include types without handlers', () => {
      events.on('test.event', vi.fn().mockResolvedValue(undefined));

      const types = events.registeredTypes();
      expect(types).not.toContain('test.complex');
    });
  });

  describe('Handler Stats', () => {
    describe('getHandlerStats()', () => {
      it('should return handler statistics', () => {
        events.on('test.event', vi.fn().mockResolvedValue(undefined));
        events.on('test.event', vi.fn().mockResolvedValue(undefined));
        events.on('test.complex', vi.fn().mockResolvedValue(undefined));
        events.onAll(vi.fn().mockResolvedValue(undefined));

        const stats = getHandlerStats();

        expect(stats.totalTypeHandlers).toBe(3); // 2 + 1
        expect(stats.globalHandlers).toBe(1);
        expect(stats.byType['test.event']).toBe(2);
        expect(stats.byType['test.complex']).toBe(1);
      });

      it('should track registration count', () => {
        const initialCount = getHandlerStats().registrationCount;

        events.on('test.event', vi.fn().mockResolvedValue(undefined));
        events.on('test.event', vi.fn().mockResolvedValue(undefined));

        expect(getHandlerStats().registrationCount).toBe(initialCount + 2);
      });
    });

    describe('hasHandlerLeakRisk()', () => {
      it('should return false when under threshold', () => {
        events.on('test.event', vi.fn().mockResolvedValue(undefined));
        expect(hasHandlerLeakRisk()).toBe(false);
      });

      it('should return true when approaching limit', () => {
        // Set a low limit for testing
        setMaxHandlersPerType(10);

        // Add 8 handlers (80% of 10)
        for (let i = 0; i < 8; i++) {
          events.on('test.event', vi.fn().mockResolvedValue(undefined));
        }

        expect(hasHandlerLeakRisk()).toBe(true);

        // Reset to default
        setMaxHandlersPerType(100);
      });
    });

    describe('setMaxHandlersPerType()', () => {
      it('should update max handlers limit', () => {
        setMaxHandlersPerType(50);
        expect(getHandlerStats().maxHandlersPerType).toBe(50);

        // Reset to default
        setMaxHandlersPerType(100);
      });
    });
  });
});

describe('Error Classes', () => {
  describe('UnregisteredEventError', () => {
    it('should include event type in message', () => {
      const error = new UnregisteredEventError('my.custom.event');
      expect(error.name).toBe('UnregisteredEventError');
      expect(error.message).toContain('my.custom.event');
      expect(error.message).toContain('not registered');
    });
  });

  describe('EventValidationError', () => {
    it('should include event type and errors', () => {
      const errors = [{ path: ['field'], message: 'Required' }];
      const error = new EventValidationError('test.event', errors);

      expect(error.name).toBe('EventValidationError');
      expect(error.message).toContain('test.event');
      expect(error.errors).toBe(errors);
    });
  });
});
