import { kv } from '@unisane/kernel';
import { KV } from '@unisane/kernel';
import { WebhooksRepo } from '../data/webhooks.repository';
import { handleStripeEvent, handleRazorpayEvent } from '../inbound';
import { isWebhookProvider } from '@unisane/kernel';
import { addSuppression } from '@unisane/notify';
import { logger } from '@unisane/kernel';

export async function recordInboundEvent(args: {
  provider: string;
  payload: unknown;
  headers: Record<string, string>;
  verified: boolean;
  idemTtlMs?: number; // default 24h
}): Promise<{ ok: true; deduped?: true }> {
  const ttl = Math.max(1000, args.idemTtlMs ?? 24 * 60 * 60 * 1000);
  let eventId: string | null = null;
  if (args.payload && typeof args.payload === 'object') {
    const idVal = (args.payload as Record<string, unknown>).id;
    eventId = typeof idVal === 'string' ? idVal : null;
  }
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
      tenantId: null,
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
          if (email) await addSuppression({ email, reason: type, provider: 'resend', tenantId: null });
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
              await addSuppression({ email, reason: nt, provider: 'ses', tenantId: null });
            }
          }
        } catch {
          // ignore parse errors
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
