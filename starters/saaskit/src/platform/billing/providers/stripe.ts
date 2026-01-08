import type { BillingProvider, CheckoutArgs } from "./index";
import { TenantIntegrationsService } from "@unisane/billing";
import { readTenant } from "@unisane/tenants";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/src/shared/env";
import { parseMinorStr, toMajorNumberCurrency } from "@/src/shared/money";
import { mapTopupPriceIdForProvider } from "@/src/platform/billing/topupMap";

const STRIPE_API_VERSION = "2024-06-20";

function form(data: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) params.append(k, v);
  return params.toString();
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function stripeRequest<T = unknown>(
  path: string,
  init: {
    method?: "GET" | "POST" | "DELETE";
    body?: Record<string, string>;
    idempotencyKey?: string;
    timeoutMs?: number;
  }
): Promise<T> {
  const { STRIPE_SECRET_KEY: key } = getEnv();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const url = `https://api.stripe.com${path}`;
  const method = init.method ?? "POST";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (method !== "GET") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    headers["Idempotency-Key"] = init.idempotencyKey ?? randomUUID();
  }
  const maxAttempts = 3;
  let lastErr: unknown;
  const timeoutMs = Math.max(1000, init.timeoutMs ?? 10_000);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        method,
        headers,
        ...(init.body ? { body: form(init.body) } : {}),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));
      const json = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const msg =
          (json as { error?: { message?: string } }).error?.message ?? "";
        // Retry on 429/5xx
        if (res.status === 429 || res.status >= 500) {
          const backoff =
            200 * Math.pow(2, i) + Math.floor(Math.random() * 100);
          await sleep(backoff);
          continue;
        }
        throw new Error(`Stripe API error: ${res.status} ${msg}`);
      }
      return json as T;
    } catch (e) {
      lastErr = e;
      const backoff = 200 * Math.pow(2, i) + Math.floor(Math.random() * 100);
      await sleep(backoff);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Stripe request failed");
}

async function stripeFetch<T = unknown>(
  path: string,
  body: Record<string, string>
): Promise<T> {
  return stripeRequest<T>(path, { method: "POST", body });
}

async function ensureCustomerId(tenantId: string): Promise<string | null> {
  const existing = await TenantIntegrationsService.findCustomerId(
    tenantId,
    "stripe"
  );
  if (existing) return existing;
  // Create a minimal customer on Stripe to enable portal and map future invoices
  try {
    const t = await readTenant(tenantId);
    const name = t?.name || `Tenant ${tenantId}`;
    const customer = await stripeFetch<{ id: string }>("/v1/customers", {
      name,
      "metadata[tenantId]": tenantId,
    });
    if (customer?.id) {
      await TenantIntegrationsService.upsertCustomerMapping(
        tenantId,
        "stripe",
        customer.id
      );
      return customer.id;
    }
  } catch {
    // Ignore errors — checkout can proceed without preset customer
  }
  return null;
}

