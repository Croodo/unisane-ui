/**
 * @module @unisane/notify
 * @description Multi-channel notifications: email, in-app, SMS, push
 * @layer 4
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Schemas & Types
// ════════════════════════════════════════════════════════════════════════════

export * from "./domain/schemas";
export * from "./domain/types";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  NotificationNotFoundError,
  NotificationDeliveryError,
  InvalidChannelError,
  TemplateNotFoundError,
} from './domain/errors';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export { NOTIFY_EVENTS, NOTIFY_CHANNELS, NOTIFY_DEFAULTS, NOTIFY_COLLECTIONS } from './domain/constants';
export type { NotifyChannel } from './domain/constants';

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { notifyKeys } from './domain/keys';
export type { NotifyKeyBuilder } from './domain/keys';

// ════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════

export * from "./service/email";
export * from "./service/enqueue";
export * from "./service/inapp";
export * from "./service/prefs";
export * from "./service/suppression";

// ════════════════════════════════════════════════════════════════════════════
// Event Handlers - Hexagonal Architecture
// ════════════════════════════════════════════════════════════════════════════

export { registerNotifyEventHandlers } from "./event-handlers";
