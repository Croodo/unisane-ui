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
      summary:
        "Change subscription plan (upgrades only; downgrades via portal)",
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
    },
    defineOpMeta({
      op: "billing.getSubscription",
      perm: PERM.BILLING_WRITE,
      service: {
        importPath: "@unisane/billing",
        fn: "getSubscription",
        invoke: "object",
        callArgs: [{ name: "tenantId", from: "params", key: "tenantId" }],
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
