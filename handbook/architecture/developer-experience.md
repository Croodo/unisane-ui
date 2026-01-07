# Developer Experience & Platform Building

> **Status:** AUTHORITATIVE
> **Last Updated:** 2025-01-06

This document covers tooling and patterns to make building platforms on Unisane fast and friction-free.

---

## Table of Contents

1. [CLI Tool](#cli-tool)
2. [Module Generator](#module-generator)
3. [Starter Customization](#starter-customization)
4. [Database Seeding](#database-seeding)
5. [API Documentation](#api-documentation)
6. [Admin UI Scaffolding](#admin-ui-scaffolding)
7. [Development Workflow](#development-workflow)
8. [Upgrade Path](#upgrade-path)

---

## CLI Tool

### Overview

The Unisane CLI (`unisane`) provides commands for scaffolding, development, and deployment.

### Installation

```bash
# Global install
npm install -g @unisane/cli

# Or use via npx
npx @unisane/cli
```

### Commands

```bash
# Project initialization
unisane init                      # Interactive project setup
unisane init --template saaskit   # Use SaasKit template
unisane init --template minimal   # Minimal setup (kernel + gateway only)

# Module management
unisane add billing               # Add billing module
unisane add billing credits usage # Add multiple modules
unisane remove analytics          # Remove a module
unisane list                      # List available modules

# Code generation
unisane generate module <name>    # Generate new module scaffold
unisane generate service <name>   # Generate service file
unisane generate contract <name>  # Generate API contract
unisane generate migration <name> # Generate migration file

# Development
unisane dev                       # Start dev server
unisane dev --seed                # Start with database seeding
unisane db:seed                   # Seed database
unisane db:migrate                # Run migrations
unisane db:reset                  # Reset database

# Build & Deploy
unisane build                     # Production build
unisane build --analyze           # Build with bundle analysis
unisane typecheck                 # Type checking
unisane lint                      # Linting
```

### DevTools Commands (Starter Projects)

> **See Also:** [dev-tools.md](./dev-tools.md#saaskit-devtools-migration) for complete DevTools reference.

Starter projects (like SaasKit) include additional DevTools for code generation and maintenance:

```bash
# Code Generation
npm run devtools routes:gen          # Generate route handlers from contracts
npm run devtools sdk:gen             # Generate API clients + React Query hooks
npm run devtools crud <name>         # Scaffold complete CRUD module
npm run devtools crud products --tenant --slug --ui=form
npm run devtools sync                # Regenerate all (routes + SDK + doctor)

# Billing Configuration
npm run devtools billing:plans       # Print configured billing plans
npm run devtools billing:seed-stripe # Seed Stripe products/prices
npm run devtools billing:configure-stripe-portal

# Database Utilities
npm run devtools db:query <collection> [filter]
npm run devtools indexes:apply       # Ensure MongoDB indexes

# Tenant Management
npm run devtools tenant:info <slug>
npm run devtools tenant:reset-billing <slug>

# Code Quality
npm run devtools doctor              # Run health checks
npm run devtools doctor --fix        # Auto-fix issues
npm run devtools rbac:invalidate-cache

# Documentation
npm run devtools openapi:json        # Generate OpenAPI spec
npm run devtools openapi:serve       # Serve Swagger UI
npm run devtools routes:graph        # Route dependency visualization
npm run devtools diagrams:generate   # Architecture diagrams
```

### Implementation

```typescript
// packages/cli/src/index.ts

#!/usr/bin/env node

import { Command } from 'commander';
import { init } from './commands/init';
import { add, remove, list } from './commands/modules';
import { generate } from './commands/generate';
import { dev, build } from './commands/build';
import { seed, migrate, reset } from './commands/db';

const program = new Command();

program
  .name('unisane')
  .description('Unisane Platform CLI')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize a new Unisane project')
  .option('-t, --template <template>', 'Template to use (saaskit, minimal)')
  .option('-d, --directory <dir>', 'Target directory')
  .option('--skip-install', 'Skip dependency installation')
  .action(init);

// Module commands
program
  .command('add <modules...>')
  .description('Add modules to your project')
  .action(add);

program
  .command('remove <modules...>')
  .description('Remove modules from your project')
  .action(remove);

program
  .command('list')
  .description('List available modules')
  .option('--installed', 'Show only installed modules')
  .action(list);

// Generate commands
const generateCmd = program
  .command('generate')
  .alias('g')
  .description('Generate code scaffolds');

generateCmd
  .command('module <name>')
  .description('Generate a new module')
  .option('--layer <layer>', 'Module layer (1-5)', '3')
  .action((name, options) => generate('module', name, options));

generateCmd
  .command('service <name>')
  .description('Generate a service file')
  .option('-m, --module <module>', 'Target module')
  .action((name, options) => generate('service', name, options));

generateCmd
  .command('contract <name>')
  .description('Generate an API contract')
  .option('-m, --module <module>', 'Target module')
  .action((name, options) => generate('contract', name, options));

generateCmd
  .command('migration <name>')
  .description('Generate a migration file')
  .action((name, options) => generate('migration', name, options));

// Dev commands
program
  .command('dev')
  .description('Start development server')
  .option('--seed', 'Seed database on start')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(dev);

program
  .command('build')
  .description('Build for production')
  .option('--analyze', 'Analyze bundle size')
  .action(build);

// Database commands
program
  .command('db:seed')
  .description('Seed the database')
  .option('--fresh', 'Reset before seeding')
  .action(seed);

program
  .command('db:migrate')
  .description('Run database migrations')
  .option('--rollback', 'Rollback last migration')
  .action(migrate);

program
  .command('db:reset')
  .description('Reset database (DESTRUCTIVE)')
  .option('--force', 'Skip confirmation')
  .action(reset);

program.parse();
```

---

## Module Generator

### Generate New Module

```bash
unisane generate module inventory --layer 3
```

Generates:

```
packages/inventory/
├── src/
│   ├── index.ts                    # Public API
│   ├── domain/
│   │   ├── schemas.ts              # Zod schemas
│   │   ├── types.ts                # TypeScript types
│   │   ├── errors.ts               # Module errors
│   │   └── constants.ts            # Constants
│   ├── service/
│   │   ├── inventory.service.ts    # Main service
│   │   ├── handlers.ts             # Event handlers
│   │   └── index.ts                # Service barrel
│   └── data/
│       ├── types.ts                # Repository interface
│       ├── inventory.repo.ts       # Repository selector
│       ├── inventory.repo.mongo.ts # MongoDB implementation
│       ├── keys.ts                 # Cache keys
│       └── mappers.ts              # Entity mappers
├── __tests__/
│   ├── unit/
│   │   └── inventory.service.test.ts
│   └── fixtures/
│       └── index.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Module Template

```typescript
// packages/cli/src/templates/module/index.ts.template

// ════════════════════════════════════════════════════════════════════════
// {{MODULE_NAME}} MODULE - PUBLIC API
// ════════════════════════════════════════════════════════════════════════

// Types
export type {
  {{EntityType}},
  Create{{EntityType}}Input,
  Update{{EntityType}}Input,
} from './domain/types';

// Schemas (PURE - works in browser)
export {
  Z{{EntityType}},
  ZCreate{{EntityType}}Input,
  ZUpdate{{EntityType}}Input,
} from './domain/schemas';

// Errors
export {
  {{EntityType}}NotFoundError,
  {{EntityType}}AlreadyExistsError,
} from './domain/errors';

// Service functions (server-only)
export {
  create{{EntityType}},
  get{{EntityType}},
  update{{EntityType}},
  delete{{EntityType}},
  list{{EntityType}}s,
} from './service';

// Admin service
export * as {{moduleName}}Admin from './service/admin/admin.service';

// Repository setup (for bootstrap)
export {
  set{{EntityType}}Repo,
  createMongo{{EntityType}}Repo,
} from './data';

// Event handlers (for registration)
export { register{{ModuleName}}Handlers } from './service/handlers';
```

```typescript
// packages/cli/src/templates/module/service.ts.template

import { ctx, events, logger, withTransaction } from '@unisane/kernel';
import { tenantFilter } from '@unisane/kernel/database';
import {
  {{EntityType}}NotFoundError,
  {{EntityType}}AlreadyExistsError,
} from '../domain/errors';
import type {
  {{EntityType}},
  Create{{EntityType}}Input,
  Update{{EntityType}}Input,
} from '../domain/types';
import { {{EntityType}}Repo } from '../data';

/**
 * Create a new {{entityName}}.
 */
export async function create{{EntityType}}(
  input: Create{{EntityType}}Input
): Promise<{{EntityType}}> {
  const context = ctx.get();

  const {{entityName}} = await {{EntityType}}Repo.create({
    ...input,
    tenantId: context.tenantId!,
    createdBy: context.userId!,
    createdAt: new Date(),
  });

  await events.emit('{{moduleName}}.{{entityName}}.created', {
    version: 1,
    {{entityName}}Id: {{entityName}}.id,
    tenantId: context.tenantId!,
  });

  logger.info('{{EntityType}} created', {
    {{entityName}}Id: {{entityName}}.id,
  });

  return {{entityName}};
}

/**
 * Get {{entityName}} by ID.
 */
export async function get{{EntityType}}(id: string): Promise<{{EntityType}}> {
  const {{entityName}} = await {{EntityType}}Repo.findById(id, tenantFilter());

  if (!{{entityName}}) {
    throw new {{EntityType}}NotFoundError(id);
  }

  return {{entityName}};
}

/**
 * Update {{entityName}}.
 */
export async function update{{EntityType}}(
  id: string,
  input: Update{{EntityType}}Input
): Promise<{{EntityType}}> {
  const context = ctx.get();

  const existing = await get{{EntityType}}(id);

  const updated = await {{EntityType}}Repo.update(id, {
    ...input,
    updatedBy: context.userId!,
    updatedAt: new Date(),
  });

  await events.emit('{{moduleName}}.{{entityName}}.updated', {
    version: 1,
    {{entityName}}Id: id,
    tenantId: context.tenantId!,
    changes: input,
  });

  return updated;
}

/**
 * Delete {{entityName}}.
 */
export async function delete{{EntityType}}(id: string): Promise<void> {
  const context = ctx.get();

  const existing = await get{{EntityType}}(id);

  await {{EntityType}}Repo.delete(id);

  await events.emit('{{moduleName}}.{{entityName}}.deleted', {
    version: 1,
    {{entityName}}Id: id,
    tenantId: context.tenantId!,
  });

  logger.info('{{EntityType}} deleted', {
    {{entityName}}Id: id,
  });
}

/**
 * List {{entityName}}s with pagination.
 */
export async function list{{EntityType}}s(
  options: { limit?: number; cursor?: string; filter?: Record<string, unknown> } = {}
): Promise<{ items: {{EntityType}}[]; nextCursor?: string }> {
  return {{EntityType}}Repo.find({
    ...options,
    filter: { ...options.filter, ...tenantFilter() },
  });
}
```

---

## Starter Customization

### Interactive Setup

```bash
$ unisane init

? Project name: my-saas-app
? Template: SaasKit (Full SaaS boilerplate)
? Select modules to include:
  ◉ identity (Core user management)
  ◉ auth (Authentication)
  ◉ tenants (Multi-tenancy)
  ◉ settings (Tenant settings)
  ◉ billing (Subscriptions & payments)
  ◯ credits (Credit-based billing)
  ◯ usage (Usage metering)
  ◉ flags (Feature flags)
  ◯ audit (Audit logging)
  ◉ notify (Notifications)
  ◯ webhooks (Webhook management)
  ◉ storage (File storage)
  ◯ media (Image processing)
  ◯ pdf (PDF generation)
  ◯ ai (AI integrations)

? Select providers:
  ? Billing: Stripe
  ? Email: Resend
  ? Storage: AWS S3
  ? OAuth: Google, GitHub

? Database: MongoDB Atlas
? Deploy target: Vercel

Creating project...
Installing dependencies...

✓ Project created successfully!

Next steps:
  cd my-saas-app
  cp .env.example .env.local
  # Fill in your environment variables
  pnpm dev
```

### Module Selection Matrix

```typescript
// packages/cli/src/modules/registry.ts

export interface ModuleDefinition {
  name: string;
  description: string;
  layer: number;
  dependencies: string[];
  optional: boolean;
  pro: boolean;
  providers?: string[];
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // Layer 1 - Core (required)
  {
    name: 'identity',
    description: 'Core user management',
    layer: 1,
    dependencies: [],
    optional: false,
    pro: false,
  },
  {
    name: 'settings',
    description: 'Tenant settings',
    layer: 1,
    dependencies: [],
    optional: true,
    pro: false,
  },
  {
    name: 'storage',
    description: 'File storage',
    layer: 1,
    dependencies: [],
    optional: true,
    pro: false,
    providers: ['s3', 'r2', 'local'],
  },

  // Layer 2
  {
    name: 'tenants',
    description: 'Multi-tenancy',
    layer: 2,
    dependencies: ['identity'],
    optional: false,
    pro: false,
  },
  {
    name: 'auth',
    description: 'Authentication',
    layer: 2,
    dependencies: ['identity'],
    optional: false,
    pro: false,
    providers: ['password', 'otp', 'oauth', 'phone'],
  },

  // Layer 3
  {
    name: 'billing',
    description: 'Subscriptions & payments',
    layer: 3,
    dependencies: ['tenants', 'settings'],
    optional: true,
    pro: false,
    providers: ['stripe', 'razorpay'],
  },
  {
    name: 'flags',
    description: 'Feature flags',
    layer: 3,
    dependencies: ['settings', 'tenants'],
    optional: true,
    pro: false,
  },
  {
    name: 'audit',
    description: 'Audit logging',
    layer: 3,
    dependencies: ['identity', 'tenants'],
    optional: true,
    pro: false,
  },

  // Layer 4
  {
    name: 'credits',
    description: 'Credit-based billing',
    layer: 4,
    dependencies: ['billing', 'tenants'],
    optional: true,
    pro: false,
  },
  {
    name: 'usage',
    description: 'Usage metering',
    layer: 4,
    dependencies: ['tenants', 'billing'],
    optional: true,
    pro: false,
  },
  {
    name: 'notify',
    description: 'Notifications',
    layer: 4,
    dependencies: [],
    optional: true,
    pro: false,
    providers: ['resend', 'ses', 'twilio'],
  },
  {
    name: 'webhooks',
    description: 'Webhook management',
    layer: 4,
    dependencies: ['tenants'],
    optional: true,
    pro: false,
  },

  // Layer 5
  {
    name: 'media',
    description: 'Image processing',
    layer: 5,
    dependencies: ['storage', 'tenants'],
    optional: true,
    pro: false,
  },
  {
    name: 'pdf',
    description: 'PDF generation',
    layer: 5,
    dependencies: ['storage'],
    optional: true,
    pro: false,
  },
  {
    name: 'ai',
    description: 'AI integrations',
    layer: 5,
    dependencies: ['usage'],
    optional: true,
    pro: false,
    providers: ['openai', 'anthropic'],
  },

  // PRO modules
  {
    name: 'analytics',
    description: 'Analytics dashboard',
    layer: 5,
    dependencies: ['tenants', 'usage'],
    optional: true,
    pro: true,
  },
  {
    name: 'sso',
    description: 'Enterprise SSO (SAML/OIDC)',
    layer: 5,
    dependencies: ['auth', 'tenants'],
    optional: true,
    pro: true,
  },
  {
    name: 'import-export',
    description: 'Data import/export',
    layer: 5,
    dependencies: ['storage'],
    optional: true,
    pro: true,
  },
];

/**
 * Resolve dependencies for selected modules.
 */
export function resolveDependencies(selected: string[]): string[] {
  const resolved = new Set<string>();
  const queue = [...selected];

  while (queue.length > 0) {
    const moduleName = queue.shift()!;
    if (resolved.has(moduleName)) continue;

    const module = MODULE_REGISTRY.find(m => m.name === moduleName);
    if (!module) continue;

    resolved.add(moduleName);

    for (const dep of module.dependencies) {
      if (!resolved.has(dep)) {
        queue.push(dep);
      }
    }
  }

  // Sort by layer
  return Array.from(resolved).sort((a, b) => {
    const aModule = MODULE_REGISTRY.find(m => m.name === a)!;
    const bModule = MODULE_REGISTRY.find(m => m.name === b)!;
    return aModule.layer - bModule.layer;
  });
}
```

---

## Database Seeding

### Seed Configuration

```typescript
// starters/saaskit/src/seed/index.ts

import { logger } from '@unisane/kernel';
import { seedUsers } from './users.seed';
import { seedTenants } from './tenants.seed';
import { seedBilling } from './billing.seed';
import { seedFlags } from './flags.seed';

export interface SeedOptions {
  fresh?: boolean;      // Reset before seeding
  tenants?: number;     // Number of tenants to create
  usersPerTenant?: number;
}

export async function seed(options: SeedOptions = {}): Promise<void> {
  const {
    fresh = false,
    tenants = 3,
    usersPerTenant = 5,
  } = options;

  logger.info('Starting database seed', { fresh, tenants, usersPerTenant });

  if (fresh) {
    await resetDatabase();
  }

  // Seed in order
  const createdTenants = await seedTenants(tenants);
  const createdUsers = await seedUsers(createdTenants, usersPerTenant);
  await seedBilling(createdTenants);
  await seedFlags();

  logger.info('Seed completed', {
    tenants: createdTenants.length,
    users: createdUsers.length,
  });
}
```

### User Seeding

```typescript
// starters/saaskit/src/seed/users.seed.ts

import { faker } from '@faker-js/faker';
import { createUser, createMembership } from '@unisane/identity';
import { hashPassword } from '@unisane/auth';

export async function seedUsers(
  tenants: Tenant[],
  usersPerTenant: number
): Promise<User[]> {
  const users: User[] = [];

  // Create admin user (for all tenants)
  const adminUser = await createUser({
    email: 'admin@example.com',
    name: 'Admin User',
    passwordHash: await hashPassword('admin123'),
    emailVerified: true,
  });
  users.push(adminUser);

  // Add admin to all tenants as owner
  for (const tenant of tenants) {
    await createMembership({
      userId: adminUser.id,
      tenantId: tenant.id,
      role: 'owner',
    });
  }

  // Create regular users per tenant
  for (const tenant of tenants) {
    for (let i = 0; i < usersPerTenant; i++) {
      const user = await createUser({
        email: faker.internet.email(),
        name: faker.person.fullName(),
        passwordHash: await hashPassword('password123'),
        emailVerified: true,
      });

      await createMembership({
        userId: user.id,
        tenantId: tenant.id,
        role: faker.helpers.arrayElement(['admin', 'member', 'viewer']),
      });

      users.push(user);
    }
  }

  return users;
}
```

### Demo Data

```typescript
// starters/saaskit/src/seed/demo.seed.ts

/**
 * Create a fully populated demo environment.
 * Useful for demos, screenshots, and testing.
 */
export async function seedDemo(): Promise<void> {
  // Create demo company
  const demoTenant = await createTenant({
    name: 'Acme Corp',
    slug: 'acme',
    plan: 'pro',
  });

  // Create demo users
  const demoUsers = [
    { email: 'ceo@acme.com', name: 'Jane Smith', role: 'owner' },
    { email: 'dev@acme.com', name: 'John Developer', role: 'admin' },
    { email: 'viewer@acme.com', name: 'Bob Viewer', role: 'viewer' },
  ];

  for (const user of demoUsers) {
    const created = await createUser({
      email: user.email,
      name: user.name,
      passwordHash: await hashPassword('demo123'),
      emailVerified: true,
    });

    await createMembership({
      userId: created.id,
      tenantId: demoTenant.id,
      role: user.role,
    });
  }

  // Create sample data
  await createSampleInvoices(demoTenant.id);
  await createSampleUsageData(demoTenant.id);
  await createSampleNotifications(demoTenant.id);

  console.log('\n📦 Demo environment ready!\n');
  console.log('Login credentials:');
  console.log('  Email: ceo@acme.com');
  console.log('  Password: demo123\n');
}
```

---

## API Documentation

### Auto-Generated OpenAPI

```typescript
// packages/gateway/src/openapi/generator.ts

import { generateOpenApi } from '@ts-rest/open-api';
import { contracts } from '@/contracts';

export function generateOpenAPISpec() {
  return generateOpenApi(
    contracts,
    {
      info: {
        title: 'Unisane API',
        version: '1.0.0',
        description: 'API documentation for Unisane platform',
      },
      servers: [
        { url: 'http://localhost:3000/api', description: 'Development' },
        { url: 'https://api.example.com', description: 'Production' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
      },
    }
  );
}
```

### Serve Documentation

```typescript
// app/api/docs/route.ts

import { generateOpenAPISpec } from '@/gateway/openapi/generator';

export async function GET() {
  const spec = generateOpenAPISpec();

  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// app/docs/page.tsx - Swagger UI
export default function DocsPage() {
  return (
    <SwaggerUI url="/api/docs" />
  );
}
```

---

## Admin UI Scaffolding

### Admin Layout

```typescript
// packages/cli/src/templates/admin/layout.tsx.template

import { SideNav, TopBar, BreadcrumbNav } from '@unisane/ui';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Users', href: '/admin/users', icon: 'users' },
  { label: 'Tenants', href: '/admin/tenants', icon: 'building' },
  { label: 'Billing', href: '/admin/billing', icon: 'credit-card' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'chart' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SideNav items={adminNavItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <BreadcrumbNav />
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Data Table Page Generator

```bash
unisane generate admin-page users
```

Generates:

```typescript
// app/(admin)/admin/users/page.tsx

'use client';

import { DataTable } from '@unisane/data-table';
import { useUsers, useDeleteUser } from '@/hooks/users';
import { userColumns } from './columns';
import { UserFilters } from './filters';
import { CreateUserDialog } from './create-dialog';

export default function UsersPage() {
  const { data, isLoading, pagination, setPagination } = useUsers();
  const { mutate: deleteUser } = useDeleteUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <CreateUserDialog />
      </div>

      <UserFilters />

      <DataTable
        data={data?.items ?? []}
        columns={userColumns}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        onRowAction={(action, row) => {
          if (action === 'delete') {
            deleteUser(row.id);
          }
        }}
      />
    </div>
  );
}
```

---

## Development Workflow

### Recommended Workflow

```bash
# 1. Initialize project
unisane init --template saaskit
cd my-project

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start development
unisane dev --seed

# 4. Add a new feature
unisane generate module inventory --layer 3
unisane generate contract inventory

# 5. Run tests
pnpm test
pnpm test:e2e

# 6. Build for production
unisane build
```

### VSCode Integration

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}

// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Jest: current file",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Git Hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged

# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm typecheck
pnpm test:unit
```

---

## Upgrade Path

### Version Compatibility

```
Unisane uses semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes
```

### Upgrade Commands

```bash
# Check for updates
unisane upgrade --check

# Upgrade to latest
unisane upgrade

# Upgrade specific packages
unisane upgrade @unisane/kernel @unisane/billing

# See migration guide
unisane upgrade --migrations
```

### Migration Guides

```markdown
// When breaking changes occur, migration guides are provided:

## Upgrading from 1.x to 2.x

### Breaking Changes

1. **Context API**: `ctx.getTenantId()` → `ctx.get().tenantId`
2. **Events**: Events now require version field
3. **Errors**: Error codes are now enums

### Migration Steps

1. Update package versions:
   ```bash
   pnpm update @unisane/kernel@2
   ```

2. Update context usage:
   ```typescript
   // Before
   const tenantId = ctx.getTenantId();

   // After
   const { tenantId } = ctx.get();
   ```

3. Update event emissions:
   ```typescript
   // Before
   await events.emit('user.created', { userId });

   // After
   await events.emit('user.created', { version: 1, userId });
   ```
```

---

## Summary

This developer experience documentation enables:

| Capability | Command | Time Saved |
|------------|---------|------------|
| New project | `unisane init` | Hours → Minutes |
| Add module | `unisane add billing` | 30min → 30sec |
| New module | `unisane generate module` | 2hrs → 5min |
| Seed data | `unisane db:seed` | Manual → Automated |
| API docs | Auto-generated | Manual → Automated |
| Admin UI | `unisane generate admin-page` | Hours → Minutes |
| Upgrades | `unisane upgrade` | Research → Guided |

**Total estimated time savings: 80%+ reduction in boilerplate and setup time.**
