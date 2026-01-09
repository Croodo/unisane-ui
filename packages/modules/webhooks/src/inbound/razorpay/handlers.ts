import { grant } from '@unisane/credits';
import {
  paymentsRepo,
  subscriptionsRepo,
  mapRazorpaySubStatus,
  getBillingMode,
} from '@unisane/billing';
import { TenantsRepo } from '@unisane/tenants';
import { patchSetting } from '@unisane/settings';
import { reverseMapPlanIdFromProvider } from '@unisane/kernel';
import { invalidateEntitlements, resolveEntitlements } from '@unisane/kernel';
import { toMajorNumberCurrency } from '@unisane/kernel';
import { logger } from '@unisane/kernel';
import { getString, getNumber, getAny } from '../utils';

export async function handlePaymentCaptured(obj: Record<string, unknown>): Promise<void> {
  const providerPaymentId = getString(obj, ['id']);
  const amount = getNumber(obj, ['amount']);
  const currencyRaw = getString(obj, ['currency']);
  const notesAny = getAny(obj, ['notes']);
  const notes = (notesAny && typeof notesAny === 'object') ? (notesAny as Record<string, unknown>) : {};
  const tenantId = typeof notes['tenantId'] === 'string' ? notes['tenantId'] as string : undefined;
  const creditsStr = typeof notes['credits'] === 'string' ? notes['credits'] as string : undefined;
  const creditsNum = typeof notes['credits'] === 'number' ? notes['credits'] as number : undefined;
  const credits = creditsNum ?? (creditsStr ? Number.parseInt(creditsStr, 10) : undefined);
  const currency = (currencyRaw ?? '').toUpperCase();
  
  if (!tenantId || !providerPaymentId || !amount || !currency) return;
  
  const amountMajor = amount && currencyRaw ? toMajorNumberCurrency(BigInt(amount), currencyRaw) : undefined;
  
  const payArgs: {
    tenantId: string;
    provider: import('@unisane/kernel').BillingProvider;
    providerPaymentId: string;
    currency: string;
    status: import('@unisane/kernel').PaymentStatus;
    capturedAt: Date;
    amount?: number;
  } = {
    tenantId,
    provider: 'razorpay',
    providerPaymentId,
    currency,
    status: 'succeeded',
    capturedAt: new Date(),
  };
  
  if (typeof amountMajor === 'number') payArgs.amount = amountMajor;
  await paymentsRepo.upsertByProviderId(payArgs);
  
  if (typeof credits === 'number' && Number.isFinite(credits) && credits > 0) {
    await grant({ tenantId, amount: credits, reason: 'purchase', idem: providerPaymentId });
  }
}

export async function handleSubscriptionEvent(
  type: string,
  obj: Record<string, unknown>
): Promise<void> {
  const subId = getString(obj, ['id']);
  const statusRaw = getString(obj, ['status']);
  const quantity = getNumber(obj, ['quantity']);
  const planId = getString(obj, ['plan_id']) || getString(obj, ['plan', 'id']);
  const currentEndSec = getNumber(obj, ['current_end']);
  const notesAny = getAny(obj, ['notes']);
  const notes = (notesAny && typeof notesAny === 'object') ? (notesAny as Record<string, unknown>) : {};
  const tenantId = typeof notes['tenantId'] === 'string' ? notes['tenantId'] as string : undefined;
  
  if (!tenantId || !subId) return;
  
  const log = logger.child({ src: 'webhooks.razorpay', type, tenantId, subId });
  const mappedStatus = mapRazorpaySubStatus(statusRaw);
  
  await subscriptionsRepo.upsertByProviderId({
    tenantId,
    provider: 'razorpay',
    providerSubId: subId,
    planId: planId ?? 'unknown',
    quantity: (quantity ?? 1) as number,
    status: mappedStatus,
    providerStatus: statusRaw ?? null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: typeof currentEndSec === 'number' && Number.isFinite(currentEndSec)
      ? new Date(currentEndSec * 1000)
      : null,
  });
  
  log.info('subscription event processed', { planId, statusRaw, mappedStatus });
  
  if (planId) {
    const friendly = reverseMapPlanIdFromProvider('razorpay', planId);
    if (friendly && typeof friendly === 'string') {
      await TenantsRepo.setPlanId(tenantId, friendly).catch(() => undefined);
      void invalidateEntitlements(tenantId).catch(() => undefined);
    }
  }
  
  if ((await getBillingMode()) === 'subscription' && typeof quantity === 'number' && quantity > 0) {
    await patchSetting({
      tenantId,
      namespace: 'plan',
      key: 'overrides',
      value: { capacities: { seats: quantity } },
    }).catch(() => undefined);
  }
  
  // Grant subscription credits in hybrid mode
  if (/subscription\.(charged|completed)/i.test(type) && (await getBillingMode()) === 'subscription_with_credits') {
    const ent = await resolveEntitlements(tenantId);
    const creditsCfg = ent.credits as Record<string, { grant: number; period: 'month' | 'year' }> | undefined;
    
    if (creditsCfg) {
      const chargeAt = getNumber(obj, ['charge_at']) ?? getNumber(obj, ['current_end']);
      const periodEndSec = getNumber(obj, ['current_end']);
      const expiresAt = typeof periodEndSec === 'number' && Number.isFinite(periodEndSec)
        ? new Date(periodEndSec * 1000)
        : undefined;
      const entries = Object.entries(creditsCfg).filter(([, v]) => typeof v.grant === 'number' && v.grant > 0);
      
      for (const [key, v] of entries) {
        await grant({
          tenantId,
          amount: v.grant,
          reason: `subscription:${key}`,
          idem: `${subId}:subcred:${chargeAt ?? 'na'}:${key}`,
          ...(expiresAt ? { expiresAt } : {}),
        });
      }
    }
  }
}
