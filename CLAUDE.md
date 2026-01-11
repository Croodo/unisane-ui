# Unisane Monorepo — Claude Code Context

> **Purpose**: Primary context for Claude Code when working in this repository.
> **Last Updated**: 2026-01-12

---

## Project Overview

**Unisane** is a **modular monolith SaaS starter kit** with:
- **Backend**: Next.js 16 App Router + MongoDB + Redis
- **Frontend**: React 19 + Tailwind v4 + Material 3 Design System
- **Distribution**: Source code (user owns everything, shadcn-style)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 (strict) |
| Database | MongoDB (primary) + Redis/KV |
| Styling | Tailwind CSS v4 + OKLCH tokens |
| Validation | Zod (single source of truth) |
| Package Manager | pnpm + Turborepo |
| Testing | Vitest (planned) |

---

## Monorepo Structure

```
unisane-monorepo/
├── packages/
│   ├── foundation/           # Core infrastructure
│   │   ├── kernel/           # Context, database, cache, events, logging
│   │   ├── gateway/          # HTTP handlers, middleware, auth, rate limiting
│   │   └── contracts/        # Shared types, Zod schemas
│   ├── modules/              # Business logic (18 modules)
│   │   ├── auth/             # Authentication (signin, signup, OTP, tokens)
│   │   ├── identity/         # Users, memberships, API keys
│   │   ├── tenants/          # Multi-tenancy
│   │   ├── billing/          # Stripe subscriptions, payments
│   │   ├── credits/          # Usage-based billing
│   │   ├── flags/            # Feature flags
│   │   ├── settings/         # Key-value settings
│   │   ├── storage/          # File storage (S3)
│   │   ├── audit/            # Audit logging
│   │   ├── notify/           # Notifications (email, in-app)
│   │   ├── usage/            # Usage tracking
│   │   ├── webhooks/         # Outbound webhooks
│   │   ├── ai/               # AI integrations
│   │   ├── media/            # Media processing
│   │   └── pdf/              # PDF generation
│   ├── ui/
│   │   └── core/             # @unisane/ui - Material 3 components
│   └── tooling/
│       └── devtools/         # Code generation, SDK, CLI
├── starters/
│   └── saaskit/              # Main Next.js application
│       ├── src/app/          # App Router pages & API routes
│       ├── src/contracts/    # API contracts with metadata
│       └── src/sdk/          # Generated client SDK
└── handbook/                 # Architecture documentation
    ├── architecture/         # System design docs
    ├── design-system/        # UI component docs
    └── llm-context/          # AI-specific context
```

---

## Architecture Patterns

### 1. Kernel Context (AsyncLocalStorage)

Request-scoped context via `ctx`:

```typescript
import { ctx, getTenantId, getUserId } from '@unisane/kernel';

// In service code
const tenantId = getTenantId();  // Gets from context
const userId = getUserId();       // Gets from context
```

### 2. Repository Pattern

MongoDB repositories with tenant scoping:

```typescript
import { col, tenantFilter, withTenantId } from '@unisane/kernel';

// Queries automatically scoped to tenant
const doc = await col('users').findOne(tenantFilter({ email }));

// Inserts automatically include tenantId
await col('users').insertOne(withTenantId({ email, name }));
```

### 3. Contract-First API Design

Zod schemas → Generated routes → Generated SDK:

```typescript
// 1. Define contract with metadata
export const createTenantMeta = defineOpMeta({
  op: 'tenants.create',
  requireUser: true,
  service: {
    importPath: '@unisane/identity',
    fn: 'createTenantForUser',
    callArgs: [{ name: 'userId', from: 'ctx' }, { name: 'input', from: 'body' }],
  },
});

// 2. Run codegen: pnpm routes:gen
// 3. Routes + SDK generated automatically
```

### 4. Module Imports

Always import from package barrel, never deep imports:

```typescript
// ✅ Good
import { getTenant } from '@unisane/tenants';

// ❌ Bad - deep import
import { TenantsRepo } from '@unisane/tenants/data/repository';
```

---

## Critical Rules

### Code Style

1. **No hardcoded values in components** — Use design tokens
2. **No arbitrary pixels** — Use standard Tailwind spacing (p-4, gap-2, etc.)
3. **No emojis** unless user requests them
4. **Prefer editing existing files** over creating new ones
5. **Never create markdown/docs** unless explicitly requested

### Security

