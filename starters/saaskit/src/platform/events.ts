/**
 * Event Schema Registration
 *
 * Registers all domain event schemas with the kernel event system.
 * Must be called during bootstrap before any events are emitted.
 *
 * NOTE: Core event schemas are defined in kernel (EventSchemas, BillingEventSchemas).
 * This file registers additional module-specific events that aren't in kernel.
 */

import { z } from 'zod';
import { registerEvents, registerAllEventSchemas } from '@unisane/kernel';
import { CREDITS_EVENTS } from '@unisane/credits';
import { IDENTITY_EVENTS } from '@unisane/identity';
import { AUTH_EVENTS } from '@unisane/auth';
import { AUDIT_EVENTS } from '@unisane/audit';
import { FLAGS_EVENTS } from '@unisane/flags';

let registered = false;

/**
 * Register all domain event schemas.
 * Safe to call multiple times - only registers once.
 *
 * This function:
 * 1. Registers core kernel event schemas (tenant.*, storage.*, credits.*, billing.*, etc.)
 * 2. Registers additional module-specific event schemas not in kernel
 *
 * IMPORTANT: The kernel's EventSchemas already registers:
 * - tenant.* (created, updated, deleted, member.*, invitation.*)
 * - storage.* (upload.*, file.*, cleanup.*)
 * - billing.* (subscription.*, payment.*)
 * - credits.* (granted, consumed, expired)
 * - usage.* (incremented, limit_reached)
 * - notify.* (sent, read, prefs_updated, email_suppression_requested)
 * - settings.* (created, updated, deleted)
 * - webhooks.* (replayed, delivered, failed)
 * - identity.membership.role_changed, identity.apikey.*
 *
 * Only register events here that are NOT in the kernel.
 */
