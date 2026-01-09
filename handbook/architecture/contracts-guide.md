# Contracts & SDK Generation Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

This guide covers the contracts package, ts-rest integration, defineOpMeta patterns, and SDK generation workflow.

---

## Table of Contents

1. [Overview](#overview)
2. [Contracts Package Structure](#contracts-package-structure)
3. [Defining Contracts with ts-rest](#defining-contracts-with-ts-rest)
4. [defineOpMeta - Operation Metadata](#defineopmeta---operation-metadata)
5. [Route Generation (routes:gen)](#route-generation-routesgen)
6. [SDK Generation (sdk:gen)](#sdk-generation-sdkgen)
7. [Type Generation](#type-generation)
8. [Contract Versioning](#contract-versioning)
9. [Testing Contracts](#testing-contracts)
10. [Schema Rules](#schema-rules)

---

## Overview

The contracts package (`@unisane/contracts`) is the **Single Source of Truth (SSOT)** for all API definitions. It uses [ts-rest](https://ts-rest.com/) to define type-safe API contracts that generate:

1. **Route Handlers** - Server-side API routes
2. **SDK Clients** - Type-safe API clients for browser/server
3. **React Query Hooks** - Data fetching hooks with caching
4. **TypeScript Types** - Shared types for request/response

```
┌─────────────────────────────────────────────────────────────┐
│                    @unisane/contracts                        │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Contract    │    │ defineOpMeta│    │ Zod Schemas │     │
│  │ Definitions │ +  │ (metadata)  │ +  │ (validation)│     │
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

---

## Contracts Package Structure

```
packages/contracts/
├── src/
│   ├── index.ts              # Main exports
│   ├── contract.ts           # Root contract composition
│   ├── meta.ts               # defineOpMeta registry
│   │
│   ├── identity/
│   │   ├── index.ts
│   │   ├── users.contract.ts
│   │   └── users.schema.ts
│   │
│   ├── tenants/
│   │   ├── index.ts
│   │   ├── tenants.contract.ts
│   │   └── tenants.schema.ts
│   │
│   ├── billing/
│   │   ├── index.ts
│   │   ├── subscriptions.contract.ts
│   │   ├── invoices.contract.ts
│   │   └── billing.schema.ts
│   │
│   └── ... (other modules)
│
├── package.json
└── tsconfig.json
```

---

## Defining Contracts with ts-rest

### Basic Contract Definition

```typescript
// packages/contracts/src/tenants/tenants.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  TenantSchema,
  CreateTenantSchema,
  UpdateTenantSchema,
} from "./tenants.schema";

const c = initContract();

export const tenantsContract = c.router(
  {
    // List tenants
    list: {
      method: "GET",
      path: "/tenants",
      query: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
      }),
      responses: {
        200: z.object({
          items: z.array(TenantSchema),
          nextCursor: z.string().optional(),
        }),
      },
      summary: "List tenants for current user",
    },

    // Get single tenant
    get: {
      method: "GET",
      path: "/tenants/:id",
      pathParams: z.object({
        id: z.string().uuid(),
      }),
      responses: {
        200: TenantSchema,
        404: z.object({ error: z.string() }),
      },
      summary: "Get tenant by ID",
    },

    // Create tenant
    create: {
      method: "POST",
      path: "/tenants",
      body: CreateTenantSchema,
      responses: {
        201: TenantSchema,
        400: z.object({ error: z.string() }),
      },
      summary: "Create a new tenant",
    },

    // Update tenant
    update: {
      method: "PATCH",
      path: "/tenants/:id",
      pathParams: z.object({
        id: z.string().uuid(),
      }),
      body: UpdateTenantSchema,
      responses: {
        200: TenantSchema,
        404: z.object({ error: z.string() }),
      },
      summary: "Update tenant",
    },

    // Delete tenant
    delete: {
      method: "DELETE",
      path: "/tenants/:id",
      pathParams: z.object({
        id: z.string().uuid(),
      }),
      responses: {
        204: z.undefined(),
        404: z.object({ error: z.string() }),
      },
      summary: "Delete tenant",
    },
  },
  {
    pathPrefix: "/api/v1",
  }
);
```

### Schema Definitions

```typescript
// packages/contracts/src/tenants/tenants.schema.ts
import { z } from "zod";

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  plan: z.enum(["free", "pro", "enterprise"]),
  ownerId: z.string().uuid(),
  settings: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z.record(z.unknown()).optional(),
});

// Type exports for use in services
export type Tenant = z.infer<typeof TenantSchema>;
export type CreateTenant = z.infer<typeof CreateTenantSchema>;
export type UpdateTenant = z.infer<typeof UpdateTenantSchema>;
```

### Root Contract Composition

```typescript
// packages/contracts/src/contract.ts
import { initContract } from "@ts-rest/core";
import { tenantsContract } from "./tenants/tenants.contract";
import { usersContract } from "./identity/users.contract";
import { subscriptionsContract } from "./billing/subscriptions.contract";
import { creditsContract } from "./credits/credits.contract";

const c = initContract();

export const contract = c.router({
  tenants: tenantsContract,
  users: usersContract,
  subscriptions: subscriptionsContract,
  credits: creditsContract,
  // ... other module contracts
});

export type AppContract = typeof contract;
```

---

## defineOpMeta - Operation Metadata

`defineOpMeta` attaches runtime metadata to each operation. This metadata drives:
- Authentication requirements
- Rate limiting configuration
- Service mapping for route generation
- Runtime selection (Node.js vs Edge)

### Syntax

```typescript
// packages/contracts/src/meta.ts
import { defineOpMeta } from "@unisane/contracts/utils";

export const opMeta = defineOpMeta({
  // ─────────────────────────────────────────────────────────
  // TENANTS
  // ─────────────────────────────────────────────────────────
  "tenants.list": {
    auth: "required",
    rateLimit: { key: "user", limit: 100, window: "1m" },
    service: "tenants",
    fn: "listTenants",
  },

  "tenants.get": {
    auth: "required",
    rateLimit: { key: "user", limit: 200, window: "1m" },
    service: "tenants",
    fn: "readTenant",
  },

  "tenants.create": {
    auth: "required",
    rateLimit: { key: "user", limit: 10, window: "1h" },
    service: "tenants",
    fn: "createTenant",
    idempotent: true,
  },

  "tenants.update": {
    auth: "required",
    permission: "tenant:update",
    rateLimit: { key: "tenant", limit: 50, window: "1m" },
    service: "tenants",
    fn: "updateTenant",
  },

  "tenants.delete": {
    auth: "required",
    permission: "tenant:delete",
    rateLimit: { key: "tenant", limit: 5, window: "1h" },
    service: "tenants",
    fn: "deleteTenant",
  },

  // ─────────────────────────────────────────────────────────
  // BILLING
  // ─────────────────────────────────────────────────────────
  "subscriptions.create": {
    auth: "required",
    permission: "billing:manage",
    rateLimit: { key: "tenant", limit: 10, window: "1h" },
    service: "billing",
    fn: "createSubscription",
    idempotent: true,
    runtime: "nodejs", // Requires Node.js for Stripe SDK
  },

  "subscriptions.webhook": {
    auth: "none", // Webhook signature verified in handler
    rateLimit: { key: "ip", limit: 1000, window: "1m" },
    service: "billing",
    fn: "handleWebhook",
    runtime: "nodejs",
  },

  // ─────────────────────────────────────────────────────────
  // CREDITS
  // ─────────────────────────────────────────────────────────
  "credits.balance": {
    auth: "required",
    rateLimit: { key: "tenant", limit: 100, window: "1m" },
    service: "credits",
    fn: "balance",
    cache: { ttl: 10, scope: "tenant" },
  },

  "credits.consume": {
    auth: "required",
    permission: "credits:consume",
    rateLimit: { key: "tenant", limit: 1000, window: "1m" },
    service: "credits",
    fn: "consume",
    idempotent: true,
  },
});
```

### defineOpMeta Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `auth` | `"required"` \| `"optional"` \| `"none"` | Authentication requirement |
| `permission` | `string` | Required RBAC permission (e.g., `"tenant:update"`) |
| `rateLimit.key` | `"user"` \| `"tenant"` \| `"ip"` \| `"global"` | Rate limit scope |
| `rateLimit.limit` | `number` | Max requests in window |
| `rateLimit.window` | `"1s"` \| `"1m"` \| `"1h"` \| `"1d"` | Time window |
| `service` | `string` | Module/service name for route generation |
| `fn` | `string` | Function name to call in service |
| `idempotent` | `boolean` | Enable idempotency key handling |
| `runtime` | `"nodejs"` \| `"edge"` | Runtime requirement (default: edge) |
| `cache` | `{ ttl: number, scope: string }` | Response caching config |
| `timeout` | `number` | Request timeout in ms |

### How AST Parsing Extracts Metadata

The `routes:gen` command parses `defineOpMeta` using TypeScript AST:

```typescript
// tools/codegen/src/routes-gen.ts (simplified)
import ts from "typescript";

function extractOpMeta(sourceFile: ts.SourceFile) {
  const meta: Record<string, OpMeta> = {};

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isCallExpression(node)) {
      const fn = node.expression;
      if (ts.isIdentifier(fn) && fn.text === "defineOpMeta") {
        const arg = node.arguments[0];
        if (ts.isObjectLiteralExpression(arg)) {
          // Parse each property
          arg.properties.forEach((prop) => {
            if (ts.isPropertyAssignment(prop)) {
              const key = prop.name.getText();
              const value = parseObjectLiteral(prop.initializer);
              meta[key] = value;
            }
          });
        }
      }
    }
  });

  return meta;
}
```

---

## Route Generation (routes:gen)

The `routes:gen` command generates Next.js API route handlers from contracts.

### Command

```bash
pnpm routes:gen
```

### Generated Output Structure

```
starters/saaskit/src/
├── app/
│   └── api/
│       └── v1/
│           ├── tenants/
│           │   ├── route.ts           # GET (list), POST (create)
│           │   └── [id]/
│           │       └── route.ts       # GET, PATCH, DELETE
│           │
│           ├── users/
│           │   ├── route.ts
│           │   └── [id]/
│           │       └── route.ts
│           │
│           └── billing/
│               ├── subscriptions/
│               │   └── route.ts
│               └── webhooks/
│                   └── stripe/
│                       └── route.ts
```

### Generated Route Handler Example

```typescript
// starters/saaskit/src/app/api/v1/tenants/route.ts
// AUTO-GENERATED - DO NOT EDIT

import { createHandler } from "@/lib/api/handler";
import { tenantsContract } from "@unisane/contracts";
import * as tenants from "@/modules/tenants";

// GET /api/v1/tenants - List tenants
export const GET = createHandler(tenantsContract.list, {
  auth: "required",
  rateLimit: { key: "user", limit: 100, window: "1m" },
  handler: async (req, ctx) => {
    const result = await tenants.listTenants({
      cursor: req.query.cursor,
      limit: req.query.limit,
    });
    return { status: 200, body: result };
  },
});

// POST /api/v1/tenants - Create tenant
export const POST = createHandler(tenantsContract.create, {
  auth: "required",
  rateLimit: { key: "user", limit: 10, window: "1h" },
  idempotent: true,
  handler: async (req, ctx) => {
    const result = await tenants.createTenant(req.body);
    return { status: 201, body: result };
  },
});
```

### createHandler Factory

```typescript
// starters/saaskit/src/lib/api/handler.ts
import { ctx } from "@unisane/kernel";
import { withAuth, withRateLimit, withIdempotency } from "@unisane/gateway";

export function createHandler<T>(contract: T, options: HandlerOptions) {
  return async (request: Request) => {
    return ctx.run({ requestId: crypto.randomUUID() }, async () => {
      // 1. Auth middleware
      if (options.auth !== "none") {
        await withAuth(request, options.auth);
      }

      // 2. Rate limiting
      if (options.rateLimit) {
        await withRateLimit(request, options.rateLimit);
      }

      // 3. Idempotency
      if (options.idempotent) {
        const cached = await withIdempotency(request);
        if (cached) return cached;
      }

      // 4. Parse and validate request
      const parsed = await parseRequest(contract, request);

      // 5. Execute handler
      const result = await options.handler(parsed, ctx.get());

      // 6. Return response
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    });
  };
}
```

---

## SDK Generation (sdk:gen)

The `sdk:gen` command generates type-safe API clients and React Query hooks.

### Command

```bash
pnpm sdk:gen
```

### Generated Output Structure

```
src/sdk/                                  # 100% auto-generated, gitignored
├── index.ts                              # Main exports: createApi, createServerClient
├── client.ts                             # Base client factory
│
├── client/                               # Unified namespace client
│   ├── index.ts                          # Re-exports all domain clients
│   ├── tenants.ts                        # client.tenants.list(), .get(), .create()
│   ├── users.ts                          # client.users.list(), .get(), .update()
│   ├── billing.ts                        # client.billing.subscriptions.create()
│   └── credits.ts                        # client.credits.balance(), .consume()
│
├── hooks/                                # React Query hooks (namespace pattern)
│   ├── index.ts                          # Re-exports all domain hooks
│   ├── tenants.ts                        # hooks.tenants.list(), .get(), .create()
│   ├── users.ts                          # hooks.users.list(), .get(), .update()
│   ├── billing.ts                        # hooks.billing.subscriptions.list()
│   └── credits.ts                        # hooks.credits.balance(), .consume()
│
├── types/                                # Generated TypeScript types
│   ├── index.ts                          # Barrel export all types
│   └── domains/                          # Per-domain types from Zod schemas
│       ├── tenants.ts                    # Tenant, TenantCreate, TenantUpdate
│       ├── users.ts                      # User, UserCreate, etc.
│       └── billing.ts                    # Subscription, Invoice, etc.
│
└── invalidate/
    └── index.ts                          # Cache invalidation utilities
```

### Generated Client Example

```typescript
// src/sdk/client/tenants.ts
// AUTO-GENERATED - DO NOT EDIT

import { initClient } from "@ts-rest/core";
import { tenantsContract } from "@/src/contracts/tenants.contract";
import { getClientConfig } from "../config";

// Unified namespace client - accessed via client.tenants
export const tenants = {
  list: async (query?: { cursor?: string; limit?: number }) => {
    const client = initClient(tenantsContract, getClientConfig());
    return client.list({ query: query ?? {} });
  },

  get: async (id: string) => {
    const client = initClient(tenantsContract, getClientConfig());
    return client.get({ params: { id } });
  },

  create: async (data: CreateTenantInput) => {
    const client = initClient(tenantsContract, getClientConfig());
    return client.create({ body: data });
  },

  update: async (id: string, data: UpdateTenantInput) => {
    const client = initClient(tenantsContract, getClientConfig());
    return client.update({ params: { id }, body: data });
  },

  remove: async (id: string) => {
    const client = initClient(tenantsContract, getClientConfig());
    return client.delete({ params: { id } });
  },
};

// Usage (unified namespace):
// import { createApi } from "@/src/sdk";
// const client = await createApi();
// const res = await client.tenants.list({ limit: 10 });
// if (res.status === 200) console.log(res.body.items);
```

### Generated React Query Hooks Example

```typescript
// src/sdk/hooks/tenants.ts
// AUTO-GENERATED - DO NOT EDIT

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../client";
import type { Tenant, TenantCreate, TenantUpdate } from "../types";

// Query keys factory
const keys = {
  all: ["tenants"] as const,
  lists: () => [...keys.all, "list"] as const,
  list: (filters: ListFilters) => [...keys.lists(), filters] as const,
  details: () => [...keys.all, "detail"] as const,
  detail: (id: string) => [...keys.details(), id] as const,
};

// ─────────────────────────────────────────────────────────
// Namespace Pattern: hooks.tenants.{action}()
// No 'use' prefix - namespace provides context
// ─────────────────────────────────────────────────────────

// hooks.tenants.list() - List tenants query
export function list(
  filters?: { cursor?: string; limit?: number },
  options?: UseQueryOptions
) {
  const client = useApiClient();

  return useQuery({
    queryKey: keys.list(filters ?? {}),
    queryFn: async () => {
      const res = await client.tenants.list(filters ?? {});
      if (res.status !== 200) throw new Error("Failed to fetch tenants");
      return res.body;
    },
    ...options,
  });
}

// hooks.tenants.listParams() - DataTable state management
export function listParams(defaults?: { limit?: number; sort?: string }) {
  // Returns memoized query args for DataTable integration
  // ... implementation
}

// hooks.tenants.get() - Get single tenant
export function get(id: string, options?: UseQueryOptions) {
  const client = useApiClient();

  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = await client.tenants.get(id);
      if (res.status !== 200) throw new Error("Tenant not found");
      return res.body;
    },
    enabled: !!id,
    ...options,
  });
}

