import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ZGrantTokens,
  ZBurnTokens,
} from "@unisane/credits/client";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel/client";
import { ZCreditKind } from "@unisane/kernel/client";
import { ZFeatureKey } from "@unisane/kernel/client";

const c = initContract();

const ZLedgerItem = z.object({
  id: z.string(),
  kind: ZCreditKind,
  amount: z.number(),
  reason: z.string(),
  feature: ZFeatureKey.nullable(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
});

const ZCreditsBucket = z.object({
  grants: z.number(),
  burns: z.number(),
  available: z.number(),
});

const ZCreditsBreakdown = z.object({
  total: ZCreditsBucket,
  subscription: ZCreditsBucket,
  topup: ZCreditsBucket,
  other: ZCreditsBucket,
});

export const creditsContract = c.router({
  grant: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/credits/grant",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZGrantTokens,
      responses: { 200: z.object({ ok: z.literal(true) }) },
      summary: "Grant credits",
      description: "Add credits to a tenant's balance. Supports optional expiration date. Idempotent via idem key - duplicate requests with same idem are ignored. Changes are audited. Requires BILLING_WRITE permission.",
    },
    defineOpMeta({
      op: "credits.grant",
      perm: PERM.BILLING_WRITE,
      idempotent: true,
      invalidate: [
        { kind: "prefix", key: ["credits", "balance"] },
        { kind: "prefix", key: ["credits", "ledger"] },
      ],
      service: {
        importPath: "@unisane/credits",
        fn: "grant",
        zodBody: {
          importPath: "@unisane/credits",
          name: "ZGrantTokens",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "amount", from: "body", key: "amount" },
          { name: "reason", from: "body", key: "reason" },
          { name: "idem", from: "body", key: "idem" },
          {
            name: "expiresAt",
            from: "body",
            key: "expiresAt",
            optional: true,
            transform: "date",
          },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "credits",
          afterExpr: "{ amount: body.amount, reason: body.reason, result }",
        },
      },
    })
  ),
  burn: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/credits/burn",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZBurnTokens,
      responses: { 200: z.object({ ok: z.literal(true) }) },
      summary: "Burn credits",
      description: "Consume credits from a tenant's balance for feature usage. Idempotent via idem key. Optionally specify which feature the credits are being used for. Changes are audited. Requires BILLING_WRITE permission.",
    },
    defineOpMeta({
      op: "credits.burn",
      perm: PERM.BILLING_WRITE,
      idempotent: true,
      invalidate: [
        { kind: "prefix", key: ["credits", "balance"] },
        { kind: "prefix", key: ["credits", "ledger"] },
      ],
      service: {
        importPath: "@unisane/credits",
        fn: "consume",
        zodBody: {
          importPath: "@unisane/credits",
          name: "ZBurnTokens",
        },
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "amount", from: "body", key: "amount" },
          { name: "reason", from: "body", key: "reason" },
          { name: "feature", from: "body", key: "feature", optional: true },
          { name: "idem", from: "body", key: "idem" },
        ],
        requireTenantMatch: true,
        audit: {
          resourceType: "credits",
          afterExpr:
            "{ amount: body.amount, feature: body.feature ?? 'usage', result }",
        },
      },
    })
  ),
  ledger: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/credits/ledger",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(ZLedgerItem),
            nextCursor: z.string().optional(),
            prevCursor: z.string().optional(),
          }),
        }),
      },
      summary: "Credits ledger",
      description: "List credit transaction history for a tenant. Shows grants, burns, and expirations with timestamps and reasons. Supports cursor-based pagination.",
    },
    defineOpMeta({
      op: "credits.ledger",
      service: {
        importPath: "@unisane/credits",
        fn: "listLedger",
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
  balance: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/credits/balance",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            amount: z.number(),
            effectiveAt: z.string().optional(),
          }),
        }),
      },
      summary: "Credits balance",
      description: "Get the current available credit balance for a tenant. Returns the total spendable amount after accounting for grants, burns, and expirations.",
    },
    defineOpMeta({
      op: "credits.balance",
      service: {
        importPath: "@unisane/credits",
        fn: "balance",
        callArgs: [],
        requireTenantMatch: true,
      },
    })
  ),
  breakdown: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/credits/breakdown",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: ZCreditsBreakdown,
        }),
      },
      summary: "Credits balance breakdown by source",
      description: "Get detailed credit balance breakdown by source type (subscription grants, top-ups, other). Shows total grants, burns, and available balance for each category.",
    },
    defineOpMeta({
      op: "credits.breakdown",
      service: {
        importPath: "@unisane/credits",
        fn: "breakdown",
        callArgs: [],
        requireTenantMatch: true,
      },
    })
  ),
});
