# Phase 2: Module Decoupling

> **For LLMs**: Replace direct module imports with port calls. This is the core hexagonal architecture fix.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | Blocked |
| **Dependencies** | Phase 0 (ports), Phase 1 (foundation) |
| **Blocks** | Phase 3 (quality) |
| **Issues Addressed** | M-001, M-002, M-003 |

---

## Prerequisites Check

Before starting this phase, verify:

1. **Phase 0 complete**: All ports exist and are wired
2. **Phase 1 complete**: Foundation issues fixed

```typescript
// All these must work
import {
  getFlagsPort,
  getBillingPort,
  getSettingsPort,
  getCreditsPort,
  getAuditPort,
  getUsagePort,
  getNotifyPort,
  getTenantsQueryPort
} from '@unisane/kernel';
```

---

## Tasks

### 1. M-001: Fix Direct Inter-Module Imports (CRITICAL)

**Violations Found**:

| Source Module | Imports From | File |
|---------------|--------------|------|
| ai | @unisane/flags | `service/generate.ts:3` |
| ai | @unisane/billing | `service/generate.ts:4` |
| billing | @unisane/flags | `service/refund.ts:8` |
| webhooks | @unisane/settings | `data/webhooks.repository.mongo.ts:18` |

#### Fix: ai/service/generate.ts

**Before**:
```typescript
import { isEnabledForScope } from "@unisane/flags";
import { assertActiveSubscriptionForCredits } from "@unisane/billing";

export async function generate(args: GenerateArgs) {
  const enabled = await isEnabledForScope({ key: 'ai.generate', scopeId: args.scopeId });
  await assertActiveSubscriptionForCredits(args.scopeId);
  // ...
}
```

**After**:
```typescript
import { getFlagsPort, getBillingPort, getCreditsPort } from "@unisane/kernel";

export async function generate(args: GenerateArgs) {
  const flags = getFlagsPort();
  const billing = getBillingPort();
  const credits = getCreditsPort();

  // Check feature flag
  const enabled = await flags.isEnabled('ai.generate', args.scopeId);
  if (!enabled) throw new FeatureDisabledError('ai.generate');

  // Check subscription
  const subStatus = await billing.getSubscriptionStatus(args.scopeId);
  if (!subStatus.hasActiveSubscription) {
    throw new NoActiveSubscriptionError();
  }

  // Check credits
  const hasCreds = await credits.hasSufficient(args.scopeId, args.estimatedTokens);
  if (!hasCreds) throw new InsufficientCreditsError();

  // ... rest of generation
}
```

**Checklist**:
- [ ] Remove `import ... from "@unisane/flags"`
- [ ] Remove `import ... from "@unisane/billing"`
- [ ] Add `import { getFlagsPort, getBillingPort, getCreditsPort } from "@unisane/kernel"`
- [ ] Replace `isEnabledForScope()` with `flags.isEnabled()`
- [ ] Replace `assertActiveSubscriptionForCredits()` with port calls
- [ ] Add proper error handling

---

#### Fix: billing/service/refund.ts

**Before**:
```typescript
import { isEnabledForScope } from "@unisane/flags";

export async function processRefund(args: RefundArgs) {
  const enabled = await isEnabledForScope({ key: 'billing.refunds', scopeId: args.scopeId });
  // ...
}
```

**After**:
```typescript
import { getFlagsPort } from "@unisane/kernel";

export async function processRefund(args: RefundArgs) {
  const flags = getFlagsPort();
  const enabled = await flags.isEnabled('billing.refunds', args.scopeId);
  if (!enabled) throw new FeatureDisabledError('billing.refunds');
  // ...
}
```

**Checklist**:
- [ ] Remove `import ... from "@unisane/flags"`
- [ ] Add `import { getFlagsPort } from "@unisane/kernel"`
- [ ] Replace direct call with port call

---

#### Fix: webhooks/data/webhooks.repository.mongo.ts

**Before**:
```typescript
import { getTypedSetting } from "@unisane/settings";

async function getWebhookConfig(scopeId: string) {
  const config = await getTypedSetting('webhooks.config', scopeId);
  // ...
}
```

