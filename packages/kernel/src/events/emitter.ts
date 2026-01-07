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
 * Map of event type to handlers.
 */
const handlers = new Map<string, Set<EventHandler>>();

/**
 * Global handlers that receive all events.
 */
const globalHandlers = new Set<EventHandler>();

/**
 * Optional outbox collection accessor (set during app bootstrap).
 */
let outboxAccessor: (() => OutboxCollection) | null = null;

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
  outboxAccessor = accessor;
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
    const typeHandlers = handlers.get(type) || new Set();
    const allHandlers = [...typeHandlers, ...globalHandlers];

    if (allHandlers.length === 0) {
      // No handlers, but event was valid - that's ok
      return;
    }

    // Call all handlers in parallel
    await Promise.all(
      allHandlers.map((handler) =>
        handler(event).catch((err) => {
          // Log error but don't fail the emission
          console.error(`[events] Handler failed for '${type}':`, err);
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
    if (!outboxAccessor) {
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
    const outbox = outboxAccessor();
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
    if (!handlers.has(type)) {
      handlers.set(type, new Set());
    }
    handlers.get(type)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.get(type)?.delete(handler as EventHandler);
    };
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
    globalHandlers.add(handler);
    return () => globalHandlers.delete(handler);
  },

  /**
   * Remove all handlers for a specific event type.
   * Useful for testing or cleanup.
   */
  off(type: string): void {
    handlers.delete(type);
  },

  /**
   * Remove all handlers (type-specific and global).
   * Useful for testing or cleanup.
   */
  offAll(): void {
    handlers.clear();
    globalHandlers.clear();
  },

  /**
   * Get the count of handlers for a specific event type.
   * Useful for debugging.
   */
  handlerCount(type: string): number {
    return (handlers.get(type)?.size || 0) + globalHandlers.size;
  },
};
