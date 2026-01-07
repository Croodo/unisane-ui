# Architecture Quick Reference

> Quick reference for the finalized Unisane architecture.
> For full details, see [00-FINALIZED-ARCHITECTURE.md](./00-FINALIZED-ARCHITECTURE.md)

---

## Key Improvements from v1

| Area | Before (v1) | After (v2) | Why |
|------|-------------|------------|-----|
| **UI Integration** | Symlinks | Workspace packages | Cross-platform reliable |
| **Transactions** | Not defined | `withTransaction()` in kernel | Data integrity |
| **Events** | Untyped emit | Typed contracts + versioning | Future-proof |
| **Errors** | Ad-hoc | Domain classes + mapping | Consistent |
| **Observability** | Minimal | Logger, tracer, metrics | Production-ready |
| **Testing** | Basic | Pyramid (unit/integration/e2e) | Comprehensive |
| **PRO Stripping** | Path-based | AST-based markers | Reliable |
| **Versioning** | Not defined | Semver + upgrade CLI | Smooth upgrades |

---

## Layer Architecture

```
Layer 0: kernel, gateway          ← Foundation
Layer 1: identity, settings, storage
Layer 2: tenants, auth
Layer 3: billing, flags, audit
Layer 4: credits, usage, notify, webhooks
Layer 5: media, pdf, ai
PRO:     analytics, sso, import-export
```

**Rule:** Import only from same or lower layers via PUBLIC API.

---

## Module Structure

```
packages/{module}/
├── src/
│   ├── index.ts              # PUBLIC API (barrel)
│   ├── domain/               # PURE (no server deps)
│   │   ├── schemas.ts        # Zod (works in browser)
│   │   ├── types.ts
│   │   └── errors.ts         # Module-specific errors
│   ├── service/              # Business logic
│   │   ├── {entity}.service.ts  # 100-300 lines
│   │   └── admin/
│   └── data/                 # Repository pattern
├── __tests__/
└── package.json
```

---

## Key Patterns

### Context

```typescript
import { ctx } from '@unisane/kernel';

// Get current context
const { tenantId, userId } = ctx.get();

// Run with context
await ctx.run(context, async () => {
  // Code here has access to context
});
```

### Transactions

```typescript
import { withTransaction } from '@unisane/kernel';

await withTransaction(async (session) => {
  await collection.insertOne(doc1, { session });
  await collection.insertOne(doc2, { session });
  // Both succeed or both rollback
});
```

### Events

```typescript
import { events } from '@unisane/kernel';

// Typed emit
await events.emit('billing.subscription.created', {
  tenantId,
  subscriptionId,
  planId,
});

// Typed handler
events.on('billing.subscription.created', async (payload) => {
  // payload is typed
});
```

### Errors

```typescript
import { NotFoundError, BusinessError } from '@unisane/kernel/errors';

// Throw domain errors
throw new NotFoundError('Subscription', id);
throw new BusinessError('INSUFFICIENT_CREDITS', 'Not enough credits');

// Gateway automatically maps to HTTP responses
```

### Tenant Scoping

```typescript
import { tenantFilter, assertTenantOwnership } from '@unisane/kernel';

// Auto-add tenantId to queries
const docs = await col.find(tenantFilter({ status: 'active' }));

// Validate ownership after fetch
const doc = await col.findOne({ _id: id });
assertTenantOwnership(doc, 'Subscription');
```

---

## Event vs Job Decision

| Use Case | Choice |
|----------|--------|
| Must succeed together | Direct function call |
| Side effect, can fail | `events.emit()` |
| Must deliver, retry on fail | `events.emitReliable()` (outbox) |
| Long-running, scheduled | Inngest job |

---

## Distribution Flow

```
Monorepo (dev)
    │
    │ build-starter.ts
    ▼
┌─────────────────────────────┐
│ 1. Copy starter             │
│ 2. Flatten modules          │
│ 3. Copy UI packages         │
│ 4. Strip PRO (if OSS)       │
│ 5. Transform imports        │
│ 6. Update package.json      │
└─────────────────────────────┘
    │
    ▼
User Project (no @unisane/* deps)
```

