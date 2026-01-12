# Contracts & SDK Generation Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
> **Last Updated:** January 2026

This guide covers the contract-first development system: ts-rest contracts, metadata patterns, and SDK generation workflow.

---

## Table of Contents

1. [Overview](#overview)
2. [Contract Structure](#contract-structure)
3. [Defining Contracts with ts-rest](#defining-contracts-with-ts-rest)
4. [Operation Metadata (withMeta)](#operation-metadata-withmeta)
5. [Route Generation](#route-generation)
6. [SDK Generation](#sdk-generation)
7. [Type Generation](#type-generation)
8. [Schema Rules](#schema-rules)
9. [Development Workflow](#development-workflow)

---

## Overview

The contracts system is the **Single Source of Truth (SSOT)** for all API definitions. Using [ts-rest](https://ts-rest.com/), contracts generate:

1. **Route Handlers** - Next.js API routes with `makeHandler()`
2. **SDK Clients** - Type-safe browser and server API clients
3. **React Query Hooks** - Data fetching hooks with automatic invalidation
4. **TypeScript Types** - Browser-safe types extracted from Zod schemas

```
┌─────────────────────────────────────────────────────────────┐
│           starters/saaskit/src/contracts/                    │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Contract    │    │  withMeta   │    │ Zod Schemas │     │
│  │ Definitions │ +  │  (metadata) │ +  │ (validation)│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │routes:gen│    │ sdk:gen  │    │types:gen │
     └──────────┘    └──────────┘    └──────────┘
            │               │               │
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  Route   │    │  Client  │    │  Shared  │
     │ Handlers │    │  + Hooks │    │  Types   │
     └──────────┘    └──────────┘    └──────────┘
```

### Key Statistics (January 2026)

- **22 contract files** in `starters/saaskit/src/contracts/`
- **~80+ generated route files** in `app/api/rest/v1/`
- **~17,300 lines** of auto-generated code (91% of API layer)
- **100% type-safe** end-to-end from frontend to database

---

## Contract Structure

```
starters/saaskit/src/
├── contracts/
│   ├── app.router.ts           # Root router composition
│   ├── meta.ts                 # OpMeta types and helpers
│   │
│   ├── auth.contract.ts        # Authentication endpoints
│   ├── users.contract.ts       # User management
│   ├── tenants.contract.ts     # Tenant/workspace operations
│   ├── me.contract.ts          # Current user context
│   ├── memberships.contract.ts # Team member management
│   ├── apikeys.contract.ts     # API key CRUD
│   ├── billing.contract.ts     # Subscriptions & payments
│   ├── credits.contract.ts     # Usage-based billing
│   ├── flags.contract.ts       # Feature flags
│   ├── settings.contract.ts    # Settings management
│   ├── storage.contract.ts     # File storage
│   ├── audit.contract.ts       # Audit logging
│   ├── notify.contract.ts      # Notifications
│   ├── usage.contract.ts       # Usage metering
│   ├── webhooks.contract.ts    # Webhook management
│   ├── ai.contract.ts          # AI services
│   ├── pdf.contract.ts         # PDF generation
│   ├── jobs.contract.ts        # Background jobs
│   ├── analytics.contract.ts   # Analytics
│   ├── import-export.contract.ts # Data import/export
│   ├── entitlements.contract.ts  # Plan entitlements
│   └── outbox.contract.ts      # Event outbox admin
```

---

## Defining Contracts with ts-rest

### Basic Contract Definition

```typescript
// starters/saaskit/src/contracts/tenants.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { ZTenantCreate } from "@unisane/identity/client";
import { defineOpMeta, withMeta } from "./meta";
import { ZCursor, ZPlanId } from "@unisane/kernel/client";

const c = initContract();

// Admin-specific filter schema (inline)
export const ZAdminTenantFilters = z.object({
  q: z.string().optional(),
  slug: z.object({
    eq: z.string().optional(),
    contains: z.string().optional(),
  }).partial().optional(),
  planId: z.object({
    eq: ZPlanId.optional(),
    in: z.array(ZPlanId).optional(),
  }).partial().optional(),
}).partial();

// Admin list query schema (inline)
export const ZAdminListQuery = z.object({
  cursor: ZCursor.optional(),
  limit: z.coerce.number().int().positive().max(50).default(50),
  sort: z.string().optional(),
  filters: ZAdminTenantFilters.optional(),
});

// Response DTO (inline)
const ZTenantOut = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  planId: ZPlanId,
});

export const tenantsContract = c.router({
  // Create tenant (user-facing)
  create: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants",
      body: ZTenantCreate,
      responses: { 200: z.object({ ok: z.literal(true), data: ZTenantOut }) },
      summary: "Create tenant",
    },
    defineOpMeta({
      op: "tenants.create",
      requireUser: true,
      idempotent: true,
      service: {
        importPath: "@unisane/identity",
        fn: "createTenantForUser",
        zodBody: { importPath: "@unisane/identity", name: "ZTenantCreate" },
        invoke: "object",
        callArgs: [
          { name: "userId", from: "ctx", key: "userId" },
          { name: "input", from: "body" },
        ],
      },
    })
  ),

  // Admin: list tenants
  adminList: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/tenants",
      query: ZAdminListQuery,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(ZTenantOut),
            cursor: z.string().optional(),
          }),
        }),
      },
      summary: "Admin list tenants",
    },
    defineOpMeta({
      op: "admin.tenants.list",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/tenants",
        fn: "listAdminTenants",
        listKind: "admin",
        filtersSchema: {
          importPath: "./tenants.contract",
          name: "ZAdminTenantFilters",
        },
      },
    })
  ),
});
```

### Root Router Composition

```typescript
// starters/saaskit/src/contracts/app.router.ts
import { initContract } from "@ts-rest/core";
import { authContract } from "./auth.contract";
import { usersContract } from "./users.contract";
import { tenantsContract } from "./tenants.contract";
import { meContract } from "./me.contract";
import { settingsContract } from "./settings.contract";
import { creditsContract } from "./credits.contract";
import { usageContract } from "./usage.contract";
import { notifyContract } from "./notify.contract";
import { webhooksContract } from "./webhooks.contract";
import { billingContract } from "./billing.contract";
import { membershipsContract } from "./memberships.contract";
import { apikeysContract } from "./apikeys.contract";
import { flagsContract } from "./flags.contract";
import { importExportContract } from "./import-export.contract";
import { auditContract } from "./audit.contract";
import { aiContract } from "./ai.contract";
import { jobsContract } from "./jobs.contract";
import { entitlementsContract } from "./entitlements.contract";
import { pdfContract } from "./pdf.contract";
import { outboxContract } from "./outbox.contract";
import { analyticsContract } from "./analytics.contract";
import { storageContract } from "./storage.contract";

const c = initContract();

export const appRouter = c.router({
  auth: authContract,
  users: usersContract,
  tenants: tenantsContract,
  me: meContract,
  settings: settingsContract,
  credits: creditsContract,
  usage: usageContract,
  notify: notifyContract,
  webhooks: webhooksContract,
  billing: billingContract,
  memberships: membershipsContract,
  apikeys: apikeysContract,
  flags: flagsContract,
  importExport: importExportContract,
  audit: auditContract,
  ai: aiContract,
  jobs: jobsContract,
  entitlements: entitlementsContract,
  pdf: pdfContract,
  outbox: outboxContract,
  analytics: analyticsContract,
  storage: storageContract,
});
```

---

## Operation Metadata (withMeta)

`withMeta()` attaches runtime metadata to each operation. This metadata drives:
- Authentication requirements (`requireUser`, `requireSuperAdmin`, `allowUnauthed`)
- Authorization checks (`perm` for RBAC permissions, `requireTenantMatch`)
- Idempotency handling (`idempotent: true`)
- Service mapping for route generation (`service.importPath`, `service.fn`)
- Structured call arguments (`service.callArgs`)
- Runtime selection (`runtime: "nodejs" | "edge"`)

### OpMeta Type Definition

```typescript
// starters/saaskit/src/contracts/meta.ts
import type { ZodTypeAny } from "zod";
import type { Permission } from "@unisane/kernel/client";

export type OpMeta = {
  op: string;
  perm?: Permission;
  requireTenantMatch?: boolean;
  requireSuperAdmin?: boolean;
  requireUser?: boolean;
  allowUnauthed?: boolean;
  idempotent?: boolean;
  queryZod?: ZodTypeAny;
  /** Next.js runtime for the route. Default: 'nodejs'. */
  runtime?: "nodejs" | "edge";
  /** Response schema reference for type-safe codegen (optional). */
  responseSchema?: { importPath: string; name: string };
  invalidate?: Array<
    | { kind: "prefix"; key: [string, ...unknown[]] }
    | { kind: "key"; key: [string, ...unknown[]] }
    | {
        kind: "op";
        target: string;
        from?: "params" | "query" | "body";
        pick?: string[];
      }
  >;
  service?: {
    importPath: string;
    fn: string;
    callExpr?: string;
    zodBody?: { importPath: string; name: string };
    zodQuery?: { importPath: string; name: string };
    requireTenantMatch?: boolean;
    requireSuperAdmin?: boolean;
    raw?: boolean;
    rateKeyExpr?: string;
    extraImports?: Array<{ importPath: string; names: string[] }>;
    // List hints (used by codegen for common parsing patterns)
    listKind?: "admin" | "tenant" | "public";
    filtersSchema?: { importPath: string; name: string };
    // Structured call arguments (preferred over callExpr)
    invoke?: "object" | "positional";
    callArgs?: ReadonlyArray<{
      name: string; // Property name for 'object', index for 'positional'
      from: "params" | "query" | "body" | "ctx" | "const";
      key?: string; // Key in source object
      optional?: boolean; // Include only if defined
      transform?: "date" | "isoDate" | "number" | "string" | "boolean";
      value?: unknown; // When from === 'const'
      fallback?: { kind: "env" | "value"; key?: string; value?: unknown };
    }>;
    // Typed factory handler (advanced)
    factory?: { importPath: string; name: string };
    audit?: {
      resourceType: string;
      resourceIdExpr?: string;
      afterExpr?: string;
    };
  };
};

export function defineOpMeta<T extends OpMeta>(meta: T): T {
  return meta;
}

// Inline helper: attach OpMeta without altering the route type
export function withMeta<T extends object>(def: T, meta: OpMeta): T {
  try {
    Object.defineProperty(def as object, "meta", {
      value: meta,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  } catch {
    (def as Record<string, unknown>)["meta"] = meta;
  }
  return def as T;
}
```

### Common OpMeta Patterns

#### Pattern 1: Simple Mutation with Auth

```typescript
create: withMeta(
  {
    method: "POST",
    path: "/api/rest/v1/tenants",
    body: ZTenantCreate,
    responses: { 200: ZTenantOut },
  },
  defineOpMeta({
    op: "tenants.create",
    requireUser: true,
    idempotent: true,
    service: {
      importPath: "@unisane/identity",
      fn: "createTenantForUser",
      invoke: "object",
      callArgs: [
        { name: "userId", from: "ctx", key: "userId" },
        { name: "input", from: "body" },
      ],
    },
  })
)
```

#### Pattern 2: Admin List with Filters

```typescript
adminList: withMeta(
  {
    method: "GET",
    path: "/api/rest/v1/admin/users",
    query: ZAdminListQuery,
    responses: { 200: ZAdminListResponse },
  },
  defineOpMeta({
    op: "admin.users.list",
    requireUser: true,
    requireSuperAdmin: true,
    service: {
      importPath: "@unisane/identity",
      fn: "listAdminUsers",
      listKind: "admin",
      filtersSchema: {
        importPath: "./users.contract",
        name: "ZAdminUserFilters",
      },
    },
  })
)
```

#### Pattern 3: Tenant-Scoped Query

```typescript
balance: withMeta(
  {
    method: "GET",
    path: "/api/rest/v1/tenants/:tenantId/credits/balance",
    pathParams: z.object({ tenantId: z.string() }),
    responses: { 200: ZBalanceOut },
  },
  defineOpMeta({
    op: "credits.balance",
    requireUser: true,
    requireTenantMatch: true,
    service: {
      importPath: "@unisane/credits",
      fn: "balance",
      invoke: "object",
      callArgs: [
        { name: "tenantId", from: "params", key: "tenantId" },
      ],
    },
  })
)
```

#### Pattern 4: Webhook (No Auth)

```typescript
stripeWebhook: withMeta(
  {
    method: "POST",
    path: "/api/rest/v1/webhooks/in/stripe",
    body: z.any(),
    responses: { 200: z.object({ ok: z.literal(true) }) },
  },
  defineOpMeta({
    op: "webhooks.in.stripe",
    allowUnauthed: true, // Signature verified in handler
    runtime: "nodejs", // Requires Node.js for Stripe SDK
    service: {
      importPath: "@unisane/billing",
      fn: "handleStripeWebhook",
      raw: true, // Access raw request body
    },
  })
)
```

---

## Route Generation

The `routes:gen` command generates Next.js API route handlers from contracts using AST parsing.

### Command

```bash
# In starters/saaskit/
pnpm routes:gen

# Or via devtools
pnpm unisane devtools routes gen
```

### Generated Output Structure

```
starters/saaskit/src/app/api/rest/v1/
├── tenants/
│   ├── route.ts                              # POST /tenants (create)
│   ├── by-slug/[slug]/route.ts               # GET /tenants/by-slug/:slug
│   └── [tenantId]/
│       ├── settings/route.ts                 # GET/PATCH
│       ├── credits/
│       │   ├── balance/route.ts              # GET
│       │   ├── ledger/route.ts               # GET
│       │   └── burn/route.ts                 # POST
│       ├── billing/
│       │   ├── subscribe/route.ts            # POST
│       │   ├── subscription/route.ts         # GET
│       │   └── portal/route.ts               # GET
│       └── memberships/
│           └── route.ts                      # GET/POST
│
├── admin/
│   ├── tenants/
│   │   ├── route.ts                          # GET (list)
│   │   ├── export/route.ts                   # GET (CSV export)
│   │   ├── stats/route.ts                    # GET (statistics)
│   │   └── [id]/route.ts                     # GET/DELETE
│   └── users/
│       ├── route.ts                          # GET (list)
│       ├── facets/route.ts                   # GET (filter options)
│       ├── stats/route.ts                    # GET (statistics)
│       └── [id]/route.ts                     # GET/PATCH/DELETE
│
├── auth/
│   ├── password/
│   │   ├── signup/route.ts                   # POST
│   │   ├── signin/route.ts                   # POST
│   │   └── reset/
│   │       ├── start/route.ts                # POST
│   │       └── verify/route.ts               # POST
│   └── otp/
│       ├── start/route.ts                    # POST
│       └── verify/route.ts                   # POST
│
└── me/
    ├── route.ts                              # GET
    ├── profile/route.ts                      # GET/PATCH
    └── memberships/route.ts                  # GET
```

### Generated Route Handler Example

```typescript
// starters/saaskit/src/app/api/rest/v1/tenants/route.ts
// AUTO-GENERATED by 'npm run routes:gen' — DO NOT EDIT

import { makeHandler } from '@unisane/gateway';
import { createTenantForUser, ZTenantCreate as __BodySchema_POST } from '@unisane/identity';
import { z } from 'zod';

export const runtime = 'nodejs';

export const POST = makeHandler<typeof __BodySchema_POST>(
  {
    op: "tenants.create",
    requireUser: true,
    idempotent: true,
    zod: __BodySchema_POST
  },
  async ({ req, params, body, ctx, requestId }) => {
    const __body: z.output<typeof __BodySchema_POST> = body!;
    const __arg_userId = ctx?.userId;
    const __arg_input = __body;

    const result = await (createTenantForUser({
      userId: __arg_userId,
      input: __arg_input
    } as unknown as Parameters<typeof createTenantForUser>[0]));

    return result as unknown;
  }
);
```

### makeHandler Factory

The `makeHandler` function (from `@unisane/gateway`) provides:

1. **Context initialization** - `ctx.run()` wraps the handler
2. **Authentication** - Checks `requireUser`, `requireSuperAdmin`, `allowUnauthed`
3. **Authorization** - RBAC permission checks, tenant matching
4. **Request validation** - Zod schema validation for body/query/params
5. **Idempotency** - Deduplication based on `Idempotency-Key` header
6. **Error handling** - Domain errors → HTTP responses
7. **Observability** - Logging, tracing, metrics

---

## SDK Generation

The `sdk:gen` command generates type-safe API clients and React Query hooks from contracts.

### Command

```bash
# In starters/saaskit/
pnpm sdk:gen

# Or via devtools
pnpm unisane devtools sdk gen

# Generate specific targets
pnpm sdk:gen --clients      # Browser + server clients only
pnpm sdk:gen --hooks        # React Query hooks only
pnpm sdk:gen --types        # TypeScript types only
pnpm sdk:gen --admin-hooks  # Admin-specific hooks
```

### Generated Output Structure

```
starters/saaskit/src/sdk/
├── index.ts                                  # Main exports
├── server.ts                                 # Server-side exports
│
├── clients/
│   └── generated/
│       ├── browser.ts                        # Browser client (22+ modules)
│       └── server.ts                         # Server client (SSR-safe)
│
├── hooks/
│   ├── index.ts                              # Hook exports
│   └── generated/
│       ├── hooks.ts                          # Barrel export
│       ├── keys.ts                           # Query key factories
│       ├── invalidate.ts                     # Cache invalidation
│       ├── invalidate.op.ts                  # Operation invalidation
│       ├── useAdminListParams.ts             # Admin list state management
│       ├── shared/
│       │   ├── types.ts                      # ListOut, UnwrapOk
│       │   ├── unwrap.ts                     # Response unwrapping
│       │   └── index.ts
│       └── domains/
│           ├── auth.hooks.ts                 # Auth hooks
│           ├── users.hooks.ts                # User hooks
│           ├── tenants.hooks.ts              # Tenant hooks
│           ├── billing.hooks.ts              # Billing hooks
│           ├── credits.hooks.ts              # Credit hooks
│           └── ... (15+ domain hook files)
│
├── types/
│   ├── generated/
│   │   ├── index.ts                          # Barrel export
│   │   ├── auth.types.ts                     # Auth request/response types
│   │   ├── users.types.ts                    # User types
│   │   ├── tenants.types.ts                  # Tenant types
│   │   └── ... (20+ type files)
│   └── index.ts
│
└── registries/
    └── generated/
        ├── admin.tenants.fields.gen.ts       # Admin tenant field registry
        └── admin.users.fields.gen.ts         # Admin user field registry
```

### Generated Browser Client Example

```typescript
// src/sdk/clients/generated/browser.ts (excerpt)
/* AUTO-GENERATED by 'sdk:gen --clients' — DO NOT EDIT */

import type {
  TenantsCreateRequest,
  TenantsCreateResponse,
  TenantsAdminListRequest,
  TenantsAdminListResponse,
} from '../../types/generated/tenants.types';

// ... imports for all 22 modules

/**
 * Browser API client factory
 * Returns a fully typed API client for all domains
 */
export async function browserApi() {
  const baseUrl = ''; // Same origin

  return {
    auth: {
      passwordSignUp: async (req: AuthPasswordSignUpRequest) => { /* ... */ },
      passwordSignIn: async (req: AuthPasswordSignInRequest) => { /* ... */ },
      // ... more auth methods
    },
    tenants: {
      create: async (req: TenantsCreateRequest) => { /* ... */ },
      adminList: async (req: TenantsAdminListRequest) => { /* ... */ },
      // ... more tenant methods
    },
    admin: {
      tenants: {
        export: async (req: TenantsAdminExportRequest) => { /* ... */ },
        stats: async (req: TenantsAdminStatsRequest) => { /* ... */ },
        list: async (req: TenantsAdminListRequest) => { /* ... */ },
        // ...
      },
      users: {
        list: async (req: UsersAdminListRequest) => { /* ... */ },
        facets: async (req: UsersAdminFacetsRequest) => { /* ... */ },
        // ...
      },
      // ...
    },
    billing: { /* ... */ },
    credits: { /* ... */ },
    // ... 18 more domains
  };
}
```

### Generated React Query Hooks Example

```typescript
// src/sdk/hooks/generated/domains/tenants.hooks.ts (excerpt)
/* AUTO-GENERATED by 'sdk:gen --hooks' — DO NOT EDIT */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import type {
  TenantsCreateRequest,
  TenantsCreateResponse,
  TenantsAdminListRequest,
  TenantsAdminListResponse,
} from "../../types/generated/tenants.types";
import { browserApi } from "@/src/sdk/clients/generated/browser";
import { keys } from "../keys";
import { unwrapResponse } from "../shared/unwrap";

/** POST /api/rest/v1/tenants (mutation) */
export function useTenantsCreate(
  options?: MutationOpts<TenantsCreateResponse, TenantsCreateRequest>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TenantsCreateRequest) => {
      const api = await browserApi();
      return unwrapResponse<TenantsCreateResponse>(
        await api.tenants.create(variables)
      );
    },
    ...options,
    onSuccess: (data, variables, ctx) => {
      // Automatically invalidate list queries
      void qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "tenants" &&
          String(query.queryKey[1] ?? '').toLowerCase().includes('list'),
      });
      options?.onSuccess?.(data, variables, ctx);
    },
  });
}

/** GET /api/rest/v1/admin/tenants (query) */
export function useTenantsAdminList(
  arg?: TenantsAdminListRequest,
  options?: QueryOpts<TenantsAdminListResponse>
): UseQueryResult<TenantsAdminListResponse, unknown> {
  return useQuery({
    queryKey: keys.tenants.adminList(arg as any),
    queryFn: async () => {
      const api = await browserApi();
      return unwrapResponse<TenantsAdminListResponse>(
        await api.admin.tenants.list(arg)
      );
    },
    ...options,
  });
}

// ... more hooks
```

### Hook Usage Examples

```typescript
// Client component using generated hooks
"use client";
import {
  useTenantsCreate,
  useTenantsAdminList
} from "@/src/sdk/hooks/generated/domains/tenants.hooks";

export function TenantList() {
  // Query hook with automatic refetching
  const { data, isLoading, error } = useTenantsAdminList({
    query: { limit: 25, sort: "createdAt" }
  });

  // Mutation hook with automatic cache invalidation
  const createMutation = useTenantsCreate({
    onSuccess: (data) => {
      toast.success(`Tenant ${data.name} created!`);
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data?.items.map((tenant) => (
        <TenantCard key={tenant.id} tenant={tenant} />
      ))}
      <button
        onClick={() => createMutation.mutate({
          name: "New Tenant",
          slug: "new-tenant"
        })}
      >
        Create Tenant
      </button>
    </div>
  );
}
```

### Query Key Factories

```typescript
// src/sdk/hooks/generated/keys.ts (excerpt)
/* AUTO-GENERATED - query key factories for all domains */

export const keys = {
  tenants: {
    all: ["tenants"] as const,
    lists: () => [...keys.tenants.all, "list"] as const,
    adminList: (args?: any) => [...keys.tenants.lists(), "admin", args] as const,
    detail: (id: string) => [...keys.tenants.all, "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    lists: () => [...keys.users.all, "list"] as const,
    adminList: (args?: any) => [...keys.users.lists(), "admin", args] as const,
    detail: (id: string) => [...keys.users.all, "detail", id] as const,
  },
  billing: {
    all: ["billing"] as const,
    subscription: () => [...keys.billing.all, "subscription"] as const,
    invoices: () => [...keys.billing.all, "invoices"] as const,
  },
  // ... 20+ more domains
};
```

---

## Type Generation

Types are automatically extracted from Zod schemas and generated as browser-safe TypeScript types.

### Generated Types Structure

```
src/sdk/types/generated/
├── index.ts                          # Barrel export: export * from './auth.types'; ...
├── auth.types.ts                     # AuthPasswordSignUpRequest, AuthPasswordSignUpResponse, ...
├── users.types.ts                    # UsersAdminListRequest, UsersAdminListResponse, ...
├── tenants.types.ts                  # TenantsCreateRequest, TenantsCreateResponse, ...
├── billing.types.ts                  # BillingSubscribeRequest, BillingSubscribeResponse, ...
└── ... (20+ type files)
```

### Type Naming Convention

For operation `tenants.adminList`:
- Request type: `TenantsAdminListRequest`
- Response type: `TenantsAdminListResponse`

Pattern: `{Domain}{OperationName}Request` / `{Domain}{OperationName}Response`

### Usage in Components

```typescript
// ✅ CORRECT - Import from SDK types
import type {
  Tenant,
  TenantCreate,
  TenantsCreateRequest,
  TenantsCreateResponse,
} from "@/src/sdk/types";

interface TenantCardProps {
  tenant: Tenant;
  onEdit?: (tenant: Tenant) => void;
}

export function TenantCard({ tenant, onEdit }: TenantCardProps) {
  return (
    <div>
      <h3>{tenant.name}</h3>
      <p>{tenant.slug}</p>
    </div>
  );
}
```

```typescript
// ❌ WRONG - Never define types manually in components
interface Tenant {
  id: string;
  name: string;
  // Don't do this! Types are generated from contracts
}
```

### Type Flow

```
Zod Schema (contracts)
        │
        ▼
defineOpMeta + ts-rest  →  TypeScript AST
        │
        ▼
sdk:gen extracts types  →  src/sdk/types/generated/*.types.ts
        │
        ▼
Components import       →  @/src/sdk/types
```

---

## Schema Rules

> **IMPORTANT:** Follow these rules to maintain a clean schema hierarchy and prevent duplication.

### Schema Hierarchy

```
Level 1: packages/[module]/domain/schemas.ts    → SSOT (Single Source of Truth)
Level 2: packages/[module]/client.ts            → Re-exports for client use
Level 3: starters/saaskit/src/contracts/*.ts    → Imports from packages + inline DTOs
Level 4: starters/saaskit/src/sdk/types/        → Generated browser-safe types
```

### What Goes Where

| Schema Type | Location | Example |
|-------------|----------|---------|
| **Domain schemas** | `packages/[module]/domain/schemas.ts` | `ZTenant`, `ZUser`, `ZSubscription` |
| **Client schemas** | `packages/[module]/client.ts` | Re-exports of domain schemas |
| **Request DTOs** | `contracts/*.contract.ts` (inline) | `ZTenantCreate`, `ZApiKeyCreate` |
| **Response DTOs** | `contracts/*.contract.ts` (inline) | `ZTenantOut`, `ZMeOut`, `ZLedgerItem` |
| **Admin query schemas** | `contracts/*.contract.ts` (inline) | `ZAdminListQuery`, `ZAdminUserFilters` |

### Rules

1. **Domain schemas MUST be defined in packages**
   ```typescript
   // ✅ CORRECT - In packages/identity/domain/schemas.ts
   export const ZTenantCreate = z.object({
     name: z.string().min(1).max(100),
     slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/)
   });

   // ❌ WRONG - Defining domain logic in contract
   const ZTenantCreate = z.object({ name: z.string(), slug: z.string() });
   ```

2. **Contracts MUST import domain schemas from packages**
   ```typescript
   // ✅ CORRECT
   import { ZTenantCreate, ZTenantFilters } from '@unisane/identity/client';

   // ❌ WRONG - Duplicating package schemas
   const ZTenantFilters = z.object({ planId: z.string().optional() });
   ```

3. **Response DTOs are allowed inline in contracts**
   ```typescript
   // ✅ CORRECT - Response DTO specific to this endpoint
   const ZMeOut = z.object({
     userId: z.string(),
     tenantId: z.string().nullable(),
     role: z.string(),
     plan: z.string(),
   });
   ```

4. **Admin query schemas are allowed inline**
   ```typescript
   // ✅ CORRECT - Admin-specific query params
   export const ZAdminListQuery = z.object({
     cursor: ZCursor.optional(),
     limit: z.coerce.number().max(50).default(50),
     sort: z.string().optional(),
     filters: ZAdminUserFilters.optional(),
   });
   ```

5. **Enums and constants MUST come from kernel**
   ```typescript
   // ✅ CORRECT
   import { ZPlanId, ZCreditKind, ZCursor } from '@unisane/kernel/client';

   // ❌ WRONG - Hardcoding enum values
   const PLANS = ['free', 'pro', 'business'] as const;
   ```

### TenantId Nullability Policy

| Context | Schema | Example |
|---------|--------|---------|
| **Input schemas** | Omit tenantId | `ZCreateFile` - tenantId from context |
| **Entity responses** (tenant-scoped) | `z.string().min(1)` | `ZStorageFileResponse.tenantId` |
| **User context responses** | `z.string().nullable()` | `ZMeOut.tenantId` (user may have no tenant) |
| **Admin list filters** | `z.string().optional()` | `ZAdminFilters.tenantId` (filter param) |

**Rules:**
1. Never accept `tenantId` in request body - always use context via `getTenantId()`
2. Tenant-scoped entity responses MUST have required `tenantId: z.string().min(1)`
3. User context responses (like `/me`) MAY have nullable tenantId
4. Admin filters MAY have optional tenantId for cross-tenant queries

---

## Development Workflow

### Adding a New Endpoint

**1. Define or import schema** in contracts

```typescript
// If new domain entity, define in packages/[module]/domain/schemas.ts
export const ZApiKeyCreate = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

// Export from packages/[module]/client.ts
export { ZApiKeyCreate } from './domain/schemas';
```

**2. Add contract** in `starters/saaskit/src/contracts/[domain].contract.ts`

```typescript
import { ZApiKeyCreate } from "@unisane/identity/client";

export const apikeysContract = c.router({
  create: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/apikeys",
      pathParams: z.object({ tenantId: z.string() }),
      body: ZApiKeyCreate,
      responses: { 200: z.object({ ok: z.literal(true), data: ZApiKeyOut }) },
      summary: "Create API key",
    },
    defineOpMeta({
      op: "apikeys.create",
      requireUser: true,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/identity",
        fn: "createApiKey",
        invoke: "object",
        callArgs: [
          { name: "tenantId", from: "params", key: "tenantId" },
          { name: "userId", from: "ctx", key: "userId" },
          { name: "input", from: "body" },
        ],
      },
    })
  ),
});
```

**3. Implement service function** in packages

```typescript
// packages/identity/src/service/apikeys.service.ts
import type { ZApiKeyCreate } from '../domain/schemas';
import { z } from 'zod';

export async function createApiKey(input: {
  tenantId: string;
  userId: string;
  input: z.infer<typeof ZApiKeyCreate>;
}) {
  // Implementation
}
```

**4. Run generators**

```bash
# Generate route handlers
pnpm routes:gen

# Generate SDK clients + hooks
pnpm sdk:gen

# Or run both
pnpm codegen
```

**5. Use in frontend**

```typescript
import { useApikeysCreate } from "@/src/sdk/hooks/generated/domains/apikeys.hooks";

function CreateApiKeyButton() {
  const create = useApikeysCreate({
    onSuccess: (data) => {
      toast.success("API key created!");
    },
  });

  return (
    <button onClick={() => create.mutate({
      name: "Production API Key",
      expiresAt: "2026-12-31T23:59:59Z"
    })}>
      Create API Key
    </button>
  );
}
```

### Codegen Commands

| Command | Description |
|---------|-------------|
| `pnpm routes:gen` | Generate API route handlers from contracts |
| `pnpm sdk:gen` | Generate SDK clients and React Query hooks |
| `pnpm sdk:gen --clients` | Generate clients only (browser + server) |
| `pnpm sdk:gen --hooks` | Generate React Query hooks only |
| `pnpm sdk:gen --types` | Generate TypeScript types only |
| `pnpm sdk:gen --admin-hooks` | Generate admin-specific hooks |
| `pnpm codegen` | Run all generators (routes + sdk + types) |

### CLI via devtools

```bash
# Via devtools CLI
pnpm unisane devtools routes gen
pnpm unisane devtools sdk gen
pnpm unisane devtools sdk gen --clients
pnpm unisane devtools sdk gen --hooks
```

---

## Quick Reference

### File Locations

| What | Location |
|------|----------|
| **Contracts** | `starters/saaskit/src/contracts/*.contract.ts` |
| **Router** | `starters/saaskit/src/contracts/app.router.ts` |
| **Meta types** | `starters/saaskit/src/contracts/meta.ts` |
| **Generated routes** | `starters/saaskit/src/app/api/rest/v1/**/*.ts` |
| **Generated SDK** | `starters/saaskit/src/sdk/` |
| **Generated types** | `starters/saaskit/src/sdk/types/generated/*.types.ts` |
| **Generated hooks** | `starters/saaskit/src/sdk/hooks/generated/domains/*.hooks.ts` |
| **Codegen scripts** | `packages/tooling/devtools/src/generators/` |

### Common Patterns

#### CRUD Operations

```typescript
export const resourceContract = c.router({
  list: withMeta({ /* GET /resources */ }, { /* ... */ }),
  create: withMeta({ /* POST /resources */ }, { /* ... */ }),
  get: withMeta({ /* GET /resources/:id */ }, { /* ... */ }),
  update: withMeta({ /* PATCH /resources/:id */ }, { /* ... */ }),
  delete: withMeta({ /* DELETE /resources/:id */ }, { /* ... */ }),
});
```

#### Tenant-Scoped Operations

```typescript
path: "/api/rest/v1/tenants/:tenantId/resource",
pathParams: z.object({ tenantId: z.string() }),
// ...
defineOpMeta({
  requireUser: true,
  requireTenantMatch: true, // Ensures ctx.tenantId === params.tenantId
  // ...
})
```

#### Admin Operations

```typescript
path: "/api/rest/v1/admin/resources",
// ...
defineOpMeta({
  op: "admin.resources.list",
  requireUser: true,
  requireSuperAdmin: true, // Requires 'superadmin' role
  service: {
    listKind: "admin",
    filtersSchema: { importPath: "./...", name: "ZAdminResourceFilters" },
    // ...
  },
})
```

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [dev-tools.md](./dev-tools.md), [QUICK-REFERENCE.md](./QUICK-REFERENCE.md), [sdk-architecture.md](./sdk-architecture.md)