**After**:
```typescript
import { getSettingsPort } from "@unisane/kernel";

async function getWebhookConfig(scopeId: string) {
  const settings = getSettingsPort();
  const config = await settings.get<WebhookConfig>('webhooks.config', scopeId);
  // ...
}
```

**Checklist**:
- [ ] Remove `import ... from "@unisane/settings"`
- [ ] Add `import { getSettingsPort } from "@unisane/kernel"`
- [ ] Replace direct call with port call

---

### 2. M-002: Fix Cross-Module Type Dependencies

**Violation Found**:
`packages/modules/billing/src/domain/ports/subscriptions.ts` line 3

**Before**:
```typescript
import type { LatestSub } from '@unisane/tenants';

export interface SubscriptionsRepo {
  getLatestByScopeIds(scopeIds: string[]): Promise<Map<string, LatestSub>>;
}
```

**After**:
```typescript
// Define type locally - don't import from other modules
interface SubscriptionView {
  id: string;
  status: 'active' | 'canceled' | 'past_due';
  planId: string;
  currentPeriodEnd: number;
}

export interface SubscriptionsRepo {
  getLatestByScopeIds(scopeIds: string[]): Promise<Map<string, SubscriptionView>>;
}
```

**Checklist**:
- [ ] Remove `import type { LatestSub } from '@unisane/tenants'`
- [ ] Define `SubscriptionView` locally
- [ ] Update any code using `LatestSub` to use `SubscriptionView`
- [ ] Verify no type mismatches

---

### 3. M-003: Verify All Kernel Ports Exist

Ensure these ports exist (from Phase 0):

| Port | Module | Status |
|------|--------|--------|
| FlagsPort | flags | ✓ Exists |
| BillingPort | billing | ✓ Exists |
| SettingsPort | settings | ✓ Exists |
| CreditsPort | credits | From Phase 0 |
| AuditPort | audit | From Phase 0 |
| UsagePort | usage | From Phase 0 |
| NotifyPort | notify | From Phase 0 |
| TenantsQueryPort | tenants | From Phase 0 |

**Checklist**:
- [ ] Verify all 8 ports export from `@unisane/kernel`
- [ ] Verify all 8 ports have adapters
- [ ] Verify bootstrap wires all ports

---

## Full Module Scan

Run this to find any remaining violations:

```bash
# Find direct module imports (excluding kernel)
grep -r "from ['\"]@unisane/" packages/modules/ \
  | grep -v "@unisane/kernel" \
  | grep -v "node_modules" \
  | grep -v ".d.ts"
```

Expected output after Phase 2: **Empty** (no direct module imports)

---

## Verification

### Automated Check

Create a lint rule or script:

```typescript
// scripts/check-module-imports.ts
import { glob } from 'glob';
import { readFileSync } from 'fs';

const modulesPath = 'packages/modules';
const files = glob.sync(`${modulesPath}/**/*.ts`);

const violations: string[] = [];

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const importMatches = content.matchAll(/from ['"]@unisane\/([^'"]+)['"]/g);

  for (const match of importMatches) {
    const pkg = match[1];
    if (pkg !== 'kernel') {
      violations.push(`${file}: imports from @unisane/${pkg}`);
    }
  }
}

if (violations.length > 0) {
  console.error('❌ Direct module import violations found:');
  violations.forEach(v => console.error(`   ${v}`));
  process.exit(1);
} else {
  console.log('✅ No direct module imports found');
}
```

**Checklist**:
- [ ] Create check script
- [ ] Add to CI pipeline
- [ ] Run and verify zero violations

---

### Manual Verification

```bash
# Build should pass
pnpm build

# Type check should pass
pnpm typecheck

# All tests should pass
pnpm test
```

---

## Success Criteria

Phase 2 is complete when:

1. **Zero direct imports** between `@unisane/*` modules (except kernel)
2. **Zero type imports** from other modules
3. **All cross-module calls** use `get*Port()` pattern
4. Automated check script passes
5. All M-00x issues marked resolved

---

## Next Phase

After Phase 2 is complete, proceed to **[PHASE-3-QUALITY.md](./PHASE-3-QUALITY.md)** to fix code quality issues.

---

> **Last Updated**: 2025-01-15
