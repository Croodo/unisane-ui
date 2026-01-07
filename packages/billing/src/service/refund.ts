import { getBillingProvider } from "@unisane/kernel";
import { toMinorStrCurrency } from "@unisane/kernel";
import { redis } from "@unisane/kernel";
import * as paymentsRepo from "../data/payments.repository";
import { getEnv } from "@unisane/kernel";
import { refundLockKey } from "../domain/keys";
import type { BillingProvider } from "@unisane/kernel";
import { isEnabledForTenant } from "@unisane/flags";
import { FLAG } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";

export async function refund(args: {
  tenantId: string;
  providerPaymentId: string;
  amount?: number;
}) {
  // Feature gate
  const enabled = await isEnabledForTenant({
    key: FLAG.BILLING_REFUND,
    tenantId: args.tenantId,
  });
  if (!enabled) throw ERR.forbidden("Refunds disabled");
  const p = await paymentsRepo.findByProviderPaymentId({
    tenantId: args.tenantId,
    providerPaymentId: args.providerPaymentId,
  });
  if (!p) return { ok: false as const, error: "PAYMENT_NOT_FOUND" };
  // Acquire a short NX lock to avoid duplicate refunds across retries/processes
  const amountMinorStrLock =
    typeof args.amount === "number"
      ? toMinorStrCurrency(args.amount, p.currency)
      : "full";
  const currentProvider = (
    getEnv().BILLING_PROVIDER ??
    p.provider ??
    "stub"
  ).toString();
  const lockKey = refundLockKey(
    args.tenantId,
    currentProvider as BillingProvider,
    args.providerPaymentId,
    amountMinorStrLock
  );
  const locked = await redis.set(lockKey, "1", { NX: true, PX: 30_000 });
  if (!locked) return { ok: true as const };
  // Call provider
  const provider = getBillingProvider();
  const amountMinorStr =
    typeof args.amount === "number"
      ? toMinorStrCurrency(args.amount, p.currency)
      : undefined;
  await provider.refundPayment({
    tenantId: args.tenantId,
    providerPaymentId: args.providerPaymentId,
    ...(amountMinorStr ? { amountMinorStr } : {}),
  });
  await paymentsRepo.markRefunded(p.id);
  return { ok: true as const };
}
