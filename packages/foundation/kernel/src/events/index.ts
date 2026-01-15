/**
 * Events Module
 *
 * Provides a typed event system for domain events with:
 * - Type-safe event emission with Zod schema validation
 * - Synchronous (fire-and-forget) and reliable (outbox) delivery modes
 * - Event subscription with type-safe handlers
 * - Context-aware event metadata (requestId, scopeId)
 *
 * ## Event Registration Architecture
 *
 * There are two complementary registration mechanisms:
 *
 * 1. **Static EventSchemas** (in `schemas.ts`) - Compile-time type safety
 *    - Use this for defining all core domain events
 *    - Provides `EventType` and `EventPayload<T>` types
 *    - MUST call `await registerAllEventSchemas()` at app bootstrap
 *
 * 2. **Dynamic registerEvent()** (in `registry.ts`) - Runtime registration
 *    - Use for module-specific events not in core schemas
 *    - Use for testing/mocking scenarios
 *    - Generally prefer static schemas for production code
 *
 * ## Bootstrap Setup
 *
 * ```typescript
 * // In your bootstrap.ts
 * import { registerAllEventSchemas } from '@unisane/kernel';
 *
 * export async function bootstrap() {
 *   // Register all core event schemas (REQUIRED)
 *   await registerAllEventSchemas();
 *
 *   // ... rest of bootstrap
 * }
 * ```
 *
 * ## Usage Example
 *
 * ```typescript
 * import { emitTyped, onTyped } from '@unisane/kernel';
 *
 * // Type-safe emission (preferred)
 * await emitTyped('tenant.created', {
 *   scopeId: 'tenant_123',
 *   slug: 'acme',
 *   name: 'Acme Corp',
 *   ownerId: 'user_456',
 * });
 *
 * // Type-safe subscription
 * onTyped('tenant.created', async (event) => {
 *   console.log('New tenant:', event.payload.name);
 * });
 * ```
 */

// Types
export type {
  EventMeta,
  DomainEvent,
  EventHandler,
  OutboxEntry,
  EventSchema,
  InferEventPayload,
} from './types';

// Registry
export {
  registerEvent,
  registerEvents,
  getEventSchema,
  isEventRegistered,
  getRegisteredEvents,
  clearEventRegistry,
  defineEvent,
  BaseSchemas,
} from './registry';
export type { RegisteredEventType } from './registry';

// Emitter
export {
  events,
  setOutboxAccessor,
  setMaxHandlersPerType,
  setStrictMode,
  getHandlerStats,
  hasHandlerLeakRisk,
  UnregisteredEventError,
  EventValidationError,
} from './emitter';

// Outbox Worker
export { createOutboxWorker } from './outbox-worker';
export type { OutboxWorkerOptions, OutboxWorker } from './outbox-worker';

// Event Schemas - Central registry of all event types and their schemas
export {
  EventSchemas,
  registerAllEventSchemas,
  getSchema,
  isValidEventType,
  getEventTypesByModule,
  // Base schemas
  ScopedEventSchema,
  UserActionEventSchema,
  // Individual schemas for direct import if needed
  TenantCreatedSchema,
  TenantDeletedSchema,
  StorageUploadRequestedSchema,
  StorageUploadConfirmedSchema,
  CreditsGrantedSchema,
  CreditsConsumedSchema,
} from './schemas';
export type { EventType, EventPayload, AnyEventPayload } from './schemas';

// Typed event emission helpers
export { emitTyped, emitTypedReliable, onTyped } from './typed-emitter';

// Billing event schemas (for event-driven decoupling)
export {
  BillingEventSchemas,
  // Stripe webhook events
  StripeTopupCompletedSchema,
  StripeSubscriptionInvoicePaidSchema,
  StripeSubscriptionChangedSchema,
  StripeInvoiceEventSchema,
  StripePaymentEventSchema,
  StripeCustomerMappingEventSchema,
  // Razorpay webhook events
  RazorpayPaymentCompletedSchema,
  RazorpaySubscriptionChangedSchema,
  RazorpayPaymentEventSchema,
  // Generic events
  CreditGrantRequestedSchema,
} from './billing-events';
export type { BillingEventType, BillingEventPayload } from './billing-events';

// Centralized module event handler registration
export {
  registerModuleEventHandlers,
  initAllModuleEventHandlers,
  getRegisteredModules,
  areHandlersInitialized,
  clearModuleHandlerRegistry,
} from './module-handlers';
export type { HandlerRegistrar } from './module-handlers';
