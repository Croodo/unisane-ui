import type {
  PaymentStatus,
  InvoiceStatus,
  SubscriptionStatus,
} from "@unisane/kernel";
import type { PlanId } from "@unisane/kernel";
import type { BillingProvider } from "@unisane/kernel";

import type { BillingMode } from "@unisane/kernel";

export type CancelSubscriptionArgs = { tenantId: string; atPeriodEnd: boolean };
export type GetSubscriptionArgs = { tenantId: string };

export type PlanConfig = {
  id: PlanId;
  label: string;
  tagline: string;
  recommended?: boolean;
  features?: string[];
  defaultPrice?: {
    amount: number;
    currency: string;
    interval: "month" | "year";
  };
};

export type BillingConfig = {
  mode: BillingMode;
  plans: PlanConfig[];
};

export type PaymentView = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  capturedAt: Date | null;
};

export type PaymentListPage = {
  items: PaymentView[];
  nextCursor?: string;
  prevCursor?: string;
};

export type PaymentDetail = PaymentView & {
  provider: BillingProvider;
  providerPaymentId: string;
};

export type InvoiceView = {
  id: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: Date | null;
  url: string | null;
};

export type InvoiceListPage = {
  items: InvoiceView[];
  nextCursor?: string;
  prevCursor?: string;
};

export type SubscriptionView = {
  id: string;
  planId: string;
  quantity: number;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

export type TenantIntegrationRef = { tenantId: string; customerId: string };