export async function registerEventSchemas(): Promise<void> {
  if (registered) return;
  registered = true;

  // ─── KERNEL CORE EVENT SCHEMAS ──────────────────────────────────────────────
  // Registers EventSchemas and BillingEventSchemas from kernel
  await registerAllEventSchemas();
  console.log('[events] Kernel core event schemas registered');

  // ─── CREDITS EVENT SCHEMAS ───────────────────────────────────────────────────
  // Note: credits.granted, credits.consumed, credits.expired are in kernel
  // Only register credits.refunded which is not in kernel
  registerEvents({
    [CREDITS_EVENTS.REFUNDED]: z.object({
      scopeId: z.string(),
      amount: z.number(),
      reason: z.string(),
      id: z.string(),
    }),
  });

  // ─── IDENTITY EVENT SCHEMAS ──────────────────────────────────────────────────
  // Note: identity.membership.role_changed, identity.apikey.* are in kernel
  // Only register identity.user.* events here
  registerEvents({
    [IDENTITY_EVENTS.USER_CREATED]: z.object({
      userId: z.string(),
      email: z.string(),
    }),
    [IDENTITY_EVENTS.USER_UPDATED]: z.object({
      userId: z.string(),
      email: z.string().optional(),
      username: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    }),
    [IDENTITY_EVENTS.USER_DELETED]: z.object({
      userId: z.string(),
    }),
    [IDENTITY_EVENTS.USER_EMAIL_VERIFIED]: z.object({
      userId: z.string(),
      email: z.string(),
    }),
    [IDENTITY_EVENTS.USER_PHONE_VERIFIED]: z.object({
      userId: z.string(),
      phone: z.string(),
    }),
    // Note: API_KEY_CREATED/REVOKED use 'identity.api_key.*' (with underscore)
    // but kernel has 'identity.apikey.*' (no underscore) - they're different events
    [IDENTITY_EVENTS.API_KEY_CREATED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
      keyId: z.string(),
    }),
    [IDENTITY_EVENTS.API_KEY_REVOKED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
      keyId: z.string(),
      keyHash: z.string().optional(),
    }),
  });

  // ─── AUTH EVENT SCHEMAS ──────────────────────────────────────────────────────
  // These are not in kernel, register all auth events
  registerEvents({
    [AUTH_EVENTS.SIGNUP_COMPLETED]: z.object({
      userId: z.string(),
      email: z.string(),
      method: z.string(),
    }),
    [AUTH_EVENTS.SIGNIN_COMPLETED]: z.object({
      userId: z.string(),
      method: z.string(),
    }),
    [AUTH_EVENTS.SIGNIN_FAILED]: z.object({
      email: z.string(),
      reason: z.string(),
    }),
    [AUTH_EVENTS.SIGNOUT_COMPLETED]: z.object({
      userId: z.string(),
    }),
    [AUTH_EVENTS.OTP_REQUESTED]: z.object({
      email: z.string(),
    }),
    [AUTH_EVENTS.OTP_VERIFIED]: z.object({
      userId: z.string(),
      email: z.string(),
    }),
    [AUTH_EVENTS.RESET_REQUESTED]: z.object({
      email: z.string(),
    }),
    [AUTH_EVENTS.RESET_COMPLETED]: z.object({
      userId: z.string(),
      email: z.string(),
    }),
    [AUTH_EVENTS.PHONE_VERIFICATION_STARTED]: z.object({
      userId: z.string(),
      phone: z.string(),
    }),
    [AUTH_EVENTS.PHONE_VERIFIED]: z.object({
      userId: z.string(),
      phone: z.string(),
    }),
    [AUTH_EVENTS.ACCOUNT_LOCKED]: z.object({
      userId: z.string(),
      email: z.string(),
      reason: z.string(),
    }),
  });

  // ─── AUDIT EVENT SCHEMAS ─────────────────────────────────────────────────────
  // These are not in kernel
  registerEvents({
    [AUDIT_EVENTS.LOG_CREATED]: z.object({
      scopeId: z.string(),
      action: z.string(),
      resourceType: z.string(),
      resourceId: z.string().optional(),
    }),
  });

  // ─── FLAGS EVENT SCHEMAS ─────────────────────────────────────────────────────
  // These are not in kernel
  registerEvents({
    [FLAGS_EVENTS.FLAG_EVALUATED]: z.object({
      key: z.string(),
      enabled: z.boolean(),
    }),
    [FLAGS_EVENTS.OVERRIDE_SET]: z.object({
      key: z.string(),
      scopeType: z.string(),
      scopeId: z.string(),
      enabled: z.boolean(),
    }),
    [FLAGS_EVENTS.OVERRIDE_REMOVED]: z.object({
      key: z.string(),
      scopeType: z.string(),
      scopeId: z.string(),
    }),
  });

  // ─── EVENTS ALREADY IN KERNEL (DO NOT REGISTER) ─────────────────────────────
  // The following event types are already registered via registerAllEventSchemas():
  //
  // TENANT_EVENTS: tenant.created, tenant.updated, tenant.deleted,
  //   tenant.member.added, tenant.member.removed, tenant.member.role_changed,
  //   tenant.invitation.created, tenant.invitation.accepted, tenant.invitation.revoked
  //
  // BILLING_EVENTS: billing.subscription.created, billing.subscription.updated,
  //   billing.subscription.cancelled, billing.payment.succeeded, billing.payment.failed
  //
  // STORAGE_EVENTS: storage.upload.requested, storage.upload.confirmed,
  //   storage.file.deleted, storage.file.purged, storage.cleanup.orphaned, storage.cleanup.deleted
  //
  // NOTIFY_EVENTS: notify.sent, notify.read, notify.prefs_updated, notify.email_suppression_requested
  //
  // SETTINGS_EVENTS: settings.created, settings.updated, settings.deleted
  //
  // USAGE_EVENTS: usage.incremented, usage.limit_reached
  //
  // WEBHOOKS_EVENTS: webhooks.replayed, webhooks.delivered, webhooks.failed
  //
  // IDENTITY_EVENTS (partial): identity.membership.role_changed,
  //   identity.apikey.created, identity.apikey.revoked

  console.log('[events] All module event schemas registered');
}