// hooks.tenants.create() - Create tenant mutation
export function create(options?: UseMutationOptions) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TenantCreate) => {
      const res = await client.tenants.create(data);
      if (res.status !== 201) throw new Error("Failed to create tenant");
      return res.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.lists() });
    },
    ...options,
  });
}

// hooks.tenants.update() - Update tenant mutation
export function update(options?: UseMutationOptions) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TenantUpdate }) => {
      const res = await client.tenants.update(id, data);
      if (res.status !== 200) throw new Error("Failed to update tenant");
      return res.body;
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(keys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: keys.lists() });
    },
    ...options,
  });
}

// hooks.tenants.remove() - Delete tenant mutation (not 'delete' - reserved word)
export function remove(options?: UseMutationOptions) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.tenants.remove(id);
      if (res.status !== 204) throw new Error("Failed to delete tenant");
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: keys.lists() });
    },
    ...options,
  });
}
```

### Hook Usage Examples

```typescript
// Client component using namespace pattern
"use client";
import { hooks } from "@/src/sdk";

export function TenantList() {
  // hooks.tenants.list() - no 'use' prefix
  const { data, isLoading, error } = hooks.tenants.list({ limit: 25 });
  const createMutation = hooks.tenants.create();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data?.items.map((tenant) => (
        <TenantCard key={tenant.id} tenant={tenant} />
      ))}
      <button onClick={() => createMutation.mutate({ name: "New Tenant", slug: "new-tenant" })}>
        Create Tenant
      </button>
    </div>
  );
}
```

### Cache Invalidation Utilities

```typescript
// src/sdk/invalidate/index.ts
// AUTO-GENERATED - DO NOT EDIT

