import { listByProviderCursor as tenantIntegrationsCursor } from "../data/tenant-integrations.repository";
import { SubscriptionsRepository } from "../data/subscriptions.repository";
import { InvoicesRepository } from "../data/invoices.repository";
import { PaymentsRepository } from "../data/payments.repository";
import { metrics, logger, ProviderError } from "@unisane/kernel";
import { toMajorNumberCurrency } from "@unisane/kernel";
import { getEnv } from "@unisane/kernel";
import {
  mapStripeSubStatus,
  mapRazorpaySubStatus,
} from "../domain/mappers";

/**
 * Configuration error for missing environment variables.
 * Non-retryable as it requires deployment fix.
 */
class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function qs(params: Record<string, string>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) u.append(k, v);
  return u.toString();
}

async function stripeGet<T = unknown>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const { STRIPE_SECRET_KEY: key } = getEnv();
  if (!key) throw new ConfigurationError("STRIPE_SECRET_KEY is not set");
  const url = `https://api.stripe.com${path}?${qs(params)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const errorObj = json as { error?: { message?: string; code?: string; type?: string } };
    const msg = errorObj.error?.message ?? `HTTP ${res.status}`;
    const code = errorObj.error?.code;
    // 4xx errors are typically non-retryable (bad request, invalid params)
    // 5xx errors are retryable (server issues)
    const retryable = res.status >= 500;
    throw new ProviderError("stripe", new Error(msg), { retryable, providerCode: code });
  }
  return json as T;
}

function getAny(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}
function getString(obj: unknown, path: string[]): string | undefined {
  const v = getAny(obj, path);
  return typeof v === "string" ? v : undefined;
}
function getNumber(obj: unknown, path: string[]): number | undefined {
  const v = getAny(obj, path);
  return typeof v === "number" ? v : undefined;
}

export async function reconcileStripe(
  deadlineMs?: number
): Promise<{
  customers: number;
  subs: number;
  invoices: number;
  payments: number;
}> {
  const t0 = Date.now();
  const cursor = tenantIntegrationsCursor("stripe") as AsyncIterable<{
    tenantId: string;
    customerId: string;
  }>;
  let customers = 0;
  let subs = 0;
  let invoices = 0;
  let payments = 0;
  for await (const row of cursor) {
    customers++;
    if (deadlineMs && Date.now() > deadlineMs) break;
    const tenantId = row.tenantId;
    const customer = row.customerId;

    // Subscriptions
    try {
      const subList = await stripeGet<{ data?: unknown[] }>(
        "/v1/subscriptions",
        { customer, limit: "20", status: "all" }
      );
      const items = (
        Array.isArray(subList.data) ? subList.data : []
      ) as unknown[];
      for (const s of items) {
        const id = getString(s, ["id"]);
        const status = getString(s, ["status"]);
        const quantity = getNumber(s, ["quantity"]);
        const priceId = getString(s, ["plan", "id"]);
        const cancelAtPeriodEnd = getAny(s, ["cancel_at_period_end"]) === true;
        const currentPeriodEnd =
          getNumber(s, ["current_period_end"]) ??
          getNumber(s, ["items", "data", "0", "current_period_end"]);
        await SubscriptionsRepository.upsertByProviderId({
          tenantId,
          provider: "stripe",
          providerSubId: id ?? "",
          planId: priceId ?? "unknown",
          quantity: (quantity ?? 1) as number,
          status: mapStripeSubStatus(status),
          providerStatus: status ?? null,
          cancelAtPeriodEnd,
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
        });
        subs++;
      }
    } catch (err) {
      const isProviderError = err instanceof ProviderError;
      logger.warn("reconcile: stripe subscription fetch failed", { err, tenantId, customer, provider: "stripe", retryable: isProviderError ? err.retryable : undefined });
    }

    if (deadlineMs && Date.now() > deadlineMs) break;
    // Invoices (recent)
    try {
      const invList = await stripeGet<{ data?: unknown[] }>("/v1/invoices", {
        customer,
        limit: "10",
      });
      const items = (
        Array.isArray(invList.data) ? invList.data : []
      ) as unknown[];
      for (const inv of items) {
        const id = getString(inv, ["id"]);
        const amountPaid = getNumber(inv, ["amount_paid"]);
        const currencyRaw = getString(inv, ["currency"]);
        const hostedUrl = getString(inv, ["hosted_invoice_url"]);
        const paymentIntent = getString(inv, ["payment_intent"]);
        const currency = (currencyRaw ?? "").toUpperCase();
        if (id && amountPaid && currency) {
          const amountMajor = toMajorNumberCurrency(
            BigInt(amountPaid),
            currency
          );
          await InvoicesRepository.upsertByProviderId({
            tenantId,
            provider: "stripe",
            providerInvoiceId: id,
            amount: amountMajor,
            currency,
            status: "paid",
            issuedAt: new Date(),
            url: hostedUrl ?? null,
          });
          invoices++;
        }
        if (paymentIntent && amountPaid && currency) {
          const amountMajor = toMajorNumberCurrency(
            BigInt(amountPaid),
            currency
          );
          await PaymentsRepository.upsertByProviderId({
            tenantId,
            provider: "stripe",
            providerPaymentId: paymentIntent,
            amount: amountMajor,
            currency,
            status: "succeeded",
            capturedAt: new Date(),
          });
          payments++;
        }
      }
    } catch (err) {
      const isProviderError = err instanceof ProviderError;
      logger.warn("reconcile: stripe invoice/payment fetch failed", { err, tenantId, customer, provider: "stripe", retryable: isProviderError ? err.retryable : undefined });
    }
  }
  const elapsed = Date.now() - t0;
  metrics.increment("billing_reconcile_runs", {
    labels: { provider: "stripe", customers: String(customers), subs: String(subs), invoices: String(invoices), payments: String(payments) },
  });
  metrics.histogram("billing_reconcile_ms", elapsed, { labels: { provider: "stripe" } });
  return { customers, subs, invoices, payments };
}

async function rzpGet<T = unknown>(path: string): Promise<T> {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getEnv();
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)
    throw new ConfigurationError("RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET is not set");
  const res = await fetch(`https://api.razorpay.com${path}`, {
    method: "GET",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString(
          "base64"
        ),
    },
  });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const errorObj = json as { error?: { description?: string; code?: string } };
    const msg = errorObj.error?.description ?? `HTTP ${res.status}`;
    const code = errorObj.error?.code;
    // 4xx errors are typically non-retryable, 5xx are retryable
    const retryable = res.status >= 500;
    throw new ProviderError("razorpay", new Error(msg), { retryable, providerCode: code });
  }
  return json as T;
}

