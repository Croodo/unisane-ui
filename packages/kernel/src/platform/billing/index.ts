/**
 * Billing platform stub - provides payment provider adapters and plan mapping
 * Actual implementations are injected by the application
 */

import type { BillingProvider } from '../../constants/providers';

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
  name: BillingProvider;

  createCheckoutSession(args: {
    tenantId: string;
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
    tenantId: string;
    planId?: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  /** Create a topup checkout session */
  createTopupCheckout(args: {
    tenantId: string;
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
    tenantId: string;
    providerSubId: string;
    planId?: string;
  }): Promise<Subscription>;

  /** Update subscription quantity */
  updateSubscriptionQuantity(args: {
    tenantId: string;
    providerSubId: string;
    quantity: number;
  }): Promise<Subscription>;

  refundPayment(args: {
    tenantId: string;
    providerPaymentId: string;
    amountMinorStr?: string;
  }): Promise<void>;
}

const noopBillingProvider: BillingProviderAdapter = {
  name: 'stripe',
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
  return _providers.get(name) ?? noopBillingProvider;
}

export function registerBillingProvider(provider: BillingProvider, adapter: BillingProviderAdapter): void {
  _providers.set(provider, adapter);
}

// Plan ID mapping
export type PlanIdMap = Record<string, Record<BillingProvider, string>>;

let _planIdMap: PlanIdMap = {};

export function mapPlanIdForProvider(friendlyId: string, provider: BillingProvider): string | undefined {
  return _planIdMap[friendlyId]?.[provider];
}

export function reverseMapPlanIdFromProvider(provider: BillingProvider, providerId: string): string | undefined {
  for (const [friendly, mapping] of Object.entries(_planIdMap)) {
    if (mapping[provider] === providerId) {
      return friendly;
    }
  }
  return undefined;
}

export function setPlanIdMap(map: PlanIdMap): void {
  _planIdMap = map;
}
