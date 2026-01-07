# @unisane/devtools - Complete Implementation Roadmap

> **Status:** NOT IMPLEMENTED - Package shell exists, no code
> **Target:** Complete CLI toolkit for code generation, database management, and developer operations

---

## Overview

The devtools package is a comprehensive CLI toolkit providing commands across six categories:

| Category | Commands | Purpose |
|----------|----------|---------|
| **Code Generation** | `routes:gen`, `sdk:gen`, `openapi:json`, `openapi:serve`, `crud` | Generate API routes, SDK clients, OpenAPI specs |
| **Database** | `db:query`, `indexes:apply`, `seed`, `migrate` | Database queries, indexing, seeding, migrations |
| **Tenant Operations** | `tenant:info`, `tenant:reset-billing` | Tenant inspection and billing reset |
| **Billing Setup** | `billing:plans`, `billing:seed-stripe`, `billing:configure-stripe-portal` | Stripe integration and plan setup |
| **Cache & RBAC** | `rbac:invalidate-cache` | Cache management |
| **Development** | `doctor`, `watch`, `sync`, `diagrams:generate`, `routes:graph` | Health checks, file watching, diagrams |

---

## Architecture

### Command Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           @unisane/devtools                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  CODE GENERATION                                                     │    │
│  │  ├── routes:gen      → Generate Next.js API route handlers          │    │
│  │  ├── sdk:gen         → Generate complete SDK (clients, hooks, etc.) │    │
│  │  ├── openapi:json    → Generate OpenAPI JSON spec                   │    │
│  │  ├── openapi:serve   → Serve OpenAPI docs (Swagger UI)              │    │
│  │  └── crud            → Scaffold new CRUD module                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DATABASE                                                            │    │
│  │  ├── db:query        → Query collections with JSON filter           │    │
│  │  ├── indexes:apply   → Create/update database indexes               │    │
│  │  ├── seed            → Seed demo data (tenants, users, etc.)        │    │
│  │  └── migrate         → Run database migrations                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TENANT OPERATIONS                                                   │    │
│  │  ├── tenant:info     → Display tenant details and aggregates        │    │
│  │  └── tenant:reset-billing → Reset billing state for tenant          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  BILLING SETUP                                                       │    │
│  │  ├── billing:plans   → Display plan configuration                   │    │
│  │  ├── billing:seed-stripe → Create Stripe products and prices        │    │
│  │  └── billing:configure-stripe-portal → Configure customer portal    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  CACHE & RBAC                                                        │    │
│  │  └── rbac:invalidate-cache → Clear RBAC permission cache            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DEVELOPMENT                                                         │    │
│  │  ├── doctor          → Health checks and auto-fix                   │    │
│  │  ├── watch           → Watch contracts and regenerate               │    │
│  │  ├── sync            → Run all generators + doctor --fix            │    │
│  │  ├── routes:graph    → Visualize route dependencies                 │    │
│  │  └── diagrams:generate → Generate architecture diagrams             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  CORE ENGINE                                                                 │
│  ├── Contract Discovery  → Find and load *.contract.ts files               │
│  ├── Metadata Extraction → Parse defineOpMeta() via ts-morph               │
│  ├── Template Rendering  → Generate code from templates                    │
│  ├── Database Connection → Lazy connection to MongoDB                      │
│  └── File Writer         → Write with diff support                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Package Structure (Modular Architecture)