import { QueryClient } from "@tanstack/react-query";

// Namespace pattern for invalidation: invalidate.{domain}.{scope}()
export function createInvalidator(queryClient: QueryClient) {
  return {
    tenants: {
      all: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
      list: () => queryClient.invalidateQueries({ queryKey: ["tenants", "list"] }),
      detail: (id: string) =>
        queryClient.invalidateQueries({ queryKey: ["tenants", "detail", id] }),
    },
    users: {
      all: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
      list: () => queryClient.invalidateQueries({ queryKey: ["users", "list"] }),
      detail: (id: string) =>
        queryClient.invalidateQueries({ queryKey: ["users", "detail", id] }),
    },
    billing: {
      all: () => queryClient.invalidateQueries({ queryKey: ["billing"] }),
      subscriptions: () => queryClient.invalidateQueries({ queryKey: ["billing", "subscriptions"] }),
    },
  };
}

// Usage:
// import { invalidate } from "@/src/sdk";
// invalidate.tenants.all();
// invalidate.tenants.detail("tenant-123");
```

---

## Type Generation

Types are automatically generated from Zod schemas via the SDK generation process. **Never manually define types in components** - always import from the SDK.

### Generated Types Structure

```
src/sdk/types/
├── index.ts                    # Barrel export: export * from './domains/tenants'; ...
└── domains/
    ├── tenants.ts              # Tenant, TenantCreate, TenantUpdate, TenantListResponse
    ├── users.ts                # User, UserCreate, UserUpdate
    ├── billing.ts              # Subscription, Invoice, PaymentMethod
    └── credits.ts              # CreditBalance, CreditTransaction
