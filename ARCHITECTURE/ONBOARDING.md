# Developer Onboarding Guide

> **For LLMs**: Quick start guide for new developers. Read this to understand how to work in the Unisane codebase.

---

## Quick Start

### 1. Understand the Architecture

Unisane follows **hexagonal architecture** (ports and adapters pattern):

```
┌─────────────────────────────────────────────────────────────┐
│                        Starters                             │
│  (saaskit, cli, etc.)                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                        Modules                              │
│  (billing, credits, auth, identity, ai, etc.)               │
│                          │                                  │
│               ONLY import from kernel                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                        Kernel                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Ports     │  │  Events     │  │   Cache     │          │
│  │  (APIs)     │  │  (Pub/Sub)  │  │   (Redis)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       Adapters                              │
│  (billing-stripe, storage-s3, email-ses, etc.)              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Key Rules (Memorize These)

| Rule | Correct | Wrong |
|------|---------|-------|
| **Import from kernel** | `import { x } from '@unisane/kernel'` | `import { x } from '@unisane/billing'` |
| **Use ports for cross-module** | `getFlagsPort().isEnabled()` | `import { isEnabled } from '@unisane/flags'` |
| **Wrap adapters** | `createResilientAdapter(...)` | `new StripeAdapter()` |
| **Own your events** | billing module emits `billing.*` | ai module emits `billing.*` |

### 3. Repository Structure

```
unisane-monorepo/
├── packages/
│   ├── foundation/
│   │   ├── kernel/          # Core infrastructure, ports, events
│   │   ├── gateway/         # HTTP handling, auth middleware
│   │   └── contracts/       # Shared Zod schemas
│   ├── modules/
│   │   ├── billing/         # Subscription management
│   │   ├── credits/         # Token/credit system
│   │   ├── auth/            # Authentication
│   │   ├── identity/        # User profiles
│   │   ├── tenants/         # Multi-tenancy
│   │   ├── ai/              # AI features
│   │   └── ...
│   ├── adapters/
│   │   ├── billing-stripe/  # Stripe integration
│   │   ├── storage-s3/      # S3 storage
│   │   ├── email-ses/       # AWS SES emails
│   │   └── ...
│   └── tooling/
│       └── devtools/        # Code generation, CLI
├── starters/
│   └── saaskit/             # Full SaaS application starter
└── ARCHITECTURE/            # You are here
```

---

## Common Tasks

### Task 1: Fix a Bug in a Module

1. Load `RULES.md` first
2. Check if the bug is documented in `ISSUES/` (may have a suggested fix)
3. Understand the module structure before changing code
4. Follow existing patterns in the module
5. Verify your fix doesn't violate `RULES.md`

### Task 2: Add a New Feature

1. Load `RULES.md` + `PATTERNS.md`
2. Determine which module owns this feature
3. Follow `PATTERNS.md` → Pattern 5 (Adding a New Module) or relevant pattern
4. Use ports for any cross-module communication
5. Add event emissions if other modules need to react

### Task 3: Create a New Adapter

1. Load `RULES.md` + `PATTERNS.md` + `REFERENCE/ADAPTERS.md`
2. Follow `PATTERNS.md` → Pattern 3 (Creating a New Adapter)
3. MUST use `createResilientProxy()` wrapper
4. MUST use `CIRCUIT_BREAKER_DEFAULTS` from kernel
5. Add to `REFERENCE/ADAPTERS.md`

### Task 4: Add Cross-Module Communication

1. Check if a port exists in `REFERENCE/PORTS.md`
2. If yes: use `get*Port()` from kernel
3. If no: create the port first (Pattern 1)
4. **NEVER** import directly from another module

---

## Development Workflow

### Setting Up

```bash
# Clone and install
git clone <repo>
cd unisane-monorepo
pnpm install

# Build foundation packages first
pnpm --filter @unisane/kernel build
pnpm --filter @unisane/contracts build

# Build all
pnpm build
```

### Running Locally

```bash
# Start development server
cd starters/saaskit
pnpm dev

# Run specific module tests
pnpm --filter @unisane/billing test
```

### Code Generation

```bash
# Generate routes from contracts
pnpm --filter @unisane/devtools routes:gen