export const stripeProvider: BillingProvider = {
  async createCheckout(args: CheckoutArgs): Promise<{ url: string }> {
    // Treat planId as Stripe Price ID. Mode subscription by default.
    // Include or ensure a customer mapping to avoid duplicates and enable portal immediately
    const ensuredCustomer = await ensureCustomerId(args.tenantId);
    const payload: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": args.planId,
      "line_items[0][quantity]": String(args.quantity ?? 1),
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      "metadata[tenantId]": args.tenantId,
    };
    if (ensuredCustomer) payload.customer = ensuredCustomer;
    type SessionOut = { url: string; customer?: string | null };
    let session: SessionOut;
    try {
      session = await stripeFetch<SessionOut>(
        "/v1/checkout/sessions",
        payload
      );
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      // Handle stale customer mappings when switching Stripe accounts:
      // if Stripe says "No such customer", retry without the customer hint
      if (
        payload.customer &&
        /No such customer/i.test(msg)
      ) {
        // Drop stale customer and let Stripe create a fresh one
        delete payload.customer;
        session = await stripeFetch<SessionOut>(
          "/v1/checkout/sessions",
          payload
        );
        const newCustomer =
          typeof (session as { customer?: unknown }).customer === "string"
            ? ((session as { customer?: string }).customer as string)
            : null;
        if (newCustomer) {
          await TenantIntegrationsService.upsertCustomerMapping(
            args.tenantId,
            "stripe",
            newCustomer
          );
        }
      } else {
        throw e;
      }
    }
    return { url: session.url };
  },

  async portalUrl(args: { tenantId: string }): Promise<{ url: string }> {
    const customer = await TenantIntegrationsService.findCustomerId(
      args.tenantId,
      "stripe"
    );
    if (!customer)
      throw new Error(
        "Stripe portal unavailable: missing customer mapping for tenant"
      );
    const { BILLING_PORTAL_RETURN_URL: returnUrl } = getEnv();
    if (!returnUrl) throw new Error("BILLING_PORTAL_RETURN_URL is not set");
    // Attach tenantId so the return handler can redirect to the correct workspace
    const urlObj = new URL(returnUrl);
    urlObj.searchParams.set("tenantId", args.tenantId);
    const session = await stripeFetch<{ url: string }>(
      "/v1/billing_portal/sessions",
      {
        customer,
        return_url: urlObj.toString(),
      }
    );
    return { url: session.url };
  },

  async refundPayment(args: {
    tenantId: string;
    providerPaymentId: string;
    amountMinorStr?: string;
  }): Promise<{ ok: true }> {
    // Attempt refund by payment_intent; if amount provided, pass amount in cents
    const body: Record<string, string> = {
      payment_intent: args.providerPaymentId,
    };
    if (args.amountMinorStr) body.amount = args.amountMinorStr;
    const idem = `refund:${args.tenantId}:${args.providerPaymentId}:${args.amountMinorStr ?? "full"}`;
    await stripeRequest("/v1/refunds", {
      method: "POST",
      body,
      idempotencyKey: idem,
    });
    return { ok: true } as const;
  },
  async cancelSubscription(args: {
    tenantId: string;
    providerSubId: string;
    atPeriodEnd: boolean;
  }): Promise<{ ok: true }> {
    void args.tenantId;
    if (args.atPeriodEnd) {
      await stripeFetch(
        `/v1/subscriptions/${encodeURIComponent(args.providerSubId)}`,
        { cancel_at_period_end: "true" }
      );
    } else {
      await stripeRequest(
        `/v1/subscriptions/${encodeURIComponent(args.providerSubId)}`,
        { method: "DELETE" }
      );
    }
    return { ok: true as const };
  },
  async createTopupCheckout(args: {
    tenantId: string;
    amountMinorStr: string;
    currency: string;
    credits: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }> {
    // Try to resolve a pre-created Stripe Price for this pack
    let payload: Record<string, string>;
    let usedMappedPrice = false;
    try {
      const minor = parseMinorStr(args.amountMinorStr);
      const amountMajor = toMajorNumberCurrency(minor, args.currency);
      const { BILLING_PROVIDER } = getEnv();
      const mapped = mapTopupPriceIdForProvider(
        BILLING_PROVIDER ?? "stripe",
        amountMajor,
        args.currency
      );
      if (mapped) {
        usedMappedPrice = true;
        payload = {
          mode: "payment",
          "line_items[0][price]": mapped,
          "line_items[0][quantity]": "1",
          success_url: args.successUrl,
          cancel_url: args.cancelUrl,
          "metadata[tenantId]": args.tenantId,
        };
      } else {
        payload = {};
      }
    } catch {
      payload = {};
    }
    if (!usedMappedPrice) {
      payload = {
        mode: "payment",
        "line_items[0][price_data][currency]": args.currency,
        "line_items[0][price_data][product_data][name]": "Credits Top-up",
        "line_items[0][price_data][unit_amount]": args.amountMinorStr,
        "line_items[0][quantity]": "1",
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        "metadata[tenantId]": args.tenantId,
      };
    }
    const session = await stripeFetch<{ url: string }>(
      "/v1/checkout/sessions",
      payload
    );
    return { url: session.url };
  },
  async updateSubscriptionQuantity(args: {
    tenantId: string;
    providerSubId: string;
    quantity: number;
  }): Promise<{ ok: true }> {
    void args.tenantId;
    // 1) Fetch subscription to get its first item id
    const sub = await stripeRequest<{
      items?: { data?: Array<{ id?: string }> };
    }>(`/v1/subscriptions/${encodeURIComponent(args.providerSubId)}`, {
      method: "GET",
    });
    const itemId = sub?.items?.data?.[0]?.id;
    if (!itemId) throw new Error("Stripe subscription item not found");
    // 2) Update item quantity (creates prorations by default)
    await stripeRequest(
      `/v1/subscription_items/${encodeURIComponent(itemId)}`,
      {
        method: "POST",
        body: {
          quantity: String(Math.max(1, Math.trunc(args.quantity))),
          proration_behavior: "create_prorations",
        },
      }
    );
    return { ok: true as const };
  },
  async updateSubscriptionPlan(args: {
    tenantId: string;
    providerSubId: string;
    planId: string;
  }): Promise<{ ok: true }> {
    void args.tenantId;
    // Fetch subscription items to find the primary item id
    const sub = await stripeRequest<{
      items?: { data?: Array<{ id?: string }> };
    }>(`/v1/subscriptions/${encodeURIComponent(args.providerSubId)}`, {
      method: "GET",
    });
    const itemId = sub?.items?.data?.[0]?.id;
    if (!itemId) throw new Error("Stripe subscription item not found");
    // Update the item price with proration.
    await stripeRequest(
      `/v1/subscription_items/${encodeURIComponent(itemId)}`,
      {
        method: "POST",
        body: {
          price: args.planId,
          proration_behavior: "create_prorations",
        },
      }
    );
    // Immediately try to invoice + collect payment for the proration.
    // If there is no default payment method or Stripe cannot pay the invoice,
    // we swallow the error and let Stripe handle the open invoice via dunning.
    try {
      const invoice = await stripeRequest<{ id?: string }>(
        "/v1/invoices",
        {
          method: "POST",
          body: {
            subscription: args.providerSubId,
          },
        }
      );
      if (invoice?.id) {
        await stripeRequest(
          `/v1/invoices/${encodeURIComponent(invoice.id)}/pay`,
          {
            method: "POST",
            body: {},
          }
        );
      }
    } catch {
      // Leave invoice open/unpaid; Stripe will send emails / use dunning.
    }
    return { ok: true as const };
  },
};