export async function reconcileRazorpay(
  deadlineMs?: number
): Promise<{ subs: number; payments: number }> {
  const t0 = Date.now();
  let subs = 0;
  let payments = 0;
  // Refresh known subscriptions from DB by provider id
  try {
    const rows = await SubscriptionsRepository.listByProviderId("razorpay");
    for (const row of rows) {
      if (deadlineMs && Date.now() > deadlineMs) break;
      const s = await rzpGet<Record<string, unknown>>(
        `/v1/subscriptions/${encodeURIComponent(row.providerSubId)}`
      );
      const status = getString(s, ["status"]);
      const quantity = getNumber(s, ["quantity"]);
      const planId = getString(s, ["plan_id"]) || getString(s, ["plan", "id"]);
      await SubscriptionsRepository.upsertByProviderId({
        tenantId: row.tenantId,
        provider: "razorpay",
        providerSubId: row.providerSubId,
        planId: planId ?? "unknown",
        quantity: (quantity ?? 1) as number,
        status: mapRazorpaySubStatus(status),
        providerStatus: status ?? null,
      });
      subs++;
    }
  } catch (err) {
    const isProviderError = err instanceof ProviderError;
    logger.warn("reconcile: razorpay subscription sweep failed", { err, provider: "razorpay", retryable: isProviderError ? err.retryable : undefined });
  }
  // Refresh recent payments from DB by provider id
  try {
    const rowsP = await PaymentsRepository.listByProviderId("razorpay");
    for (const row of rowsP) {
      if (deadlineMs && Date.now() > deadlineMs) break;
      const p = await rzpGet<Record<string, unknown>>(
        `/v1/payments/${encodeURIComponent(row.providerPaymentId)}`
      );
      const amount = getNumber(p, ["amount"]);
      const currencyRaw = getString(p, ["currency"]);
      const statusRaw = getString(p, ["status"]);
      const currency = (currencyRaw ?? "").toUpperCase();
      if (amount && currency) {
        const amountMajor = toMajorNumberCurrency(BigInt(amount), currency);
        const mapped: import("@unisane/kernel").PaymentStatus =
          statusRaw === "captured" ? "succeeded" : "processing";
        await PaymentsRepository.upsertByProviderId({
          tenantId: row.tenantId,
          provider: "razorpay",
          providerPaymentId: row.providerPaymentId,
          amount: amountMajor,
          currency,
          status: mapped,
        });
        payments++;
      }
    }
  } catch (err) {
    const isProviderError = err instanceof ProviderError;
    logger.warn("reconcile: razorpay payment sweep failed", { err, provider: "razorpay", retryable: isProviderError ? err.retryable : undefined });
  }
  const elapsed = Date.now() - t0;
  metrics.increment("billing_reconcile_runs", {
    labels: { provider: "razorpay", subs: String(subs), payments: String(payments) },
  });
  metrics.histogram("billing_reconcile_ms", elapsed, { labels: { provider: "razorpay" } });
  return { subs, payments };
}
