# SDK Architecture Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md) | **Related:** [contracts-guide.md](./contracts-guide.md)

This guide covers the SDK architecture, multi-platform client generation, OpenAPI specification, React/Vue Query integration, cache invalidation, and Zod validation.

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Browser client | **Implemented** | `@unisane/devtools sdk:gen` |
| Server client | **Implemented** | `@unisane/devtools sdk:gen` |
| TypeScript types | **Implemented** | `@unisane/devtools sdk:gen` |
| React Query hooks | **Implemented** | `@unisane/devtools sdk:gen` |
| Admin list params hooks | **Implemented** | `@unisane/devtools sdk:gen --admin-hooks` |
| Grid registries | **Implemented** | `@unisane/devtools sdk:gen --admin-hooks` |
| Vue composables | **Implemented** | `@unisane/devtools sdk:gen --vue` |
| Zod schemas | **Implemented** | `@unisane/devtools sdk:gen --zod` |
| OpenAPI generation | **Not Implemented** | Planned in devtools |
| Cache invalidation | **Implemented** | Via react-query keys |

### Codegen Command

All SDK generation is handled by `@unisane/devtools`:

```bash
# Generate all SDK targets (including admin hooks)
pnpm devtools sdk:gen

# Generate specific targets
pnpm devtools sdk:gen --hooks           # React Query hooks only
pnpm devtools sdk:gen --admin-hooks     # Admin list params hooks only
pnpm devtools sdk:gen --types           # TypeScript types only
pnpm devtools sdk:gen --dry-run         # Preview without writing
```

---

## Key Principle: 100% Auto-Generated

**The SDK directory is entirely auto-generated. No hand-written files allowed.**

Every file in `/src/sdk/` is produced by codegen scripts. This ensures:
- Single source of truth (contracts)
- No drift between contracts and SDK
- Type safety guaranteed
- Consistent patterns across all domains

```
contracts/*.contract.ts  →  scripts/gen-sdk.ts  →  src/sdk/**/*
                                                    (100% generated)
```

---

## Table of Contents

