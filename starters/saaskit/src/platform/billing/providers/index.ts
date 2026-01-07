import { stripeProvider } from "./stripe";
import { razorpayProvider } from "./razorpay";
import { getEnv } from "@/src/shared/env";

export type CheckoutArgs = {
  tenantId: string;
  planId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
};

export type BillingProvider = {
  createCheckout(args: CheckoutArgs): Promise<{ url: string }>;
  portalUrl(args: { tenantId: string }): Promise<{ url: string }>;
  refundPayment(args: {
    tenantId: string;
    providerPaymentId: string;
    amountMinorStr?: string;
  }): Promise<{ ok: true }>;
  createTopupCheckout(args: {
    tenantId: string;
    amountMinorStr: string;
    currency: string;
    credits: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;
  cancelSubscription(args: {
    tenantId: string;
    providerSubId: string;
    atPeriodEnd: boolean;
  }): Promise<{ ok: true }>;
  updateSubscriptionQuantity(args: {
    tenantId: string;
    providerSubId: string;
    quantity: number;
  }): Promise<{ ok: true }>;
  updateSubscriptionPlan(args: {
    tenantId: string;
    providerSubId: string;
    planId: string;
  }): Promise<{ ok: true }>;
};

/**
 * Creates a stub provider that throws descriptive errors.
 * Reduces duplication for unconfigured/partial providers.
 */
function createStubProvider(name: string, hint: string): BillingProvider {
  const err = (op: string) => new Error(`${name}: ${op} - ${hint}`);
  return {
    async createCheckout() {
      throw err("createCheckout");
    },
    async portalUrl() {
      throw err("portalUrl");
    },
    async refundPayment() {
      throw err("refundPayment");
    },
    async createTopupCheckout() {
      throw err("createTopupCheckout");
    },
    async cancelSubscription() {
      throw err("cancelSubscription");
    },
    async updateSubscriptionQuantity() {
      throw err("updateSubscriptionQuantity");
    },
    async updateSubscriptionPlan() {
      throw err("updateSubscriptionPlan");
    },
  };
}

// Stub providers with descriptive error messages
const stubProvider = createStubProvider(
  "Billing",
  "Provider not configured. Set BILLING_PROVIDER and provider secrets."
);

const stripeMisconfigured = createStubProvider(
  "Stripe",
  "Not fully configured. Set STRIPE_SECRET_KEY."
);

const razorpayMisconfigured = createStubProvider(
  "Razorpay",
  "Not fully configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
);

export function getBillingProvider(): BillingProvider {
  const { BILLING_PROVIDER, STRIPE_SECRET_KEY } = getEnv();
  const p = (BILLING_PROVIDER ?? "stub").toLowerCase();

  if (p === "stripe") {
    return STRIPE_SECRET_KEY ? stripeProvider : stripeMisconfigured;
  }

  if (p === "razorpay") {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getEnv();
    return RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
      ? razorpayProvider
      : razorpayMisconfigured;
  }

  return stubProvider;
}
