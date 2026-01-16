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
import { CIRCUIT_BREAKER_DEFAULTS, ConfigurationError, logger, redis, tryGetScopeContext } from '@unisane/kernel';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

/**
 * BIL-003 FIX: Get correlation ID from current scope context for request tracing.
 */
function getCorrelationId(): string {
  const context = tryGetScopeContext();
  return context?.requestId ?? randomUUID();
}

/**
 * STR-002 FIX: Lock key for customer ID creation
 * Used to prevent race conditions when creating Stripe customers
 *
 * C-002 FIX: Increased lock TTL and wait time to handle slow Stripe responses
 */
const CUSTOMER_LOCK_KEY = (scopeId: string) => `stripe:customer:lock:${scopeId}`;
const CUSTOMER_LOCK_TTL_MS = 30_000; // 30 second lock (C-002 FIX: increased from 10s)
const CUSTOMER_LOCK_WAIT_MS = 8_000; // C-002 FIX: Wait 8s before retry (was 500ms)
const CUSTOMER_LOCK_MAX_RETRIES = 3; // C-002 FIX: Max retries when waiting for lock

const log = logger.child({ adapter: 'stripe' });

const STRIPE_API_VERSION = '2024-06-20';
const BASE_URL = 'https://api.stripe.com';

/**
 * Zod schema for validating Stripe adapter configuration.
 * Validates at construction time to catch configuration errors early.
 */
export const ZStripeBillingAdapterConfig = z.object({
  secretKey: z.string().min(1, 'Stripe secret key is required').startsWith('sk_', 'Invalid Stripe secret key format'),
  portalReturnUrl: z.string().url('portalReturnUrl must be a valid URL'),
  findCustomerId: z.function().optional(),
  saveCustomerId: z.function().optional(),
  // STR-005 FIX: Add clearCustomerId to remove stale mappings
  clearCustomerId: z.function().optional(),
  getScopeName: z.function().optional(),
  mapPlanId: z.function().optional(),
  mapTopupPriceId: z.function().optional(),
});

export interface StripeBillingAdapterConfig {
  /** Stripe secret key */
  secretKey: string;
  /** Return URL for billing portal */
  portalReturnUrl: string;
  /** Optional: Customer ID resolver for scope mapping */
  findCustomerId?: (scopeId: string) => Promise<string | null>;
  /** Optional: Save customer ID mapping */
  saveCustomerId?: (scopeId: string, customerId: string) => Promise<void>;
  /** STR-005 FIX: Optional: Clear stale customer ID mapping */
  clearCustomerId?: (scopeId: string) => Promise<void>;
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
  // STR-005 FIX: Add clearCustomerId for stale mapping cleanup
  private readonly clearCustomerId?: (scopeId: string) => Promise<void>;
  private readonly getScopeName?: (scopeId: string) => Promise<string | null>;
  private readonly mapPlanId?: (planId: string) => string | undefined;
  private readonly mapTopupPriceId?: (amount: number, currency: string) => string | undefined;

