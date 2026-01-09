/**
 * Event Schema Registration
 *
 * Registers all domain event schemas with the kernel event system.
 * Must be called during bootstrap before any events are emitted.
 */

import { z } from 'zod';
import { registerEvents } from '@unisane/kernel';
import { CREDITS_EVENTS } from '@unisane/credits';
import { IDENTITY_EVENTS } from '@unisane/identity';

let registered = false;

/**
 * Register all domain event schemas.
 * Safe to call multiple times - only registers once.
 */
export function registerEventSchemas(): void {
  if (registered) return;
  registered = true;

  // ─── CREDITS EVENT SCHEMAS ───────────────────────────────────────────────────

  registerEvents({
    [CREDITS_EVENTS.GRANTED]: z.object({
      tenantId: z.string(),
      amount: z.number(),
      reason: z.string(),
      id: z.string(),
    }),
    [CREDITS_EVENTS.CONSUMED]: z.object({
      tenantId: z.string(),
      amount: z.number(),
      reason: z.string(),
      feature: z.string(),
    }),
    [CREDITS_EVENTS.EXPIRED]: z.object({
      tenantId: z.string(),
      amount: z.number(),
      ids: z.array(z.string()),
    }),
    [CREDITS_EVENTS.REFUNDED]: z.object({
      tenantId: z.string(),
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
      tenantId: z.string(),
      userId: z.string(),
      keyId: z.string(),
    }),
    [IDENTITY_EVENTS.API_KEY_REVOKED]: z.object({
      tenantId: z.string(),
      userId: z.string(),
      keyId: z.string(),
      keyHash: z.string().optional(),
    }),
    [IDENTITY_EVENTS.MEMBERSHIP_ROLE_CHANGED]: z.object({
      tenantId: z.string(),
      userId: z.string(),
      role: z.string().optional(),
      action: z.enum(['added', 'removed']).optional(),
    }),
  });

  console.log('[events] Domain event schemas registered');
}
