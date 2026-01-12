# Development Tools

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
>
> **Last Updated:** January 2026 (reflects current codebase implementation)

Complete specification for all development tools in the Unisane monorepo.

---

## Overview

The Unisane development tools ecosystem consists of:

1. **@unisane/devtools** - Unified CLI for development operations (797 lines, actively developed)
2. **@unisane/cli-core** - Shared utilities for CLI tools (logging, prompts)
3. **@unisane/test-utils** - Test utilities and helpers
4. **Shared configs** - ESLint, TypeScript, Tailwind configurations
5. **Release tooling** - Build and distribution tools (partial implementation)

**Current Status (January 2026):**
- Core CLI infrastructure: ✅ **Complete**
- Code generation: ✅ **Routes and SDK working**
- Database commands: ✅ **Core operations working**
- UI component system: ✅ **Complete (shadcn-style)**
- Tenant/Billing commands: ⚠️ **Defined but not implemented**
- CI/CD workflows: ❌ **Not implemented**
- Git hooks: ❌ **Not configured**

---

## Table of Contents

1. [CLI Architecture](#cli-architecture)
2. [Tool Packages](#tool-packages)
3. [Command Reference](#command-reference)
4. [Shared Configurations](#shared-configurations)
5. [Implementation Status](#implementation-status)
6. [Migration Guide](#migration-guide)

---

## CLI Architecture

### Package Structure

```
packages/tooling/
├── devtools/              # @unisane/devtools (main CLI)
│   ├── src/
│   │   ├── cli.ts         # Entry point (797 lines)
│   │   ├── commands/
│   │   │   ├── ui/        # ✅ UI component management
│   │   │   ├── routes/    # ✅ Route generation
│   │   │   ├── sdk/       # ✅ SDK generation
│   │   │   ├── db/        # ✅ Database operations
│   │   │   ├── env/       # ✅ Environment management
│   │   │   ├── add/       # ⚠️ Module/integration adding
│   │   │   ├── create/    # ✅ Project creation
│   │   │   ├── dev/       # ✅ Doctor command
│   │   │   ├── upgrade/   # ✅ Package upgrades
│   │   │   └── release/   # ✅ Build and distribution
│   │   └── utils/
│   │       ├── env.ts     # Environment loading
│   │       └── git.ts     # Git utilities
│   └── package.json
│
├── cli-core/              # @unisane/cli-core (shared utilities)
│   └── src/
│       ├── log.ts         # Logging utilities
│       └── prompts.ts     # Interactive prompts
│
├── unisane/               # Main `unisane` CLI (lightweight wrapper)
│   └── src/
│       └── cli.ts         # Delegates to devtools
│
├── create-unisane/        # Project scaffolding
│   └── src/
│       ├── index.ts       # Entry point
│       └── template.ts    # Template download
│
├── test-utils/            # @unisane/test-utils
│   └── src/
│       ├── db.ts          # Database test helpers
│       ├── fixtures.ts    # Test fixtures
│       └── context.ts     # Test context
│
├── eslint-config/         # @unisane/eslint-config
├── typescript-config/     # @unisane/typescript-config
└── tailwind-config/       # @unisane/tailwind-config
```

### Command Categories

```
unisane                          # Main CLI entry

PROJECT SETUP ✅
├── create [name]                # Create new project
└── init                         # ⚠️ Not implemented

UI COMPONENTS ✅
├── ui init                      # Initialize Unisane UI
├── ui add [components...]       # Add components (shadcn-style)
├── ui diff [component]          # Check for updates
└── ui doctor                    # Verify installation

ADD RESOURCES ⚠️
├── add module <name>            # ⚠️ Partially implemented
└── add integration <name>       # ⚠️ Not implemented

CODE GENERATION
├── generate routes              # ✅ Generate API routes
├── generate sdk                 # ✅ Generate SDK
├── generate types               # ✅ Generate types
├── generate openapi             # ❌ Not implemented
└── generate crud <name>         # ❌ Not implemented

DATABASE ✅
├── db query <collection>        # Query collections
├── db collections               # List collections
├── db rename [from] [to]        # Rename collections
├── db seed                      # Seed database
├── db migrate                   # Run migrations
├── db indexes                   # Manage indexes
├── db push                      # ❌ Not implemented
├── db pull                      # ❌ Not implemented
└── db studio                    # ❌ Not implemented

ENVIRONMENT ✅
├── env check                    # Validate env vars
├── env init                     # Create .env.local
├── env pull                     # ⚠️ Defined, not functional
├── env push                     # ⚠️ Defined, not functional
└── env generate                 # ⚠️ Defined, not functional

DEVELOPMENT
├── dev                          # ⚠️ Passthrough to pnpm dev
├── build                        # ⚠️ Passthrough to pnpm build
├── doctor                       # ✅ Health checks with --fix
├── upgrade                      # ✅ Upgrade packages
├── info                         # ✅ Show versions
├── sync                         # ❌ Not implemented
└── watch                        # ❌ Not implemented

TENANT MANAGEMENT ❌
├── tenant info <id>             # Not implemented
├── tenant list                  # Not implemented
├── tenant create                # Not implemented
└── tenant delete <id>           # Not implemented

BILLING ❌
├── billing plans                # Not implemented
├── billing sync-stripe          # Not implemented
└── billing portal-config        # Not implemented

CACHE ❌
├── cache clear                  # Not implemented
└── cache clear-rbac             # Not implemented

RELEASE ✅
├── release build                # Build distribution
├── release verify               # Verify build
├── release versions             # List versions
└── release publishable          # Show publishable packages
```

---

## Tool Packages

### @unisane/devtools (Main CLI)

**Status:** ✅ Actively developed (797 lines)

**Location:** `packages/tooling/devtools/`

**Binary:** `unisane` (via `@unisane/devtools`)

**Purpose:** Unified CLI for all development operations in Unisane projects.

**Key Features:**
- Contract-first code generation (routes, SDK, types)
- UI component management (shadcn-style)
- Database operations (query, seed, migrate, indexes)
- Environment management
- Package upgrades with codemods
- Release tooling

**Dependencies:**
```json
{
  "dependencies": {
    "@unisane/cli-core": "workspace:*",
    "commander": "^12.0.0",
    "ts-morph": "^21.0.0",
    "mongodb": "^6.3.0",
    "chokidar": "^3.5.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0",
    "prompts": "^2.4.2",
    "fs-extra": "^11.0.0"
  }
}
```

**Installation:**
```bash
# In a Unisane project
pnpm install

# Already included in starters as devDependency
```

---

### @unisane/cli-core (Shared Utilities)

**Status:** ✅ Complete

**Location:** `packages/tooling/cli-core/`

**Purpose:** Shared logging and prompt utilities for all CLI tools.

**Exports:**

```typescript
// packages/tooling/cli-core/src/log.ts

export const log = {
  // Banners
  banner(text: string): void;

  // Levels
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;

  // Formatting
  dim(message: string): void;
  section(title: string): void;
  kv(key: string, value: string): void;
  list(items: string[]): void;
  newline(): void;

  // Spinners
  spinner(text: string): Ora;
};

export function setVerbose(enabled: boolean): void;
```

```typescript
// packages/tooling/cli-core/src/prompts.ts

export async function confirm(message: string, initial?: boolean): Promise<boolean>;

export async function select<T extends string>(
  message: string,
  choices: Array<{ value: T; title: string; description?: string }>
): Promise<T | null>;

export async function multiselect<T extends string>(
  message: string,
  choices: Array<{ value: T; title: string; selected?: boolean }>
): Promise<T[]>;

export async function text(
  message: string,
  options?: { initial?: string; validate?: (value: string) => boolean | string }
): Promise<string | null>;
```

**Usage:**
```typescript
import { log, confirm, select } from '@unisane/cli-core';

log.banner('Unisane');
log.info('Starting code generation...');

const confirmed = await confirm('Generate routes?', true);

const component = await select('Select component:', [
  { value: 'button', title: 'Button', description: 'Primary button component' },
  { value: 'card', title: 'Card', description: 'Card container' },
]);
```

---

### @unisane/test-utils

**Status:** ✅ Complete

**Location:** `packages/tooling/test-utils/`

**Purpose:** Test utilities for database setup, fixtures, and context management.

**Key Files:**

```typescript
// packages/tooling/test-utils/src/db.ts

import { MongoMemoryServer } from 'mongodb-memory-server';

export async function setupTestDb(): Promise<void>;
export async function teardownTestDb(): Promise<void>;
export async function clearCollections(): Promise<void>;
```

```typescript
// packages/tooling/test-utils/src/context.ts

import type { RequestContext } from '@unisane/kernel';

export function createTestContext(overrides?: Partial<RequestContext>): RequestContext;

export async function runWithTestContext<T>(
  fn: () => Promise<T>,
  overrides?: Partial<RequestContext>
): Promise<T>;
```

```typescript
// packages/tooling/test-utils/src/fixtures.ts

export const fixtures = {
  user: (overrides?: Partial<User>) => User;
  tenant: (overrides?: Partial<Tenant>) => Tenant;
  subscription: (overrides?: Partial<Subscription>) => Subscription;
  // ... more fixture factories
};
```

**Usage in Tests:**
```typescript
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDb, teardownTestDb, clearCollections } from '@unisane/test-utils';
import { runWithTestContext, fixtures } from '@unisane/test-utils';

describe('user service', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  it('creates a user', async () => {
    await runWithTestContext(async () => {
      const user = fixtures.user({ email: 'test@example.com' });
      // Test logic...
    });
  });
});
```

---

### @unisane/eslint-config

**Status:** ✅ Complete

**Location:** `packages/tooling/eslint-config/`

**Exports:**
- `base.js` - Base rules for all packages
- `next.js` - Next.js specific rules
- `react-internal.js` - React library rules

**Usage:**
```javascript
// eslint.config.js
import base from '@unisane/eslint-config/base';

export default [...base];
```

---

### @unisane/typescript-config

**Status:** ✅ Complete

**Location:** `packages/tooling/typescript-config/`

**Exports:**
- `base.json` - Base TypeScript config
- `nextjs.json` - Next.js apps
- `react-library.json` - React packages
- `node-library.json` - Node.js packages

**Usage:**
```json
// tsconfig.json
{
  "extends": "@unisane/typescript-config/nextjs.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

---

### @unisane/tailwind-config

**Status:** ✅ Complete

**Location:** `packages/tooling/tailwind-config/`

**Usage:**
```javascript
// tailwind.config.js
import baseConfig from '@unisane/tailwind-config';

export default {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}'],
};
```

---

## Command Reference

### Project Setup Commands

#### ✅ `unisane create [name]`

Create a new Unisane project from templates.

**Status:** Implemented

```bash
unisane create my-app
unisane create my-app --template saaskit
unisane create my-app --use-pnpm
unisane create my-app --skip-git --skip-install
```

**Options:**
- `-t, --template <template>` - Template: saaskit, minimal, api-only (default: saaskit)
- `--use-npm` - Use npm as package manager
- `--use-yarn` - Use yarn
- `--use-pnpm` - Use pnpm
- `--use-bun` - Use bun
- `--skip-git` - Skip git initialization
- `--skip-install` - Skip dependency installation
- `--typescript` - Use TypeScript strict mode
- `--example` - Include example code

**Implementation:** [packages/tooling/devtools/src/commands/create/index.ts](../../packages/tooling/devtools/src/commands/create/index.ts)

---

#### ⚠️ `unisane init`

Initialize Unisane in an existing project.

**Status:** Not implemented (shows warning message)

```bash
unisane init
# Output: init command is not yet implemented
# Use: unisane create <name> instead
```

---

### UI Component Commands

#### ✅ `unisane ui init`

Initialize Unisane UI in your project (shadcn-style).

**Status:** Implemented

```bash
unisane ui init
unisane ui init --force  # Overwrite existing files
```

**What it does:**
1. Verifies Next.js project structure
2. Creates `src/styles/unisane.css` (from @unisane/tokens)
3. Creates `src/lib/utils.ts` (cn function with tailwind-merge)
4. Updates `app/globals.css` with imports
5. Creates component directories

**Implementation:** [packages/tooling/devtools/src/commands/ui/init.ts](../../packages/tooling/devtools/src/commands/ui/init.ts)

---

#### ✅ `unisane ui add [components...]`

Add UI components to your project.

**Status:** Implemented

```bash
unisane ui add                    # Interactive selection
unisane ui add button card        # Add specific components
unisane ui add --all              # Add all components
unisane ui add button --overwrite # Overwrite existing
```

**Options:**
- `-y, --yes` - Skip confirmation prompts
- `-o, --overwrite` - Overwrite existing files
- `-a, --all` - Add all components

**How it works:**
1. Loads registry from `@unisane/ui/registry/registry.json`
2. Resolves component dependencies (transitive)
3. Interactive selection if no components specified
4. Copies files from registry, transforms imports
5. Reports npm dependencies needed

**Implementation:** [packages/tooling/devtools/src/commands/ui/add.ts](../../packages/tooling/devtools/src/commands/ui/add.ts)

---

#### ✅ `unisane ui diff [component]`

Check for component updates.

**Status:** Implemented

```bash
unisane ui diff           # Check all components
unisane ui diff button    # Check specific component
```

**Implementation:** [packages/tooling/devtools/src/commands/ui/diff.ts](../../packages/tooling/devtools/src/commands/ui/diff.ts)

---

#### ✅ `unisane ui doctor`

Check UI installation health.

**Status:** Implemented

```bash
unisane ui doctor
```

**Checks:**
- Next.js installation
- Tailwind v4 configuration
- @unisane/ui package
- Tokens package
- CSS imports
- Utils file

**Implementation:** [packages/tooling/devtools/src/commands/ui/doctor.ts](../../packages/tooling/devtools/src/commands/ui/doctor.ts)

---

### Code Generation Commands

#### ✅ `unisane generate routes`

Generate Next.js API route handlers from ts-rest contracts.

**Status:** Implemented

```bash
unisane generate routes
unisane generate routes --dry-run      # Preview changes
unisane generate routes --rewrite      # Force rewrite all
unisane generate routes --no-scaffold  # Skip wrapper files
```

**Options:**
- `--dry-run` - Preview changes without writing files
- `--rewrite` - Force rewrite all routes
- `--no-scaffold` - Skip creating wrapper files

**What it does:**
1. Scans all `*.contract.ts` files in `src/contracts/`
2. Reads `defineOpMeta()` service mappings
3. Generates route handlers at `src/app/api/**/route.ts`
4. Merges imports and method handlers per route file
5. Sets runtime (`nodejs` or `edge`) from contract metadata

**Generated Output Example:**
```typescript
/* AUTO-GENERATED by 'unisane generate routes' — DO NOT EDIT */
import { NextResponse } from 'next/server';
import { listUsers } from '@/src/modules/users/service/crud';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Auto-generated handler with validation, auth, rate limiting
}
```

**Implementation:** [packages/tooling/devtools/src/commands/routes/gen.ts](../../packages/tooling/devtools/src/commands/routes/gen.ts)

---

#### ✅ `unisane generate sdk`

Generate SDK clients, React Query hooks, and TypeScript types from contracts.

**Status:** Implemented

```bash
unisane generate sdk                    # Generate all
unisane generate sdk --clients          # Clients only
unisane generate sdk --hooks            # React hooks only
unisane generate sdk --vue              # Vue composables only
unisane generate sdk --zod              # Zod schemas only
unisane generate sdk --types            # TypeScript types only
unisane generate sdk --admin-hooks      # Admin list params hooks
unisane generate sdk --dry-run          # Preview changes
```

**Options:**
- `--clients` - Generate API clients only
- `--hooks` - Generate React hooks only
- `--vue` - Generate Vue composables only
- `--zod` - Generate Zod schemas only
- `--types` - Generate TypeScript types only
- `--admin-hooks` - Generate admin list params hooks
- `--dry-run` - Preview changes without writing files

**Generated Files:**
```
src/sdk/clients/generated/
├── browser.ts          # Browser fetch client
├── server.ts           # Server-side client (with cookies forwarding)
└── index.ts            # Barrel export

src/sdk/hooks/generated/
├── users.hooks.ts      # useUsersList, useUserCreate, etc.
├── tenants.hooks.ts
└── index.ts

src/sdk/types/generated/
├── users.types.ts      # Request/response types
└── index.ts
```

**Client Usage:**
```typescript
// Browser
import { browserApi } from '@/src/sdk/clients/generated/browser';
const api = await browserApi();
const users = await api.users.list({ limit: 20 });

// Server (RSC/Server Actions)
import { serverApi } from '@/src/sdk/clients/generated/server';
const api = await serverApi();
const user = await api.users.read('user-123');
```

**Hook Usage:**
```typescript
import { useUsersList, useUserCreate } from '@/src/sdk/hooks/generated';

function UsersPage() {
  const { data: users, isLoading } = useUsersList({ limit: 20 });
  const createUser = useUserCreate();

  const handleCreate = () => {
    createUser.mutate({ email: 'new@example.com' });
  };

  // ...
}
```

**Implementation:** [packages/tooling/devtools/src/commands/sdk/gen.ts](../../packages/tooling/devtools/src/commands/sdk/gen.ts)

---

#### ✅ `unisane generate types`

Generate TypeScript types from contracts (shorthand for `generate sdk --types`).

**Status:** Implemented

```bash
unisane generate types
unisane generate types --dry-run
```

---

#### ❌ `unisane generate openapi`

Generate OpenAPI JSON specification from contracts.

**Status:** Not implemented

```bash
unisane generate openapi
unisane generate openapi -o ./openapi.json
```

**Planned Implementation:** Parse ts-rest contracts and generate OpenAPI 3.0 spec.

---

#### ❌ `unisane generate crud <name>`

Scaffold a new CRUD module with types, schemas, repo, service, and contract.

**Status:** Not implemented

```bash
unisane generate crud products --tenant --slug
unisane generate crud tasks --soft-delete --audit
```

**Planned Options:**
- `--tenant` - Add tenant scoping
- `--slug` - Add slug field
- `--soft-delete` - Add soft delete support
- `--audit` - Add audit logging
- `--unique <fields>` - Comma-separated unique fields

**Planned Output:**
```
src/modules/products/
├── domain/
│   ├── types.ts        # Product type definition
│   └── schemas.ts      # Zod validation schemas
├── data/
│   └── repo.mongo.ts   # MongoDB repository
├── service/
│   └── crud.ts         # CRUD service functions
└── index.ts            # Barrel export

src/contracts/products.contract.ts  # ts-rest contract
```

---

### Database Commands

#### ✅ `unisane db query <collection> [filter]`

Query a MongoDB collection.

**Status:** Implemented

```bash
unisane db query tenants
unisane db query users '{"email":"admin@example.com"}'
unisane db query subscriptions '{"status":"active"}' --limit 100
```

**Options:**
- `-l, --limit <n>` - Limit results (default: 50)

**Returns:** First N documents matching the filter as JSON.

**Implementation:** [packages/tooling/devtools/src/commands/db/query.ts](../../packages/tooling/devtools/src/commands/db/query.ts)

---

#### ✅ `unisane db collections`

List all collections in the database.

**Status:** Implemented

```bash
unisane db collections
unisane db ls  # Alias
```

**Implementation:** [packages/tooling/devtools/src/commands/db/index.ts](../../packages/tooling/devtools/src/commands/db/index.ts)

---

#### ✅ `unisane db rename [from] [to]`

Rename a MongoDB collection.

**Status:** Implemented

```bash
unisane db rename old_name new_name
unisane db rename old_name new_name --dry-run
unisane db rename --apply-migrations      # Apply all known renames
```

**Options:**
- `--apply-migrations` - Apply all known collection renames
- `--dry-run` - Preview changes without applying

**Implementation:** [packages/tooling/devtools/src/commands/db/rename.ts](../../packages/tooling/devtools/src/commands/db/rename.ts)

---

#### ✅ `unisane db seed`

Seed database with demo data.

**Status:** Implemented

```bash
unisane db seed                           # Run all seeders
unisane db seed --config ./seed.config.js # Use specific config
unisane db seed --reset                   # Reset DB before seeding
unisane db seed --only tenants,users      # Only run specific seeders
unisane db seed --generate                # Generate default config
unisane db seed --dry-run                 # Preview changes
```

**Options:**
- `--config <path>` - Path to seed configuration file
- `--reset` - Reset database before seeding
- `--dry-run` - Preview changes without applying
- `--generate` - Generate default config file
- `--only <types>` - Only run specific seeders (comma-separated)

**Implementation:** [packages/tooling/devtools/src/commands/db/seed.ts](../../packages/tooling/devtools/src/commands/db/seed.ts)

---

#### ✅ `unisane db migrate`

Run database migrations.

**Status:** Implemented

```bash
unisane db migrate                    # Run pending migrations
unisane db migrate --status           # Show migration status
unisane db migrate --down             # Rollback migrations
unisane db migrate --target 001       # Run up to specific migration
unisane db migrate --reset            # Reset migration history
unisane db migrate --force            # Force re-run applied migrations
unisane db migrate --path ./migrations # Custom migrations directory
unisane db migrate --dry-run          # Preview migrations
```

**Options:**
- `--dry-run` - Preview migrations without applying
- `--status` - Show migration status
- `--down` - Rollback migrations
- `--target <id>` - Run up to specific migration
- `--reset` - Reset migration history
- `--force` - Force re-run applied migrations
- `--path <path>` - Path to migrations directory

**Implementation:** [packages/tooling/devtools/src/commands/db/migrate.ts](../../packages/tooling/devtools/src/commands/db/migrate.ts)

---

#### ✅ `unisane db indexes`

Create or list database indexes.

**Status:** Implemented

```bash
unisane db indexes --apply                 # Apply indexes to database
unisane db indexes --list                  # List existing indexes
unisane db indexes --apply --collection users  # Only process specific collection
unisane db indexes --dry-run               # Preview changes
```

**Options:**
- `--apply` - Apply indexes to database
- `--list` - List existing indexes from database
- `--collection <name>` - Only process specific collection
- `--dry-run` - Preview changes without applying

**Implementation:** [packages/tooling/devtools/src/commands/db/indexes.ts](../../packages/tooling/devtools/src/commands/db/indexes.ts)

---

#### ❌ `unisane db push`

Push schema changes to database.

**Status:** Not implemented

```bash
unisane db push
unisane db push --force
```

---

#### ❌ `unisane db pull`

Pull schema from database.

**Status:** Not implemented

```bash
unisane db pull
```

---

#### ❌ `unisane db studio`

Open database studio GUI.

**Status:** Not implemented

```bash
unisane db studio
# Recommendation: Use mongosh or MongoDB Compass
```

---

### Environment Commands

#### ✅ `unisane env check`

Validate environment variables against schema.

**Status:** Implemented

```bash
unisane env check
unisane env check --file .env.production
unisane env check --show-values     # Show values (masked for sensitive)
```

**Options:**
- `-f, --file <path>` - Environment file to check (default: .env.local)
- `--show-values` - Show values (masked for sensitive)

**Implementation:** [packages/tooling/devtools/src/commands/env/index.ts](../../packages/tooling/devtools/src/commands/env/index.ts)

---

#### ✅ `unisane env init`

Create .env.local from template.

**Status:** Implemented

```bash
unisane env init
unisane env init --force                           # Overwrite existing
unisane env init --source .env.example --target .env.local
```

**Options:**
- `-f, --force` - Overwrite existing file
- `-s, --source <path>` - Source file (default: .env.example)
- `-t, --target <path>` - Target file (default: .env.local)

**Implementation:** [packages/tooling/devtools/src/commands/env/index.ts](../../packages/tooling/devtools/src/commands/env/index.ts)

---

#### ⚠️ `unisane env pull`

Pull environment variables from remote provider.

**Status:** Defined but not functional

```bash
unisane env pull
unisane env pull --provider vercel
```

**Options:**
- `--provider <name>` - Provider (vercel, doppler, railway)

---

#### ⚠️ `unisane env push`

Push environment variables to remote provider.

**Status:** Defined but not functional

```bash
unisane env push
unisane env push --provider vercel
```

---

#### ⚠️ `unisane env generate`

Generate .env.example from schema.

**Status:** Defined but not functional

```bash
unisane env generate
```

---

### Development Commands

#### ⚠️ `unisane dev`

Start development server (passthrough to package scripts).

**Status:** Passthrough only

```bash
unisane dev
# Output: dev command is a passthrough to your project scripts
# Use: pnpm dev
```

---

#### ⚠️ `unisane build`

Build for production (passthrough to package scripts).

**Status:** Passthrough only

```bash
unisane build
# Output: build command is a passthrough to your project scripts
# Use: pnpm build
```

---

#### ✅ `unisane doctor`

Run health checks on your project.

**Status:** Implemented

```bash
unisane doctor
unisane doctor --fix    # Attempt to auto-fix issues
```

**Options:**
- `--fix` - Attempt to auto-fix issues

**Checks Performed:**
- Sidecar verification
- Runtime export consistency
- Factory audit
- Service purity (no Request/URL references)
- UI boundaries (SDK-only imports)
- Inline types in UI
- Config cleanup
- Contract metadata
- Environment variables
- Import hygiene

**Implementation:** [packages/tooling/devtools/src/commands/dev/doctor.ts](../../packages/tooling/devtools/src/commands/dev/doctor.ts)

---

#### ✅ `unisane upgrade`

Upgrade Unisane packages to latest versions.

**Status:** Implemented

```bash
unisane upgrade
unisane upgrade --target latest
unisane upgrade --target next
unisane upgrade --target 1.2.3
unisane upgrade --dry-run
unisane upgrade --yes          # Skip confirmation
unisane upgrade --codemods     # Run codemods after upgrade
```

**Options:**
- `--target <version>` - Target version (latest, next, or specific) (default: latest)
- `--dry-run` - Preview changes without applying
- `-y, --yes` - Skip confirmation prompts
- `--codemods` - Run codemods after upgrade

**Implementation:** [packages/tooling/devtools/src/commands/upgrade/index.ts](../../packages/tooling/devtools/src/commands/upgrade/index.ts)

---

#### ✅ `unisane info`

Show project information and package versions.

**Status:** Implemented

```bash
unisane info
```

**Output:**
- CLI version
- Installed Unisane package versions
- Project information

**Implementation:** Built-in (cli.ts)

---

#### ❌ `unisane sync`

Run all generators and doctor --fix.

**Status:** Not implemented

```bash
unisane sync
# Should run:
#   unisane generate routes
#   unisane generate sdk
#   unisane doctor --fix
```

---

#### ❌ `unisane watch`

Watch contracts and regenerate on changes.

**Status:** Not implemented

```bash
unisane watch
```

**Planned:** Watch `src/contracts/**/*.ts` and auto-run generators on changes.

---

### Tenant Management Commands

#### ❌ `unisane tenant info <identifier>`

Display tenant details and aggregates.

**Status:** Not implemented

```bash
unisane tenant info acme
unisane tenant info 507f1f77bcf86cd799439011
```

---

#### ❌ `unisane tenant list`

List all tenants.

**Status:** Not implemented

```bash
unisane tenant list
unisane tenant list --limit 100
```

---

#### ❌ `unisane tenant create`

Create a new tenant.

**Status:** Not implemented

```bash
unisane tenant create --name "Acme Corp" --slug acme
```

---

#### ❌ `unisane tenant delete <identifier>`

Delete a tenant (soft delete).

**Status:** Not implemented

```bash
unisane tenant delete acme
unisane tenant delete <id> --hard  # Hard delete (irreversible)
```

---

### Billing Commands

#### ❌ `unisane billing plans`

Display plan configuration.

**Status:** Not implemented

```bash
unisane billing plans
```

---

#### ❌ `unisane billing sync-stripe`

Sync plans with Stripe products and prices.

**Status:** Not implemented

```bash
unisane billing sync-stripe
unisane billing sync-stripe --dry-run
```

**Planned:** Create Stripe products/prices from plan configuration.

---

#### ❌ `unisane billing portal-config`

Configure Stripe customer portal.

**Status:** Not implemented

```bash
unisane billing portal-config
```

---

### Cache Commands

#### ❌ `unisane cache clear`

Clear all caches (Redis/KV).

**Status:** Not implemented

```bash
unisane cache clear
```

---

#### ❌ `unisane cache clear-rbac`

Clear RBAC permission cache.

**Status:** Not implemented

```bash
unisane cache clear-rbac
```

---

### Release Commands (Internal)

#### ✅ `unisane release build`

Build a starter for distribution.

**Status:** Implemented

```bash
unisane release build
unisane release build --starter saaskit
unisane release build --oss             # Strip PRO code
unisane release build --dry-run
unisane release build --verbose
```

**Options:**
- `-s, --starter <name>` - Starter to build (default: saaskit)
- `--oss` - Build OSS variant (strip PRO code)
- `--dry-run` - Preview changes without writing files
- `-v, --verbose` - Detailed logging

**Implementation:** [packages/tooling/devtools/src/commands/release/build-starter.ts](../../packages/tooling/devtools/src/commands/release/build-starter.ts)

---

#### ✅ `unisane release verify`

Verify a built starter.

**Status:** Implemented

```bash
unisane release verify
unisane release verify --starter saaskit
```

**Options:**
- `-s, --starter <name>` - Starter to verify (default: saaskit)

**Implementation:** [packages/tooling/devtools/src/commands/release/verify.ts](../../packages/tooling/devtools/src/commands/release/verify.ts)

---

#### ✅ `unisane release versions`

List all package versions in the monorepo.

**Status:** Implemented

```bash
unisane release versions
```

**Implementation:** [packages/tooling/devtools/src/commands/release/version.ts](../../packages/tooling/devtools/src/commands/release/version.ts)

---

#### ✅ `unisane release publishable`

Show packages that can be published to npm.

**Status:** Implemented

```bash
unisane release publishable
```

**Implementation:** [packages/tooling/devtools/src/commands/release/version.ts](../../packages/tooling/devtools/src/commands/release/version.ts)

---

### List Commands

#### ✅ `unisane list ui`

List available UI components.

**Status:** Implemented (redirects to `ui add`)

```bash
unisane list ui
unisane list components  # Alias
# Output: Use: unisane ui add (interactive component selection)
```

---

#### ⚠️ `unisane list modules`

List available modules.

**Status:** Partially implemented

```bash
unisane list modules
```

**Implementation:** [packages/tooling/devtools/src/commands/add/index.ts](../../packages/tooling/devtools/src/commands/add/index.ts)

---

#### ⚠️ `unisane list integrations`

List available integrations.

**Status:** Partially implemented

```bash
unisane list integrations
```

**Implementation:** [packages/tooling/devtools/src/commands/add/index.ts](../../packages/tooling/devtools/src/commands/add/index.ts)

---

### Add Commands

#### ⚠️ `unisane add module <name>`

Add a business module to your project.

**Status:** Partially implemented

```bash
unisane add module billing
unisane add module credits --skip-install
unisane add module storage --dry-run
```

**Options:**
- `--skip-install` - Skip dependency installation
- `--dry-run` - Preview changes without writing files

**Implementation:** [packages/tooling/devtools/src/commands/add/index.ts](../../packages/tooling/devtools/src/commands/add/index.ts)

---

#### ⚠️ `unisane add integration <name>`

Add a third-party integration.

**Status:** Not implemented

```bash
unisane add integration stripe
unisane add integration sendgrid --skip-config
```

**Options:**
- `--skip-config` - Skip configuration prompts

---

## Shared Configurations

### ESLint Config

**Package:** `@unisane/eslint-config`

**Configs:**
- `base` - Base rules for all packages
- `next` - Next.js specific rules
- `react-internal` - React library rules

**Usage:**
```javascript
// eslint.config.js
import base from '@unisane/eslint-config/base';
import next from '@unisane/eslint-config/next';

export default [...base, ...next];
```

---

### TypeScript Config

**Package:** `@unisane/typescript-config`

**Configs:**
- `base.json` - Base config
- `nextjs.json` - Next.js apps
- `react-library.json` - React packages
- `node-library.json` - Node.js packages

**Usage:**
```json
{
  "extends": "@unisane/typescript-config/nextjs.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

---

### Tailwind Config

**Package:** `@unisane/tailwind-config`

**Usage:**
```javascript
import baseConfig from '@unisane/tailwind-config';

export default {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}'],
};
```

---

## Implementation Status

### ✅ Fully Implemented

| Category | Commands | Status |
|----------|----------|--------|
| **UI Components** | init, add, diff, doctor | ✅ Complete |
| **Code Generation** | routes, sdk, types | ✅ Working |
| **Database** | query, collections, rename, seed, migrate, indexes | ✅ Functional |
| **Environment** | check, init | ✅ Working |
| **Development** | doctor, upgrade, info | ✅ Complete |
| **Release** | build, verify, versions, publishable | ✅ Working |
| **Project Setup** | create | ✅ Working |

### ⚠️ Partially Implemented

| Command | Status | Notes |
|---------|--------|-------|
| `add module` | ⚠️ Partial | Command exists, registry incomplete |
| `list modules` | ⚠️ Partial | Command exists, registry incomplete |
| `list integrations` | ⚠️ Partial | Command exists, registry incomplete |
| `env pull/push` | ⚠️ Defined | Commands defined but not functional |
| `env generate` | ⚠️ Defined | Command defined but not functional |
| `dev` | ⚠️ Passthrough | Delegates to `pnpm dev` |
| `build` | ⚠️ Passthrough | Delegates to `pnpm build` |

### ❌ Not Implemented

| Command | Status | Priority |
|---------|--------|----------|
| `init` | ❌ Not implemented | P1 |
| `generate openapi` | ❌ Not implemented | P2 |
| `generate crud` | ❌ Not implemented | P0 |
| `sync` | ❌ Not implemented | P1 |
| `watch` | ❌ Not implemented | P2 |
| `db push` | ❌ Not implemented | P2 |
| `db pull` | ❌ Not implemented | P2 |
| `db studio` | ❌ Not implemented | P3 |
| `tenant *` | ❌ Not implemented | P1 |
| `billing *` | ❌ Not implemented | P0 |
| `cache *` | ❌ Not implemented | P2 |
| `add integration` | ❌ Not implemented | P1 |

### Missing Tooling

| Tool | Status | Priority |
|------|--------|----------|
| `@unisane/prettier-config` | ❌ Not created | P0 |
| `@unisane/vitest-config` | ❌ Not created | P0 |
| `@unisane/tsup-config` | ❌ Not created | P1 |
| Git hooks (.husky/) | ❌ Not configured | P0 |
| CI/CD workflows | ❌ Not created | P0 |
| commitlint.config.js | ❌ Not created | P1 |
| lint-staged.config.js | ❌ Not created | P1 |
| vitest.workspace.ts | ❌ Not created | P0 |

---

## Migration Guide

### From Old DevTools Structure

**Old Location (SaasKit):**
```
saaskit/devtools/
└── commands/
    ├── billing-plans.ts
    ├── billing-stripe-seed.ts
    ├── db-query.ts
    └── ...
```

**New Location (Monorepo):**
```
packages/tooling/devtools/
└── src/
    └── commands/
        ├── billing/     # ❌ Not yet implemented
        ├── db/          # ✅ Implemented
        └── ...
```

**Migration Status:**
- ✅ db:query → `unisane db query`
- ✅ routes:gen → `unisane generate routes`
- ✅ sdk:gen → `unisane generate sdk`
- ❌ billing:plans → Not yet migrated
- ❌ billing:seed-stripe → Not yet migrated
- ❌ tenant:info → Not yet migrated

---

## Roadmap

### P0 - Critical (Q1 2026)

- [ ] Implement `generate crud` command
- [ ] Implement `billing` commands (sync-stripe, portal-config)
- [ ] Create `@unisane/prettier-config`
- [ ] Create `@unisane/vitest-config`
- [ ] Set up Git hooks with Husky
- [ ] Create CI workflow (.github/workflows/ci.yml)
- [ ] Create vitest.workspace.ts

### P1 - High Priority (Q2 2026)

- [ ] Implement `init` command
- [ ] Implement `sync` command
- [ ] Implement `tenant` commands
- [ ] Complete `add module` registry
- [ ] Complete `add integration` command
- [ ] Create `@unisane/tsup-config`
- [ ] Set up commitlint and lint-staged

### P2 - Medium Priority (Q3 2026)

- [ ] Implement `generate openapi` command
- [ ] Implement `watch` command
- [ ] Implement `db push/pull` commands
- [ ] Implement `cache` commands
- [ ] Functional `env pull/push/generate` commands
- [ ] Create preview deployment workflow

### P3 - Nice to Have (Q4 2026)

- [ ] Implement `db studio` command (or recommend external tools)
- [ ] Advanced doctor checks (circular imports, performance antipatterns)
- [ ] Codemods system for upgrades
- [ ] Automated migration generation

---

## Summary

The Unisane devtools ecosystem is **actively developed** with a strong foundation in place:

**What Works (January 2026):**
- ✅ Complete UI component system (shadcn-style)
- ✅ Contract-first code generation (routes, SDK, types)
- ✅ Database operations (query, seed, migrate, indexes)
- ✅ Project creation and setup
- ✅ Health checks with auto-fix
- ✅ Package upgrades
- ✅ Release tooling

**What's Missing:**
- ❌ Billing management commands (critical for SaaS)
- ❌ CRUD scaffolding
- ❌ Git hooks and CI/CD setup
- ❌ Shared config packages (prettier, vitest, tsup)
- ❌ Tenant management commands
- ❌ OpenAPI generation

**Current State:** The CLI has a solid architecture (797 lines) with well-organized commands, but several important features are still in development. The core code generation and UI workflows are production-ready.

---

**Related Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [contracts-guide.md](./contracts-guide.md) - Contract-first development
- [sdk-architecture.md](./sdk-architecture.md) - SDK generation
- [module-development.md](./module-development.md) - Module patterns
