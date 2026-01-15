import { getBillingProvider } from "@unisane/kernel";
import { toMinorStrCurrency } from "@unisane/kernel";
import { redis } from "@unisane/kernel";
import { PaymentsRepository } from "../data/payments.repository";
import { getEnv } from "@unisane/kernel";
import { refundLockKey } from "../domain/keys";
import type { BillingProvider } from "@unisane/kernel";
import { isEnabledForScope } from "@unisane/flags";
import { FLAG } from "@unisane/kernel";
import { ERR } from "@unisane/gateway";

export async function refund(args: {
  scopeId: string;
  providerPaymentId: string;
  amount?: number;
}) {
  // Feature gate
  const enabled = await isEnabledForScope({
    key: FLAG.BILLING_REFUND,
    scopeId: args.scopeId,
  });
  if (!enabled) throw ERR.forbidden("Refunds disabled");
  const p = await PaymentsRepository.findByProviderPaymentId({
    scopeId: args.scopeId,
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
    args.scopeId,
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
    scopeId: args.scopeId,
    providerPaymentId: args.providerPaymentId,
    ...(amountMinorStr ? { amountMinorStr } : {}),
  });
  await PaymentsRepository.markRefunded(p.id);
  return { ok: true as const };
}