```
packages/devtools/
├── package.json
├── tsconfig.json
├── bin/
│   └── cli.ts                          # CLI entry point (thin wrapper)
├── src/
│   ├── index.ts                        # Main exports
│   ├── cli.ts                          # Commander program setup
│   ├── config/
│   │   ├── index.ts                    # Config loader
│   │   ├── schema.ts                   # Config schema (Zod)
│   │   └── defaults.ts                 # Default config values
│   │
│   ├── commands/                       # Command implementations
│   │   ├── codegen/                    # Code generation commands
│   │   │   ├── routes-gen.ts           # routes:gen
│   │   │   ├── sdk-gen.ts              # sdk:gen (orchestrator)
│   │   │   ├── openapi-json.ts         # openapi:json
│   │   │   ├── openapi-serve.ts        # openapi:serve
│   │   │   └── crud.ts                 # crud scaffold
│   │   │
│   │   ├── database/                   # Database commands
│   │   │   ├── db-query.ts             # db:query
│   │   │   ├── indexes-apply.ts        # indexes:apply
│   │   │   ├── seed.ts                 # seed
│   │   │   └── migrate.ts              # migrate
│   │   │
│   │   ├── tenant/                     # Tenant operations
│   │   │   ├── tenant-info.ts          # tenant:info
│   │   │   └── tenant-reset.ts         # tenant:reset-billing
│   │   │
│   │   ├── billing/                    # Billing setup
│   │   │   ├── billing-plans.ts        # billing:plans
│   │   │   ├── billing-stripe-seed.ts  # billing:seed-stripe
│   │   │   └── billing-stripe-portal.ts # billing:configure-stripe-portal
│   │   │
│   │   ├── cache/                      # Cache management
│   │   │   └── rbac-cache.ts           # rbac:invalidate-cache
│   │   │
│   │   └── dev/                        # Development commands
│   │       ├── doctor.ts               # doctor
│   │       ├── watch.ts                # watch
│   │       ├── sync.ts                 # sync
│   │       ├── routes-graph.ts         # routes:graph
│   │       └── diagrams.ts             # diagrams:generate
│   │
│   ├── generators/                     # Code generation engines
│   │   ├── routes/                     # Route generation
│   │   │   ├── index.ts                # Orchestrator
│   │   │   ├── discover.ts             # Contract discovery
│   │   │   ├── render.ts               # Route code rendering
│   │   │   ├── imports.ts              # Import merging
│   │   │   └── templates.ts            # Handler templates
│   │   │
│   │   ├── sdk/                        # SDK generation
│   │   │   ├── index.ts                # Orchestrator
│   │   │   ├── clients/
│   │   │   │   ├── core.ts             # Core client generator
│   │   │   │   ├── browser.ts          # Browser client
│   │   │   │   ├── server.ts           # Server client
│   │   │   │   └── node.ts             # Node.js client
│   │   │   ├── react/
│   │   │   │   ├── hooks.ts            # Domain hooks generator
│   │   │   │   ├── keys.ts             # Query key factory
│   │   │   │   └── invalidate.ts       # Invalidation map
│   │   │   ├── vue/
│   │   │   │   ├── composables.ts      # Vue composables
│   │   │   │   └── plugin.ts           # Vue plugin
│   │   │   ├── zod.ts                  # Zod schema re-exports
│   │   │   ├── types.ts                # Type re-exports
│   │   │   └── errors.ts               # Error classes
│   │   │
│   │   ├── openapi/
│   │   │   ├── dump.ts                 # OpenAPI JSON generator
│   │   │   └── serve.ts                # Swagger UI server
│   │   │
│   │   └── crud/
│   │       ├── index.ts                # CRUD scaffold orchestrator
│   │       ├── contract.ts             # Contract file generator
│   │       ├── service.ts              # Service file generator
│   │       ├── repository.ts           # Repository file generator
│   │       └── rate-limits.ts          # Rate limit policy adder
│   │
│   ├── extraction/                     # Metadata extraction
│   │   ├── index.ts                    # Main extractor
│   │   ├── meta-extract.ts             # ts-morph AST parsing
│   │   ├── types.ts                    # OpMeta, RouteGenEntry types
│   │   └── ops.ts                      # Operation collection
│   │
│   ├── database/                       # Database operations
│   │   ├── connection.ts               # Lazy DB connection
│   │   ├── indexes/
│   │   │   ├── index.ts                # Index application logic
│   │   │   └── definitions.ts          # Index definitions per collection
│   │   ├── seed/
│   │   │   ├── index.ts                # Seeding orchestrator
│   │   │   ├── tenants.ts              # Tenant seeding
│   │   │   ├── users.ts                # User seeding
│   │   │   ├── memberships.ts          # Membership seeding
│   │   │   ├── billing.ts              # Billing data seeding
│   │   │   ├── flags.ts                # Feature flag seeding
│   │   │   └── apikeys.ts              # API key seeding
│   │   └── migrations/
│   │       ├── runner.ts               # Migration runner
│   │       └── history.ts              # Migration history tracking
│   │
│   ├── tenant/                         # Tenant operations
│   │   ├── info.ts                     # Tenant info retrieval
│   │   └── reset.ts                    # Billing reset logic
│   │
│   ├── billing/                        # Billing operations
│   │   ├── plans.ts                    # Plan display logic
│   │   └── stripe/
│   │       ├── seed.ts                 # Stripe product/price creation
│   │       └── portal.ts               # Portal configuration
│   │
│   ├── checks/                         # Doctor checks
│   │   ├── index.ts                    # Check orchestrator
│   │   ├── sidecars.ts                 # Sidecar file checks
│   │   ├── factories.ts                # Factory pattern checks
│   │   ├── services.ts                 # Service purity checks
│   │   ├── ui-boundaries.ts            # UI import boundary checks
│   │   ├── contracts-meta.ts           # Contract metadata checks
│   │   ├── imports.ts                  # Import style checks
│   │   └── env.ts                      # Environment variable checks
│   │
│   └── utils/
│       ├── fs.ts                       # File operations (writeText, ensureDir)
│       ├── git.ts                      # Git operations (ensureCleanWorkingTree)
│       ├── env.ts                      # Environment loading (.env.local)
│       ├── logger.ts                   # Logging (ora spinners, chalk colors)
│       ├── paths.ts                    # Path utilities
│       └── templates.ts                # Template rendering utilities
│
└── templates/                          # Static code templates
    ├── sdk/
    │   ├── core/
    │   │   ├── client.ts.tpl
    │   │   └── errors.ts.tpl
    │   ├── browser/
    │   │   └── client.ts.tpl
    │   ├── server/
    │   │   ├── client.ts.tpl
    │   │   └── getSession.ts.tpl
    │   ├── node/
    │   │   └── client.ts.tpl
    │   ├── react/
    │   │   ├── Provider.tsx.tpl
    │   │   ├── context.ts.tpl
    │   │   └── utils.ts.tpl
    │   └── vue/
    │       ├── plugin.ts.tpl
    │       └── context.ts.tpl
    └── crud/
        ├── contract.ts.tpl
        ├── service.ts.tpl
        ├── repository.ts.tpl
        └── schemas.ts.tpl
```