---

## Import Transforms

| Dev (monorepo) | Prod (user project) |
|----------------|---------------------|
| `@unisane/kernel` | `@/modules/kernel` |
| `@unisane/billing` | `@/modules/billing` |
| `@unisane/ui` | `@/components/ui` |

---

## Testing Quick Reference

```bash
# Run all tests
pnpm test

# Run specific package
pnpm --filter @unisane/billing test

# Run with coverage
pnpm test -- --coverage

# Run integration tests
RUN_INTEGRATION=1 pnpm test
```

---

## CLI Commands

```bash
# Create new project
npx unisane create my-app

# Add UI component
npx unisane add button dialog

# Check for updates
npx unisane upgrade --check

# Run database migrations
npx unisane db migrate

# Health check
npx unisane doctor
```

---

## DevTools Commands (Starters)

> **See Also:** [dev-tools.md](./dev-tools.md#saaskit-devtools-migration) for full reference.

```bash
# Code Generation (from ts-rest contracts)
npm run devtools routes:gen          # Generate route handlers
npm run devtools sdk:gen             # Generate clients + hooks
npm run devtools crud <name>         # Scaffold CRUD module
npm run devtools crud <name> --tenant --slug --ui=form
npm run devtools sync                # Regenerate all + doctor --fix

# Billing
npm run devtools billing:plans
npm run devtools billing:seed-stripe
npm run devtools billing:configure-stripe-portal

# Database
npm run devtools db:query <collection> [filterJson]
npm run devtools indexes:apply

# Tenant
npm run devtools tenant:info <slug>
npm run devtools tenant:reset-billing <slug>

# Quality
npm run devtools doctor
npm run devtools doctor --fix

# Docs
npm run devtools openapi:serve
npm run devtools routes:graph
```

---

## Migration Timeline

| Phase | Duration | Key Tasks |
|-------|----------|-----------|
| 0. Prep | 1-2 days | Backup, audit, plan |
| 1. Structure | 2-3 days | Monorepo setup |
| 2. Kernel | 3-4 days | Core infrastructure |
| 3. Gateway | 2-3 days | HTTP layer |
| 4. Modules | 5-7 days | Extract 18 modules |
| 5. Starter | 3-4 days | Template setup |
| 6. Build | 2-3 days | Distribution tools |
| 7. CLI | 2-3 days | User commands |
| 8. Test | 3-4 days | E2E + docs |
| 9. Launch | 1-2 days | Publish + announce |
| **Total** | **~30 days** | |

---

## Checklists

### New Module

- [ ] Package structure
- [ ] domain/ (schemas, types, errors)
- [ ] service/ (grouped, 100-300 lines)
- [ ] data/ (repository pattern)
- [ ] index.ts (barrel export)
- [ ] Tests (unit + integration)
- [ ] Documentation

### New Event

- [ ] Schema in `contracts.ts`
- [ ] Version number (V1)
- [ ] Add to EventRegistry
- [ ] Emit in service
- [ ] Handler (if needed)
- [ ] Tests

### Pre-Release

- [ ] Tests passing
- [ ] TypeScript clean
- [ ] ESLint clean
- [ ] OSS build works
- [ ] PRO build works
- [ ] CLI tested
- [ ] Docs updated
- [ ] Changelog updated

---

## File Locations

| What | Where |
|------|-------|
| Full architecture | `handbook/architecture/ARCHITECTURE.md` |
| Kernel source | `packages/kernel/src/` |
| Gateway source | `packages/gateway/src/` |
| Module template | `packages/{module}/src/` |
| Starter template | `starters/saaskit/` |
| Build tools | `tools/release/src/` |
| CLI | `packages/cli/src/` |
| DevTools | `packages/devtools/src/` |
| DevTools Docs | `handbook/architecture/dev-tools.md` |
| Tests | `packages/*/__tests__/` |

