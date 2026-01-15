/**
 * Stripe Billing Adapter
 *
 * Implements the BillingProviderAdapter interface for Stripe payments.
 *
 * @example
 * ```typescript
 * import { StripeBillingAdapter } from '@unisane/billing-stripe';
 *
 * const adapter = new StripeBillingAdapter({
 *   secretKey: process.env.STRIPE_SECRET_KEY!,
 *   portalReturnUrl: 'https://app.example.com/billing',
 * });
 *
 * // Create checkout session
 * const { url } = await adapter.createCheckout({
 *   scopeId: 'tenant_123',
 *   planId: 'price_xxx',
 *   successUrl: 'https://app.example.com/success',
 *   cancelUrl: 'https://app.example.com/cancel',
 * });
 * ```
 */

import type { BillingProviderAdapter, CheckoutSession, PortalSession, Subscription } from '@unisane/kernel';
import { randomUUID } from 'node:crypto';

const STRIPE_API_VERSION = '2024-06-20';
const BASE_URL = 'https://api.stripe.com';

export interface StripeBillingAdapterConfig {
  /** Stripe secret key */
  secretKey: string;
  /** Return URL for billing portal */
  portalReturnUrl: string;
  /** Optional: Customer ID resolver for scope mapping */
  findCustomerId?: (scopeId: string) => Promise<string | null>;
  /** Optional: Save customer ID mapping */
  saveCustomerId?: (scopeId: string, customerId: string) => Promise<void>;
  /** Optional: Get scope name for customer creation */
  getScopeName?: (scopeId: string) => Promise<string | null>;
  /** Optional: Map plan IDs to Stripe price IDs */
  mapPlanId?: (planId: string) => string | undefined;
  /** Optional: Map topup amount to Stripe price ID */
  mapTopupPriceId?: (amount: number, currency: string) => string | undefined;
}

function form(data: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) params.append(k, v);
  return params.toString();
}


/**
 * Stripe implementation of the BillingProviderAdapter interface.
 */
export class StripeBillingAdapter implements BillingProviderAdapter {
  readonly name = 'stripe' as const;

  private readonly secretKey: string;
  private readonly portalReturnUrl: string;
  private readonly findCustomerId?: (scopeId: string) => Promise<string | null>;
  private readonly saveCustomerId?: (scopeId: string, customerId: string) => Promise<void>;
  private readonly getScopeName?: (scopeId: string) => Promise<string | null>;
  private readonly mapPlanId?: (planId: string) => string | undefined;
  private readonly mapTopupPriceId?: (amount: number, currency: string) => string | undefined;

  constructor(config: StripeBillingAdapterConfig) {
    if (!config.secretKey) {
      throw new Error('StripeBillingAdapter: config.secretKey is required');
    }
    this.secretKey = config.secretKey;
    this.portalReturnUrl = config.portalReturnUrl;
    this.findCustomerId = config.findCustomerId;
    this.saveCustomerId = config.saveCustomerId;
    this.getScopeName = config.getScopeName;
    this.mapPlanId = config.mapPlanId;
    this.mapTopupPriceId = config.mapTopupPriceId;
  }