---

## Implementation Phases

### Phase 1: CLI Infrastructure & Utilities
**Goal:** Working CLI skeleton with command routing and shared utilities

**Files to create:**
```
src/
├── index.ts              # Main exports
├── cli.ts                # Commander program with all commands registered
├── config/
│   ├── index.ts          # Config loader (devtools.config.ts)
│   ├── schema.ts         # Zod schema for config validation
│   └── defaults.ts       # Default config values
└── utils/
    ├── fs.ts             # ensureDir, writeText, readText
    ├── git.ts            # ensureCleanWorkingTree
    ├── env.ts            # loadEnvLocal
    ├── logger.ts         # ora spinners, chalk colors, banner
    ├── paths.ts          # Path conversion utilities
    └── templates.ts      # Template file loading/rendering
```

**Deliverables:**
- [ ] CLI entry point with commander (all commands registered)
- [ ] Config file loading (devtools.config.ts)
- [ ] Utility functions (file writing, git checks, env loading)
- [ ] Logger with ora spinners and chalk colors
- [ ] Package builds and runs

**Reference:** Port from `/saaskit/devtools/index.ts`, `/saaskit/devtools/utils.ts`, `/saaskit/devtools/env.ts`

---

### Phase 2: Database Operations
**Goal:** Database commands for querying, indexing, seeding, and migrations

