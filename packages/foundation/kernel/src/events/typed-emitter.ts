/**
 * Typed Event Emitter
 *
 * Provides compile-time type safety for event emission.
 * Use these helpers instead of `events.emit()` for better DX.
 *
 * @example
 * ```typescript
 * import { emitTyped } from '@unisane/kernel';
 *
 * // TypeScript will enforce the correct payload shape
 * await emitTyped('tenant.created', {
 *   scopeId: 'tenant_123',
 *   slug: 'my-company',
 *   name: 'My Company',
 *   ownerId: 'user_456',
 * });
 *
 * // This would be a type error:
 * await emitTyped('tenant.created', { scopeId: 'x' }); // Missing slug, name, ownerId
 * ```
 */

import { events } from './emitter';
import type { EventType, EventPayload } from './schemas';
import type { DomainEvent } from './types';

/**
 * Emit an event with compile-time type checking.
 *
 * This is a type-safe wrapper around `events.emit()`.
 * TypeScript will enforce that the payload matches the schema
 * for the given event type.
 *
 * @param type - The event type (must be a key of EventSchemas)
 * @param payload - The event payload (type-checked against the schema)
 * @param source - Optional source identifier (defaults to 'kernel')
 */
export async function emitTyped<T extends EventType>(
  type: T,
  payload: EventPayload<T>,
  source = 'kernel'
): Promise<void> {
  await events.emit(type, payload, source);
}

/**
 * Emit an event reliably (via outbox) with compile-time type checking.
 *
 * This is a type-safe wrapper around `events.emitReliable()`.
 * The event will be persisted to the outbox before returning,
 * guaranteeing at-least-once delivery.
 *
 * @param type - The event type (must be a key of EventSchemas)
 * @param payload - The event payload (type-checked against the schema)
 * @param source - Optional source identifier (defaults to 'kernel')
 */
export async function emitTypedReliable<T extends EventType>(
  type: T,
  payload: EventPayload<T>,
  source = 'kernel'
): Promise<void> {
  await events.emitReliable(type, payload, source);
}

/**
 * Subscribe to an event with compile-time type checking.
 *
 * This is a type-safe wrapper around `events.on()`.
 * The handler will receive a typed `DomainEvent<EventPayload<T>>`.
 *
 * @param type - The event type to subscribe to
 * @param handler - The handler function with typed payload
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onTyped('tenant.created', async (event) => {
 *   // event.payload is typed as { scopeId: string; slug: string; name: string; ownerId: string }
 *   console.log('New tenant:', event.payload.name);
 * });
 * ```
 */
export function onTyped<T extends EventType>(
  type: T,
  handler: (event: DomainEvent<EventPayload<T>>) => Promise<void>
): () => void {
  return events.on(type, handler);
}

/**
 * Type guard to check if an event matches a specific type.
 * Useful in global handlers that receive any event.
 *
 * @example
 * ```typescript
 * events.onAll(async (event) => {
 *   if (isEventOfType(event, 'tenant.created')) {
 *     // event.payload is now typed as TenantCreatedPayload
 *     console.log(event.payload.slug);
 *   }
 * });
 * ```
 */
export function isEventOfType<T extends EventType>(
  event: DomainEvent<unknown>,
  type: T
): event is DomainEvent<EventPayload<T>> {
  return event.type === type;
}
