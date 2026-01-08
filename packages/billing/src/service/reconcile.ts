import { listByProviderCursor as tenantIntegrationsCursor } from "../data/tenant-integrations.repository";
import { SubscriptionsRepository } from "../data/subscriptions.repository";
import { InvoicesRepository } from "../data/invoices.repository";
import { PaymentsRepository } from "../data/payments.repository";
import { metrics } from "@unisane/kernel";
import { toMajorNumberCurrency } from "@unisane/kernel";
import { getEnv } from "@unisane/kernel";
import {
  mapStripeSubStatus,
  mapRazorpaySubStatus,
} from "../domain/mappers";

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
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const url = `https://api.stripe.com${path}?${qs(params)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message ?? "";
    throw new Error(`Stripe API error: ${res.status} ${msg}`);
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
    } catch {
      // ignore per-customer failures
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
    } catch {
      // ignore per-customer failures
    }
  }
  const elapsed = Date.now() - t0;
  metrics.inc("billing_reconcile_runs", {
    provider: "stripe",
    customers,
    subs,
    invoices,
    payments,
  });
  metrics.observe("billing_reconcile_ms", elapsed, { provider: "stripe" });
  return { customers, subs, invoices, payments };
}

async function rzpGet<T = unknown>(path: string): Promise<T> {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getEnv();
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)
    throw new Error("RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET is not set");
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
    const msg =
      (json as { error?: { description?: string } }).error?.description ?? "";
    throw new Error(`Razorpay API error: ${res.status} ${msg}`);
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
  } catch {
    // ignore sweep errors
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
  } catch {
    // ignore sweep errors
  }
  const elapsed = Date.now() - t0;
  metrics.inc("billing_reconcile_runs", {
    provider: "razorpay",
    subs,
    payments,
  });
  metrics.observe("billing_reconcile_ms", elapsed, { provider: "razorpay" });
  return { subs, payments };
}