1. **Passwords**: Scrypt hash (already implemented)
2. **API Keys**: SHA-256 hash (already implemented)
3. **PII**: Needs encryption (email, phone, names) — see ISSUES-ROADMAP.md
4. **Never log sensitive data** (passwords, tokens, keys)

### Pre-Launch Policy

This system is **pre-launch** — no production users yet:
- No backward compatibility required
- Breaking changes allowed without migration paths
- Delete unused code completely (no deprecation markers)
- Replace implementations directly (no old/new coexistence)

---

## Key Files to Know

### Configuration
- `pnpm-workspace.yaml` — Workspace packages
- `turbo.json` — Build pipeline
- `tsconfig.base.json` — Shared TypeScript config

### Generated Code (DO NOT EDIT)
- `starters/saaskit/src/app/api/rest/v1/**/*.ts` — Generated routes
- `starters/saaskit/src/sdk/generated/` — Generated SDK
- Files marked `/* AUTO-GENERATED */`

### Source of Truth
- `starters/saaskit/src/contracts/` — API contracts
- `packages/foundation/contracts/` — Shared types
- `handbook/architecture/` — System design

### Roadmap
- `ISSUES-ROADMAP.md` — Prioritized issues and implementation plan

---

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build all packages
pnpm typecheck              # TypeScript check

# Code generation
pnpm routes:gen             # Generate API routes from contracts
pnpm sdk:gen                # Generate client SDK

# Testing (not yet implemented)
pnpm test                   # Run tests
pnpm test:coverage          # With coverage
```

---

## Before Making Changes

**ALWAYS follow this workflow:**

1. **Read relevant files first** — Understand what exists
2. **Check ISSUES-ROADMAP.md** — See if task is documented
3. **Verify approach** — Confirm solution fits architecture
4. **Get confirmation** — Discuss plan before major changes

> See "Before Starting Any Phase" section in ISSUES-ROADMAP.md

---

## Module Checklist

When making cross-cutting changes, ensure all modules are updated:

| Module | Package | Has Repository |
|--------|---------|----------------|
| auth | `@unisane/auth` | Yes |
| identity | `@unisane/identity` | Yes |
| tenants | `@unisane/tenants` | Yes |
| billing | `@unisane/billing` | Yes |
| credits | `@unisane/credits` | Yes |
| flags | `@unisane/flags` | Yes |
| settings | `@unisane/settings` | Yes |
| storage | `@unisane/storage` | Yes |
| audit | `@unisane/audit` | Yes |
| notify | `@unisane/notify` | Yes |
| usage | `@unisane/usage` | Yes |
| webhooks | `@unisane/webhooks` | Yes |
| ai | `@unisane/ai` | No |
| media | `@unisane/media` | No |
| pdf | `@unisane/pdf` | No |

---

## UI System (Material 3)

The UI uses OKLCH token-driven theming:

```css
/* Theme entire app with ONE variable */
:root {
  --hue: 240;     /* Blue (default) */
  --chroma: 0.13; /* Color intensity */
}
```

### UI Rules
- Use semantic tokens: `bg-primary`, `text-on-surface`, `border-outline`
- Use standard Tailwind spacing: `p-4`, `gap-2` (scaling handled by design system)
- Dark mode is CSS-only (`.dark` class or `prefers-color-scheme`)

---

## Documentation References

> **WARNING**: Handbook documentation may be outdated. The codebase evolves faster than docs.
> Always verify against actual source code before implementing based on handbook content.

| Topic | Location | Reliability |
|-------|----------|-------------|
| Issues & Roadmap | `ISSUES-ROADMAP.md` | Current |
| System Architecture | `handbook/architecture/ARCHITECTURE.md` | May be outdated |
| Kernel Layer | `handbook/architecture/kernel.md` | May be outdated |
| SDK Generation | `handbook/architecture/sdk-architecture.md` | May be outdated |
| UI Components | `handbook/design-system/` | May be outdated |
| UI Blueprint | `handbook/llm-context/blueprint.md` | May be outdated |

**When in doubt**: Read the actual source code, not the docs.

---

## What NOT to Do

1. **Don't edit generated files** — They will be overwritten
2. **Don't add backward compatibility** — Pre-launch, not needed
3. **Don't over-engineer** — Keep solutions simple
4. **Don't create docs/README files** unless requested
5. **Don't guess file paths** — Read/search first
6. **Don't skip verification** — Always read before editing