**Files to create:**
```
src/
├── commands/database/
│   ├── db-query.ts       # db:query command
│   ├── indexes-apply.ts  # indexes:apply command
│   ├── seed.ts           # seed command
│   └── migrate.ts        # migrate command
└── database/
    ├── connection.ts     # Lazy DB connection
    ├── indexes/
    │   ├── index.ts      # Index application logic
    │   └── definitions.ts # Index definitions per collection
    ├── seed/
    │   ├── index.ts      # Seeding orchestrator
    │   ├── tenants.ts    # Tenant seeding
    │   ├── users.ts      # User seeding
    │   ├── memberships.ts # Membership seeding
    │   ├── billing.ts    # Billing data seeding
    │   ├── flags.ts      # Feature flag seeding
    │   └── apikeys.ts    # API key seeding
    └── migrations/
        ├── runner.ts     # Migration runner
        └── history.ts    # Migration history tracking
```

**Deliverables:**
- [ ] `db:query <collection> [filterJson]` - Query any collection
- [ ] `indexes:apply` - Create/update all database indexes
- [ ] `seed` - Seed demo data from seed.data.json or defaults
- [ ] `migrate` - Run pending database migrations
- [ ] Lazy database connection (only connect when needed)

**Reference:** Port from:
- `/saaskit/devtools/commands/db-query.ts`
- `/saaskit/scripts/indexes/apply.ts`
- `/saaskit/scripts/seed.ts`
- `/saaskit/scripts/db/migrate.ts`

---

### Phase 3: Contract Discovery & Metadata Extraction
**Goal:** Parse contracts and extract operation metadata for code generation

**Files to create:**
```
src/
├── extraction/
│   ├── index.ts          # Main extractor
│   ├── meta-extract.ts   # ts-morph AST parsing
│   ├── types.ts          # OpMeta, RouteGenEntry types
│   └── ops.ts            # Operation collection from router
└── generators/routes/
    └── discover.ts       # Contract file discovery
```

**Deliverables:**
- [ ] Contract file discovery (glob patterns for *.contract.ts)
- [ ] Operation collection from appRouter
- [ ] AST-based metadata extraction (ts-morph)
- [ ] Path conversion (`:id` → `[id]`)
- [ ] OpMeta type definition with all fields

**Reference:** Port from:
- `/saaskit/scripts/codegen/routes/discover.ts`
- `/saaskit/scripts/codegen/routes/meta-extract.ts`
- `/saaskit/scripts/codegen/routes/meta.ts`

---

### Phase 4: Route Generation
**Goal:** Generate Next.js API route handlers from contracts

**Files to create:**
```
src/
├── commands/codegen/
│   └── routes-gen.ts     # routes:gen command
└── generators/routes/
    ├── index.ts          # Orchestrator
    ├── render.ts         # Code generation for handlers
    ├── imports.ts        # Import merging logic
    └── templates.ts      # Handler templates
```

**Deliverables:**
- [ ] `routes:gen` command with flags (--no-scaffold, --rewrite)
- [ ] Handler code generation
- [ ] Import merging (multiple methods per route)
- [ ] Service invocation patterns (callArgs, callExpr)
- [ ] Audit trail integration
- [ ] Zod validation integration
- [ ] Runtime configuration (nodejs/edge)

**Output pattern:**
```typescript
/* AUTO-GENERATED by 'unisane-devtools routes:gen' — DO NOT EDIT */
import { makeHandler } from '@unisane/gateway';
import { grant, ZGrantTokens } from '@unisane/credits';
import { PERM } from '@unisane/gateway';

export const runtime = 'nodejs';

export const POST = makeHandler<typeof ZGrantTokens>(
  { op: "credits.grant", requireTenantMatch: true, perm: PERM.BILLING_WRITE, zod: ZGrantTokens },
  async ({ req, params, body, ctx, requestId }) => {
    const result = await grant({ tenantId: params.tenantId, ...body });
    return result;
  }
);
```

**Reference:** Port from:
- `/saaskit/scripts/codegen/routes/gen-routes.ts`
- `/saaskit/scripts/codegen/routes/render.ts`

---

### Phase 5: SDK Core Generation
**Goal:** Generate base SDK (clients, errors, types)

