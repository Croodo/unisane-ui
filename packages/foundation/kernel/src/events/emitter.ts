/**
 * Event Emitter
 *
 * Provides event emission and subscription capabilities.
 * Supports both synchronous (fire-and-forget) and reliable (outbox pattern) emission.
 */

import { generateId } from '../utils/ids';
import { ctx } from '../context';
import { getEventSchema } from './registry';
import type { DomainEvent, EventHandler, EventMeta, OutboxEntry } from './types';

/**
 * Error thrown when emitting an unregistered event type.
 */
export class UnregisteredEventError extends Error {
  constructor(type: string) {
    super(`Event type '${type}' is not registered. Register it first with registerEvent().`);
    this.name = 'UnregisteredEventError';
  }
}

/**
 * Error thrown when event payload fails validation.
 */
export class EventValidationError extends Error {
  readonly errors: unknown;

  constructor(type: string, errors: unknown) {
    super(`Event payload validation failed for '${type}'`);
    this.name = 'EventValidationError';
    this.errors = errors;
  }
}

/**
 * Global state for event handlers to share across module instances in Next.js/Turbopack
 */
interface EventEmitterState {
  handlers: Map<string, Set<EventHandler>>;
  globalHandlers: Set<EventHandler>;
  outboxAccessor: (() => OutboxCollection) | null;
  // Track handler registration for debugging/monitoring
  registrationCount: number;
  // Max handlers per event type (protection against memory leaks)
  maxHandlersPerType: number;
}

const globalForEvents = global as unknown as { __eventEmitterState?: EventEmitterState };

if (!globalForEvents.__eventEmitterState) {
  globalForEvents.__eventEmitterState = {
    handlers: new Map(),
    globalHandlers: new Set(),
    outboxAccessor: null,
    registrationCount: 0,
    maxHandlersPerType: 100, // Reasonable default, can be configured
  };
}

const state = globalForEvents.__eventEmitterState;

/**
 * Interface for outbox collection operations.
 */
interface OutboxCollection {
  insertOne(entry: OutboxEntry): Promise<void>;
}

/**
 * Set the outbox collection accessor.
 * Called during app bootstrap to enable reliable event emission.
 */
export function setOutboxAccessor(accessor: () => OutboxCollection): void {
  state.outboxAccessor = accessor;
}

/**
 * Configure max handlers per event type.
 * Set to a lower value in serverless environments to detect leaks early.
 */
export function setMaxHandlersPerType(max: number): void {
  state.maxHandlersPerType = max;
}

/**
 * Get current handler statistics for debugging and monitoring.
 * Use this in health checks to detect handler accumulation.
 */
export function getHandlerStats(): {
  totalTypeHandlers: number;
  globalHandlers: number;
  registrationCount: number;
  maxHandlersPerType: number;
  potentialLeak: boolean;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  let totalTypeHandlers = 0;
  let potentialLeak = false;

  for (const [type, handlers] of state.handlers) {
    byType[type] = handlers.size;
    totalTypeHandlers += handlers.size;
    if (handlers.size >= state.maxHandlersPerType * 0.8) {
      potentialLeak = true; // Warn at 80% of limit
    }
  }

  if (state.globalHandlers.size >= state.maxHandlersPerType * 0.8) {
    potentialLeak = true;
  }

  return {
    totalTypeHandlers,
    globalHandlers: state.globalHandlers.size,
    registrationCount: state.registrationCount,
    maxHandlersPerType: state.maxHandlersPerType,
    potentialLeak,
    byType,
  };
}

/**
 * Check if there's a potential memory leak based on handler counts.
 * Returns true if any handler type is at 80%+ of the limit.
 */
export function hasHandlerLeakRisk(): boolean {
  return getHandlerStats().potentialLeak;
}

/**
 * Create event metadata from current context.
 */
function createEventMeta(source: string): EventMeta {
  const context = ctx.tryGet();
  return {
    eventId: generateId('evt'),
    timestamp: new Date().toISOString(),
    version: 1,
    source,
    correlationId: context?.requestId,
    tenantId: context?.tenantId,
  };
}

/**
 * Validate payload against registered schema.
 */
function validatePayload<T>(type: string, payload: T): T {
  const schema = getEventSchema(type);
  if (!schema) {
    throw new UnregisteredEventError(type);
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new EventValidationError(type, result.error.errors);
  }

  return result.data as T;
}

/**
 * Log handler errors with structured context.
 */
