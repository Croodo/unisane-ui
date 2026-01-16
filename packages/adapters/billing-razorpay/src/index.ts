/**
 * Razorpay Billing Adapter
 *
 * Implements the BillingProviderAdapter interface for Razorpay payments.
 * Optimized for Indian market with INR support.
 *
 * @example
 * ```typescript
 * import { RazorpayBillingAdapter } from '@unisane/billing-razorpay';
 *
 * const adapter = new RazorpayBillingAdapter({
 *   keyId: process.env.RAZORPAY_KEY_ID!,
 *   keySecret: process.env.RAZORPAY_KEY_SECRET!,
 * });
 *
 * // Create subscription checkout
 * const { url } = await adapter.createCheckout({
 *   scopeId: 'tenant_123',
 *   planId: 'plan_xxx',
 *   successUrl: 'https://app.example.com/success',
 *   cancelUrl: 'https://app.example.com/cancel',
 * });
 * ```
 */

import type { BillingProviderAdapter, CheckoutSession, PortalSession, Subscription } from '@unisane/kernel';
import { CIRCUIT_BREAKER_DEFAULTS, ConfigurationError, tryGetScopeContext } from '@unisane/kernel';
import { z } from 'zod';

const BASE_URL = 'https://api.razorpay.com/v1';

/**
 * BIL-003 FIX: Get correlation ID from current scope context for request tracing.
 */
function getCorrelationId(): string {
  const context = tryGetScopeContext();
  return context?.requestId ?? crypto.randomUUID();
}

/**
 * Zod schema for validating Razorpay adapter configuration.
 * Validates at construction time to catch configuration errors early.
 *
 * Razorpay Key ID format: starts with 'rzp_live_' or 'rzp_test_'
 * Key Secret: non-empty string
 */
export const ZRazorpayBillingAdapterConfig = z.object({
  keyId: z
    .string()
    .min(1, 'Razorpay key ID is required')
    .refine(
      (val: string) => val.startsWith('rzp_live_') || val.startsWith('rzp_test_'),
      'Razorpay key ID must start with "rzp_live_" or "rzp_test_"'
    ),
  keySecret: z.string().min(1, 'Razorpay key secret is required'),
  mapPlanId: z.function().optional(),
});

export interface RazorpayBillingAdapterConfig {
  /** Razorpay Key ID (must start with rzp_live_ or rzp_test_) */
  keyId: string;
  /** Razorpay Key Secret */
  keySecret: string;
  /** Optional: Map plan IDs to Razorpay plan IDs */
  mapPlanId?: (planId: string) => string | undefined;
}



/**
 * Razorpay implementation of the BillingProviderAdapter interface.
 *
 * **Supported Operations:**
 * - Subscriptions: Full support via Razorpay Subscriptions API
 * - One-time payments: Use `createTopupCheckout()` (via Payment Links API)
 *
 * **Limitations:**
 * - `createCheckoutSession()` only supports `mode: 'subscription'`
 * - `createCheckoutSession()` with `mode: 'payment'` will throw an error
 *   (Razorpay Payment Links require an explicit amount, not a price ID)
 * - No customer billing portal (Razorpay doesn't offer this feature)
 *
 * For one-time payments, use `createTopupCheckout()` which accepts the amount directly.
 */
export class RazorpayBillingAdapter implements BillingProviderAdapter {
  readonly name = 'razorpay' as const;

  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly mapPlanId?: (planId: string) => string | undefined;

  constructor(config: RazorpayBillingAdapterConfig) {
    // Validate configuration at construction time
    const result = ZRazorpayBillingAdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('razorpay', result.error.issues);
    }