**Files to create:**
```
src/
├── commands/codegen/
│   └── sdk-gen.ts        # sdk:gen orchestrator
└── generators/sdk/
    ├── index.ts          # SDK generation orchestrator
    ├── clients/
    │   ├── core.ts       # Core client generator
    │   ├── browser.ts    # Browser client generator
    │   ├── server.ts     # Server client generator
    │   └── node.ts       # Node.js client generator
    ├── errors.ts         # Error classes generator
    └── types.ts          # Type re-exports generator
```

**Templates:**
```
templates/sdk/
├── core/
│   ├── client.ts.tpl
│   └── errors.ts.tpl
├── browser/
│   └── client.ts.tpl
├── server/
│   ├── client.ts.tpl
│   └── getSession.ts.tpl
└── node/
    └── client.ts.tpl
```

**Deliverables:**
- [ ] `sdk:gen` command (orchestrator with flags)
- [ ] Core client generation
- [ ] Browser client with CSRF
- [ ] Server client with header forwarding
- [ ] Node.js client with API key auth
- [ ] Error classes generation
- [ ] Type re-exports from contracts

**Reference:** Port from `/saaskit/scripts/codegen/sdk/gen-clients.ts`, `/saaskit/scripts/codegen/sdk/gen-types.ts`

---

### Phase 6: React Hooks Generation
**Goal:** Generate @tanstack/react-query hooks

**Files to create:**
```
src/generators/sdk/
├── react/
│   ├── hooks.ts          # Domain hooks generator
│   ├── keys.ts           # Query key factory generator
│   ├── invalidate.ts     # Invalidation map generator
│   ├── naming.ts         # Hook naming utilities
│   ├── parser.ts         # Contract parsing for hooks
│   └── utils.ts          # Utility functions generator
```

**Templates:**
```
templates/sdk/react/
├── Provider.tsx.tpl
├── context.ts.tpl
├── utils.ts.tpl
├── unwrap.ts.tpl
└── useFeatureFlags.ts.tpl
```

**Deliverables:**
- [ ] Per-domain hooks generation (`hooks.tenants.list()`)
- [ ] Query hooks (useQuery wrapper)
- [ ] Mutation hooks (useMutation with invalidation)
- [ ] ListParams hooks (for DataTable)
- [ ] Query key factory
- [ ] Invalidation map from contract metadata
- [ ] Utility hooks (useInvalidate, usePrefetch)

**Namespace pattern:**
```typescript
// Generated: src/sdk/react/hooks/index.ts
import * as tenants from './domains/tenants.hooks';
import * as users from './domains/users.hooks';

export const hooks = {
  tenants,  // hooks.tenants.list(), hooks.tenants.create()
  users,    // hooks.users.list(), hooks.users.get()
} as const;
```

**Reference:** Port from:
- `/saaskit/scripts/codegen/sdk/gen-hooks.ts`
- `/saaskit/scripts/codegen/sdk/gen-invalidate.ts`
- `/saaskit/scripts/codegen/sdk/hooks/*`

---

### Phase 7: Vue Composables Generation
**Goal:** Generate @tanstack/vue-query composables

**Files to create:**
```
src/generators/sdk/
├── vue/
│   ├── composables.ts    # Domain composables generator
│   ├── keys.ts           # Query key factory generator
│   └── plugin.ts         # Vue plugin generator
```

**Templates:**
```
templates/sdk/vue/
├── plugin.ts.tpl
└── context.ts.tpl
```

**Deliverables:**
- [ ] Per-domain composables (`composables.tenants.list()`)
- [ ] Query composables with ref support
- [ ] Mutation composables
- [ ] Vue plugin for initialization

---

### Phase 8: OpenAPI & Zod Generation
**Goal:** Generate Zod re-exports and OpenAPI spec

**Files to create:**
```
src/
├── commands/codegen/
│   ├── openapi-json.ts   # openapi:json command
│   └── openapi-serve.ts  # openapi:serve command
└── generators/
    ├── sdk/
    │   └── zod.ts        # Zod schema re-exports
    └── openapi/
        ├── dump.ts       # OpenAPI JSON generator
        └── serve.ts      # Swagger UI server
```

