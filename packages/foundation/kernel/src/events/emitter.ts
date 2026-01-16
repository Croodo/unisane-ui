/**
 * Event Emitter
 *
 * Provides event emission and subscription capabilities.
 * Supports both synchronous (fire-and-forget) and reliable (outbox pattern) emission.
 */

import { generateId } from '../utils/ids';
import { tryGetScopeContext } from '../scope/context';
import { getEventSchema } from './registry';
import type { DomainEvent, EventHandler, EventMeta, OutboxEntry } from './types';
import { logger } from '../observability/logger';

/**
 * Error thrown when emitting an unregistered event type.
 */
export class UnregisteredEventError extends Error {
  constructor(type: string) {
    super(
      `Event type '${type}' is not registered. ` +
      `Did you call registerAllEventSchemas() at bootstrap? ` +
      `Or use registerEvent() for custom events.`
    );
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
  // If true, throw error when max handlers reached instead of just warning
  strictMode: boolean;
  // KERN-004 FIX: Last time we logged a handler accumulation warning
  lastAccumulationWarningAt: number;
  // KERN-004 FIX: Interval between accumulation warnings (5 minutes)
  accumulationWarningIntervalMs: number;
}

const globalForEvents = global as unknown as { __eventEmitterState?: EventEmitterState };

if (!globalForEvents.__eventEmitterState) {
  // KERN-004 FIX: Auto-enable strictMode in production
  // This ensures handler leaks cause visible errors rather than silent degradation
  const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

  globalForEvents.__eventEmitterState = {
    handlers: new Map(),
    globalHandlers: new Set(),
    outboxAccessor: null,
    registrationCount: 0,
    maxHandlersPerType: 100, // Reasonable default, can be configured
    strictMode: isProduction, // KERN-004 FIX: Enable strict mode in production
    lastAccumulationWarningAt: 0,
    accumulationWarningIntervalMs: 5 * 60 * 1000, // 5 minutes
  };
}

const state = globalForEvents.__eventEmitterState;

/**
 * KERN-013 FIX: Registration guard to detect concurrent modifications.
 * While Node.js is single-threaded, async handlers during emit could
 * theoretically trigger new registrations. This counter helps detect issues.
 */
let registrationLockDepth = 0;
let emitInProgress = false;

function warnIfConcurrentRegistration(operation: string): void {
  if (emitInProgress) {
    logger.warn(`Event handler ${operation} during emit - may cause inconsistent behavior`, {
      module: 'events',
      operation,
      lockDepth: registrationLockDepth,
    });
  }
}

/**
 * Interface for outbox collection operations.
 */
interface OutboxCollection {
  insertOne(entry: OutboxEntry): Promise<void>;
}

/**
 * Set the outbox collection accessor.
 * Called during app bootstrap to enable reliable event emission.
 *
 * KERN-016 FIX: This must be called during bootstrap before using emitReliable().
 * Use isReliableEventsEnabled() to check if outbox is configured.
 */
export function setOutboxAccessor(accessor: () => OutboxCollection): void {
  state.outboxAccessor = accessor;
}

/**
 * KERN-016 FIX: Check if reliable events (outbox) is configured.
 * Use this to conditionally enable features that depend on reliable events.
 *
 * @example
 * ```typescript
 * if (events.isReliableEventsEnabled()) {
 *   await events.emitReliable('order.created', order);
 * } else {
 *   // Fall back to standard emit or skip
 *   await events.emit('order.created', order);
 * }
 * ```
 */
export function isReliableEventsEnabled(): boolean {
  return state.outboxAccessor !== null;
}

/**
 * Configure max handlers per event type.
 * Set to a lower value in serverless environments to detect leaks early.
 */
export function setMaxHandlersPerType(max: number): void {
  state.maxHandlersPerType = max;
}

/**
 * Enable or disable strict mode.
 * In strict mode, throws an error when max handlers is reached instead of just warning.
 * Enable this in production to fail fast on handler leaks.
 */
export function setStrictMode(strict: boolean): void {
  state.strictMode = strict;
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
 * KERN-004 FIX: Log a warning if handler counts are approaching the limit.
 * Called periodically (throttled) to avoid log spam.
 * Logs at 50%, 70%, and 90% of the limit.
 */
function checkAndLogAccumulation(): void {
  const now = Date.now();
  if (now - state.lastAccumulationWarningAt < state.accumulationWarningIntervalMs) {
    return; // Throttle logging
  }

  const stats = getHandlerStats();
  const threshold50 = state.maxHandlersPerType * 0.5;
  const threshold70 = state.maxHandlersPerType * 0.7;
  const threshold90 = state.maxHandlersPerType * 0.9;

  // Find event types with high handler counts
  const highTypes: Array<{ type: string; count: number; severity: 'warning' | 'high' | 'critical' }> = [];

  for (const [type, count] of Object.entries(stats.byType)) {
    if (count >= threshold90) {
      highTypes.push({ type, count, severity: 'critical' });
    } else if (count >= threshold70) {
      highTypes.push({ type, count, severity: 'high' });
    } else if (count >= threshold50) {
      highTypes.push({ type, count, severity: 'warning' });
    }
  }

  // Check global handlers too
  if (stats.globalHandlers >= threshold90) {
    highTypes.push({ type: '__global__', count: stats.globalHandlers, severity: 'critical' });
  } else if (stats.globalHandlers >= threshold70) {
    highTypes.push({ type: '__global__', count: stats.globalHandlers, severity: 'high' });
  } else if (stats.globalHandlers >= threshold50) {
    highTypes.push({ type: '__global__', count: stats.globalHandlers, severity: 'warning' });
  }

  if (highTypes.length === 0) {
    return;
  }

  // Log the warning
  state.lastAccumulationWarningAt = now;

  const hasCritical = highTypes.some((h) => h.severity === 'critical');
  const hasHigh = highTypes.some((h) => h.severity === 'high');

  const logMethod = hasCritical ? 'error' : hasHigh ? 'warn' : 'info';
  const message = `Event handler accumulation detected - possible memory leak`;

  logger[logMethod](message, {
    module: 'events',
    maxHandlersPerType: state.maxHandlersPerType,
    totalTypeHandlers: stats.totalTypeHandlers,
    globalHandlers: stats.globalHandlers,
    registrationCount: stats.registrationCount,
    affectedTypes: highTypes,
  });
}

/**
 * Create event metadata from current scope context.
 */
function createEventMeta(source: string): EventMeta {
  const context = tryGetScopeContext();
  const scopeId = context?.scope?.id;
  const scopeType = context?.scope?.type;
  return {
    eventId: generateId('evt'),
    timestamp: new Date().toISOString(),
    version: 1,
    source,
    correlationId: context?.requestId,
    scopeType,
    scopeId,
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
  logger.error('Event handler failed', {
    module: 'events',
    eventType: type,
    errorName: err.name,
    error: err.message,
    stack: err.stack,
  });
}

/**
 * The main events API.
 */
export const events = {
  /**
   * KERN-016 FIX: Check if reliable events (outbox) is configured.
   */
  isReliableEventsEnabled,

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

    // KERN-013 FIX: Snapshot handlers before emit to avoid concurrent modification issues
    // Get handlers for this event type - create snapshot to avoid issues if handlers are modified during emit
    const typeHandlers = state.handlers.get(type) || new Set();
    const allHandlers = [...typeHandlers, ...state.globalHandlers];

    if (allHandlers.length === 0) {
      // No handlers, but event was valid - that's ok
      return;
    }

    // KERN-013 FIX: Mark emit in progress to detect concurrent registrations
    emitInProgress = true;
    try {
      // Call all handlers in parallel
      await Promise.all(
        allHandlers.map((handler) =>
          handler(event).catch((err) => {
            logHandlerError(type, err);
          })
        )
      );
    } finally {
      emitInProgress = false;
    }
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
    // KERN-013 FIX: Warn if registering during emit (potential race condition)
    warnIfConcurrentRegistration('registration');

    if (!state.handlers.has(type)) {
      state.handlers.set(type, new Set());
    }

    const typeHandlers = state.handlers.get(type)!;

    // Check for handler limit (memory leak protection)
    if (typeHandlers.size >= state.maxHandlersPerType) {
      const message =
        `Max handlers (${state.maxHandlersPerType}) reached for '${type}'. ` +
        `This may indicate a memory leak. Consider calling unsubscribe() when handlers are no longer needed.`;

      if (state.strictMode) {
        throw new Error(message);
      }
      logger.warn(message, { module: 'events', eventType: type, maxHandlers: state.maxHandlersPerType });
    }

    typeHandlers.add(handler as EventHandler);
    state.registrationCount++;

    // KERN-004 FIX: Check and log handler accumulation periodically
    checkAndLogAccumulation();

    // Return unsubscribe function
    // KERN-002 FIX: Clean up empty Sets to prevent memory leak over time
    return () => {
      const handlers = state.handlers.get(type);
      if (handlers) {
        handlers.delete(handler as EventHandler);
        // Clean up empty Set to prevent memory accumulation
        if (handlers.size === 0) {
          state.handlers.delete(type);
        }
      }
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
      const message =
        `Max global handlers (${state.maxHandlersPerType}) reached. ` +
        `This may indicate a memory leak.`;

      if (state.strictMode) {
        throw new Error(message);
      }
      logger.warn(message, { module: 'events', maxHandlers: state.maxHandlersPerType });
    }

    state.globalHandlers.add(handler);
    state.registrationCount++;

    // KERN-004 FIX: Check and log handler accumulation periodically
    checkAndLogAccumulation();

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