  private async stripeRequest<T = unknown>(
    path: string,
    init: {
      method?: 'GET' | 'POST' | 'DELETE';
      body?: Record<string, string>;
      idempotencyKey?: string;
      timeoutMs?: number;
    } = {}
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const method = init.method ?? 'POST';
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Stripe-Version': STRIPE_API_VERSION,
    };
    if (method !== 'GET') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      headers['Idempotency-Key'] = init.idempotencyKey ?? randomUUID();
    }

    const timeoutMs = Math.max(1000, init.timeoutMs ?? 10_000);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    
    try {
      const res = await fetch(url, {
        method,
        headers,
        ...(init.body ? { body: form(init.body) } : {}),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));

      const json = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? '';
        throw new Error(`Stripe API error: ${res.status} ${msg}`);
      }
      return json as T;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Stripe request failed');
    }
  }

  private async ensureCustomerId(scopeId: string): Promise<string | null> {
    if (this.findCustomerId) {
      const existing = await this.findCustomerId(scopeId);
      if (existing) return existing;
    }

    // Create a minimal customer on Stripe
    try {
      const name = (await this.getScopeName?.(scopeId)) ?? `Scope ${scopeId}`;
      const customer = await this.stripeRequest<{ id: string }>('/v1/customers', {
        method: 'POST',
        body: {
          name,
          'metadata[scopeId]': scopeId,
        },
      });

      if (customer?.id && this.saveCustomerId) {
        await this.saveCustomerId(scopeId, customer.id);
      }
      return customer?.id ?? null;
    } catch {
      return null;
    }
  }

  async createCheckoutSession(args: {
    scopeId: string;
    customerId?: string;
    priceId: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
    mode?: 'subscription' | 'payment';
    metadata?: Record<string, string>;
  }): Promise<CheckoutSession> {
    // Note: customerId resolution happens here, which performs a request.
    // If ensureCustomerId fails, the circuit breaker will catch it if it bubbles up.
    // ensureCustomerId swallows errors and returns null, which might bypass the breaker for that specific call,
    // but the subsequent checkout session creation would fail and trigger the breaker.
    const customerId = args.customerId ?? (await this.ensureCustomerId(args.scopeId));

    const payload: Record<string, string> = {
      mode: args.mode ?? 'subscription',
      'line_items[0][price]': args.priceId,
      'line_items[0][quantity]': String(args.quantity ?? 1),
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      'metadata[scopeId]': args.scopeId,
    };

    if (customerId) payload.customer = customerId;

    // Add custom metadata
    if (args.metadata) {
      for (const [k, v] of Object.entries(args.metadata)) {
        payload[`metadata[${k}]`] = v;
      }
    }

    type SessionOut = { id: string; url: string; customer?: string };
    let session: SessionOut;

    try {
      session = await this.stripeRequest<SessionOut>('/v1/checkout/sessions', {
        method: 'POST',
        body: payload,
      });
    } catch (e) {
      const msg = (e as Error)?.message ?? '';
      // Handle stale customer mappings - Logic preserved
      // If we get "No such customer", we try WITHOUT the customer ID. 
      // This is a business logic retry, not a network retry, so it stays.
      if (payload.customer && /No such customer/i.test(msg)) {
        delete payload.customer;
        session = await this.stripeRequest<SessionOut>('/v1/checkout/sessions', {
          method: 'POST',
          body: payload,
        });
        if (session.customer && this.saveCustomerId) {
          await this.saveCustomerId(args.scopeId, session.customer);
        }
      } else {
        throw e;
      }
    }

    return { id: session.id, url: session.url };
  }

  async createCheckout(args: {
    scopeId: string;
    planId?: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    const priceId = args.planId
      ? (this.mapPlanId?.(args.planId) ?? args.planId)
      : '';

    if (!priceId) {
      throw new Error('Plan ID is required for Stripe checkout');
    }

    return this.createCheckoutSession({
      scopeId: args.scopeId,
      priceId,
      quantity: args.quantity,
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      mode: 'subscription',
    });
  }

  async createTopupCheckout(args: {
    scopeId: string;
    amountMinorStr: string;
    currency: string;
    credits: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    const amount = parseInt(args.amountMinorStr, 10);
    const mappedPriceId = this.mapTopupPriceId?.(amount / 100, args.currency);

    let payload: Record<string, string>;

    if (mappedPriceId) {
      payload = {
        mode: 'payment',
        'line_items[0][price]': mappedPriceId,
        'line_items[0][quantity]': '1',
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        'metadata[scopeId]': args.scopeId,
        'metadata[credits]': String(args.credits),
      };
    } else {
      payload = {
        mode: 'payment',
        'line_items[0][price_data][currency]': args.currency,
        'line_items[0][price_data][product_data][name]': 'Credits Top-up',
        'line_items[0][price_data][unit_amount]': args.amountMinorStr,
        'line_items[0][quantity]': '1',
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        'metadata[scopeId]': args.scopeId,
        'metadata[credits]': String(args.credits),
      };
    }

    const session = await this.stripeRequest<{ id: string; url: string }>(
      '/v1/checkout/sessions',
      { method: 'POST', body: payload }
    );

    return { id: session.id, url: session.url };
  }

  async createPortalSession(args: {
    customerId: string;
    returnUrl: string;
  }): Promise<PortalSession> {
    const session = await this.stripeRequest<{ url: string }>(
      '/v1/billing_portal/sessions',
      {
        method: 'POST',
        body: {
          customer: args.customerId,
          return_url: args.returnUrl,
        },
      }
    );

    return { url: session.url };
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const sub = await this.stripeRequest<{
        id: string;
        status: string;
        current_period_end?: number;
        cancel_at_period_end?: boolean;
      }>(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'GET',
      });

      return {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    } catch {
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<void> {
    if (immediately) {
      await this.stripeRequest(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'DELETE',
      });
    } else {
      await this.stripeRequest(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'POST',
        body: { cancel_at_period_end: 'true' },
      });
    }
  }

  async updateSubscription(
    subscriptionId: string,
    args: { priceId?: string; quantity?: number }
  ): Promise<Subscription> {
    // Fetch subscription to get item ID
    const sub = await this.stripeRequest<{
      id: string;
      status: string;
      current_period_end?: number;
      items?: { data?: Array<{ id?: string }> };
    }>(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: 'GET',
    });

    const itemId = sub?.items?.data?.[0]?.id;
    if (!itemId) throw new Error('Stripe subscription item not found');

    const body: Record<string, string> = {
      proration_behavior: 'create_prorations',
    };

    if (args.priceId) body.price = args.priceId;
    if (args.quantity !== undefined) {
      body.quantity = String(Math.max(1, Math.trunc(args.quantity)));
    }

    await this.stripeRequest(`/v1/subscription_items/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      body,
    });

    return {
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : undefined,
    };
  }

  async updateSubscriptionPlan(args: {
    scopeId: string;
    providerSubId: string;
    planId?: string;
  }): Promise<Subscription> {
    const priceId = args.planId
      ? (this.mapPlanId?.(args.planId) ?? args.planId)
      : undefined;

    if (!priceId) {
      throw new Error('Plan ID is required');
    }

    return this.updateSubscription(args.providerSubId, { priceId });
  }

  async updateSubscriptionQuantity(args: {
    scopeId: string;
    providerSubId: string;
    quantity: number;
  }): Promise<Subscription> {
    return this.updateSubscription(args.providerSubId, { quantity: args.quantity });
  }

  async refundPayment(args: {
    scopeId: string;
    providerPaymentId: string;
    amountMinorStr?: string;
  }): Promise<void> {
    const body: Record<string, string> = {
      payment_intent: args.providerPaymentId,
    };

    if (args.amountMinorStr) {
      body.amount = args.amountMinorStr;
    }

    const idem = `refund:${args.scopeId}:${args.providerPaymentId}:${args.amountMinorStr ?? 'full'}`;

    await this.stripeRequest('/v1/refunds', {
      method: 'POST',
      body,
      idempotencyKey: idem,
    });
  }
}

/**
 * Create a new Stripe billing adapter.
 * Wrapped with resilience (circuit breaker, retry).
 */
import { createResilientProxy } from '@unisane/kernel';

export function createStripeBillingAdapter(config: StripeBillingAdapterConfig): BillingProviderAdapter {
  return createResilientProxy({
    name: 'stripe',
    primary: new StripeBillingAdapter(config),
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 30000,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200, // Faster than default because Stripe is usually fast
    },
  });
}