**Deliverables:**
- [ ] Per-domain Zod re-exports
- [ ] `schemas` namespace object
- [ ] `openapi:json` - Generate OpenAPI JSON file
- [ ] `openapi:serve` - Serve Swagger UI locally
- [ ] Operation ID mapping

**Reference:** Port from `/saaskit/scripts/codegen/openapi/openapi-dump.ts`, `/saaskit/devtools/commands/openapi.serve.ts`

---

### Phase 9: CRUD Scaffolding
**Goal:** Scaffold new CRUD modules with contract, service, repository

**Files to create:**
```
src/
├── commands/codegen/
│   └── crud.ts           # crud command
└── generators/crud/
    ├── index.ts          # CRUD scaffold orchestrator
    ├── contract.ts       # Contract file generator
    ├── service.ts        # Service file generator
    ├── repository.ts     # Repository file generator
    └── rate-limits.ts    # Rate limit policy adder
```

**Templates:**
```
templates/crud/
├── contract.ts.tpl
├── service.ts.tpl
├── repository.ts.tpl
└── schemas.ts.tpl
```

**Deliverables:**
- [ ] `crud <moduleName>` - Scaffold new CRUD module
- [ ] Contract file with list/read/create/update/delete ops
- [ ] Service file with business logic stubs
- [ ] Repository file with data access patterns
- [ ] Auto-add rate limit policies

**Reference:** Port from `/saaskit/devtools/commands/crud.ts`

---

### Phase 10: Tenant & Billing Operations
**Goal:** Commands for tenant inspection and billing setup

**Files to create:**
```
src/
├── commands/
│   ├── tenant/
│   │   ├── tenant-info.ts        # tenant:info
│   │   └── tenant-reset.ts       # tenant:reset-billing
│   └── billing/
│       ├── billing-plans.ts      # billing:plans
│       ├── billing-stripe-seed.ts # billing:seed-stripe
│       └── billing-stripe-portal.ts # billing:configure-stripe-portal
├── tenant/
│   ├── info.ts           # Tenant info retrieval logic
│   └── reset.ts          # Billing reset logic
└── billing/
    ├── plans.ts          # Plan display logic
    └── stripe/
        ├── seed.ts       # Stripe product/price creation
        └── portal.ts     # Portal configuration
```

**Deliverables:**
- [ ] `tenant:info <slug|id>` - Display tenant details, members, billing
- [ ] `tenant:reset-billing <slug|id>` - Reset billing state
- [ ] `billing:plans` - Display plan configuration
- [ ] `billing:seed-stripe` - Create Stripe products and prices from plans
- [ ] `billing:configure-stripe-portal` - Configure customer portal

**Reference:** Port from:
- `/saaskit/devtools/commands/tenant-info.ts`
- `/saaskit/devtools/commands/tenant-reset.ts`
- `/saaskit/devtools/commands/billing-plans.ts`
- `/saaskit/devtools/commands/billing-stripe-seed.ts`
- `/saaskit/devtools/commands/billing-configure-stripe-portal.ts`

---

### Phase 11: Cache & RBAC Operations
**Goal:** Cache management commands

**Files to create:**
```
src/commands/cache/
└── rbac-cache.ts         # rbac:invalidate-cache command
```

**Deliverables:**
- [ ] `rbac:invalidate-cache` - Clear RBAC permission cache

**Reference:** Port from `/saaskit/devtools/commands/rbac-cache.ts`

---

### Phase 12: Developer Commands
**Goal:** Health checks, watch mode, sync, and diagnostics

**Files to create:**
```
src/
├── commands/dev/
│   ├── doctor.ts         # doctor command
│   ├── watch.ts          # watch command
│   ├── sync.ts           # sync command
│   ├── routes-graph.ts   # routes:graph command
│   └── diagrams.ts       # diagrams:generate command
└── checks/               # Doctor checks (modular)
    ├── index.ts          # Check orchestrator
    ├── sidecars.ts       # Sidecar file checks
    ├── factories.ts      # Factory pattern checks
    ├── services.ts       # Service purity checks
    ├── ui-boundaries.ts  # UI import boundary checks
    ├── contracts-meta.ts # Contract metadata checks
    ├── imports.ts        # Import style checks
    └── env.ts            # Environment variable checks
```