  constructor(config: StripeBillingAdapterConfig) {
    // Validate configuration at construction time
    const result = ZStripeBillingAdapterConfig.safeParse(config);
    if (!result.success) {
      throw ConfigurationError.fromZod('stripe', result.error.issues);
    }

    this.secretKey = config.secretKey;
    this.portalReturnUrl = config.portalReturnUrl;
    this.findCustomerId = config.findCustomerId;
    this.saveCustomerId = config.saveCustomerId;
    this.clearCustomerId = config.clearCustomerId;
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
    // BIL-003 FIX: Include correlation ID for request tracing
    const correlationId = getCorrelationId();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Stripe-Version': STRIPE_API_VERSION,
      // BIL-003 FIX: Add custom header for correlation ID (for logging/debugging)
      'X-Request-Id': correlationId,
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

      // BIL-002 FIX: Handle JSON parse failures explicitly instead of silently returning {}
      let json: unknown;
      try {
        json = await res.json();
      } catch (parseError) {
        // If response was successful but body is not JSON, that's unexpected
        if (res.ok) {
          throw new Error(`Stripe returned non-JSON response for ${path}`);
        }
        // For error responses, include status in the error message
        throw new Error(`Stripe API error: ${res.status} (non-JSON response)`);
      }

      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? '';
        throw new Error(`Stripe API error: ${res.status} ${msg}`);
      }
      return json as T;
    } catch (e) {
      // BIL-001 FIX: Explicitly propagate abort errors with context
      // This ensures timeout aborts are properly communicated to callers
      if (e instanceof Error && e.name === 'AbortError') {
        const timeoutError = new Error(`Stripe request timed out after ${timeoutMs}ms: ${path}`);
        timeoutError.name = 'TimeoutError';
        timeoutError.cause = e;
        throw timeoutError;
      }
      throw e instanceof Error ? e : new Error('Stripe request failed');
    }
  }

  /**
   * STR-002 FIX: Ensure customer ID with distributed lock to prevent race conditions.
   *
   * **Race Condition Prevention:**
   * 1. First check if customer already exists (fast path)
   * 2. Acquire distributed lock before creating
   * 3. Re-check after acquiring lock (another request may have created it)
   * 4. Create customer only if still needed
   *
   * This prevents duplicate customer creation when concurrent requests
   * arrive for the same scopeId.
   */
  private async ensureCustomerId(scopeId: string): Promise<string | null> {
    // Fast path: check if customer already exists
    if (this.findCustomerId) {
      const existing = await this.findCustomerId(scopeId);
      if (existing) return existing;
    }

    // STR-002 FIX: Acquire distributed lock before creating customer
    const lockKey = CUSTOMER_LOCK_KEY(scopeId);
    const lockAcquired = await redis.set(lockKey, '1', { NX: true, PX: CUSTOMER_LOCK_TTL_MS });

    if (!lockAcquired) {
      // C-002 FIX: Another request is creating the customer - wait with proper timeout
      // Use longer wait time (~80% of lock TTL) and retry loop
      for (let retry = 0; retry < CUSTOMER_LOCK_MAX_RETRIES; retry++) {
        log.debug('ensureCustomerId: waiting for lock', { scopeId, retry });
        await new Promise((resolve) => setTimeout(resolve, CUSTOMER_LOCK_WAIT_MS));

        // Re-check after waiting
        if (this.findCustomerId) {
          const existing = await this.findCustomerId(scopeId);
          if (existing) return existing;
        }

        // Try to acquire lock again
        const retryLock = await redis.set(lockKey, '1', { NX: true, PX: CUSTOMER_LOCK_TTL_MS });
        if (retryLock) {
          log.debug('ensureCustomerId: acquired lock on retry', { scopeId, retry });
          break; // Got the lock, proceed to create
        }
      }

      // If still no customer and no lock after retries, log and proceed
      // The Stripe idempotency key will prevent duplicates as a final safeguard
      if (this.findCustomerId) {
        const existing = await this.findCustomerId(scopeId);
        if (existing) return existing;
      }
      log.debug('ensureCustomerId: lock contention resolved, proceeding', { scopeId });
    }

    // Create a minimal customer on Stripe
    try {
      // STR-002 FIX: Re-check after acquiring lock
      // Another concurrent request might have created the customer while we waited for the lock
      if (this.findCustomerId) {
        const existing = await this.findCustomerId(scopeId);
        if (existing) return existing;
      }

      const name = (await this.getScopeName?.(scopeId)) ?? `Scope ${scopeId}`;
      const customer = await this.stripeRequest<{ id: string }>('/v1/customers', {
        method: 'POST',
        body: {
          name,
          'metadata[scopeId]': scopeId,
        },
        // STR-002 FIX: Use scopeId as idempotency key to prevent Stripe duplicates
        idempotencyKey: `customer:create:${scopeId}`,
      });

      if (customer?.id && this.saveCustomerId) {
        await this.saveCustomerId(scopeId, customer.id);
      }
      return customer?.id ?? null;
    } catch (err) {
      // Log the error with proper context - the checkout will attempt to
      // create customer inline via Stripe Checkout, but this failure indicates
      // a potential issue that should be investigated.
      log.warn('ensureCustomerId failed', {
        scopeId,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return null;
    }
    // Note: Lock is NOT released - it auto-expires after TTL
    // This provides natural throttling for rapid retries
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

    // STR-006 FIX: Add custom metadata with validation
    if (args.metadata) {
      const metadataEntries = Object.entries(args.metadata);
      // Stripe allows max 50 metadata keys
      if (metadataEntries.length > 50) {
        throw new Error(`Too many metadata keys: ${metadataEntries.length} (max 50)`);
      }
      for (const [k, v] of metadataEntries) {
        // Stripe metadata key limit: 40 chars
        if (k.length > 40) {
          throw new Error(`Metadata key too long: "${k.slice(0, 20)}..." (max 40 chars)`);
        }
        // Stripe metadata value limit: 500 chars
        if (v.length > 500) {
          throw new Error(`Metadata value too long for key "${k}" (max 500 chars)`);
        }
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
        // STR-005 FIX: Clear stale mapping to prevent repeated failures
        if (this.clearCustomerId) {
          await this.clearCustomerId(args.scopeId).catch(() => {
            // Log but don't fail - best effort cleanup
          });
        }
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
    // STR-003 FIX: Validate amount is a positive integer within bounds
    const amount = parseInt(args.amountMinorStr, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive integer');
    }
    // Stripe allows amounts up to 99999999 (in minor units)
    // This is ~$1M USD, more than enough for any reasonable topup
    const MAX_AMOUNT_MINOR = 99_999_999;
    if (amount > MAX_AMOUNT_MINOR) {
      throw new Error(`Amount exceeds maximum allowed (${MAX_AMOUNT_MINOR} minor units)`);
    }
    // Validate credits is also reasonable
    if (args.credits <= 0 || !Number.isInteger(args.credits)) {
      throw new Error('Credits must be a positive integer');
    }

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Distinguish between "not found" (expected) and actual errors
      const isNotFound = /no such subscription|resource_missing/i.test(errorMessage);

      if (isNotFound) {
        log.debug('subscription not found', { subscriptionId });
      } else {
        log.error('getSubscription failed', {
          subscriptionId,
          error: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        });
      }
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

    // STR-007 FIX: Validate subscription items array before accessing
    const items = sub?.items?.data;
    if (!items || items.length === 0) {
      throw new Error('Stripe subscription has no items');
    }
    if (items.length > 1) {
      // Log warning but proceed with first item for backwards compatibility
      // Callers managing multi-item subscriptions should use Stripe API directly
      console.warn(`[billing-stripe] Subscription ${subscriptionId} has ${items.length} items, updating first item only`);
    }
    const itemId = items[0]?.id;
    if (!itemId) throw new Error('Stripe subscription item ID not found');

    const body: Record<string, string> = {
      proration_behavior: 'create_prorations',
    };

    if (args.priceId) body.price = args.priceId;
    if (args.quantity !== undefined) {
      body.quantity = String(Math.max(1, Math.trunc(args.quantity)));
    }

    // STR-004 FIX: Use deterministic idempotency key based on subscription + update content
    // This prevents duplicate updates if the same operation is retried
    const idempotencyKey = `sub-update:${subscriptionId}:${args.priceId ?? ''}:${args.quantity ?? ''}`;

    await this.stripeRequest(`/v1/subscription_items/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      body,
      idempotencyKey,
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

/**
 * M-005 FIX: Classify Stripe errors for intelligent retry behavior.
 * Retryable: Network timeouts, 5xx errors, rate limits (429)
 * Non-retryable: 4xx client errors (except 429), validation errors
 */
function classifyStripeError(error: unknown): { retryable: boolean; delayMs?: number } {
  if (!(error instanceof Error)) {
    return { retryable: false };
  }

  const message = error.message.toLowerCase();

  // Timeout errors are retryable
  if (error.name === 'TimeoutError' || message.includes('timed out')) {
    return { retryable: true, delayMs: 1000 };
  }

  // Network errors are retryable
  if (message.includes('network') || message.includes('econnreset') || message.includes('enotfound')) {
    return { retryable: true, delayMs: 500 };
  }

  // Parse status code from Stripe error messages
  const statusMatch = message.match(/stripe api error: (\d{3})/i);
  if (statusMatch && statusMatch[1]) {
    const status = parseInt(statusMatch[1], 10);

    // 429 Too Many Requests - retryable with longer delay
    if (status === 429) {
      return { retryable: true, delayMs: 2000 };
    }

    // 5xx Server errors - retryable
    if (status >= 500 && status < 600) {
      return { retryable: true, delayMs: 1000 };
    }

    // 4xx Client errors (except 429) - not retryable
    if (status >= 400 && status < 500) {
      return { retryable: false };
    }
  }

  // Default: don't retry unknown errors
  return { retryable: false };
}

export function createStripeBillingAdapter(config: StripeBillingAdapterConfig): BillingProviderAdapter {
  return createResilientProxy({
    name: 'stripe',
    primary: new StripeBillingAdapter(config),
    circuitBreaker: {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200, // Faster than default because Stripe is usually fast
      // M-005 FIX: Use error classifier for intelligent retry decisions
      shouldRetry: (error: unknown) => classifyStripeError(error).retryable,
    },
  });
}

