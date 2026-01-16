/**
 * WEBH-003 FIX (Architecture Design Decision):
 * This module communicates with other modules via the kernel's event system.
 *
 * For email suppression (bounces, complaints), we emit `notify.email_suppression_requested`
 * events rather than directly calling the notify module. This achieves:
 *
 * 1. Loose coupling: webhooks module doesn't import notify module
 * 2. Extensibility: other modules can listen to these events
 * 3. Reliability: events can be persisted to outbox for guaranteed delivery
 * 4. Testability: event handlers can be mocked independently
 *
 * The webhooks module acts as an "adapter" that translates raw webhook payloads
 * into domain events that other modules can consume.
 */
import { kv, KV, isWebhookProvider, logger, emitTyped } from '@unisane/kernel';
import { WebhooksRepo } from '../data/webhooks.repository';
import { handleStripeEvent, handleRazorpayEvent } from '../inbound';

/**
 * WEBH-002 FIX: Provider-specific deduplication ID extraction.
 * Each provider has different ID structures:
 * - Stripe: payload.id (evt_xxx)
 * - Razorpay: payload.event (pay_xxx, order_xxx) or headers['x-razorpay-event-id']
 * - Resend: payload.webhook_id or payload.data.email_id
 * - SES: payload.MessageId (SNS message ID)
 */
function extractEventId(provider: string, payload: unknown, headers: Record<string, string>): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const p = payload as Record<string, unknown>;

  switch (provider) {
    case 'stripe':
      // Stripe uses payload.id (evt_xxx)
      return typeof p.id === 'string' ? p.id : null;

    case 'razorpay':
      // Razorpay: check header first, then payload.event field
      if (headers['x-razorpay-event-id'] && typeof headers['x-razorpay-event-id'] === 'string') {
        return headers['x-razorpay-event-id'];
      }
      // Fallback to payload fields
      if (typeof p.event === 'string') return p.event;
      if (typeof p.id === 'string') return p.id;
      return null;

    case 'resend':
      // Resend: webhook_id or nested data.email_id
      if (typeof p.webhook_id === 'string') return p.webhook_id;
      if (typeof p.id === 'string') return p.id;
      if (p.data && typeof p.data === 'object') {
        const data = p.data as Record<string, unknown>;
        if (typeof data.email_id === 'string') return data.email_id;
      }
      return null;

    case 'ses':
      // SES via SNS: MessageId is the unique identifier
      if (typeof p.MessageId === 'string') return p.MessageId;
      // Fallback to message-specific ID if present
      if (typeof p.Message === 'string') {
        try {
          const msg = JSON.parse(p.Message) as Record<string, unknown>;
          if (typeof msg.mail === 'object' && msg.mail !== null) {
            const mail = msg.mail as Record<string, unknown>;
            if (typeof mail.messageId === 'string') return mail.messageId;
          }
        } catch {
          // Ignore parse errors
        }
      }
      return null;

    default:
      // Generic fallback: try payload.id
      return typeof p.id === 'string' ? p.id : null;
  }
}

export async function recordInboundEvent(args: {
  provider: string;
  payload: unknown;
  headers: Record<string, string>;
  verified: boolean;
  idemTtlMs?: number; // default 24h
}): Promise<{ ok: true; deduped?: true }> {
  const ttl = Math.max(1000, args.idemTtlMs ?? 24 * 60 * 60 * 1000);
  // WEBH-002 FIX: Use provider-specific ID extraction
  const eventId = extractEventId(args.provider, args.payload, args.headers);
  const baseLog = logger.child({
    src: 'webhooks.recordInbound',
    provider: args.provider,
    eventId: eventId ?? undefined,
  });
  if (eventId) {
    const key = `${KV.WEBHOOK_IDEM}${args.provider}:${eventId}`;
    const ok = await kv.set(key, '1', { NX: true, PX: ttl });
    if (!ok) {
      try {
        baseLog.debug('inbound webhook deduped', { dedup: true });
      } catch {}
      return { ok: true as const, deduped: true as const };
    }
  }
  try {
    if (!isWebhookProvider(args.provider)) {
      throw new Error(`Unknown webhook provider: ${args.provider}`);
    }
    await WebhooksRepo.recordInbound({
      scopeId: null,
      provider: args.provider,
      eventId,
      status: (args.verified ? 'verified' : 'received'),
      headers: args.headers,
      payload: args.payload,
    });
    try {
      baseLog.info('inbound webhook stored', { verified: args.verified });
    } catch {}
    // Provider-specific handling
    if (args.provider === 'stripe') {
      await handleStripeEvent(args.payload);
    } else if (args.provider === 'razorpay') {
      await handleRazorpayEvent(args.payload);
    } else if (args.provider === 'resend') {
      // Minimal mapping: expect payload like { type: 'email.bounced'|'email.complained', data: { email?: string, to?: string } }
      if (args.payload && typeof args.payload === 'object') {
        const p = args.payload as Record<string, unknown>;
        const type = String(p.type ?? '');
        if (/bounced|complained/i.test(type)) {
          const data = (p.data ?? {}) as Record<string, unknown>;
          const email = (typeof data.email === 'string' ? data.email : typeof data.to === 'string' ? data.to : null);
          if (email) {
            await emitTyped('notify.email_suppression_requested', {
              email,
              reason: type,
              provider: 'resend',
              scopeId: null,
            }, 'webhooks');
          }
        }
      }
    } else if (args.provider === 'ses') {
      // SES via SNS: payload is the SNS envelope; Message is a JSON string
      if (args.payload && typeof args.payload === 'object') {
        const p = args.payload as Record<string, unknown>;
        const msgStr = typeof p.Message === 'string' ? p.Message : '';
        try {
          type SesRecipient = { emailAddress?: string };
          type SesMessage = {
            notificationType?: string;
            bounce?: { bouncedRecipients?: SesRecipient[] };
            complaint?: { complainedRecipients?: SesRecipient[] };
          };
          const m: SesMessage = msgStr ? (JSON.parse(msgStr) as SesMessage) : {};
          const nt = String(m.notificationType ?? '');
          if (/Bounce|Complaint/i.test(nt)) {
            const recipientsArr: SesRecipient[] = m.bounce?.bouncedRecipients ?? m.complaint?.complainedRecipients ?? [];
            const recipients = recipientsArr.map((r) => r.emailAddress).filter((e): e is string => typeof e === 'string');
            for (const email of recipients) {
              await emitTyped('notify.email_suppression_requested', {
                email,
                reason: nt,
                provider: 'ses',
                scopeId: null,
              }, 'webhooks');
            }
          }
        } catch (err) {
          baseLog.warn("ses webhook: failed to parse SNS message", { err });
        }
      }
    }
  } catch (e) {
    try {
      baseLog.error('inbound webhook handler failed', { err: e instanceof Error ? { name: e.name, message: e.message } : String(e) });
    } catch {}
    const code = (e as { code?: number }).code;
    if (code === 11000) return { ok: true as const, deduped: true as const };
    throw e;
  }
  return { ok: true as const };
}