```

### Usage in Services (Backend)

```typescript
// packages/tenants/src/service/tenants.service.ts
import type { Tenant, TenantCreate, TenantUpdate } from "@unisane/contracts";

export async function createTenant(data: TenantCreate): Promise<Tenant> {
  // Implementation
}
```

### Usage in Components (Frontend)

```typescript
// src/components/tenant-card.tsx
// ✅ CORRECT - Import from SDK types
import type { Tenant } from "@/src/sdk/types";

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
z.infer<typeof Schema>  →  TypeScript types
        │
        ▼
sdk:gen extracts types  →  src/sdk/types/
        │
        ▼
Components import from  →  @/src/sdk/types
```

---

## Contract Versioning

### API Version Strategy

- Major versions in URL: `/api/v1/`, `/api/v2/`
- Minor/patch changes: backward compatible
- Breaking changes: new major version

### Adding a New Version

```typescript
// packages/contracts/src/v2/tenants.contract.ts
import { initContract } from "@ts-rest/core";

const c = initContract();

export const tenantsContractV2 = c.router(
  {
    // New schema with additional fields
    list: {
      method: "GET",
      path: "/tenants",
      query: z.object({
        cursor: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
        // NEW: Filter by status
        status: z.enum(["active", "suspended", "deleted"]).optional(),
      }),
      responses: {
        200: z.object({
          items: z.array(TenantSchemaV2),
          nextCursor: z.string().optional(),
          // NEW: Total count
          total: z.number(),
        }),
      },
    },
  },
  {
    pathPrefix: "/api/v2",
  }
);
```

### Deprecation Strategy

```typescript
// Add deprecation notice in contract
{
  method: "GET",
  path: "/tenants/:id/legacy",
  deprecated: true, // Shows warning in SDK
  summary: "DEPRECATED: Use /tenants/:id instead",
}
```

---

## Testing Contracts

### Contract Validation Tests

```typescript
// packages/contracts/src/__tests__/tenants.contract.test.ts
import { describe, it, expect } from "vitest";
import { tenantsContract } from "../tenants/tenants.contract";