function logHandlerError(type: string, error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[events] Handler failed for '${type}':`, {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
}

/**
 * The main events API.
 */
export const events = {
  /**
   * Emit an event synchronously (fire-and-forget).
   * Handlers are called in parallel, errors are logged but don't stop other handlers.
   *
   * @example
   * ```typescript
   * await events.emit('billing.subscription.created', {
   *   tenantId: 'tenant_123',
   *   planId: 'pro',
   *   providerSubId: 'sub_xyz',
   * });
   * ```
   *
   * @param type - The event type
   * @param payload - The event payload (validated against schema)
   * @param source - Optional source identifier (defaults to 'kernel')
   */
  async emit<T>(type: string, payload: T, source = 'kernel'): Promise<void> {
    // Validate payload against schema
    const validatedPayload = validatePayload(type, payload);

    // Create the event
    const event: DomainEvent<T> = {
      type,
      payload: validatedPayload,
      meta: createEventMeta(source),
    };

    // Get handlers for this event type
    const typeHandlers = state.handlers.get(type) || new Set();
    const allHandlers = [...typeHandlers, ...state.globalHandlers];

    if (allHandlers.length === 0) {
      // No handlers, but event was valid - that's ok
      return;
    }

    // Call all handlers in parallel
    await Promise.all(
      allHandlers.map((handler) =>
        handler(event).catch((err) => {
          logHandlerError(type, err);
        })
      )
    );
  },

  /**
   * Emit an event reliably via the outbox pattern.
   * Guarantees at-least-once delivery by persisting to outbox before returning.
   * A background job processes the outbox and delivers events.
   *
   * @example
   * ```typescript
   * await events.emitReliable('billing.subscription.created', {
   *   tenantId: 'tenant_123',
   *   planId: 'pro',
   * });
   * ```
   *
   * @param type - The event type
   * @param payload - The event payload (validated against schema)
   * @param source - Optional source identifier (defaults to 'kernel')
   * @throws Error if outbox is not configured
   */
  async emitReliable<T>(type: string, payload: T, source = 'kernel'): Promise<void> {
    if (!state.outboxAccessor) {
      throw new Error(
        'Outbox not configured. Call setOutboxAccessor() during bootstrap to enable reliable events.'
      );
    }

    // Validate payload against schema
    const validatedPayload = validatePayload(type, payload);

    // Create outbox entry
    const now = new Date();
    const entry: OutboxEntry<T> = {
      type,
      payload: validatedPayload,
      meta: createEventMeta(source),
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into outbox
    const outbox = state.outboxAccessor();
    await outbox.insertOne(entry);
  },

  /**
   * Subscribe to a specific event type.
   *
   * @example
   * ```typescript
   * const unsubscribe = events.on('billing.subscription.created', async (event) => {
   *   console.log('New subscription:', event.payload.planId);
   * });
   *
   * // Later...
   * unsubscribe();
   * ```
   *
   * @param type - The event type to subscribe to
   * @param handler - The handler function
   * @returns Unsubscribe function
   */
  on<T>(type: string, handler: EventHandler<T>): () => void {
    if (!state.handlers.has(type)) {
      state.handlers.set(type, new Set());
    }

    const typeHandlers = state.handlers.get(type)!;

    // Check for handler limit (memory leak protection)
    if (typeHandlers.size >= state.maxHandlersPerType) {
      console.warn(
        `[events] Max handlers (${state.maxHandlersPerType}) reached for '${type}'. ` +
        `This may indicate a memory leak. Consider calling unsubscribe() when handlers are no longer needed.`
      );
    }

    typeHandlers.add(handler as EventHandler);
    state.registrationCount++;

    // Return unsubscribe function
    return () => {
      state.handlers.get(type)?.delete(handler as EventHandler);
    };
  },

  /**
   * Subscribe to a specific event type with automatic cleanup after first call.
   * Useful for one-time event handlers.
   *
   * @param type - The event type to subscribe to
   * @param handler - The handler function (called once then unsubscribed)
   * @returns Unsubscribe function (in case you want to cancel before event fires)
   */
  once<T>(type: string, handler: EventHandler<T>): () => void {
    const unsubscribe = events.on<T>(type, async (event) => {
      unsubscribe();
      await handler(event);
    });
    return unsubscribe;
  },

  /**
   * Subscribe to all events (global handler).
   * Useful for logging, analytics, or debugging.
   *
   * @example
   * ```typescript
   * events.onAll(async (event) => {
   *   console.log(`[${event.type}]`, event.meta.eventId);
   * });
   * ```
   *
   * @param handler - The handler function
   * @returns Unsubscribe function
   */
  onAll(handler: EventHandler): () => void {
    // Check for global handler limit
    if (state.globalHandlers.size >= state.maxHandlersPerType) {
      console.warn(
        `[events] Max global handlers (${state.maxHandlersPerType}) reached. ` +
        `This may indicate a memory leak.`
      );
    }

    state.globalHandlers.add(handler);
    state.registrationCount++;
    return () => state.globalHandlers.delete(handler);
  },

  /**
   * Remove all handlers for a specific event type.
   * Useful for testing or cleanup.
   */
  off(type: string): void {
    state.handlers.delete(type);
  },

  /**
   * Remove all handlers (type-specific and global).
   * Useful for testing or cleanup.
   */
  offAll(): void {
    state.handlers.clear();
    state.globalHandlers.clear();
  },

  /**
   * Get the count of handlers for a specific event type.
   * Useful for debugging.
   */
  handlerCount(type: string): number {
    return (state.handlers.get(type)?.size || 0) + state.globalHandlers.size;
  },

  /**
   * Get all registered event types with handlers.
   */
  registeredTypes(): string[] {
    return Array.from(state.handlers.keys());
  },
};
