/**
 * @module @unisane/billing
 * @description Stripe/LemonSqueezy subscriptions, payments, invoices, refunds
 * @layer 3
 */

// ════════════════════════════════════════════════════════════════════════════
// Domain - Types & Schemas
// ════════════════════════════════════════════════════════════════════════════

export type {
  BillingConfig,
  CancelSubscriptionArgs,
  GetSubscriptionArgs,
  PaymentView,
  PaymentListPage,
  InvoiceView,
  InvoiceListPage,
  SubscriptionView,
  PlanConfig,
} from "./domain/types";

export {
  ZCancel,
  ZChangePlan,
  ZChangeQuantity,
  ZPortal,
  ZRefund,
  ZSubscribe,
  ZTopup,
} from "./domain/schemas";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Errors
// ════════════════════════════════════════════════════════════════════════════

export {
  SubscriptionNotFoundError,
  SubscriptionAlreadyExistsError,
  SubscriptionCancelledError,
  InvalidPlanError,
  PlanDowngradeNotAllowedError,
  PaymentNotFoundError,
  PaymentAlreadyRefundedError,
  RefundAmountExceededError,
  InvoiceNotFoundError,
  BillingProviderError,
  CustomerNotFoundError,
  InsufficientCreditsError,
} from "./domain/errors";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Constants
// ════════════════════════════════════════════════════════════════════════════

export {
  BILLING_EVENTS,
  BILLING_DEFAULTS,
  BILLING_COLLECTIONS,
} from "./domain/constants";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Cache Keys
// ════════════════════════════════════════════════════════════════════════════

export { billingKeys, refundLockKey } from "./domain/keys";
export type { BillingKeyBuilder } from "./domain/keys";

// ════════════════════════════════════════════════════════════════════════════
// Services - Subscription Management
// ════════════════════════════════════════════════════════════════════════════

export { subscribe } from "./service/subscribe";
export { getSubscription, assertActiveSubscriptionForCredits } from "./service/subscription";
export { cancelSubscription } from "./service/cancel";
export { changePlan } from "./service/changePlan";
export { changeQuantity } from "./service/changeQuantity";
export { SubscriptionsService } from "./service/subscriptions";

// ════════════════════════════════════════════════════════════════════════════
// Services - Payments & Invoices
// ════════════════════════════════════════════════════════════════════════════

export { listPayments } from "./service/listPayments";
export { listInvoices } from "./service/listInvoices";
export { refund } from "./service/refund";
export { topup } from "./service/topup";

// ════════════════════════════════════════════════════════════════════════════
// Services - Configuration & Portal
// ════════════════════════════════════════════════════════════════════════════

export { getConfig } from "./service/config";
export { getBillingMode } from "./service/mode";
export { portal } from "./service/portal";
export { TenantIntegrationsService } from "./service/tenantIntegrations";

// ════════════════════════════════════════════════════════════════════════════
// Services - Admin
// ════════════════════════════════════════════════════════════════════════════

export { getTenantOpenInvoiceCounts, getTenantLatestSubscriptions } from "./service/admin/stats";

// ════════════════════════════════════════════════════════════════════════════
// Data - Repositories (for internal/webhook use)
// ════════════════════════════════════════════════════════════════════════════

export * as paymentsRepo from "./data/payments.repository";
export * as invoicesRepo from "./data/invoices.repository";
export * as subscriptionsRepo from "./data/subscriptions.repository";
export {
  findTenantIdByCustomer,
  upsertCustomerMapping,
  softDeleteCustomerMapping,
  findCustomerId,
} from "./data/tenant-integrations.repository";

// ════════════════════════════════════════════════════════════════════════════
// Domain - Mappers (for webhook use)
// ════════════════════════════════════════════════════════════════════════════

export { mapStripeSubStatus, mapRazorpaySubStatus } from "./domain/mappers";
