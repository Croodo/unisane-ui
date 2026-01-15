# Unisane Platform Architecture

Complete architecture documentation for the Unisane platform.

---

## Roadmaps (What to Build)

| Document | Description | When to Use |
|----------|-------------|-------------|
| [MASTER-ROADMAP.md](../roadmaps/MASTER-ROADMAP.md) | Overall vision & phases | Understanding priorities |
| [centralization-plan.md](../roadmaps/centralization-plan.md) | Architecture consolidation | Fixing fragmentation |
| [server-table-state.md](../roadmaps/server-table-state.md) | DataTable implementation | Working on tables |

---

## Documents

### Core Documentation

| Document | Description | When to Use |
|----------|-------------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete platform specification | Full understanding, decisions |
| [implementation-status.md](./implementation-status.md) | What's built vs planned | Quick status check |
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | Patterns cheat sheet | Daily reference |
| [kernel.md](./kernel.md) | Kernel layer deep-dive | Implementing kernel |
| [testing.md](./testing.md) | Testing strategy | Writing tests |

### Development Guides

| Document | Description | When to Use |
|----------|-------------|-------------|
| [module-development.md](./module-development.md) | Creating new modules | Building new features |
| [contracts-guide.md](./contracts-guide.md) | ts-rest, defineOpMeta, SDK | API contracts & codegen |
| [sdk-architecture.md](./sdk-architecture.md) | Multi-platform SDK, hooks, OpenAPI | SDK development & integration |
| [adapters-guide.md](./adapters-guide.md) | Creating & using adapters | Implementing port interfaces |
| [platform-layer.md](./platform-layer.md) | Hexagonal architecture in saaskit | Understanding platform adapters |
| [providers.md](./providers.md) | AI, storage, email, payments | Integrating services |
| [advanced-features.md](./advanced-features.md) | Auth, media, AI, analytics | Advanced implementations |
| [developer-experience.md](./developer-experience.md) | CLI, generators, seeding | Fast platform building |

### Operations & Deployment

| Document | Description | When to Use |
|----------|-------------|-------------|
| [deployment.md](./deployment.md) | Docker, Vercel, CI/CD | Deploying to production |
| [build-distribution.md](./build-distribution.md) | Build process, OSS/PRO | Building starters |
| [troubleshooting.md](./troubleshooting.md) | Common issues & solutions | Debugging problems |
| [dev-tools.md](./dev-tools.md) | ESLint, Vitest, CI/CD, CLI ecosystem | Setting up tooling |

> **Note:** Legacy migration docs have been moved to [../archive/](../archive/) folder.

---

## Quick Summary

### What is Unisane?

```
Unisane Platform
├── UI Library (@unisane/ui)           # Material 3 components
├── DataTable (@unisane/data-table)    # Advanced data grid
├── SaasKit (Starter)                  # Full SaaS boilerplate
└── Future: E-commerce, CRM, AI Apps   # Built from same modules
```

### Architecture: Clean Modular Monolith

```
┌─────────────────────────────────────────────────┐
│                    KERNEL                        │
│  ctx │ db │ events │ cache │ errors │ utils     │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│                   GATEWAY                        │
│  handler │ auth │ rateLimit │ middleware        │
└─────────────────────────────────────────────────┘
                      │
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Layer 2 │ │ Layer 3 │ │ Layer 4 │ │ Layer 5 │
│identity │→│ tenants │→│ billing │→│ credits │
│settings │ │ auth    │ │ flags   │ │ usage   │
│storage  │ │ sso     │ │ audit   │ │ notify  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
                      │
┌─────────────────────────────────────────────────┐
│                   STARTERS                       │
│  SaasKit: contracts + platform + components     │
└─────────────────────────────────────────────────┘
```

### Key Patterns

```typescript
// Context - request-scoped data
const { tenantId, userId } = ctx.get();

// Transactions - atomic operations
await withTransaction(async (session) => {
  await createTenant(data, session);
  await createMembership(data, session);
});

// Events - async side effects
await events.emit('billing.subscription.created', payload);

// Errors - typed domain errors
throw new NotFoundError('Subscription', id);
```

---

## Reading Order

### New to the project?

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Read sections 1-6
2. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Bookmark for daily use
3. [module-development.md](./module-development.md) - Understand module structure

### Creating a new module?

1. [module-development.md](./module-development.md) - Step-by-step guide
2. [contracts-guide.md](./contracts-guide.md) - API contracts
3. [sdk-architecture.md](./sdk-architecture.md) - SDK integration
4. [kernel.md](./kernel.md) - Kernel utilities
5. [testing.md](./testing.md) - Test patterns

### Implementing a feature?

1. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Patterns
2. [kernel.md](./kernel.md) - If touching kernel
3. [testing.md](./testing.md) - For test patterns
4. [advanced-features.md](./advanced-features.md) - For auth, media, AI, notifications

### Setting up integrations?

1. [providers.md](./providers.md) - Provider interfaces
2. [contracts-guide.md](./contracts-guide.md) - API contracts
3. [sdk-architecture.md](./sdk-architecture.md) - SDK generation & hooks
4. [deployment.md](./deployment.md) - Environment setup

### Deploying to production?

1. [deployment.md](./deployment.md) - Full deployment guide
2. [build-distribution.md](./build-distribution.md) - Build process
3. [troubleshooting.md](./troubleshooting.md) - Common issues

### Building a new platform?

1. [developer-experience.md](./developer-experience.md) - CLI and generators
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand module system
3. [build-distribution.md](./build-distribution.md) - Distribution flow

---

## File Overview

```
architecture/
├── README.md                  # This file (index)
│
├── # Core
├── ARCHITECTURE.md            # Main spec (~1600 lines)
├── QUICK-REFERENCE.md         # Cheat sheet (~200 lines)
├── implementation-status.md   # What's built vs planned
├── kernel.md                  # Kernel deep-dive (~1000 lines)
├── testing.md                 # Testing strategy (~500 lines)
│
├── # Development Guides
├── module-development.md      # Module creation (~600 lines)
├── contracts-guide.md         # ts-rest & SDK (~800 lines)
├── sdk-architecture.md        # SDK, hooks, OpenAPI (~1200 lines)
├── platform-layer.md          # Hexagonal architecture
├── providers.md               # Service providers (~1000 lines)
├── advanced-features.md       # Advanced features (~2600 lines)
├── developer-experience.md    # DX & tooling (~800 lines)
│
└── # Operations
    ├── deployment.md          # Deployment guide (~700 lines)
    ├── build-distribution.md  # Build & OSS/PRO (~800 lines)
    ├── troubleshooting.md     # Debug guide (~600 lines)
    └── dev-tools.md           # Tool configs, CI/CD, CLI ecosystem
```

---

## Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| ARCHITECTURE.md | Authoritative | 2026-01-09 |
| implementation-status.md | Current | 2026-01-09 |
| sdk-architecture.md | Current | 2026-01-09 |
| build-distribution.md | Current | 2026-01-09 |
| platform-layer.md | Current | 2026-01-09 |
| dev-tools.md | Current | 2026-01-09 |
| contracts-guide.md | Active | 2025-01-06 |
| deployment.md | Active | 2025-01-06 |
| providers.md | Active | 2025-01-06 |
| module-development.md | Active | 2025-01-06 |
| troubleshooting.md | Active | 2025-01-06 |

---

**Last Updated:** 2026-01-09
**Status:** Authoritative
