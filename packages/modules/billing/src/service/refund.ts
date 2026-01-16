import { getBillingProvider, toMinorStrCurrency, redis, getEnv, FLAG, isEnabledForScope } from "@unisane/kernel";
import type { BillingProvider } from "@unisane/kernel";
import { PaymentsRepository } from "../data/payments.repository";
import { refundLockKey } from "../domain/keys";
import { ERR } from "@unisane/gateway";
import { logBillingAudit, BILLING_AUDIT_ACTIONS } from "./audit";

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

  // BILL-001 FIX: Validate refund amount
  if (typeof args.amount === "number") {
    // Amount must be positive
    if (args.amount <= 0) {
      return { ok: false as const, error: "INVALID_REFUND_AMOUNT" };
    }
    // Amount must not exceed the original payment amount
    // Both p.amount and args.amount are in major units (dollars)
    if (args.amount > p.amount) {
      return { ok: false as const, error: "REFUND_EXCEEDS_PAYMENT" };
    }
  }

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

  // Audit log the refund
  await logBillingAudit({
    scopeId: args.scopeId,
    action: BILLING_AUDIT_ACTIONS.REFUND_COMPLETED,
    targetType: 'payment',
    targetId: p.id,
    changes: [
      { field: 'status', from: p.status, to: 'refunded' },
    ],
    metadata: {
      provider: currentProvider,
      providerPaymentId: args.providerPaymentId,
      amount: args.amount ?? p.amount,
      currency: p.currency,
      refundType: args.amount ? 'partial' : 'full',
    },
  });

  return { ok: true as const };
}
