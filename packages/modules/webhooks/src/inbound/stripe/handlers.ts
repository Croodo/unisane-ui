import { grant } from '@unisane/credits';
import {
  paymentsRepo,
  invoicesRepo,
  subscriptionsRepo,
  findTenantIdByCustomer,
  upsertCustomerMapping,
  softDeleteCustomerMapping,
  mapStripeSubStatus,
  getBillingMode,
} from '@unisane/billing';
import { creditsForPurchase } from '@unisane/kernel';
import { toMajorNumberCurrency } from '@unisane/kernel';
import { TenantsRepo } from '@unisane/tenants';
import { patchSetting } from '@unisane/settings';
import { reverseMapPlanIdFromProvider } from '@unisane/kernel';
import { invalidateEntitlements, resolveEntitlements } from '@unisane/kernel';
import { logger } from '@unisane/kernel';
import { getString, getNumber, getAny } from '../utils';

async function findTenantIdByCustomerStripe(customerId?: string | null): Promise<string | null> {
  if (!customerId) return null;
  return findTenantIdByCustomer('stripe', customerId);
}

export async function handleCheckoutCompleted(obj: Record<string, unknown>, eventId?: string): Promise<void> {
  const log = logger.child({ src: 'webhooks.stripe', type: 'checkout.session.completed', eventId });
  const mode = getString(obj, ['mode']);
  const tenantId = getString(obj, ['metadata', 'tenantId']);
  const customerId = getString(obj, ['customer']);
  
  if (tenantId && customerId) {
    await upsertCustomerMapping(tenantId, 'stripe', customerId);
  }
  
  if (mode === 'payment') {
    const paymentIntent = getString(obj, ['payment_intent']);
    const amountTotal = getNumber(obj, ['amount_total']);
    const currencyRaw = getString(obj, ['currency']);
    const invoiceId = getString(obj, ['invoice']);
    const invoicePdf = getString(obj, ['invoice_pdf']);
    const amountMajor = amountTotal && currencyRaw ? toMajorNumberCurrency(BigInt(amountTotal), currencyRaw) : undefined;
    const credits = amountMajor !== undefined && currencyRaw ? creditsForPurchase(amountMajor, currencyRaw) : undefined;
    const currency = (currencyRaw ?? '').toUpperCase();
    
    if (!tenantId || !paymentIntent || !credits || amountMajor === undefined || !currency) return;
    
    await grant({ tenantId, amount: credits, reason: 'purchase', idem: paymentIntent });
    log.info('credits granted', { phase: 'topup_checkout_completed', tenantId, customerId, paymentIntent, credits, amountMajor, currency });
    
    await paymentsRepo.upsertByProviderId({
      tenantId,
      provider: 'stripe',
      providerPaymentId: paymentIntent,
      amount: amountMajor,
      currency,
      status: 'succeeded',
      capturedAt: new Date(),
    });
    
    if (invoiceId) {
      await invoicesRepo.upsertByProviderId({
        tenantId,
        provider: 'stripe',
        providerInvoiceId: invoiceId,
        amount: amountMajor,
        currency,
        status: 'paid',
        issuedAt: new Date(),
        url: invoicePdf ?? null,
      });
    }
  }
}

