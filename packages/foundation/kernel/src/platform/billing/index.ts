/**
 * Billing platform stub - provides payment provider adapters and plan mapping
 * Actual implementations are injected by the application
 */

import type { BillingProvider, BillingProviderInternal } from '../../constants/providers';
import { logger } from '../../observability';

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface BillingProviderAdapter {
  /** Provider name - 'noop' for fallback when no provider registered */
  name: BillingProviderInternal;

  createCheckoutSession(args: {
    scopeId: string;
    customerId?: string;
    priceId: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
    mode?: 'subscription' | 'payment';
    metadata?: Record<string, string>;
  }): Promise<CheckoutSession>;

  /** Alias for createCheckoutSession - used by billing module */
  createCheckout(args: {
    scopeId: string;
    planId?: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  /** Create a topup checkout session */
  createTopupCheckout(args: {
    scopeId: string;
    amountMinorStr: string;
    currency: string;
    credits: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  createPortalSession(args: {
    customerId: string;
    returnUrl: string;
  }): Promise<PortalSession>;

  getSubscription(subscriptionId: string): Promise<Subscription | null>;

  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void>;

  updateSubscription(subscriptionId: string, args: {
    priceId?: string;
    quantity?: number;
  }): Promise<Subscription>;

  /** Update subscription plan */
  updateSubscriptionPlan(args: {
    scopeId: string;
    providerSubId: string;
    planId?: string;
  }): Promise<Subscription>;

  /** Update subscription quantity */
  updateSubscriptionQuantity(args: {
    scopeId: string;
    providerSubId: string;
    quantity: number;
  }): Promise<Subscription>;

  refundPayment(args: {
    scopeId: string;
    providerPaymentId: string;
    amountMinorStr?: string;
  }): Promise<void>;
}

/** Noop billing provider returned when no provider is registered */
const noopBillingProvider: BillingProviderAdapter = {
  name: 'noop',
  createCheckoutSession: async () => ({ id: '', url: '' }),
  createCheckout: async () => ({ id: '', url: '' }),
  createTopupCheckout: async () => ({ id: '', url: '' }),
  createPortalSession: async () => ({ url: '' }),
  getSubscription: async () => null,
  cancelSubscription: async () => {},
  updateSubscription: async () => ({ id: '', status: '' }),
  updateSubscriptionPlan: async () => ({ id: '', status: '' }),
  updateSubscriptionQuantity: async () => ({ id: '', status: '' }),
  refundPayment: async () => {},
};

let _providers: Map<BillingProvider, BillingProviderAdapter> = new Map();

export function getBillingProvider(provider?: BillingProvider): BillingProviderAdapter {
  const name = provider ?? 'stripe';
  const adapter = _providers.get(name);
  if (!adapter) {
    logger.warn('billing.provider.not_registered', { requested: name });
    return noopBillingProvider;
  }
  return adapter;
}

export function registerBillingProvider(provider: BillingProvider, adapter: BillingProviderAdapter): void {
  _providers.set(provider, adapter);
}

// Plan ID mapping
export type PlanIdMap = Record<string, Record<BillingProvider, string>>;

let _planIdMap: PlanIdMap = {};

// Reverse index for O(1) lookup: provider -> providerId -> friendlyId
type ReverseMap = Partial<Record<BillingProvider, Record<string, string>>>;
let _reverseMap: ReverseMap = {};

/**
 * Build reverse index when plan map is set.
 * Enables O(1) lookup of friendly plan ID from provider plan ID.
 */
function buildReverseMap(): void {
  _reverseMap = {};
  for (const [friendly, mapping] of Object.entries(_planIdMap)) {
    for (const [provider, id] of Object.entries(mapping)) {
      const providerKey = provider as BillingProvider;
      if (!_reverseMap[providerKey]) {
        _reverseMap[providerKey] = {};
      }
      _reverseMap[providerKey]![id] = friendly;
    }
  }
}

export function mapPlanIdForProvider(friendlyId: string, provider: BillingProvider): string | undefined {
  return _planIdMap[friendlyId]?.[provider];
}

export function reverseMapPlanIdFromProvider(provider: BillingProvider, providerId: string): string | undefined {
  return _reverseMap[provider]?.[providerId];
}

export function setPlanIdMap(map: PlanIdMap): void {
  _planIdMap = map;
  buildReverseMap();
}