    this.keyId = config.keyId;
    this.keySecret = config.keySecret;
    this.mapPlanId = config.mapPlanId;
  }

  private authHeader(): string {
    const token = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    return `Basic ${token}`;
  }

  /**
   * RZP-002 FIX: Generate idempotency key for POST operations.
   * Uses crypto.randomUUID() prefixed with context for traceability.
   * Razorpay idempotency keys must be unique per request intent.
   */
  private generateIdempotencyKey(context: string): string {
    return `${context}_${crypto.randomUUID()}`;
  }

  private async rzpRequest<T = unknown>(
    path: string,
    init: { method?: string; body?: unknown; timeoutMs?: number; idempotencyKey?: string } = {}
  ): Promise<T> {
    const timeoutMs = Math.max(1000, init.timeoutMs ?? 10_000);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    // BIL-003 FIX: Include correlation ID for request tracing
    const correlationId = getCorrelationId();
    // RZP-002 FIX: Include idempotency key header for POST requests
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: this.authHeader(),
      // BIL-003 FIX: Add custom header for correlation ID (for logging/debugging)
      'X-Request-Id': correlationId,
    };

    if (init.idempotencyKey) {
      headers['X-Idempotency-Key'] = init.idempotencyKey;
    }

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: init.method ?? 'GET',
        headers,
        ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));

      // BIL-002 FIX: Handle JSON parse failures explicitly instead of silently returning {}
      type RazorpayError = { error?: { description?: string } };
      let json: unknown;
      try {
        json = await res.json();
      } catch (parseError) {
        // If response was successful but body is not JSON, that's unexpected
        if (res.ok) {
          throw new Error(`Razorpay returned non-JSON response for ${path}`);
        }
        // For error responses, include status in the error message
        throw new Error(`Razorpay API error: ${res.status} (non-JSON response)`);
      }

      if (!res.ok) {
        const err = json as RazorpayError;
        const msg = err.error?.description ?? `Razorpay ${res.status}`;
        throw new Error(msg);
      }
      return json as T;
    } catch (e) {
      // BIL-001 FIX: Explicitly propagate abort errors with context
      // This ensures timeout aborts are properly communicated to callers
      if (e instanceof Error && e.name === 'AbortError') {
        const timeoutError = new Error(`Razorpay request timed out after ${timeoutMs}ms: ${path}`);
        timeoutError.name = 'TimeoutError';
        timeoutError.cause = e;
        throw timeoutError;
      }
      throw e instanceof Error ? e : new Error('Razorpay request failed');
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
    if (args.mode === 'payment') {
      // Razorpay payment links require an explicit amount, but createCheckoutSession
      // only receives a priceId (which in Stripe contains the amount, but Razorpay
      // doesn't have equivalent price objects for one-time payments).
      //
      // For one-time payments with Razorpay, use createTopupCheckout() instead,
      // which accepts the amount directly.
      throw new Error(
        'Razorpay createCheckoutSession does not support payment mode. ' +
        'Use createTopupCheckout() for one-time payments with Razorpay, ' +
        'or use Stripe for payment mode checkout sessions.'
      );
    }

    // Create subscription
    const payload = {
      plan_id: args.priceId,
      total_count: 1,
      quantity: args.quantity ?? 1,
      customer_notify: 1,
      notes: {
        scopeId: args.scopeId,
        ...args.metadata,
      },
    };

    // RZP-002 FIX: Add idempotency key for subscription creation
    const sub = await this.rzpRequest<{ id: string; short_url?: string }>(
      '/subscriptions',
      {
        method: 'POST',
        body: payload,
        idempotencyKey: this.generateIdempotencyKey(`sub_${args.scopeId}`),
      }
    );

    return {
      id: sub.id,
      url: sub.short_url ?? args.successUrl,
    };
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
      throw new Error('Plan ID is required for Razorpay checkout');
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

  private async createPaymentLink(input: {
    scopeId: string;
    amount: number;
    currency: string;
    description?: string;
    successUrl: string;
    credits?: number;
  }): Promise<CheckoutSession> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error('Invalid amount');
    }

    const payload = {
      amount: input.amount,
      currency: input.currency,
      description: input.description ?? 'Payment',
      callback_url: input.successUrl,
      callback_method: 'get',
      notes: {
        scopeId: input.scopeId,
        ...(input.credits !== undefined ? { credits: String(input.credits) } : {}),
      },
    };

    // RZP-002 FIX: Add idempotency key for payment link creation
    const pl = await this.rzpRequest<{ id: string; short_url?: string }>(
      '/payment_links',
      {
        method: 'POST',
        body: payload,
        idempotencyKey: this.generateIdempotencyKey(`plink_${input.scopeId}`),
      }
    );

    return {
      id: pl.id,
      url: pl.short_url ?? input.successUrl,
    };
  }

  async createTopupCheckout(args: {
    scopeId: string;
    amountMinorStr: string;
    currency: string;
    credits: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    // RZP-005 FIX: Validate amount is a positive integer within bounds
    const amount = parseInt(args.amountMinorStr, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive integer');
    }
    // Razorpay allows amounts up to 50,000,000 paise (500,000 INR)
    // For international, limit to reasonable topup amounts
    const MAX_AMOUNT_MINOR = 50_000_000;
    if (amount > MAX_AMOUNT_MINOR) {
      throw new Error(`Amount exceeds maximum allowed (${MAX_AMOUNT_MINOR} minor units)`);
    }
    // Validate credits is also reasonable
    if (args.credits <= 0 || !Number.isInteger(args.credits)) {
      throw new Error('Credits must be a positive integer');
    }

    return this.createPaymentLink({
      scopeId: args.scopeId,
      amount,
      currency: args.currency,
      description: `Credits top-up (${args.credits})`,
      successUrl: args.successUrl,
      credits: args.credits,
    });
  }

  async createPortalSession(args: {
    customerId: string;
    returnUrl: string;
  }): Promise<PortalSession> {
    // Razorpay does not offer a customer billing portal like Stripe
    // Return a fallback URL that redirects back to the app's billing page
    return {
      url: args.returnUrl,
    };
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const sub = await this.rzpRequest<{
        id: string;
        status: string;
        current_end?: number;
        ended_at?: number;
      }>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);

      return {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_end
          ? new Date(sub.current_end * 1000)
          : undefined,
      };
    } catch (err) {
      // RZP-003 FIX: Only return null for "not found" errors, propagate others
      const msg = (err as Error)?.message ?? '';
      // Razorpay returns 404 or "not found" for missing subscriptions
      if (/not found|404/i.test(msg)) {
        return null;
      }
      // Propagate network errors, auth errors, etc.
      throw err;
    }
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<void> {
    // RZP-002 FIX: Add idempotency key for subscription cancellation
    await this.rzpRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
      method: 'POST',
      body: { cancel_at_cycle_end: !immediately },
      idempotencyKey: this.generateIdempotencyKey(`cancel_${subscriptionId}`),
    });
  }

  async updateSubscription(
    subscriptionId: string,
    args: { priceId?: string; quantity?: number }
  ): Promise<Subscription> {
    const body: Record<string, unknown> = {};

    if (args.quantity !== undefined) {
      body.quantity = Math.max(1, Math.trunc(args.quantity));
    }

    if (args.priceId) {
      body.plan_id = args.priceId;
    }

    // RZP-002 FIX: Add idempotency key for subscription update
    await this.rzpRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: 'POST',
      body,
      idempotencyKey: this.generateIdempotencyKey(`update_${subscriptionId}`),
    });

    const sub = await this.getSubscription(subscriptionId);
    if (!sub) throw new Error('Failed to fetch updated subscription');

    return sub;
  }

  async updateSubscriptionPlan(args: {
    scopeId: string;
    providerSubId: string;
    planId?: string;
  }): Promise<Subscription> {
    // Use the existing updateSubscription method with plan_id
    if (!args.planId) {
      // If no planId provided, just return the current subscription
      const sub = await this.getSubscription(args.providerSubId);
      if (!sub) throw new Error('Subscription not found');
      return sub;
    }

    // Map the planId if a mapper is configured
    const mappedPlanId = this.mapPlanId?.(args.planId) ?? args.planId;

    return this.updateSubscription(args.providerSubId, { priceId: mappedPlanId });
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
    const body: Record<string, unknown> = {};

    if (args.amountMinorStr) {
      body.amount = parseInt(args.amountMinorStr, 10);
    }

    // RZP-002 FIX: Add idempotency key for refund operation
    await this.rzpRequest(
      `/payments/${encodeURIComponent(args.providerPaymentId)}/refund`,
      {
        method: 'POST',
        body,
        idempotencyKey: this.generateIdempotencyKey(`refund_${args.providerPaymentId}`),
      }
    );
  }
}

/**
 * Create a new Razorpay billing adapter.
 * Wrapped with resilience (circuit breaker, retry).
 */
import { createResilientProxy } from '@unisane/kernel';

export function createRazorpayBillingAdapter(config: RazorpayBillingAdapterConfig): BillingProviderAdapter {
  return createResilientProxy({
    name: 'razorpay',
    primary: new RazorpayBillingAdapter(config),
    circuitBreaker: {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 500,
    },
  });
}