**Deliverables:**
- [ ] `doctor` - Health checks with --fix option
- [ ] `doctor` checks:
  - [ ] Wrapper/sidecar file consistency
  - [ ] Factory usage audit
  - [ ] Service purity (no Request/URL)
  - [ ] UI boundary enforcement
  - [ ] Contracts metadata validation
  - [ ] Import style (split value/type imports)
  - [ ] Environment variable validation
- [ ] `watch` - Watch contracts and regenerate on change
- [ ] `sync` - Run all generators + doctor --fix
- [ ] `routes:graph` - Visualize route dependencies (--json, --dot)
- [ ] `diagrams:generate` - Generate architecture diagrams

**Reference:** Port from:
- `/saaskit/devtools/commands/doctor.ts`
- `/saaskit/devtools/commands/watch.ts`
- `/saaskit/devtools/commands/routes.graph.ts`
- `/saaskit/devtools/commands/diagrams.generate.ts`

---

### Phase 13: Full Integration & Polish
**Goal:** Complete CLI with all features working together

**Deliverables:**
- [ ] All commands wired and tested
- [ ] Dry-run mode for generators (--dry-run)
- [ ] Verbose logging mode (--verbose)
- [ ] Comprehensive error handling
- [ ] CI integration (verify generated code)
- [ ] Help text for all commands
- [ ] Documentation

---

## Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.0.0",
    "ora": "^8.0.0",
    "ts-morph": "^23.0.0",
    "glob": "^10.0.0",
    "fs-extra": "^11.0.0",
    "diff": "^7.0.0",
    "chokidar": "^3.0.0",
    "express": "^4.0.0",
    "swagger-ui-express": "^5.0.0",
    "dotenv": "^16.0.0"
  },
  "peerDependencies": {
    "typescript": "^5.0.0",
    "@unisane/kernel": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

---

## Config File (devtools.config.ts)

```typescript
import { defineConfig } from '@unisane/devtools';

export default defineConfig({
  // Contract discovery
  contracts: {
    dir: './src/contracts',
    router: './src/contracts/app.router.ts',
    glob: '**/*.contract.ts',
  },

  // Route generation
  routes: {
    output: './src/app/api',
    runtime: 'nodejs',
  },

  // SDK generation
  sdk: {
    output: './src/sdk',
    targets: ['browser', 'server', 'node', 'react', 'vue', 'zod', 'types'],
    namespace: true,  // Use hooks.domain.action() pattern
  },

  // Database
  database: {
    uri: process.env.MONGODB_URI,
    seedDataPath: './scripts/seed.data.json',
  },

  // Package imports (for generated code)
  packages: {
    gateway: '@unisane/gateway',
    kernel: '@unisane/kernel',
    audit: '@unisane/audit',
    billing: '@unisane/billing',
    credits: '@unisane/credits',
    flags: '@unisane/flags',
    identity: '@unisane/identity',
    notify: '@unisane/notify',
    settings: '@unisane/settings',
    storage: '@unisane/storage',
    tenants: '@unisane/tenants',
    webhooks: '@unisane/webhooks',
  },
});
```

---

## CLI Usage

```bash
# Code Generation
pnpm devtools routes:gen              # Generate Next.js API route handlers
pnpm devtools routes:gen --dry-run    # Preview without writing
pnpm devtools routes:gen --rewrite    # Force rewrite all routes
pnpm devtools sdk:gen                 # Generate complete SDK
pnpm devtools sdk:gen --hooks         # React hooks only
pnpm devtools sdk:gen --vue           # Vue composables only
pnpm devtools sdk:gen --clients       # Clients only
pnpm devtools openapi:json            # Generate OpenAPI JSON
pnpm devtools openapi:serve           # Serve Swagger UI
pnpm devtools crud users              # Scaffold new CRUD module

# Database
pnpm devtools db:query tenants '{"slug":"acme"}'  # Query collection
pnpm devtools indexes:apply           # Apply all database indexes
pnpm devtools seed                    # Seed demo data
pnpm devtools migrate                 # Run migrations

# Tenant Operations
pnpm devtools tenant:info acme        # Show tenant details
pnpm devtools tenant:reset-billing acme # Reset billing state

# Billing Setup
pnpm devtools billing:plans           # Display plan configuration
pnpm devtools billing:seed-stripe     # Create Stripe products/prices
pnpm devtools billing:configure-stripe-portal # Configure portal

# Cache & RBAC
pnpm devtools rbac:invalidate-cache   # Clear RBAC cache

# Development
pnpm devtools doctor                  # Health check
pnpm devtools doctor --fix            # Health check with auto-fix
pnpm devtools watch                   # Watch mode
pnpm devtools sync                    # Run all generators + doctor --fix
pnpm devtools routes:graph --json     # Route dependencies as JSON
pnpm devtools routes:graph --dot      # Route dependencies as DOT
pnpm devtools diagrams:generate svg   # Generate architecture diagrams
```

---

## Reference Files

**Old saaskit (to port from):**
- `/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit/devtools/index.ts`
- `/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit/devtools/commands/*`
- `/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit/scripts/codegen/routes/*`
- `/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit/scripts/codegen/sdk/*`
- `/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit/scripts/indexes/apply.ts`
- `/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit/scripts/seed.ts`
- `/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit/scripts/db/migrate.ts`

**Architecture docs:**
- `/unisane-monorepo/handbook/architecture/sdk-architecture.md`
- `/unisane-monorepo/handbook/architecture/contracts-guide.md`

**Generated code examples:**
- `/unisane-monorepo/starters/saaskit/src/app/api/rest/v1/` (routes)
- `/unisane-monorepo/starters/saaskit/src/sdk/` (SDK)

---

## Key Design Decisions

1. **Modular Architecture** - Each command category has its own directory; no bloated single files
2. **Separation of Concerns** - Commands (CLI) are separate from generators (business logic)
3. **Namespace Pattern** - SDK uses `hooks.domain.action()` not `useDomainAction()`
4. **100% Auto-Generated** - No hand-written SDK files, all from contracts
5. **Package Imports** - Generated code imports from `@unisane/*` packages
6. **ts-morph for AST** - Robust metadata extraction from TypeScript
7. **Templates + Generation** - Static templates for structure, dynamic for domain code
8. **Config-Driven** - devtools.config.ts controls all paths and options
9. **Lazy Loading** - Database connection only when needed
10. **Doctor Checks Modular** - Each check is a separate file for maintainability

---

## Command Reference

| Command | Description | Options |
|---------|-------------|---------|
| `routes:gen` | Generate Next.js API routes from contracts | `--dry-run`, `--rewrite`, `--no-scaffold` |
| `sdk:gen` | Generate SDK (clients, hooks, types) | `--clients`, `--hooks`, `--vue`, `--zod`, `--types` |
| `openapi:json` | Generate OpenAPI JSON specification | |
| `openapi:serve` | Serve Swagger UI locally | `--port` |
| `crud` | Scaffold new CRUD module | `<moduleName>` |
| `db:query` | Query database collection | `<collection> [filterJson]` |
| `indexes:apply` | Create/update database indexes | |
| `seed` | Seed demo data | |
| `migrate` | Run database migrations | |
| `tenant:info` | Display tenant details | `<slug\|id>` |
| `tenant:reset-billing` | Reset tenant billing state | `<slug\|id>` |
| `billing:plans` | Display plan configuration | |
| `billing:seed-stripe` | Create Stripe products/prices | |
| `billing:configure-stripe-portal` | Configure Stripe portal | |
| `rbac:invalidate-cache` | Clear RBAC permission cache | |
| `doctor` | Run health checks | `--fix` |
| `watch` | Watch contracts and regenerate | |
| `sync` | Run all generators + doctor --fix | |
| `routes:graph` | Visualize route dependencies | `--json`, `--dot` |
| `diagrams:generate` | Generate architecture diagrams | `<format>` |