export async function handleInvoiceEvent(
  type: string,
  obj: Record<string, unknown>,
  eventId?: string
): Promise<void> {
  const customerId = getString(obj, ['customer']);
  const tenantId = await findTenantIdByCustomerStripe(customerId);
  if (!tenantId) return;
  
  const paymentIntent = getString(obj, ['payment_intent']);
  const amountPaid = getNumber(obj, ['amount_paid']);
  const currencyRaw = getString(obj, ['currency']);
  const hostedUrl = getString(obj, ['hosted_invoice_url']);
  const invoiceId = getString(obj, ['id']);
  const currency = (currencyRaw ?? '').toUpperCase();
  
  if (!currency || !invoiceId) return;
  
  const invLog = logger.child({ src: 'webhooks.stripe', type, eventId, tenantId, invoiceId });
  const mode = await getBillingMode();
  invLog.info('stripe invoice.* event received', { phase: 'invoice_event', mode, amountPaid, currency });

  // Payment row
  if (paymentIntent && amountPaid && currency && (type === 'invoice.payment_succeeded' || type === 'invoice.payment_failed')) {
    const amountMajorPaid = toMajorNumberCurrency(BigInt(amountPaid), currency);
    await paymentsRepo.upsertByProviderId({
      tenantId,
      provider: 'stripe',
      providerPaymentId: paymentIntent,
      amount: amountMajorPaid,
      currency,
      status: type === 'invoice.payment_succeeded' ? 'succeeded' : 'failed',
      capturedAt: new Date(),
    });
  }

  // Invoice row
  const amountMajorInv = amountPaid !== undefined && currencyRaw
    ? toMajorNumberCurrency(BigInt(amountPaid ?? 0), currencyRaw)
    : 0;
  const invoiceStatus: import('@unisane/kernel').InvoiceStatus =
    type === 'invoice.payment_succeeded' ? 'paid'
    : type === 'invoice.voided' ? 'void'
    : type === 'invoice.marked_uncollectible' ? 'uncollectible'
    : 'open';
  
  await invoicesRepo.upsertByProviderId({
    tenantId,
    provider: 'stripe',
    providerInvoiceId: invoiceId,
    amount: amountMajorInv,
    currency,
    status: invoiceStatus,
    issuedAt: new Date(),
    url: hostedUrl ?? null,
  });

  // Subscription credits grant
  if (type === 'invoice.payment_succeeded' && mode === 'subscription_with_credits') {
    const subscriptionId = getString(obj, ['subscription']) ??
      getString(obj, ['lines', 'data', '0', 'parent', 'subscription_item_details', 'subscription']) ??
      getString(obj, ['parent', 'subscription_details', 'subscription']);
    const billingReason = getString(obj, ['billing_reason']);
    const isSubscriptionInvoice = !!subscriptionId && (!billingReason || /subscription/i.test(billingReason));
    
    if (!isSubscriptionInvoice) {
      invLog.debug('not subscription invoice; skipping credits', { billingReason, subscriptionId });
      return;
    }
    
    const periodEndSec = getNumber(obj, ['lines', 'data', '0', 'period', 'end']) ?? getNumber(obj, ['current_period_end']);
    const expiresAt = typeof periodEndSec === 'number' && Number.isFinite(periodEndSec) ? new Date(periodEndSec * 1000) : undefined;
    const ent = await resolveEntitlements(tenantId);
    const creditsCfg = ent.credits as Record<string, { grant: number; period: 'month' | 'year' }> | undefined;
    
    if (creditsCfg) {
      const entries = Object.entries(creditsCfg).filter(([, v]) => typeof v.grant === 'number' && v.grant > 0);
      invLog.info('granting credits', { phase: 'subscription_invoice_grant', subscriptionId, billingReason, creditsKeys: entries.map(([k]) => k) });
      for (const [key, v] of entries) {
        await grant({
          tenantId,
          amount: v.grant,
          reason: `subscription:${key}`,
          idem: `${invoiceId}:subcred:${key}`,
          ...(expiresAt ? { expiresAt } : {}),
        });
      }
    }
  }
}

export async function handleSubscriptionEvent(
  type: string,
  obj: Record<string, unknown>,
  eventId?: string
): Promise<void> {
  const customerId = getString(obj, ['customer']);
  const tenantId = await findTenantIdByCustomerStripe(customerId);
  if (!tenantId) return;
  
  const subId = getString(obj, ['id']);
  const statusRaw = getString(obj, ['status']);
  const quantity = getNumber(obj, ['quantity']);
  const priceId = getString(obj, ['plan', 'id']);
  const cancelAtPeriodEnd = getAny(obj, ['cancel_at_period_end']) === true;
  const currentPeriodEnd = getNumber(obj, ['current_period_end']) ?? getNumber(obj, ['items', 'data', '0', 'current_period_end']);
  
  const subLog = logger.child({ src: 'webhooks.stripe', type, eventId, tenantId, subId });
  
  await subscriptionsRepo.upsertByProviderId({
    tenantId,
    provider: 'stripe',
    providerSubId: subId ?? '',
    planId: priceId ?? 'unknown',
    quantity: (quantity ?? 1) as number,
    status: type === 'customer.subscription.deleted' ? 'canceled' : mapStripeSubStatus(statusRaw),
    providerStatus: statusRaw ?? null,
    cancelAtPeriodEnd,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
  });
  
  subLog.info('subscription event processed', { priceId, statusRaw, cancelAtPeriodEnd, currentPeriodEnd });
  
  if (priceId) {
    const friendly = reverseMapPlanIdFromProvider('stripe', priceId);
    if (friendly && typeof friendly === 'string') {
      await TenantsRepo.setPlanId(tenantId, friendly).catch(() => undefined);
      void invalidateEntitlements(tenantId).catch(() => undefined);
      subLog.info('tenant planId updated', { priceId, friendly });
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
}

export async function handleCustomerDeleted(obj: Record<string, unknown>): Promise<void> {
  const customerId = getString(obj, ['id']);
  if (!customerId) return;
  const tenantId = await findTenantIdByCustomerStripe(customerId);
  if (!tenantId) return;
  await softDeleteCustomerMapping('stripe', customerId).catch(() => undefined);
}

export async function handleChargeRefunded(obj: Record<string, unknown>): Promise<void> {
  const paymentIntent = getString(obj, ['payment_intent']);
  const customerId = getString(obj, ['customer']);
  const tenantId = await findTenantIdByCustomerStripe(customerId);
  if (!tenantId || !paymentIntent) return;
  await paymentsRepo.upsertByProviderId({ tenantId, provider: 'stripe', providerPaymentId: paymentIntent, status: 'refunded' });
}