# Generate types from contracts
pnpm --filter @unisane/contracts build
```

---

## Understanding Ports

Ports are interfaces that define how modules communicate. They live in the kernel.

### Available Ports

| Port | Purpose | Get Function |
|------|---------|--------------|
| `FlagsPort` | Feature flag checks | `getFlagsPort()` |
| `BillingPort` | Billing service calls | `getBillingPort()` |
| `SettingsPort` | Settings key-value ops | `getSettingsPort()` |
| `CreditsPort` | Credit balance ops | `getCreditsPort()` |
| `AuditPort` | Audit log entries | `getAuditPort()` |
| `UsagePort` | Usage tracking | `getUsagePort()` |
| `NotifyPort` | Send notifications | `getNotifyPort()` |
| `JobsPort` | Background jobs | `getJobsPort()` |
| `OutboxPort` | Transactional outbox | `getOutboxPort()` |
| `TenantsPort` | Tenant operations | `getTenantsPort()` |
| `IdentityPort` | User profile ops | `getIdentityPort()` |
| `AuthIdentityPort` | Auth identity ops | `getAuthIdentityPort()` |

### Using a Port

```typescript
import { getCreditsPort, getFlagsPort } from '@unisane/kernel';

async function myFunction(scopeId: string) {
  const flags = getFlagsPort();
  const credits = getCreditsPort();

  // Check feature flag
  const enabled = await flags.isEnabled('my.feature', scopeId);
  if (!enabled) throw new Error('Feature disabled');

  // Consume credits
  await credits.consume({
    scopeId,
    amount: 10,
    reason: 'my.feature',
  });
}
```

---

## Understanding Events

Events enable loose coupling between modules. Each module owns its events.

### Event Ownership

| Prefix | Owner Module |
|--------|--------------|
| `billing.*` | @unisane/billing |
| `credits.*` | @unisane/credits |
| `tenant.*` | @unisane/tenants |
| `user.*` | @unisane/identity |
| `auth.*` | @unisane/auth |

### Emitting Events

Only emit events that your module owns:

```typescript
// In @unisane/billing - CORRECT
import { events } from '@unisane/kernel';

await events.emit('billing.subscription.created', {
  scopeId,
  subscriptionId,
  planId,
});
```

### Listening to Events

Any module can listen to any event:

```typescript
// In @unisane/credits - listening to billing events
import { onTyped } from '@unisane/kernel';

onTyped('billing.subscription.created', async (event) => {
  await grantInitialCredits(event.payload.scopeId);
});
```

---

## Adapter Resilience

All external-facing adapters MUST use resilience wrappers:

```typescript
import { createResilientProxy, CIRCUIT_BREAKER_DEFAULTS } from '@unisane/kernel';

export function createMyAdapter(config: Config): MyPort {
  return createResilientProxy({
    name: 'my-adapter',
    primary: new MyAdapterImpl(config),
    circuitBreaker: {
      failureThreshold: CIRCUIT_BREAKER_DEFAULTS.failureThreshold,
      resetTimeout: CIRCUIT_BREAKER_DEFAULTS.resetTimeout,
    },
    retry: {
      maxRetries: 3,
      baseDelayMs: 200,
    },
  });
}
```

### Standard Defaults

- Circuit breaker: 5 failures, 30s reset, 2 successes to recover
- Retry: 3 attempts, 200ms base delay with exponential backoff
- Timeout: 10s request timeout

---

## Troubleshooting

### "Port not configured" Error

```
Error: CreditsPort not configured. Call setCreditsPort() in bootstrap.
```

**Fix**: Ensure `bootstrap.ts` wires the port before it's used:

```typescript
// starters/saaskit/src/bootstrap.ts
const credits = await import('@unisane/credits');
setCreditsPort({
  consume: credits.consumeTokens,
  grant: credits.grantTokens,
  getBalance: credits.getBalance,
});
```

### Module Import Violations

If you see ESLint errors about importing from other modules:

```
Error: Cannot import from @unisane/flags in @unisane/ai
```

**Fix**: Use the appropriate port instead:

```typescript
// WRONG
import { isEnabled } from '@unisane/flags';

// CORRECT
import { getFlagsPort } from '@unisane/kernel';
const flags = getFlagsPort();
await flags.isEnabled(...);
```

### Contract Build Failures

If route generation fails:

```
Error: Cannot find module '@unisane/contracts/dist/router'
```

**Fix**: Build contracts first:

```bash
pnpm --filter @unisane/contracts build
```

Note: The devtools now auto-build contracts when stale, but manual build may still be needed for fresh checkouts.

---

## Further Reading

| Document | When to Read |
|----------|--------------|
| [RULES.md](./RULES.md) | Always - contains hard rules |
| [PATTERNS.md](./PATTERNS.md) | When implementing new features |
| [REFERENCE/PORTS.md](./REFERENCE/PORTS.md) | When working with cross-module calls |
| [REFERENCE/EVENTS.md](./REFERENCE/EVENTS.md) | When working with events |
| [REFERENCE/ADAPTERS.md](./REFERENCE/ADAPTERS.md) | When adding external integrations |
| [REFERENCE/MODULES.md](./REFERENCE/MODULES.md) | When understanding module responsibilities |
| [ISSUES/RESOLVED.md](./ISSUES/RESOLVED.md) | When checking if an issue was already fixed |

---

> **Last Updated**: 2025-01-15