1. [Overview](#overview)
2. [Consistent API Pattern](#consistent-api-pattern)
3. [Why This Architecture](#why-this-architecture)
4. [SDK Structure](#sdk-structure)
5. [Generated Files Reference](#generated-files-reference)
6. [Generated Types](#generated-types)
7. [Server Component Data Fetching](#server-component-data-fetching)
8. [Client Component Data Fetching](#client-component-data-fetching)
9. [Core Client](#core-client)
10. [Browser Client](#browser-client)
11. [Node.js Client](#nodejs-client)
12. [React Query Hooks](#react-query-hooks)
13. [Vue Query Composables](#vue-query-composables)
14. [Zod Validation Schemas](#zod-validation-schemas)
15. [OpenAPI Specification](#openapi-specification)
16. [Cache Invalidation](#cache-invalidation)
17. [Error Handling](#error-handling)
18. [Type Safety & IDE Support](#type-safety--ide-support)
19. [SDK Generation Scripts](#sdk-generation-scripts)
20. [DataTable Integration](#datatable-integration)
21. [Best Practices](#best-practices)

---

## Overview

The SaaSKit SDK provides type-safe API clients generated from ts-rest contracts. It supports multiple platforms and frameworks while maintaining a single source of truth.

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CONTRACTS (Single Source of Truth)               │
│                     src/contracts/*.contract.ts                      │
│                                                                      │
│  withMeta({ method, path, body: Zod, responses }, defineOpMeta({    │
│    op: "domain.action",                                              │
│    invalidate: [...],                                                │
│    service: { ... }                                                  │
│  }))                                                                 │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│  OpenAPI Spec   │   │  Route Handlers │   │      SDK System         │
│  openapi.json   │   │  app/api/**     │   │                         │
└─────────────────┘   └─────────────────┘   │  ┌─────────────────┐    │
                                             │  │  Core Client    │    │
                                             │  │  (ts-rest)      │    │
                                             │  └────────┬────────┘    │
                                             │           │             │
                                             │  ┌────────┼────────┐    │
                                             │  ▼        ▼        ▼    │
                                             │ Browser  Node   Zod     │
                                             │ React    Client Schemas │
                                             │ Vue                     │
                                             └─────────────────────────┘
```

---

## Consistent API Pattern

**All SDK exports follow a namespace pattern: `namespace.domain.operation()`**

This ensures consistent, discoverable, and IDE-friendly usage across the entire SDK.

### Pattern Overview

```typescript
// ✅ CORRECT - Namespace pattern (consistent, discoverable)
import { client, hooks, schemas } from '@saaskit/sdk/react';

// Client calls (server or browser)
const res = await client.tenants.list({ query: { limit: 20 } });
const res = await client.tenants.get({ params: { id } });
const res = await client.tenants.create({ body: { name: 'Acme' } });

// React hooks (client components only)
const { data } = hooks.tenants.list({ limit: 20 });
const { data } = hooks.tenants.get(id);
const { mutate } = hooks.tenants.create();

// Zod schemas
const validated = schemas.tenants.create.parse(input);

// ❌ WRONG - Direct imports (inconsistent, hard to discover)
import { useTenantsList, useTenantsCreate } from '@saaskit/sdk/react';
import { createClient } from '@saaskit/sdk';
```

> **Note:** Hooks don't use the `use` prefix (e.g., `hooks.tenants.list()` not `hooks.tenants.useList()`) because the `hooks.` namespace already indicates these are React hooks. This reduces redundancy while maintaining React's hook semantics.

### Naming Convention

| Layer | Pattern | Example |
|-------|---------|---------|
| **Client** | `client.{domain}.{action}()` | `client.tenants.list()` |
| **React Hooks** | `hooks.{domain}.{action}()` | `hooks.tenants.list()` |
| **Vue Composables** | `composables.{domain}.{action}()` | `composables.tenants.list()` |
| **Zod Schemas** | `schemas.{domain}.{action}` | `schemas.tenants.create` |
| **Query Keys** | `keys.{domain}.{action}()` | `keys.tenants.list()` |
| **Types** | `types.{Domain}`, `types.{Domain}{Action}` | `types.Tenant`, `types.TenantCreate` |

### Why Namespace Pattern?

| Benefit | Explanation |
|---------|-------------|
| **Discoverability** | Type `hooks.` and IDE shows all domains |
| **Consistency** | Same pattern everywhere, easy to learn |
| **Refactoring** | Rename domain once, updates everywhere |
| **Tree-shaking** | Bundlers can still eliminate unused code |
| **No collisions** | No risk of `useList` from wrong domain |

### Generated Namespace Structure

```typescript
// src/sdk/react/index.ts
/* AUTO-GENERATED — DO NOT EDIT */

export { client } from './client';
export { hooks } from './hooks';
export { keys } from './hooks/keys';
export { schemas } from '../zod';

// src/sdk/react/hooks/index.ts
/* AUTO-GENERATED — DO NOT EDIT */

import * as tenants from './domains/tenants.hooks';
import * as users from './domains/users.hooks';
import * as auth from './domains/auth.hooks';
// ... all domains

export const hooks = {
  tenants,
  users,
  auth,
  // ... all domains
} as const;

// src/sdk/vue/index.ts
/* AUTO-GENERATED — DO NOT EDIT */

export { client } from './client';
export { composables } from './composables';
export { keys } from './composables/keys';
export { schemas } from '../zod';

// src/sdk/vue/composables/index.ts
/* AUTO-GENERATED — DO NOT EDIT */

import * as tenants from './domains/tenants';
import * as users from './domains/users';
import * as auth from './domains/auth';
// ... all domains

export const composables = {
  tenants,
  users,
  auth,
  // ... all domains
} as const;
```

### Hook Naming Within Domains

```typescript
// src/sdk/react/hooks/domains/tenants.hooks.ts
/* AUTO-GENERATED — DO NOT EDIT */

// Queries (no 'use' prefix - namespace provides context)
export function list(query?, options?) { ... }        // GET /tenants
export function get(id, options?) { ... }             // GET /tenants/:id
export function listParams(defaults?) { ... }         // DataTable state management

// Mutations
export function create(options?) { ... }              // POST /tenants
export function update(options?) { ... }              // PUT /tenants/:id
export function remove(options?) { ... }              // DELETE /tenants/:id (not 'delete' - reserved word)

// Usage: hooks.tenants.list(), hooks.tenants.create()
```

---

## Why This Architecture

Each component exists for a specific reason:

| Component | Why It's Needed | Use Case |
|-----------|-----------------|----------|
| **Browser Client** | CSRF protection, cookie auth | React/Vue apps in browser |
| **Node.js Client** | API key auth, no cookies | Cron jobs, webhooks, microservices, external integrations |
| **React Hooks** | React Query integration | Next.js, React apps |
| **Vue Composables** | Vue Query integration | Nuxt, Vue apps (platform users may prefer Vue) |
| **Zod Schemas** | Form validation, runtime checks | React Hook Form, server actions |

### Why Node.js Client is Separate

The browser client uses cookies and CSRF tokens. Node.js services need:
- API key authentication (no cookies)
- Different timeout defaults (longer for server-to-server)
- No CSRF handling
- Different User-Agent headers

```typescript
// Browser: Uses cookies, CSRF
const browserClient = createClient({ baseUrl });

// Node.js: Uses API key, no cookies
const nodeClient = createNodeClient({
  baseUrl,
  apiKey: 'sk_xxx',  // Server-side only
});
```

### Why Zod is a Separate Entry

Zod schemas serve multiple purposes beyond just contracts:

1. **Form validation** - React Hook Form + Zod resolver
2. **Server action validation** - Validate input before processing
3. **Runtime type checking** - Ensure API responses match expected shape
4. **Clean imports** - One place for all validation schemas

```typescript
// Form validation (most common use case)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZTenantCreate, type TenantCreate } from '@saaskit/sdk/zod';

const form = useForm<TenantCreate>({
  resolver: zodResolver(ZTenantCreate),
});

// Server action validation
import { ZTenantCreate } from '@saaskit/sdk/zod';

async function createTenant(input: unknown) {
  const validated = ZTenantCreate.parse(input);
  // Now validated is type-safe
}
```

### Why Vue Support

SaaSKit is a platform for developers to build on. Not everyone uses React:
- Vue is the #2 JavaScript framework
- Vue Query (@tanstack/vue-query) uses identical patterns to React Query
- Same type safety, same caching, same invalidation

---

## SDK Structure

```
src/sdk/                              # ⚠️ ENTIRELY AUTO-GENERATED
├── core/                             # Framework-agnostic core
│   ├── client.ts                     # Base HTTP client (ts-rest)
│   ├── types.ts                      # Types from contracts
│   ├── errors.ts                     # Typed error classes
│   └── index.ts
│
├── browser/                          # Browser client
│   ├── client.ts                     # CSRF, cookies, request ID
│   └── index.ts
│
├── node/                             # Node.js client
│   ├── client.ts                     # API key auth, server defaults
│   └── index.ts
│
├── server/                           # Next.js server client
│   ├── client.ts                     # Header forwarding, RSC support
│   ├── getSession.ts                 # Server session helper
│   └── index.ts
│
├── react/                            # React Query hooks
│   ├── Provider.tsx                  # QueryClient provider wrapper
│   ├── context.ts                    # Client context
│   ├── hooks/
│   │   ├── domains/                  # Per-domain hook files
│   │   │   ├── auth.hooks.ts         # auth.signIn(), etc.
│   │   │   ├── tenants.hooks.ts      # tenants.list(), tenants.listParams()
│   │   │   └── ...
│   │   ├── index.ts                  # Exports: { hooks } namespace object
│   │   ├── keys.ts                   # Query key factory
│   │   ├── invalidate.ts             # Invalidation map
│   │   ├── utils.ts                  # useInvalidate, usePrefetch
│   │   ├── useFeatureFlags.ts        # Feature flags helper
│   │   └── unwrap.ts                 # Response unwrappers
│   └── index.ts                      # Exports: { client, hooks, keys, schemas }
│
├── vue/                              # Vue Query composables
│   ├── plugin.ts                     # Vue plugin
│   ├── composables/
│   │   ├── domains/                  # Per-domain composable files
│   │   │   ├── auth.ts               # auth.signIn(), etc.
│   │   │   ├── tenants.ts            # tenants.list(), tenants.create()
│   │   │   └── ...
│   │   ├── index.ts                  # Exports: { composables } namespace object
│   │   ├── keys.ts
│   │   └── utils.ts
│   └── index.ts                      # Exports: { client, composables, keys, schemas }
│
├── zod/                              # Zod validation schemas
│   ├── domains/                      # Re-exports by domain
│   │   ├── auth.ts
│   │   ├── tenants.ts
│   │   └── ...
│   └── index.ts
│
├── types/                            # Generated TypeScript types
│   ├── domains/                      # Per-domain types
│   │   ├── tenants.ts                # Tenant, TenantCreate, TenantUpdate
│   │   ├── users.ts                  # User, UserCreate, etc.
│   │   └── ...
│   └── index.ts                      # Barrel export all types
│
├── contracts.ts                      # Contract re-exports
├── errors.ts                         # Error class re-exports
└── index.ts                          # Main entry (browser client)
```

**Note:** No `registries/` folder. DataTable column definitions live in components, not SDK.

---

## Generated Files Reference

Every file in the SDK is generated from templates:

| File | Generation Source | Template Description |
|------|------------------|----------------------|
| `index.ts` | Template | Re-exports browser client |
| `server.ts` | Template | Next.js server client with header forwarding |
| `errors.ts` | Template | Error classes (fixed set based on HTTP codes) |
| `contracts.ts` | appRouter scan | Re-exports all contracts |
| `core/client.ts` | Template | Base ts-rest client factory |
| `core/types.ts` | Contract Zod schemas | Inferred types from all schemas |
| `browser/client.ts` | Template | Browser client with CSRF |
| `node/client.ts` | Template | Node client with API key auth |
| `server/getSession.ts` | Template | Calls `api.me.get()` server-side |
| `react/Provider.tsx` | Template | QueryClientProvider wrapper |
| `react/context.ts` | Template | React context for client |
| `react/hooks/utils.ts` | Template | `useInvalidate()`, `usePrefetch()` |
| `react/hooks/useFeatureFlags.ts` | me.get contract | Wraps `useMe()` and extracts flags |
| `react/hooks/unwrap.ts` | Template | Response unwrappers, `is404()` |
| `react/hooks/keys.ts` | Contract ops scan | Query key factory from all ops |
| `react/hooks/invalidate.ts` | Contract `invalidate` fields | Invalidation rules map |
| `react/hooks/domains/*.ts` | Contract per domain | Hooks for each operation |
| `vue/plugin.ts` | Template | Vue 3 plugin |
| `vue/composables/domains/*.ts` | Contract per domain | Composables for each operation |
| `zod/domains/*.ts` | Contract body schemas | Re-exports Zod schemas |

### Template Categories

**1. Fixed Templates (never change):**
```
core/client.ts, browser/client.ts, node/client.ts, server/client.ts,
server/getSession.ts, react/Provider.tsx, react/context.ts,
react/hooks/utils.ts, react/hooks/unwrap.ts, vue/plugin.ts
```

**2. Scanned from Contracts:**
```
contracts.ts           ← appRouter structure
core/types.ts          ← Zod schema inference
react/hooks/keys.ts    ← All op names
react/hooks/invalidate.ts ← invalidate fields in defineOpMeta
```

**3. Per-Domain Generation:**
```
react/hooks/domains/*.ts   ← One file per contract domain
vue/composables/domains/*  ← One file per contract domain
zod/domains/*.ts           ← Zod re-exports per domain
```

**4. Derived from Specific Contracts:**
```
react/hooks/useFeatureFlags.ts ← Derived from me.get response shape
errors.ts                      ← Fixed HTTP error codes
```

### Package Exports

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./node": "./dist/node/index.js",
    "./react": "./dist/react/index.js",
    "./vue": "./dist/vue/index.js",
    "./zod": "./dist/zod/index.js",
    "./types": "./dist/types/index.js"
  }
}
```

---

## Generated Types

**All types are auto-generated from Zod schemas in contracts. Never define types manually in components.**

### Type Sources

Types flow from Zod schemas through the SDK:

```
┌─────────────────────────────────────────────────────────────────────┐
│  modules/tenants/domain/schemas.ts                                  │
│                                                                      │
│  export const ZTenantCreate = z.object({                            │
│    name: z.string().min(1).max(100),                                │
│    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),               │
│  });                                                                 │
│  export type TenantCreate = z.infer<typeof ZTenantCreate>;          │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  src/sdk/types/index.ts (AUTO-GENERATED)                            │
│                                                                      │
│  // Re-exports all types from contracts and modules                  │
│  export type { TenantCreate, TenantUpdate, Tenant } from '...';     │
│  export type { UserCreate, User, MeGetResponse } from '...';        │
│  export type { MembershipCreate, Membership } from '...';           │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Components import from SDK                                          │
│                                                                      │
│  import type { Tenant, TenantCreate } from '@saaskit/sdk/types';    │
└─────────────────────────────────────────────────────────────────────┘
```

### Importing Types

```typescript
// ✅ CORRECT - Import from SDK types
import type {
  Tenant,
  TenantCreate,
  TenantUpdate,
  User,
  Membership,
  MeGetResponse,
} from '@saaskit/sdk/types';

// ✅ ALSO CORRECT - Import alongside Zod schemas
import { ZTenantCreate, type TenantCreate } from '@saaskit/sdk/zod';

// ❌ WRONG - Never define types manually in components
interface Tenant {
  id: string;
  name: string;
  // ... don't do this!
}
```

### Generated Type Categories

| Category | Example Types | Source |
|----------|---------------|--------|
| **Entity types** | `Tenant`, `User`, `Membership` | Zod response schemas |
| **Create DTOs** | `TenantCreate`, `UserCreate` | Zod body schemas |
| **Update DTOs** | `TenantUpdate`, `UserUpdate` | Zod body schemas |
| **List responses** | `TenantsListResponse`, `UsersListResponse` | Contract responses |
| **List items** | `TenantsListItem`, `UsersListItem` | Array element types |
| **Session** | `MeGetResponse` | me.get contract |

### Using Types in Components

```typescript
// Server component
import type { Tenant } from '@saaskit/sdk/types';

export default async function TenantPage({ params }: { params: { id: string } }) {
  const client = await createServerClient();
  const res = await client.tenants.get({ params: { id: params.id } });

  if (res.status !== 200) notFound();

  const tenant: Tenant = res.body.data;  // Fully typed
  return <TenantDetails tenant={tenant} />;
}

// Client component
import type { Tenant, TenantCreate } from '@saaskit/sdk/types';

interface TenantFormProps {
  tenant?: Tenant;           // For editing
  onSubmit: (data: TenantCreate) => void;
}

export function TenantForm({ tenant, onSubmit }: TenantFormProps) {
  // Types flow through the component
}
```

---

## Server Component Data Fetching

Server components use `createServerClient()` to fetch data with full type safety.

### Basic Pattern

```typescript
// app/(tenant)/w/[slug]/page.tsx
import { createServerClient } from '@saaskit/sdk/server';
import { notFound, redirect } from 'next/navigation';
import type { Tenant } from '@saaskit/sdk/types';

export default async function WorkspacePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const client = await createServerClient();

  // Fetch data server-side
  const res = await client.tenants.getBySlug({ params: { slug } });

  // Handle response with discriminated union
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (res.status !== 200) throw new Error('Failed to load tenant');

  // res.body.data is now typed as Tenant
  const tenant = res.body.data;

  return (
    <div>
      <h1>{tenant.name}</h1>
      <WorkspaceClient slug={slug} initialTenant={tenant} />
    </div>
  );
}
```

### Auth Guard Pattern

```typescript
// app/_server/requireAuth.ts
import { createServerClient } from '@saaskit/sdk/server';
import { redirect, notFound } from 'next/navigation';
import type { MeGetResponse } from '@saaskit/sdk/types';

export async function requireUser(nextPath: string): Promise<{
  client: Awaited<ReturnType<typeof createServerClient>>;
  me: MeGetResponse;
}> {
  const client = await createServerClient();

  const res = await client.me.get();

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (res.status !== 200) {
    throw new Error('Failed to get session');
  }

  return { client, me: res.body.data };
}

export async function requireAdmin(nextPath = '/admin') {
  const { client, me } = await requireUser(nextPath);

  if (!me.isSuperAdmin && me.globalRole !== 'super_admin') {
    notFound();
  }

  return { client, me };
}
```

### Layout with Auth

```typescript
// app/(tenant)/w/[slug]/layout.tsx
import { createServerClient } from '@saaskit/sdk/server';
import { requireUser } from '@/app/_server/requireAuth';
import { SessionProvider } from '@/context/SessionContext';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { client, me } = await requireUser(`/w/${slug}/dashboard`);

  // Fetch additional data needed for layout
  const tenantRes = await client.tenants.getBySlug({ params: { slug } });
  if (tenantRes.status !== 200) notFound();

  return (
    <SessionProvider initialMe={me}>
      <Sidebar tenant={tenantRes.body.data} />
      <main>{children}</main>
    </SessionProvider>
  );
}
```

### SSR with Client Handoff

```typescript
// app/(admin)/admin/tenants/page.tsx
import { createServerClient } from '@saaskit/sdk/server';
import type { TenantsListResponse } from '@saaskit/sdk/types';
import { TenantsClient } from './TenantsClient';

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; sort?: string; q?: string }>;
}) {
  const { cursor, sort, q } = await searchParams;
  const client = await createServerClient();

  // Server-side fetch with query params
  const res = await client.admin.tenants.list({
    query: {
      cursor,
      sort: sort ?? '-createdAt',
      search: q,
      limit: 25,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to load tenants');
  }

  // Pass SSR data to client component
  return (
    <TenantsClient
      initialData={res.body}
      initialSort={sort ?? '-createdAt'}
      initialSearch={q}
    />
  );
}
```

---

## Client Component Data Fetching

Client components use hooks for reactive data fetching with automatic caching and invalidation.

### Basic Pattern

```typescript
// app/(tenant)/w/[slug]/dashboard/DashboardClient.tsx
'use client';

import { hooks } from '@saaskit/sdk/react';
import { useSession } from '@/hooks/useSession';
import type { Membership } from '@saaskit/sdk/types';

export function DashboardClient({ slug }: { slug: string }) {
  const { me } = useSession();
  const tenantId = me?.tenantId;

  // Conditional fetching - only when tenantId is available
  const membersQuery = hooks.memberships.list(
    { params: { tenantId }, query: { limit: 100 } },
    { enabled: Boolean(tenantId) }
  );

  const creditsQuery = hooks.credits.balance(
    { params: { tenantId } },
    { enabled: Boolean(tenantId) }
  );

  if (membersQuery.isLoading) return <Skeleton />;

  return (
    <div>
      <StatCard
        title="Team Members"
        value={membersQuery.data?.items?.length ?? 0}
      />
      <StatCard
        title="Credits"
        value={creditsQuery.data?.amount ?? 0}
      />
    </div>
  );
}
```

### With Initial SSR Data

```typescript
// app/(admin)/admin/tenants/TenantsClient.tsx
'use client';

import { hooks } from '@saaskit/sdk/react';
import type { TenantsListResponse, Tenant } from '@saaskit/sdk/types';

interface TenantsClientProps {
  initialData: TenantsListResponse;
  initialSort: string;
  initialSearch?: string;
}

export function TenantsClient({
  initialData,
  initialSort,
  initialSearch
}: TenantsClientProps) {
  // List params for pagination, sorting, filtering
  const params = hooks.tenants.listParams({
    limit: 25,
    sort: initialSort,
    search: initialSearch,
  });

  // Query with SSR initial data
  const query = hooks.tenants.list(params.queryArgs, {
    initialData,           // Hydrate from server
    staleTime: 60_000,     // Consider fresh for 1 minute
  });

  return (
    <DataTable
      data={query.data?.items ?? []}
      isLoading={query.isLoading}
      onSearch={params.setSearch}
      onSort={params.setSort}
      onNextPage={params.nextPage}
      hasNextPage={Boolean(query.data?.nextCursor)}
    />
  );
}
```

### Mutations with Optimistic Updates

```typescript
// components/TenantActions.tsx
'use client';

import { hooks } from '@saaskit/sdk/react';
import type { Tenant, TenantUpdate } from '@saaskit/sdk/types';

export function TenantActions({ tenant }: { tenant: Tenant }) {
  const updateMutation = hooks.tenants.update({
    onSuccess: () => {
      toast.success('Tenant updated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = hooks.tenants.remove({
    onSuccess: () => {
      toast.success('Tenant deleted');
      router.push('/admin/tenants');
    },
  });

  const handleUpdate = (data: TenantUpdate) => {
    updateMutation.mutate({
      params: { id: tenant.id },
      body: data,
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this tenant?')) {
      deleteMutation.mutate({ params: { id: tenant.id } });
    }
  };

  return (
    <div>
      <Button
        onClick={() => handleUpdate({ name: 'New Name' })}
        loading={updateMutation.isPending}
      >
        Update
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        loading={deleteMutation.isPending}
      >
        Delete
      </Button>
    </div>
  );
}
```

### Form with Validation

```typescript
// components/CreateTenantForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hooks, schemas } from '@saaskit/sdk/react';
import type { TenantCreate } from '@saaskit/sdk/types';

export function CreateTenantForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<TenantCreate>({
    resolver: zodResolver(schemas.tenants.create),
    defaultValues: { name: '', slug: '' },
  });

  const createMutation = hooks.tenants.create({
    onSuccess: (data) => {
      toast.success(`Created ${data.name}`);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      // Handle validation errors from server
      if (error.code === 'validation_error' && error.errors) {
        error.errors.forEach(e => form.setError(e.path, { message: e.message }));
      } else {
        toast.error(error.message);
      }
    },
  });

  const onSubmit = (data: TenantCreate) => {
    createMutation.mutate({ body: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
      <Input
        {...form.register('slug')}
        error={form.formState.errors.slug?.message}
      />
      <Button type="submit" loading={createMutation.isPending}>
        Create Tenant
      </Button>
    </form>
  );
}
```

### Infinite Scroll / Pagination

```typescript
// components/AuditLogList.tsx
'use client';

import { hooks } from '@saaskit/sdk/react';

export function AuditLogList({ tenantId }: { tenantId: string }) {
  const query = hooks.audit.listInfinite(
    { params: { tenantId }, query: { limit: 50 } },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <div>
      {query.data?.pages.flatMap(page => page.items).map(item => (
        <AuditLogItem key={item.id} item={item} />
      ))}

      {query.hasNextPage && (
        <Button
          onClick={() => query.fetchNextPage()}
          loading={query.isFetchingNextPage}
        >
          Load More
        </Button>
      )}
    </div>
  );
}
```

---

## Core Client

The core client uses ts-rest to provide type-safe API calls. It's the foundation that browser and Node.js clients build upon.

```typescript
// src/sdk/core/client.ts

import { initClient } from '@ts-rest/core';
import { appRouter } from '@/src/contracts/app.router';

export interface ClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export function createBaseClient(config: ClientConfig) {
  return initClient(appRouter, {
    baseUrl: config.baseUrl,
    baseHeaders: config.headers ?? {},
    credentials: config.credentials,
  });
}

export type SaaSKitClient = ReturnType<typeof createBaseClient>;
```

### Usage Pattern

The client mirrors the contract structure:

```typescript
// Contract defines: tenantsContract.create
// Client provides: client.tenants.create

const result = await client.tenants.create({
  body: { name: 'Acme Corp' }
});

const list = await client.tenants.list({
  query: { limit: 20 }
});

const tenant = await client.tenants.get({
  params: { tenantId: 'xxx' }
});
```

---

## Browser Client

Optimized for browser environments with automatic CSRF and cookie handling.

```typescript
// src/sdk/browser/client.ts

import { createBaseClient, type ClientConfig } from '../core/client';

export function createClient(config: Omit<ClientConfig, 'credentials'>) {
  return createBaseClient({
    ...config,
    credentials: 'include',  // Send cookies
    headers: {
      ...config.headers,
      'x-csrf-token': getCsrfToken(),
      'x-request-id': crypto.randomUUID(),
    },
  });
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match?.[1] ?? '';
}
```

### Browser Usage

```typescript
// In React/Next.js client components
import { createClient } from '@saaskit/sdk';

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
});

// Cookies and CSRF handled automatically
const me = await client.me.get();
```

---

## Node.js Client

Optimized for server environments with API key authentication.

```typescript
// src/sdk/node/client.ts

import { createBaseClient, type ClientConfig } from '../core/client';

export interface NodeClientConfig extends ClientConfig {
  apiKey?: string;
  bearerToken?: string;
}

export function createNodeClient(config: NodeClientConfig) {
  const headers: Record<string, string> = {
    ...config.headers,
    'User-Agent': 'SaaSKit-Node/1.0',
    'x-request-id': crypto.randomUUID(),
  };

  if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }
  if (config.bearerToken) {
    headers['Authorization'] = `Bearer ${config.bearerToken}`;
  }

  return createBaseClient({
    baseUrl: config.baseUrl,
    headers,
  });
}
```

### Node.js Usage

```typescript
// In cron jobs, webhooks, microservices
import { createNodeClient } from '@saaskit/sdk/node';

const client = createNodeClient({
  baseUrl: process.env.API_URL!,
  apiKey: process.env.API_KEY!,
});

// Fetch with cursor pagination
let cursor: string | undefined;
do {
  const res = await client.users.list({ query: { limit: 100, cursor } });
  if (res.status !== 200) break;

  for (const user of res.body.data) {
    await processUser(user);
  }
  cursor = res.body.meta?.nextCursor;
} while (cursor);
```

### Server Components (Next.js)

For Next.js server components, forward headers:

```typescript
// src/sdk/server.ts
import { cookies, headers } from 'next/headers';
import { createBaseClient } from './core/client';

export async function createServerClient() {
  const cookieStore = await cookies();
  const headersList = await headers();

  return createBaseClient({
    baseUrl: process.env.API_URL!,
    credentials: 'include',
    headers: {
      cookie: cookieStore.toString(),
      'x-forwarded-for': headersList.get('x-forwarded-for') ?? '',
    },
  });
}
```

---

## React Query Hooks

Generated hooks integrate with @tanstack/react-query for caching, invalidation, and state management.

### Provider Setup

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HooksProvider } from '@saaskit/sdk/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HooksProvider baseUrl={process.env.NEXT_PUBLIC_API_URL!}>
        {children}
      </HooksProvider>
    </QueryClientProvider>
  );
}
```

### Generated Hook Types

For each contract operation (all accessed via `hooks.{domain}`):

```typescript
// Query (GET) operations
hooks.tenants.list(query?, options?)       // List with caching
hooks.tenants.get(params, options?)        // Single item

// Mutation (POST/PUT/DELETE) operations
hooks.tenants.create(options?)             // With auto-invalidation
hooks.tenants.update(options?)
hooks.tenants.remove(options?)             // 'delete' is reserved word

// List params (for DataTable integration)
hooks.tenants.listParams(defaults?)        // ListParamsLike state management
```

### Hook Implementation

```typescript
// src/sdk/react/hooks/domains/tenants.hooks.ts
/* AUTO-GENERATED — DO NOT EDIT */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSaaSKitClient } from '../context';
import { keys } from '../keys';
import { invalidateMap } from '../invalidate';

// Named exports for namespace pattern: hooks.tenants.list()
export function list(
  query?: TenantsListQuery,
  options?: UseQueryOptions
) {
  const client = useSaaSKitClient();

  return useQuery({
    queryKey: keys.tenants.list(query),
    queryFn: () => client.tenants.list({ query }),
    ...options,
  });
}

export function create(options?: UseMutationOptions) {
  const client = useSaaSKitClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => client.tenants.create(variables),
    onSuccess: (data, variables, context) => {
      // Smart invalidation from contract metadata
      const rules = invalidateMap['tenants.create'] ?? [];
      for (const rule of rules) {
        if (rule.kind === 'prefix') {
          queryClient.invalidateQueries({ queryKey: rule.key });
        }
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

// Usage: hooks.tenants.list(), hooks.tenants.create()
```

### Usage in Components

```tsx
'use client';

import { hooks } from '@saaskit/sdk/react';

export function TenantsPage() {
  const { data, isLoading } = hooks.tenants.list({ limit: 20 });

  const createMutation = hooks.tenants.create({
    onSuccess: (tenant) => toast.success(`Created ${tenant.name}`),
  });

  return (
    <div>
      <Button
        onClick={() => createMutation.mutate({ body: { name: 'New' } })}
        loading={createMutation.isPending}
      >
        Create
      </Button>
      <TenantsList items={data?.items ?? []} />
    </div>
  );
}
```

---

## Vue Query Composables

Generated composables integrate with @tanstack/vue-query, following identical patterns to React.

### Plugin Setup

```typescript
// main.ts (Vue 3)
import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { SaaSKitPlugin } from '@saaskit/sdk/vue';

const app = createApp(App);

app.use(VueQueryPlugin);
app.use(SaaSKitPlugin, {
  baseUrl: import.meta.env.VITE_API_URL,
});

app.mount('#app');
```

### Generated Composable Types

```typescript
// Same pattern as React hooks (via composables namespace)
composables.tenants.list(query?, options?)
composables.tenants.get(params, options?)
composables.tenants.create(options?)
composables.tenants.update(options?)
```

### Composable Implementation

```typescript
// src/sdk/vue/composables/domains/tenants.ts
/* AUTO-GENERATED — DO NOT EDIT */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useSaaSKitClient } from '../../context';
import { keys } from '../keys';

// Named exports for namespace pattern: composables.tenants.list()
export function list(
  query?: MaybeRef<TenantsListQuery>,
  options?: UseQueryOptions
) {
  const client = useSaaSKitClient();

  return useQuery({
    queryKey: computed(() => keys.tenants.list(unref(query))),
    queryFn: () => client.tenants.list({ query: unref(query) }),
    ...options,
  });
}

export function create(options?: UseMutationOptions) {
  const client = useSaaSKitClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => client.tenants.create(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    ...options,
  });
}

// Usage: composables.tenants.list(), composables.tenants.create()
```

### Usage in Vue Components

```vue
<script setup lang="ts">
import { composables } from '@saaskit/sdk/vue';

const { data, isLoading } = composables.tenants.list({ limit: 20 });

const createMutation = composables.tenants.create({
  onSuccess: (tenant) => {
    toast.success(`Created ${tenant.name}`);
  },
});
</script>

<template>
  <button
    @click="createMutation.mutate({ body: { name: 'New' } })"
    :disabled="createMutation.isPending"
  >
    Create
  </button>
  <TenantsList :items="data?.items ?? []" />
</template>
```

---

## Zod Validation Schemas

Re-exported Zod schemas from contracts for form validation and runtime checks.

### Schema Structure

Schemas are defined in modules and re-exported through SDK:

```
modules/tenants/domain/schemas.ts    # Source (ZTenantCreate, ZTenantUpdate)
         ↓
contracts/tenants.contract.ts        # Uses in contract definition
         ↓
sdk/zod/generated/tenants.ts         # Re-exports for SDK consumers
         ↓
sdk/zod/index.ts                     # Barrel export
```

### Generated Zod Entry

```typescript
// src/sdk/zod/generated/tenants.ts

// Re-export from source
export {
  ZTenantCreate,
  ZTenantUpdate,
  type TenantCreate,
  type TenantUpdate,
} from '@/src/modules/tenants/domain/schemas';

// Response schemas (from contracts)
export { ZTenantResponse } from '@/src/contracts/tenants.contract';
```

### Form Validation (Primary Use Case)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hooks, schemas } from '@saaskit/sdk/react';
import type { TenantCreate } from '@saaskit/sdk/zod';

export function CreateTenantForm() {
  const form = useForm<TenantCreate>({
    resolver: zodResolver(schemas.tenants.create),
    defaultValues: { name: '' },
  });

  const mutation = hooks.tenants.create();

  const onSubmit = (data: TenantCreate) => {
    mutation.mutate({ body: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
      <button type="submit">Create</button>
    </form>
  );
}
```

### Server Action Validation

```typescript
'use server';

import { ZTenantCreate } from '@saaskit/sdk/zod';
import { createServerClient } from '@saaskit/sdk/server';

export async function createTenant(formData: FormData) {
  const input = Object.fromEntries(formData);

  // Validate before processing
  const result = ZTenantCreate.safeParse(input);
  if (!result.success) {
    return { error: result.error.flatten() };
  }

  const client = await createServerClient();
  const tenant = await client.tenants.create({ body: result.data });

  return { data: tenant };
}
```

---

## OpenAPI Specification

Generated from ts-rest contracts with full metadata.

### Enhanced Generation

```typescript
// src/openapi/spec.ts

import { generateOpenApi } from '@ts-rest/open-api';
import { appRouter } from '@/src/contracts/app.router';

export function generateSpec(): OpenAPIObject {
  const openapi = generateOpenApi(appRouter, {
    info: {
      title: 'SaaSKit API',
      version: readKitVersion(),
    },
  }, {
    setOperationId: true,
    operationMapper: (operation, route) => {
      const meta = route.meta as OpMeta | undefined;
      return {
        ...operation,
        // Use op field as operationId
        operationId: meta?.op?.replace(/\./g, '_'),
        // Add security based on auth requirements
        security: getSecurityRequirement(meta),
      };
    },
  });

  // Add security schemes
  openapi.components = {
    ...openapi.components,
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' },
    },
  };

  return openapi;
}
```

### Commands

```bash
npm run openapi:json   # Generate spec
npm run openapi:lint   # Validate with Redocly
npm run openapi:serve  # Serve with ReDoc at localhost:7400
```

---

## Cache Invalidation

Contract metadata drives smart cache invalidation.

### Declaring in Contracts

```typescript
// src/contracts/tenants.contract.ts

create: withMeta(
  { method: 'POST', path: '/api/rest/v1/tenants', ... },
  defineOpMeta({
    op: 'tenants.create',
    invalidate: [
      { kind: 'prefix', key: ['tenants', 'list'] },
      { kind: 'op', target: 'me.tenants' },
    ],
  })
),
```

### Generated Invalidation Map

```typescript
// src/sdk/hooks/generated/invalidate.ts (AUTO-GENERATED)

export const invalidateMap = {
  'tenants.create': [
    { kind: 'prefix', key: ['tenants', 'list'] },
    { kind: 'op', target: 'me.tenants' },
  ],
  'tenants.update': [
    { kind: 'op', target: 'tenants.get', from: 'params', pick: ['tenantId'] },
  ],
} as const;
```

### How It Works

When a mutation succeeds, the generated hook reads `invalidateMap` and invalidates matching queries:

```typescript
// Generated hook
onSuccess: () => {
  const rules = invalidateMap['tenants.create'];
  for (const rule of rules) {
    if (rule.kind === 'prefix') {
      queryClient.invalidateQueries({ queryKey: rule.key, exact: false });
    } else if (rule.kind === 'op') {
      queryClient.invalidateQueries({ queryKey: keys[rule.target]() });
    }
  }
}
```

---

## Error Handling

Typed error classes for specific error handling.

### Error Hierarchy

```typescript
// src/sdk/core/errors.ts

export class SaaSKitError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'SaaSKitError';
  }
}

export class ValidationError extends SaaSKitError {
  constructor(
    message: string,
    public readonly errors: Array<{ path: string; message: string }>,
    requestId?: string,
  ) {
    super(message, 'validation_error', 400, requestId);
  }
}

export class AuthenticationError extends SaaSKitError { /* 401 */ }
export class AuthorizationError extends SaaSKitError { /* 403 */ }
export class NotFoundError extends SaaSKitError { /* 404 */ }
export class RateLimitError extends SaaSKitError { /* 429 */ }
```

### Usage

```typescript
import { ValidationError, RateLimitError } from '@saaskit/sdk';

try {
  await client.tenants.create({ body: { name: '' } });
} catch (error) {
  if (error instanceof ValidationError) {
    // Show field errors
    error.errors.forEach(e => setFieldError(e.path, e.message));
  } else if (error instanceof RateLimitError) {
    toast.error(`Try again in ${error.retryAfter}s`);
  }
}
```

### Null-Safe Response Handling

ts-rest returns discriminated union responses. Always check status before accessing body:

```typescript
// ❌ UNSAFE - body type is unknown without status check
const res = await client.tenants.get({ params: { tenantId } });
const tenant = res.body.data; // TypeScript error or unsafe

// ✅ SAFE - discriminated union narrows type
const res = await client.tenants.get({ params: { tenantId } });
if (res.status === 200) {
  const tenant = res.body.data; // Typed as Tenant
} else if (res.status === 404) {
  // Handle not found
} else {
  // Handle other errors
}
```

### Generated Response Unwrappers

The SDK provides helper functions for common patterns:

```typescript
// src/sdk/react/hooks/unwrap.ts
/* AUTO-GENERATED — DO NOT EDIT */

import { SaaSKitError, NotFoundError } from '../core/errors';

/**
 * Unwrap successful response or throw typed error
 */
export function unwrap<T>(res: { status: number; body: unknown }): T {
  if (res.status >= 200 && res.status < 300) {
    return (res.body as { data: T }).data;
  }
  throw toError(res);
}

/**
 * Unwrap list response with items and meta
 */
export function unwrapList<T>(res: { status: number; body: unknown }): {
  items: T[];
  meta: { nextCursor?: string; total?: number };
} {
  if (res.status >= 200 && res.status < 300) {
    const body = res.body as { data: T[]; meta?: unknown };
    return {
      items: body.data,
      meta: (body.meta ?? {}) as { nextCursor?: string; total?: number },
    };
  }
  throw toError(res);
}

/**
 * Check if error is 404 Not Found
 */
export function is404(e: unknown): e is NotFoundError {
  return e instanceof NotFoundError ||
    (typeof e === 'object' && e !== null && 'status' in e && e.status === 404);
}

/**
 * Convert response to typed error
 */
function toError(res: { status: number; body: unknown }): SaaSKitError {
  const body = res.body as { message?: string; code?: string; errors?: unknown[] };
  switch (res.status) {
    case 400: return new ValidationError(body.message ?? 'Validation failed', body.errors ?? []);
    case 401: return new AuthenticationError(body.message ?? 'Unauthorized');
    case 403: return new AuthorizationError(body.message ?? 'Forbidden');
    case 404: return new NotFoundError(body.message ?? 'Not found');
    case 429: return new RateLimitError(body.message ?? 'Rate limited');
    default: return new SaaSKitError(body.message ?? 'Request failed', body.code ?? 'unknown', res.status);
  }
}
```

### Usage with Unwrappers

```typescript
import { unwrap, unwrapList, is404 } from '@saaskit/sdk/react';

// Single item - throws on error
try {
  const tenant = unwrap<Tenant>(await client.tenants.get({ params: { tenantId } }));
  console.log(tenant.name);
} catch (e) {
  if (is404(e)) {
    redirect('/not-found');
  }
  throw e;
}

// List with pagination
const { items, meta } = unwrapList<Tenant>(await client.tenants.list({ query: { limit: 20 } }));
console.log(`Found ${items.length} tenants, next cursor: ${meta.nextCursor}`);
```

### React Query Error Boundaries

```tsx
// Global error handler in QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof SaaSKitError && error.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ValidationError) {
          // Validation errors handled by form
          return;
        }
        if (error instanceof RateLimitError) {
          toast.error(`Rate limited. Try again in ${error.retryAfter}s`);
          return;
        }
        toast.error(error.message);
      },
    },
  },
});
```

---

## Type Safety & IDE Support

The SDK is designed for full TypeScript support with IDE autocompletion.

### Discriminated Union Responses

ts-rest uses discriminated unions for type-safe response handling:

```typescript
// Response type from contract
type TenantsGetResponse =
  | { status: 200; body: { ok: true; data: Tenant } }
  | { status: 404; body: { ok: false; error: string } }
  | { status: 401; body: { ok: false; error: string } };

// TypeScript narrows type based on status check
const res = await client.tenants.get({ params: { tenantId } });

if (res.status === 200) {
  res.body.data.name;  // ✅ Autocomplete works, type is Tenant
}
if (res.status === 404) {
  res.body.error;      // ✅ Type is string
}
```

### Generated Types from Zod

Types are inferred from Zod schemas, ensuring contract-type alignment:

```typescript
// In module: modules/tenants/domain/schemas.ts
export const ZTenantCreate = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

// Inferred type (auto-generated)
export type TenantCreate = z.infer<typeof ZTenantCreate>;
// = { name: string; slug?: string }

// SDK re-exports for consumers
import { ZTenantCreate, type TenantCreate } from '@saaskit/sdk/zod';
```

### Hook Return Types

Generated hooks have fully typed returns:

```typescript
// hooks.tenants.list() return type
const {
  data,       // { ok: true; data: Tenant[]; meta: { nextCursor?: string } } | undefined
  isLoading,  // boolean
  isFetching, // boolean
  error,      // SaaSKitError | null
  refetch,    // () => Promise<...>
} = hooks.tenants.list({ limit: 20 });

// hooks.tenants.create() return type
const {
  mutate,       // (variables: { body: TenantCreate }) => void
  mutateAsync,  // (variables: { body: TenantCreate }) => Promise<Tenant>
  isPending,    // boolean
  isSuccess,    // boolean
  data,         // Tenant | undefined
  error,        // SaaSKitError | null
} = hooks.tenants.create();
```

### Query Key Type Safety

Generated key factories are fully typed:

```typescript
// src/sdk/react/hooks/keys.ts
/* AUTO-GENERATED — DO NOT EDIT */

export const keys = {
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...keys.tenants.all, 'list'] as const,
    list: (query?: TenantsListQuery) => [...keys.tenants.lists(), query] as const,
    details: () => [...keys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...keys.tenants.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    // ...
  },
} as const;

// Usage - IDE autocomplete works
queryClient.invalidateQueries({ queryKey: keys.tenants.lists() });
queryClient.getQueryData(keys.tenants.detail(tenantId));
```

### Contract-to-Client Type Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TYPE FLOW                                     │
│                                                                      │
│  Zod Schema                ts-rest Contract           SDK Client     │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐ │
│  │ ZTenantCreate│────────▶│ body: ZTenant│────────▶│ body: Tenant │ │
│  │ (validation) │  infer  │ Create       │  infer  │ Create       │ │
│  └──────────────┘         └──────────────┘         └──────────────┘ │
│                                                           │         │
│                                                           ▼         │
│                                                    ┌──────────────┐ │
│                                                    │ IDE shows:   │ │
│                                                    │ { name: str, │ │
│                                                    │   slug?: str}│ │
│                                                    └──────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Strict Null Checks

All generated code is compatible with `strictNullChecks: true`:

```typescript
// Optional chaining for nullable data
const tenantName = data?.data?.name ?? 'Unknown';

// Nullish coalescing for defaults
const items = data?.data ?? [];

// Type guards for safe access
if (data && data.status === 200) {
  // data.body.data is guaranteed non-null here
}
```

### IDE Features

With proper TypeScript setup, you get:

1. **Autocomplete** - All client methods, hook names, types
2. **Hover documentation** - JSDoc from contracts flows through
3. **Go to definition** - Jump from hook to contract to Zod schema
4. **Rename symbol** - Rename across contracts, SDK, and consumers
5. **Find all references** - See all usages of a type or hook
6. **Error highlighting** - Type mismatches shown immediately

### tsconfig.json Requirements

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "paths": {
      "@saaskit/sdk": ["./src/sdk"],
      "@saaskit/sdk/*": ["./src/sdk/*"]
    }
  }
}
```

---

## SDK Generation Scripts

The codegen system ensures the SDK is 100% auto-generated from contracts.

### Generator Architecture

```
scripts/
├── gen-sdk.ts              # Main orchestrator
├── templates/              # Static file templates
│   ├── core/
│   │   ├── client.ts.tpl
│   │   └── errors.ts.tpl
│   ├── browser/
│   │   └── client.ts.tpl
│   ├── node/
│   │   └── client.ts.tpl
│   ├── server/
│   │   ├── client.ts.tpl
│   │   └── getSession.ts.tpl
│   ├── react/
│   │   ├── Provider.tsx.tpl
│   │   ├── context.ts.tpl
│   │   ├── utils.ts.tpl
│   │   └── unwrap.ts.tpl
│   └── vue/
│       └── plugin.ts.tpl
└── generators/             # Dynamic generators
    ├── gen-types.ts        # Type extraction from Zod
    ├── gen-contracts.ts    # Contract re-exports
    ├── gen-keys.ts         # Query key factory
    ├── gen-invalidate.ts   # Invalidation map
    ├── gen-hooks.ts        # React hooks per domain
    ├── gen-composables.ts  # Vue composables per domain
    ├── gen-zod.ts          # Zod schema re-exports
    └── gen-feature-flags.ts # Feature flags hook
```

### Template Example: getSession.ts

```typescript
// scripts/templates/server/getSession.ts.tpl
/* AUTO-GENERATED — DO NOT EDIT */
"use server";

import { createServerClient } from './client';

export async function getSession() {
  const api = await createServerClient();
  const result = await api.me.get();
  if (result.status === 200) {
    return result.body.data;
  }
  return null;
}
```

### Template Example: utils.ts (useInvalidate, usePrefetch)

```typescript
// scripts/templates/react/utils.ts.tpl
/* AUTO-GENERATED — DO NOT EDIT */

import { useQueryClient } from '@tanstack/react-query';
import { keys } from './keys';
import { invalidateMap, type InvalidateItem } from './invalidate';

export function useInvalidate() {
  const qc = useQueryClient();

  return (op: keyof typeof invalidateMap) => {
    const rules = invalidateMap[op] ?? [];
    for (const rule of rules) {
      if (rule.kind === 'prefix') {
        qc.invalidateQueries({ queryKey: rule.key as string[] });
      } else if (rule.kind === 'key') {
        qc.invalidateQueries({ queryKey: rule.key as string[], exact: true });
      }
    }
  };
}

export function usePrefetch() {
  const qc = useQueryClient();

  return <T>(queryKey: readonly unknown[], queryFn: () => Promise<T>) => {
    return qc.prefetchQuery({ queryKey, queryFn });
  };
}
```

### Template Example: unwrap.ts

```typescript
// scripts/templates/react/unwrap.ts.tpl
/* AUTO-GENERATED — DO NOT EDIT */

import type { ClientInferResponses } from '@ts-rest/core';

type TsRestResponse<T> = { status: number; body: T };

export function unwrapResponse<T>(res: TsRestResponse<{ ok: true; data: T }>): T {
  if (res.status >= 200 && res.status < 300) {
    return res.body.data;
  }
  throw new Error(`Request failed with status ${res.status}`);
}

export function toListOut<T>(res: TsRestResponse<{ ok: true; data: T[]; meta?: unknown }>): {
  items: T[];
  meta: unknown;
} {
  return { items: res.body.data, meta: res.body.meta ?? {} };
}

export function is404(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    (e as { status: number }).status === 404
  );
}
```

### Template Example: useFeatureFlags.ts

```typescript
// scripts/templates/react/useFeatureFlags.ts.tpl
/* AUTO-GENERATED — DO NOT EDIT */

import * as me from './domains/me.hooks';

export function useFeatureFlags() {
  const { data } = me.useGet();
  return data?.flags ?? {};
}

export function useFeatureFlag(key: string): boolean {
  const flags = useFeatureFlags();
  return Boolean(flags[key]);
}

// Usage: hooks.useFeatureFlags(), hooks.useFeatureFlag('dark-mode')
```

### Commands

```bash
# Generate all SDK components (cleans and regenerates)
pnpm run sdk:gen

# Individual generators
pnpm run sdk:gen:hooks      # React/Vue hooks
pnpm run sdk:gen:keys       # Query key factory
pnpm run sdk:gen:invalidate # Invalidation map
pnpm run sdk:gen:zod        # Zod schema re-exports
pnpm run sdk:gen:templates  # Copy static templates

# Watch mode (re-runs on contract changes)
pnpm run sdk:watch
```

### Script Implementation (gen-sdk.ts)

```typescript
// scripts/gen-sdk.ts
import { rmSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { appRouter } from '../src/contracts/app.router';

const SDK_DIR = resolve(__dirname, '../src/sdk');
const TEMPLATES_DIR = resolve(__dirname, './templates');

// Step 1: Clean SDK directory
rmSync(SDK_DIR, { recursive: true, force: true });
mkdirSync(SDK_DIR, { recursive: true });

// Step 2: Copy static templates
copyTemplates(TEMPLATES_DIR, SDK_DIR);

// Step 3: Generate dynamic files
generateContracts(appRouter);
generateTypes(appRouter);
generateKeys(appRouter);
generateInvalidateMap(appRouter);
generateReactHooks(appRouter);
generateVueComposables(appRouter);
generateZodReExports(appRouter);

console.log('✅ SDK generated successfully');
```

### CI Integration

```yaml
# .github/workflows/ci.yml
jobs:
  check-generated:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm run sdk:gen
      - name: Verify SDK is up to date
        run: |
          if ! git diff --quiet src/sdk/; then
            echo "❌ SDK is out of date. Run 'pnpm run sdk:gen' and commit."
            git diff src/sdk/
            exit 1
          fi
          echo "✅ SDK is up to date"
```

### Pre-commit Hook

```bash
# .husky/pre-commit
pnpm run sdk:gen
# SDK is gitignored, no need to add
```

### Gitignore Configuration

Since the SDK is 100% auto-generated, ignore the entire folder:

```gitignore
# .gitignore

# SDK - entirely auto-generated (run `pnpm run sdk:gen` to regenerate)
src/sdk/
```

**Why gitignore the SDK?**

| Reason | Explanation |
|--------|-------------|
| **Single source of truth** | Contracts are the source, SDK is derived |
| **No merge conflicts** | Generated code causes messy git diffs |
| **Smaller repo size** | No need to store generated files |
| **Forces regeneration** | Developers must run `sdk:gen` after pulling |
| **CI validates** | CI runs `sdk:gen` and fails if contracts changed without regeneration |

**Developer workflow:**
```bash
git pull                    # Get latest contracts
pnpm run sdk:gen           # Regenerate SDK locally
pnpm run dev               # SDK is now up to date
```

**CI workflow:**
```yaml
- run: pnpm run sdk:gen    # Generate SDK
- run: pnpm run build      # Build with fresh SDK
- run: pnpm run test       # Test with fresh SDK
```

---

## DataTable Integration

The SDK integrates with `@unisane/data-table` through interface-based composition, not code generation.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      @unisane/data-table                             │
│                      (Standalone Package)                            │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   DataTable     │    │ useRemoteData   │    │   Column Defs   │  │
│  │   Component     │◀───│     Table()     │◀───│   (in component)│  │
│  └─────────────────┘    └────────┬────────┘    └─────────────────┘  │
│                                  │                                   │
│                    Expects: ListParamsLike + QueryLike               │
└────────────────────────────────────┼────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
        ┌───────────▼───────────┐       ┌────────────▼────────────┐
        │   SDK React Hooks     │       │   Any Compatible Hook   │
        │   useAdminTenants     │       │   SWR, custom, etc.     │
        │   ListParams()        │       │                         │
        └───────────────────────┘       └─────────────────────────┘
```

**Key Principle:** DataTable is SDK-agnostic. It works with any data source that implements the `ListParamsLike` and `QueryLike` interfaces.

### Interface Contracts

```typescript
// What SDK hooks must provide (ListParamsLike)
interface ListParamsLike {
  queryArgs: {
    limit?: number;
    cursor?: string;
    sort?: string;
    filters?: Record<string, unknown>;
    search?: string;
  };
  setSearch: (value: string) => void;
  setFilter: (key: string, value: unknown) => void;
  setSort: (sort: string) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

// What query hooks must provide (QueryLike)
interface QueryLike<T> {
  data?: T[] | { items: T[]; nextCursor?: string };
  isLoading: boolean;
  isFetching: boolean;
  error?: Error;
  refetch: () => void;
}
```

### SDK Hook Generation

The SDK generates `useListParams` hooks for each list operation:

```typescript
// src/sdk/react/hooks/domains/tenants.hooks.ts
/* AUTO-GENERATED — DO NOT EDIT */

// Named export for namespace pattern: hooks.tenants.listParams()
export function listParams(defaults?: {
  limit?: number;
  sort?: string;
}): ListParamsLike {
  const [state, setState] = useState({
    limit: defaults?.limit ?? 25,
    cursor: undefined as string | undefined,
    sort: defaults?.sort ?? '-createdAt',
    filters: {} as Record<string, unknown>,
    search: '',
  });

  return {
    queryArgs: state,
    setSearch: (value) => setState(s => ({ ...s, search: value, cursor: undefined })),
    setFilter: (key, value) => setState(s => ({
      ...s,
      filters: { ...s.filters, [key]: value },
      cursor: undefined,
    })),
    setSort: (sort) => setState(s => ({ ...s, sort, cursor: undefined })),
    setLimit: (limit) => setState(s => ({ ...s, limit, cursor: undefined })),
    nextPage: () => { /* set cursor from last response */ },
    prevPage: () => { /* cursor stack management */ },
    reset: () => setState({ ...defaults, filters: {}, search: '', cursor: undefined }),
  };
}

// Usage: hooks.tenants.listParams()
```

### Usage Pattern

```tsx
'use client';

import { DataTable, useRemoteDataTable, defineColumns } from '@unisane/data-table';
import { hooks } from '@saaskit/sdk/react';

// Column definitions live in the component, not SDK
const columns = defineColumns<Tenant>([
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'slug', header: 'Slug', sortable: true },
  { key: 'planId', header: 'Plan', filterType: 'select', filterOptions: planOptions },
  { key: 'membersCount', header: 'Members', sortable: true, filterType: 'number' },
  { key: 'createdAt', header: 'Created', sortable: true, filterType: 'date' },
  {
    key: 'actions',
    header: '',
    static: true,
    render: (row) => <TenantActions tenant={row} />,
  },
]);

export function TenantsTable() {
  // SDK provides ListParamsLike via namespace pattern
  const params = hooks.tenants.listParams({ limit: 25, sort: '-createdAt' });

  // SDK provides QueryLike
  const query = hooks.tenants.list(params.queryArgs);

  // Bridge to DataTable
  const tableProps = useRemoteDataTable({ params, query });

  return (
    <DataTable
      {...tableProps}
      columns={columns}
      tableId="tenants-table"
      features={{ selection: true, search: true, columnResize: true }}
      pagination={{ mode: 'cursor', pageSize: 25 }}
    />
  );
}
```

### Why No SDK-Generated Grid Registries

The old pattern generated files like `admin.tenants.grid.ts` with field definitions and query derivation. This is **no longer needed** because:

| Old Pattern | New Pattern |
|-------------|-------------|
| SDK generates `fields` metadata | Column definitions in component |
| SDK generates `deriveQuery()` | `useListParams` hook handles state |
| SDK generates `mapFilters()` | DataTable manages filter state |
| Tight coupling to gateway | Loose coupling via interfaces |
| Code generation required | Runtime composition |

### What SDK Still Generates for DataTable

The SDK generates hooks that implement `ListParamsLike` (accessed via namespace pattern):

```
src/sdk/react/hooks/
├── domains/
│   ├── tenants.hooks.ts
│   │   ├── list()                # hooks.tenants.list() - QueryLike
│   │   └── listParams()          # hooks.tenants.listParams() - ListParamsLike
│   ├── users.hooks.ts
│   │   ├── list()                # hooks.users.list()
│   │   └── listParams()          # hooks.users.listParams()
│   └── ...
```

### Advanced: Server-Side Integration

For server components with SSR:

```tsx
// app/admin/tenants/page.tsx
import { DataTable } from '@unisane/data-table';
import { createServerClient } from '@saaskit/sdk/server';

export default async function TenantsPage({ searchParams }) {
  const client = await createServerClient();

  // Fetch initial data server-side
  const initialData = await client.tenants.list({
    query: {
      limit: 25,
      sort: searchParams.sort ?? '-createdAt',
      search: searchParams.q,
    },
  });

  return (
    <TenantsTableClient
      initialData={initialData.body.data}
      initialParams={searchParams}
    />
  );
}

// Client component receives SSR data
'use client';
import { hooks } from '@saaskit/sdk/react';

function TenantsTableClient({ initialData, initialParams }) {
  const params = hooks.tenants.listParams(initialParams);
  const query = hooks.tenants.list(params.queryArgs, { initialData });
  const tableProps = useRemoteDataTable({ params, query });

  return <DataTable {...tableProps} columns={columns} />;
}
```

### DataTable Package Reference

For full DataTable documentation, see the package README:
- Column definitions and types
- Filter types (text, number, date, select, etc.)
- Virtualization for large datasets
- Export (CSV, Excel, PDF)
- Keyboard navigation
- Cell selection and editing
- Tree data and grouping

---

## Best Practices

### 1. Use Namespace Pattern for All SDK Imports

```typescript
// ✅ Good - namespace pattern (consistent, discoverable)
import { hooks, client, schemas } from '@saaskit/sdk/react';
const { data } = hooks.tenants.list();
const mutation = hooks.tenants.create();

// ❌ Avoid - direct imports (inconsistent, hard to discover)
import { useTenantsList, useTenantsCreate } from '@saaskit/sdk/react';

// ❌ Avoid - raw React Query (no type safety, manual invalidation)
const { data } = useQuery(['tenants'], () => fetch('/api/tenants'));
```

### 2. Validate Forms with Zod via Namespace

```typescript
// ✅ Good - schema-based validation via namespace
import { schemas } from '@saaskit/sdk/react';
const form = useForm({ resolver: zodResolver(schemas.tenants.create) });

// ✅ Also good - direct Zod import for types
import { ZTenantCreate, type TenantCreate } from '@saaskit/sdk/zod';
const form = useForm<TenantCreate>({ resolver: zodResolver(ZTenantCreate) });

// ❌ Avoid - manual validation
const form = useForm({
  validate: (values) => {
    if (!values.name) return { name: 'Required' };
  }
});
```

### 3. Handle Errors Specifically

```typescript
// Good - specific handling
if (error instanceof ValidationError) {
  setFieldErrors(error.errors);
} else if (error instanceof RateLimitError) {
  showRetryMessage(error.retryAfter);
}

// Avoid - generic handling
toast.error('Something went wrong');
```

### 4. Use Node Client for Server Tasks

```typescript
// Good - API key auth for server tasks
const client = createNodeClient({ baseUrl, apiKey });

// Avoid - browser client in server context
const client = createClient({ baseUrl });  // Has CSRF, expects cookies
```

---

## Summary

### Import Patterns

| Entry | Exports | Example Usage |
|-------|---------|---------------|
| `@saaskit/sdk` | `createClient` | `const client = createClient({ baseUrl })` |
| `@saaskit/sdk/node` | `createNodeClient` | `createNodeClient({ baseUrl, apiKey })` |
| `@saaskit/sdk/react` | `client`, `hooks`, `keys`, `schemas`, `types` | `hooks.tenants.list()` |
| `@saaskit/sdk/vue` | `client`, `composables`, `keys`, `schemas` | `composables.tenants.list()` |
| `@saaskit/sdk/zod` | `Z{Domain}{Action}`, types | `ZTenantCreate`, `type TenantCreate` |

### When to Use Each

| Entry | Purpose | When to Use |
|-------|---------|-------------|
| `@saaskit/sdk` | Browser client | Direct API calls in browser |
| `@saaskit/sdk/node` | Node.js client | Cron jobs, webhooks, microservices |
| `@saaskit/sdk/react` | React Query hooks | React/Next.js apps with caching |
| `@saaskit/sdk/vue` | Vue Query composables | Vue/Nuxt apps with caching |
| `@saaskit/sdk/zod` | Validation schemas | Forms, server actions, runtime checks |

---

## Related Documentation

- [Contracts Guide](./contracts-guide.md) - Defining ts-rest contracts
- [Module Development](./module-development.md) - Building new modules
- [Troubleshooting](./troubleshooting.md) - Common SDK issues
