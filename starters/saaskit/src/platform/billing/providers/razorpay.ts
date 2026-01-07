import { getEnv } from '@unisane/kernel';
import type { BillingProvider, CheckoutArgs } from './index';

const BASE_URL = 'https://api.razorpay.com/v1';

function authHeader() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getEnv();
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error('RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not set');
  const token = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${token}`;
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function rzp<T = unknown>(path: string, init?: { method?: string; body?: unknown; timeoutMs?: number }): Promise<T> {
  const maxAttempts = 3;
  let lastErr: unknown;
  const timeoutMs = Math.max(1000, init?.timeoutMs ?? 10_000);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${BASE_URL}${path}`, {
        method: init?.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader(),
        },
        ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));
      type RazorpayError = { error?: { description?: string } };
      const json = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const err = json as RazorpayError;
        const msg = err.error?.description ?? `Razorpay ${res.status}`;
        if (res.status === 429 || res.status >= 500) {
          const backoff = 200 * Math.pow(2, i) + Math.floor(Math.random() * 100);
          await sleep(backoff);
          continue;
        }
        throw new Error(msg);
      }
      return json as T;
    } catch (e) {
      lastErr = e;
      const backoff = 200 * Math.pow(2, i) + Math.floor(Math.random() * 100);
      await sleep(backoff);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Razorpay request failed');
}

async function createSubscription(args: CheckoutArgs): Promise<{ url: string }> {
  // Assumes args.planId corresponds to a Razorpay plan_id; manage mapping at config if needed.
  const payload = {
    plan_id: args.planId,
    total_count: 1,
    quantity: args.quantity ?? 1,
    customer_notify: 1,
    // Optionally set expire_by or start_at if needed
    notes: { tenantId: args.tenantId },
  } as const;
  const sub = await rzp<{ id: string; short_url?: string }>(`/subscriptions`, { method: 'POST', body: payload });
  const url = sub.short_url || args.successUrl;
  return { url };
}

async function createPaymentLink(input: {
  tenantId: string;
  amountMinorStr: string;
  currency: string;
  description?: string;
  credits: number;
  successUrl: string;
}): Promise<{ url: string }> {
  const amount = Number.parseInt(input.amountMinorStr, 10);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid amount');
  const payload = {
    amount,
    currency: input.currency,
    description: input.description ?? `Top‑up credits (${input.credits})`,
    // Callback is optional; we rely on webhooks for finalization
    callback_url: input.successUrl,
    callback_method: 'get',
    notes: { tenantId: input.tenantId, credits: String(input.credits) },
  } as const;
  const pl = await rzp<{ id: string; short_url?: string }>(`/payment_links`, { method: 'POST', body: payload });
  const url = pl.short_url ?? input.successUrl;
  return { url };
}

export const razorpayProvider: BillingProvider = {
  async createCheckout(args) {
    return createSubscription(args);
  },
  async portalUrl() {
    // Razorpay does not offer a general customer billing portal akin to Stripe.
    // Link to a tenant-facing billing page in your app instead.
    throw new Error('Razorpay customer portal is not supported');
  },
  async refundPayment(args) {
    // Partial refund if amount is provided
    const body = args as { amountMinorStr?: string };
    const refundBody = body.amountMinorStr ? { amount: Number.parseInt(body.amountMinorStr, 10) } : {};
    await rzp(`/payments/${encodeURIComponent(args.providerPaymentId)}/refund`, { method: 'POST', body: refundBody });
    return { ok: true as const };
  },
  async cancelSubscription(args) {
    await rzp(`/subscriptions/${encodeURIComponent(args.providerSubId)}/cancel`, {
      method: 'POST',
      body: { cancel_at_cycle_end: Boolean(args.atPeriodEnd) },
    });
    return { ok: true as const };
  },
  async createTopupCheckout(args) {
    return createPaymentLink({
      tenantId: args.tenantId,
      amountMinorStr: args.amountMinorStr,
      currency: args.currency,
      description: `Credits top‑up (${args.credits})`,
      credits: args.credits,
      successUrl: args.successUrl,
    });
  },
  async updateSubscriptionQuantity(args) {
    await rzp(`/subscriptions/${encodeURIComponent(args.providerSubId)}`, {
      method: 'POST',
      body: { quantity: Math.max(1, Math.trunc(args.quantity)) },
    });
    return { ok: true as const };
  },
  async updateSubscriptionPlan(args) {
    // Plan changes for Razorpay subscriptions are not implemented yet.
    // For now, handle upgrades/downgrades via your app's billing UI
    // (e.g. cancel + recreate subscription) instead of this helper.
    void args;
    throw new Error('Razorpay subscription plan changes are not implemented. Use app-side flows instead.');
  },
};