describe("tenantsContract", () => {
  it("validates create tenant body", () => {
    const valid = { name: "Acme Corp", slug: "acme-corp" };
    const result = tenantsContract.create.body.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug", () => {
    const invalid = { name: "Acme Corp", slug: "Acme Corp" }; // spaces not allowed
    const result = tenantsContract.create.body.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("has correct path", () => {
    expect(tenantsContract.list.path).toBe("/tenants");
    expect(tenantsContract.get.path).toBe("/tenants/:id");
  });
});
```

### Integration Tests with MSW

```typescript
// src/sdk/__tests__/tenants.hooks.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { hooks } from "../hooks";
import { createWrapper } from "./test-utils";

const server = setupServer(
  http.get("/api/v1/tenants", () => {
    return HttpResponse.json({
      items: [{ id: "1", name: "Test", slug: "test" }],
      nextCursor: undefined,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("hooks.tenants.list", () => {
  it("fetches tenants", async () => {
    // Uses namespace pattern: hooks.tenants.list()
    const { result } = renderHook(() => hooks.tenants.list(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].name).toBe("Test");
  });
});
```

---

## Schema Rules

> **IMPORTANT:** Follow these rules to maintain a clean schema hierarchy and prevent duplication.

### Schema Hierarchy

```
Level 1: packages/[service]/domain/schemas.ts    → SSOT (Single Source of Truth)
Level 2: packages/[service]/client.ts            → Re-exports for client use
Level 3: starters/saaskit/src/contracts/*.ts     → Imports from packages + DTOs
Level 4: starters/saaskit/sdk/schemas.ts         → Generated
Level 5: starters/saaskit/sdk/types.ts           → Generated
```

### What Goes Where

| Schema Type | Location | Example |
|-------------|----------|---------|
| **Domain schemas** | `packages/[module]/domain/schemas.ts` | `ZTenant`, `ZUser`, `ZSubscription` |
| **Client schemas** | `packages/[module]/client.ts` | Re-exports of domain schemas |
| **Request DTOs** | `contracts/*.contract.ts` (inline) | `ZPdfBody`, `ZApiKeyCreate` |
| **Response DTOs** | `contracts/*.contract.ts` (inline) | `ZMeOut`, `ZLedgerItem`, `ZUserOut` |
| **Admin query schemas** | `contracts/*.contract.ts` (inline) | `ZAdminListQuery`, `ZAdminUserFilters` |

### Rules

1. **Domain schemas MUST be defined in packages**
   ```typescript
   // ✅ CORRECT - In packages/tenants/domain/schemas.ts
   export const ZTenantCreate = z.object({ name: z.string(), slug: z.string() });

   // ❌ WRONG - Defining domain logic in contract
   const ZTenantCreate = z.object({ name: z.string(), slug: z.string() });
   ```

2. **Contracts MUST import domain schemas from packages**
   ```typescript
   // ✅ CORRECT
   import { ZTenantCreate, ZTenantFilters } from '@unisane/tenants/client';

   // ❌ WRONG - Duplicating package schemas
   const ZTenantFilters = z.object({ planId: z.string().optional() });
   ```

3. **Response DTOs are allowed inline in contracts**
   ```typescript
   // ✅ CORRECT - Response DTO specific to this endpoint
   const ZMeOut = z.object({
     userId: z.string(),
     tenantId: z.string(),
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
   import { ZPlanId, ZCreditKind } from '@unisane/kernel/client';

   // ❌ WRONG - Hardcoding enum values
   const PLANS = ['free', 'pro', 'business'] as const;
   ```

### Audit Results (2026-01-09)

Audited all 22 contract files in `starters/saaskit/src/contracts/`. Findings:

| Category | Count | Status |
|----------|-------|--------|
| Intentional inline schemas (Response DTOs) | 13 | ✅ Correct |
| Admin query schemas | 4 | ✅ Correct |
| Files with no inline schemas | 9 | ✅ Correct |
| Domain duplication | 0 | ✅ None found |

**Conclusion:** Contract files follow best practices. All inline schemas are intentionally contract-specific (response DTOs, request bodies, admin queries).

---

## Quick Reference

### Adding a New Endpoint

1. **Define schema** in `packages/contracts/src/{module}/{module}.schema.ts`
2. **Add contract** in `packages/contracts/src/{module}/{module}.contract.ts`
3. **Add metadata** in `packages/contracts/src/meta.ts` via `defineOpMeta`
4. **Run generators**:
   ```bash
   pnpm routes:gen  # Generate route handlers
   pnpm sdk:gen     # Generate SDK clients + hooks
   ```
5. **Implement service** function referenced in `defineOpMeta.fn`

### Codegen Commands

| Command | Description |
|---------|-------------|
| `pnpm routes:gen` | Generate API route handlers from contracts |
| `pnpm sdk:gen` | Generate SDK clients and React Query hooks |
| `pnpm types:gen` | Generate TypeScript types |
| `pnpm codegen` | Run all generators |

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [dev-tools.md](./dev-tools.md), [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
