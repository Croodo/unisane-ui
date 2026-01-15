import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ZSubscribe,
  ZPortal,
  ZTopup,
  ZRefund,
  ZCancel,
  ZChangeQuantity,
  ZChangePlan,
} from "@unisane/billing/client";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel/client";
import {
  ZPaymentStatus,
  ZInvoiceStatus,
  ZSubscriptionStatus,
} from "@unisane/kernel/client";
import { ZPlanId } from "@unisane/kernel/client";
import { ZBillingMode } from "@unisane/kernel/client";
import { ZSeekPageQuery } from "@unisane/kernel/client";

const c = initContract();

export const billingContract = c.router({
  config: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/billing/config",
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            mode: ZBillingMode,
            plans: z.array(
              z.object({
                id: ZPlanId,
                label: z.string(),
                tagline: z.string(),
                recommended: z.boolean().optional(),
                features: z.array(z.string()).optional(),
                defaultPrice: z
                  .object({
                    amount: z.number(),
                    currency: z.string(),
                    interval: z.enum(["month", "year"]),
                  })
                  .optional(),
              })
            ),
          }),
        }),
      },
      summary: "Get billing config (mode + plans)",
      description:
        "Retrieve the billing configuration including the billing mode (stripe, razorpay, or none) and available subscription plans. " +
        "This is a public endpoint that does not require authentication. Use this to display pricing information on public pages.",
    },
    defineOpMeta({
      op: "billing.config",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/billing",
        fn: "getConfig",
      },
    })
  ),
  subscribe: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/subscribe",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZSubscribe,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ url: z.string().url() }),
        }),
      },
      summary: "Start subscription checkout",
      description:
        "Create a checkout session for a new subscription. Returns a URL to redirect the user to the payment provider's checkout page. " +
        "Requires billing:write permission. The user will be redirected to successUrl or cancelUrl after completing or canceling the checkout.",
    },
    defineOpMeta({
      op: "billing.subscribe",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "subscribe",
        zodBody: {
          importPath: "@unisane/billing",
          name: "ZSubscribe",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "planId", from: "body", key: "planId" },
          { name: "quantity", from: "body", key: "quantity", optional: true },
          { name: "successUrl", from: "body", key: "successUrl" },
          { name: "cancelUrl", from: "body", key: "cancelUrl" },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "subscription",
          afterExpr:
            "{ planId: body.planId, quantity: body.quantity ?? null, result }",
        },
      },
    })
  ),
  portal: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/portal",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZPortal,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ url: z.string().url() }),
        }),
      },
      summary: "Customer portal",
      description:
        "Generate a URL to the billing provider's customer portal where users can manage their subscription, " +
        "update payment methods, view invoices, and download receipts. The portal is hosted by the payment provider (Stripe/Razorpay).",
    },
    defineOpMeta({
      op: "billing.portal",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "portal",
        callArgs: [],
        requireTenantMatch: true,
        audit: {
          resourceType: "subscription",
          afterExpr: `{ url: (typeof result === 'object' && result && 'url' in result ? (result as { url?: string | null }).url ?? null : null) }`,
        },
      },
    })
  ),
  topup: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/topup",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZTopup,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ url: z.string().url() }),
        }),
      },
      summary: "Top up credits",
      description:
        "Create a one-time payment session to purchase additional credits. Returns a checkout URL. " +
        "Credits are added to the tenant's balance after successful payment. Use this for pay-as-you-go billing models.",
    },
    defineOpMeta({
      op: "billing.topup",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "topup",
        zodBody: {
          importPath: "@unisane/billing",
          name: "ZTopup",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "amount", from: "body", key: "amount" },
          { name: "currency", from: "body", key: "currency" },
          { name: "successUrl", from: "body", key: "successUrl" },
          { name: "cancelUrl", from: "body", key: "cancelUrl" },
          {
            name: "description",
            from: "body",
            key: "description",
            optional: true,
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "payment",
          afterExpr: "{ amount: body.amount, currency: body.currency, result }",
        },
      },
    })
  ),
  changePlan: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/subscription/plan",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZChangePlan,
      responses: {
        200: z.object({
          ok: z.literal(true),
        }),
      },
      summary: "Change subscription plan (upgrades only; downgrades via portal)",
      description:
        "Upgrade the current subscription to a higher-tier plan. The change takes effect immediately and " +
        "is prorated. For downgrades, redirect users to the customer portal instead. This endpoint only supports upgrades.",
    },
    defineOpMeta({
      op: "billing.changePlan",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "changePlan",
        zodBody: {
          importPath: "@unisane/billing",
          name: "ZChangePlan",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "planId", from: "body", key: "planId" },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "subscription",
          afterExpr: "{ planId: body.planId, result }",
        },
      },
    })
  ),
  cancel: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/cancel",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZCancel,
      responses: { 200: z.object({ ok: z.literal(true) }) },
      summary: "Cancel subscription",
      description:
        "Cancel the tenant's subscription. Set atPeriodEnd to true to cancel at the end of the current billing period " +
        "(recommended), or false for immediate cancellation. Immediate cancellation may result in loss of remaining subscription time.",
    },
    defineOpMeta({
      op: "billing.cancel",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "cancelSubscription",
        zodBody: {
          importPath: "@unisane/billing",
          name: "ZCancel",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "atPeriodEnd", from: "body", key: "atPeriodEnd" },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "subscription",
          afterExpr: "{ atPeriodEnd: body.atPeriodEnd, result }",
        },
      },
    })
  ),
  refund: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/refund",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZRefund,
      responses: { 200: z.object({ ok: z.literal(true) }) },
      summary: "Refund payment",
      description:
        "Issue a refund for a payment. Specify the provider payment ID and optionally a partial refund amount. " +
        "If amount is not specified, a full refund is issued. Refunds are processed through the payment provider.",
    },
    defineOpMeta({
      op: "billing.refund",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "refund",
        zodBody: {
          importPath: "@unisane/billing",
          name: "ZRefund",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "providerPaymentId", from: "body", key: "providerPaymentId" },
          { name: "amount", from: "body", key: "amount", optional: true },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "payment",
          resourceIdExpr: "body.providerPaymentId",
          afterExpr: "{ amount: body.amount ?? null, result }",
        },
      },
    })
  ),
  listInvoices: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/billing/invoices",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      query: ZSeekPageQuery,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                amountDue: z.number(),
                status: ZInvoiceStatus,
                createdAt: z.string(),
              })
            ),
            nextCursor: z.string().optional(),
          }),
        }),
      },
      summary: "List invoices",
      description:
        "Retrieve a paginated list of invoices for the tenant. Invoices include subscription charges and one-time payments. " +
        "Use the cursor parameter for pagination. Each invoice includes amount, status (draft, open, paid, void, uncollectible), and creation date.",
    },
    defineOpMeta({
      op: "billing.listInvoices",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "listInvoices",
        zodQuery: { importPath: "@unisane/kernel", name: "ZSeekPageQuery" },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "limit", from: "query", key: "limit" },
          { name: "cursor", from: "query", key: "cursor", optional: true },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  listPayments: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/billing/payments",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      query: ZSeekPageQuery,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                amount: z.number(),
                status: ZPaymentStatus,
                createdAt: z.string(),
              })
            ),
            nextCursor: z.string().optional(),
          }),
        }),
      },
      summary: "List payments",
      description:
        "Retrieve a paginated list of payment transactions for the tenant. Includes both successful and failed payment attempts. " +
        "Payment status can be: pending, succeeded, failed, or refunded. Use cursor for pagination.",
    },
    defineOpMeta({
      op: "billing.listPayments",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "listPayments",
        zodQuery: { importPath: "@unisane/kernel", name: "ZSeekPageQuery" },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "limit", from: "query", key: "limit" },
          { name: "cursor", from: "query", key: "cursor", optional: true },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  subscription: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/billing/subscription",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            id: z.string().optional(),
            planId: ZPlanId.optional(),
            status: ZSubscriptionStatus.optional(),
            cancelAtPeriodEnd: z.boolean().optional(),
            currentPeriodEnd: z.string().optional(),
          }),
        }),
      },
      summary: "Get subscription",
      description:
        "Retrieve the current subscription details for a tenant. Returns the plan ID, subscription status " +
        "(active, canceled, past_due, trialing, incomplete), whether cancellation is pending, and the current billing period end date.",
    },
    defineOpMeta({
      op: "billing.getSubscription",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "getSubscription",
        callArgs: [],
        requireTenantMatch: true,
      },
    })
  ),
  changeQuantity: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/billing/subscription/quantity",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZChangeQuantity,
      responses: { 200: z.object({ ok: z.literal(true) }) },
      summary: "Change subscription quantity (seats)",
      description:
        "Update the number of seats/units for a per-seat subscription. Increasing quantity is charged immediately (prorated). " +
        "Decreasing quantity takes effect at the next billing cycle. Use this for team-based pricing models.",
    },
    defineOpMeta({
      op: "billing.changeQuantity",
      perm: PERM.BILLING_WRITE,
      invalidate: [
        { kind: "op", target: "billing.getSubscription", from: "params" },
      ],
      service: {
        importPath: "@unisane/billing",
        fn: "changeQuantity",
        zodBody: {
          importPath: "@unisane/billing",
          name: "ZChangeQuantity",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "quantity", from: "body", key: "quantity" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
});
