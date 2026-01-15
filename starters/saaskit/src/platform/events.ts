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
import { TENANT_EVENTS } from '@unisane/tenants';
import { AUTH_EVENTS } from '@unisane/auth';
import { BILLING_EVENTS } from '@unisane/billing';
import { STORAGE_EVENTS } from '@unisane/storage';
import { NOTIFY_EVENTS } from '@unisane/notify';
import { AUDIT_EVENTS } from '@unisane/audit';
import { FLAGS_EVENTS } from '@unisane/flags';
import { SETTINGS_EVENTS } from '@unisane/settings';
import { USAGE_EVENTS } from '@unisane/usage';
import { WEBHOOKS_EVENTS } from '@unisane/webhooks';

let registered = false;

/**
 * Register all domain event schemas.
 * Safe to call multiple times - only registers once.
 *
 * This function:
 * 1. Registers core kernel event schemas (tenant.*, storage.*, credits.*, billing webhook events)
 * 2. Registers additional module-specific event schemas
 */
export async function registerEventSchemas(): Promise<void> {
  if (registered) return;
  registered = true;

  // ─── KERNEL CORE EVENT SCHEMAS ──────────────────────────────────────────────
  // Registers EventSchemas and BillingEventSchemas from kernel
  await registerAllEventSchemas();
  console.log('[events] Kernel core event schemas registered');

  // ─── CREDITS EVENT SCHEMAS ───────────────────────────────────────────────────
  // Note: Core credits events (credits.granted, credits.consumed, credits.expired) are in kernel EventSchemas
  // Only register the refunded event which is not in kernel
  registerEvents({
    [CREDITS_EVENTS.REFUNDED]: z.object({
      scopeId: z.string(),
      amount: z.number(),
      reason: z.string(),
      id: z.string(),
    }),
  });

  // ─── IDENTITY EVENT SCHEMAS ──────────────────────────────────────────────────
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
    [IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
      role: z.string().optional(),
      action: z.enum(['added', 'removed']).optional(),
    }),
  });

  // ─── TENANT EVENT SCHEMAS ────────────────────────────────────────────────────
  // Note: Core tenant events (tenant.created, tenant.deleted) are in kernel EventSchemas
  registerEvents({
    [TENANT_EVENTS.UPDATED]: z.object({
      scopeId: z.string(),
      name: z.string().optional(),
      slug: z.string().optional(),
    }),
    [TENANT_EVENTS.MEMBER_ADDED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
      role: z.string(),
    }),
    [TENANT_EVENTS.MEMBER_REMOVED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
    }),
    [TENANT_EVENTS.MEMBER_ROLE_CHANGED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
      oldRole: z.string().optional(),
      newRole: z.string(),
    }),
    [TENANT_EVENTS.INVITATION_CREATED]: z.object({
      scopeId: z.string(),
      email: z.string(),
      role: z.string(),
    }),
    [TENANT_EVENTS.INVITATION_ACCEPTED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
      email: z.string(),
    }),
    [TENANT_EVENTS.INVITATION_REVOKED]: z.object({
      scopeId: z.string(),
      email: z.string(),
    }),
  });

  // ─── AUTH EVENT SCHEMAS ──────────────────────────────────────────────────────
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

  // ─── BILLING EVENT SCHEMAS ───────────────────────────────────────────────────
  // Note: Webhook events (webhook.stripe.*, webhook.razorpay.*) are in kernel BillingEventSchemas
  registerEvents({
    [BILLING_EVENTS.SUBSCRIPTION_CREATED]: z.object({
      scopeId: z.string(),
      planId: z.string(),
      provider: z.string(),
    }),
    [BILLING_EVENTS.SUBSCRIPTION_UPDATED]: z.object({
      scopeId: z.string(),
      planId: z.string(),
      status: z.string(),
    }),
    [BILLING_EVENTS.SUBSCRIPTION_CANCELLED]: z.object({
      scopeId: z.string(),
      reason: z.string().optional(),
    }),
    [BILLING_EVENTS.PAYMENT_SUCCEEDED]: z.object({
      scopeId: z.string(),
      amount: z.number(),
      currency: z.string(),
    }),
    [BILLING_EVENTS.PAYMENT_FAILED]: z.object({
      scopeId: z.string(),
      amount: z.number(),
      currency: z.string(),
      reason: z.string().optional(),
    }),
    [BILLING_EVENTS.REFUND_ISSUED]: z.object({
      scopeId: z.string(),
      amount: z.number(),
      currency: z.string(),
      reason: z.string().optional(),
    }),
  });

  // ─── STORAGE EVENT SCHEMAS ───────────────────────────────────────────────────
  // Note: Core storage events (storage.upload.requested, storage.upload.confirmed) are in kernel
  registerEvents({
    [STORAGE_EVENTS.FILE_DELETED]: z.object({
      scopeId: z.string(),
      fileId: z.string(),
      key: z.string(),
    }),
    [STORAGE_EVENTS.CLEANUP_DELETED]: z.object({
      orphanedCount: z.number(),
      deletedCount: z.number(),
    }),
  });

  // ─── NOTIFY EVENT SCHEMAS ────────────────────────────────────────────────────
  registerEvents({
    [NOTIFY_EVENTS.SENT]: z.object({
      scopeId: z.string().optional(),
      to: z.string(),
      template: z.string().optional(),
    }),
    [NOTIFY_EVENTS.FAILED]: z.object({
      scopeId: z.string().optional(),
      to: z.string(),
      error: z.string(),
    }),
    [NOTIFY_EVENTS.READ]: z.object({
      scopeId: z.string(),
      userId: z.string(),
      notificationId: z.string(),
    }),
    [NOTIFY_EVENTS.PREFS_UPDATED]: z.object({
      scopeId: z.string(),
      userId: z.string(),
    }),
  });

  // ─── AUDIT EVENT SCHEMAS ─────────────────────────────────────────────────────
  registerEvents({
    [AUDIT_EVENTS.LOG_CREATED]: z.object({
      scopeId: z.string(),
      action: z.string(),
      resourceType: z.string(),
      resourceId: z.string().optional(),
    }),
  });

  // ─── FLAGS EVENT SCHEMAS ─────────────────────────────────────────────────────
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

  // ─── SETTINGS EVENT SCHEMAS ──────────────────────────────────────────────────
  registerEvents({
    [SETTINGS_EVENTS.UPDATED]: z.object({
      ns: z.string(),
      key: z.string(),
      scopeId: z.string().nullable(),
    }),
    [SETTINGS_EVENTS.DELETED]: z.object({
      ns: z.string(),
      key: z.string(),
      scopeId: z.string().nullable(),
    }),
  });

  // ─── USAGE EVENT SCHEMAS ─────────────────────────────────────────────────────
  registerEvents({
    [USAGE_EVENTS.INCREMENTED]: z.object({
      scopeId: z.string(),
      feature: z.string(),
      amount: z.number(),
    }),
    [USAGE_EVENTS.LIMIT_REACHED]: z.object({
      scopeId: z.string(),
      feature: z.string(),
      limit: z.number(),
      current: z.number(),
    }),
  });

  // ─── WEBHOOKS EVENT SCHEMAS ──────────────────────────────────────────────────
  registerEvents({
    [WEBHOOKS_EVENTS.DELIVERED]: z.object({
      scopeId: z.string(),
      url: z.string(),
      eventType: z.string(),
    }),
    [WEBHOOKS_EVENTS.FAILED]: z.object({
      scopeId: z.string(),
      url: z.string(),
      eventType: z.string(),
      error: z.string(),
    }),
    [WEBHOOKS_EVENTS.REPLAYED]: z.object({
      scopeId: z.string(),
      eventId: z.string(),
      target: z.string(),
    }),
  });

  console.log('[events] All module event schemas registered');
}
