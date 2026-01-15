# Phase 0: Prerequisites

> **For LLMs**: This phase MUST be completed before any other phase. It creates the kernel ports that enable module decoupling.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Status** | COMPLETE |
| **Dependencies** | None |
| **Blocks** | All other phases |
| **Estimated Scope** | 5 new ports, ~500 lines of code |

---

## Why This Phase First?

The main architecture violation is **direct module imports**:

```typescript
// CURRENT - Broken
import { isEnabledForScope } from "@unisane/flags";      // ❌
import { assertActiveSubscription } from "@unisane/billing"; // ❌
```

We cannot fix these until we have ports to replace them:

```typescript
// AFTER Phase 0 - Fixed
const flags = getFlagsPort();
const billing = getBillingPort();
```

**If we try to fix modules before creating ports, we have nothing to call.**

---

## Deliverables

### 1. CreditsPort

**Used by**: ai, billing modules

```typescript
// packages/foundation/kernel/src/ports/credits.port.ts

export interface CreditsPort {
  /**
   * Consume tokens from a scope's balance
   * @returns Remaining balance after consumption
   */
  consume(args: {
    scopeId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ remaining: number }>;

  /**
   * Grant tokens to a scope
   */
  grant(args: {
    scopeId: string;
    amount: number;
    reason: string;
    expiresAt?: Date;
  }): Promise<{ newBalance: number }>;

  /**
   * Get current balance for a scope
   */
  getBalance(scopeId: string): Promise<{
    available: number;
    reserved: number;
    expiring: { amount: number; expiresAt: Date }[];
  }>;

  /**
   * Check if scope has sufficient credits
   */
  hasSufficient(scopeId: string, amount: number): Promise<boolean>;
}

// Getter/Setter
let creditsPort: CreditsPort | null = null;

export function setCreditsPort(port: CreditsPort): void {
  creditsPort = port;
}

export function getCreditsPort(): CreditsPort {
  if (!creditsPort) {
    throw new Error('CreditsPort not configured. Call setCreditsPort() in bootstrap.');
  }
  return creditsPort;
}
```

### 2. AuditPort

**Used by**: All modules that need audit logging

```typescript
// packages/foundation/kernel/src/ports/audit.port.ts

export interface AuditEntry {
  action: string;
  actor: {
    type: 'user' | 'system' | 'api';
    id: string;
  };
  target: {
    type: string;
    id: string;
  };
  changes?: {
    field: string;
    from: unknown;
    to: unknown;
  }[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface AuditPort {
  /**
   * Log an audit entry
   */
  log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void>;

  /**
   * Query audit log
   */
  query(args: {
    scopeId: string;
    filters?: {
      action?: string;
      actorId?: string;
      targetType?: string;
      from?: Date;
      to?: Date;
    };
    pagination: { limit: number; offset: number };
  }): Promise<{ entries: AuditEntry[]; total: number }>;
}

let auditPort: AuditPort | null = null;

export function setAuditPort(port: AuditPort): void {
  auditPort = port;
}

export function getAuditPort(): AuditPort {
  if (!auditPort) {
    throw new Error('AuditPort not configured. Call setAuditPort() in bootstrap.');
  }
  return auditPort;
}
```

### 3. UsagePort

**Used by**: billing, ai modules

```typescript
// packages/foundation/kernel/src/ports/usage.port.ts

export interface UsageRecord {
  scopeId: string;
  metric: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface UsagePort {
  /**
   * Record a usage event
   */
  record(args: {
    scopeId: string;
    metric: string;
    value: number;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  /**
   * Get aggregated usage for a period
   */
  getUsage(args: {
    scopeId: string;
    metric: string;
    from: Date;
    to: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
  }): Promise<{ period: string; value: number }[]>;

  /**
   * Get current period usage (for limit checking)
   */
  getCurrentPeriodUsage(args: {
    scopeId: string;
    metric: string;
  }): Promise<{ used: number; limit: number | null }>;
}

let usagePort: UsagePort | null = null;

export function setUsagePort(port: UsagePort): void {
  usagePort = port;
}

export function getUsagePort(): UsagePort {
  if (!usagePort) {
    throw new Error('UsagePort not configured. Call setUsagePort() in bootstrap.');
  }
  return usagePort;
}
```

### 4. NotifyPort

**Used by**: auth, billing modules

```typescript
// packages/foundation/kernel/src/ports/notify.port.ts

export interface NotifyPort {
  /**
   * Send an email notification
   */
  sendEmail(args: {
    to: string | string[];
    template: string;
    data: Record<string, unknown>;
    options?: {
      cc?: string[];
      bcc?: string[];
      attachments?: { filename: string; content: Buffer }[];
    };
  }): Promise<{ messageId: string }>;

  /**
   * Send an in-app notification
   */
  sendInApp(args: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actions?: { label: string; url: string }[];
  }): Promise<{ notificationId: string }>;

  /**
   * Send a webhook notification
   */
  sendWebhook(args: {
    scopeId: string;
    event: string;
    payload: Record<string, unknown>;
  }): Promise<{ delivered: boolean; webhookId?: string }>;
}

let notifyPort: NotifyPort | null = null;

export function setNotifyPort(port: NotifyPort): void {
  notifyPort = port;
}

export function getNotifyPort(): NotifyPort {
  if (!notifyPort) {
    throw new Error('NotifyPort not configured. Call setNotifyPort() in bootstrap.');
  }
  return notifyPort;
}
```

### 5. TenantsQueryPort

**Used by**: billing, identity modules (read-only tenant queries)

```typescript
// packages/foundation/kernel/src/ports/tenants-query.port.ts

// Import SSOT types from kernel constants
import { UserStatus, SubscriptionStatus } from '../constants';

export interface TenantView {
  id: string;
  name: string;
  slug: string;
  status: UserStatus;  // SSOT: 'active' | 'suspended' | 'deleted'
  settings: Record<string, unknown>;
  subscription?: {
    planId: string;
    status: SubscriptionStatus;  // SSOT reference
    currentPeriodEnd: Date;
  };
}

export interface TenantsQueryPort {
  /**
   * Get tenant by ID (read-only view)
   */
  getById(tenantId: string): Promise<TenantView | null>;

  /**
   * Get multiple tenants by IDs
   */
  getByIds(tenantIds: string[]): Promise<Map<string, TenantView>>;

  /**
   * Check if tenant exists and is active
   */
  isActive(tenantId: string): Promise<boolean>;

  /**
   * Get tenant's current subscription status
   */
  getSubscriptionStatus(tenantId: string): Promise<{
    hasActiveSubscription: boolean;
    planId?: string;
    expiresAt?: Date;
  }>;
}

let tenantsQueryPort: TenantsQueryPort | null = null;

export function setTenantsQueryPort(port: TenantsQueryPort): void {
  tenantsQueryPort = port;
}

export function getTenantsQueryPort(): TenantsQueryPort {
  if (!tenantsQueryPort) {
    throw new Error('TenantsQueryPort not configured. Call setTenantsQueryPort() in bootstrap.');
  }
  return tenantsQueryPort;
}
```

---

## Implementation Checklist

### Step 1: Create Port Files

- [x] Create `kernel/src/ports/credits.port.ts`
- [x] Create `kernel/src/ports/audit.port.ts`
- [x] Create `kernel/src/ports/usage.port.ts`
- [x] Create `kernel/src/ports/notify.port.ts`
- [x] Extended `kernel/src/ports/tenants.port.ts` (merged TenantsQueryPort into existing TenantsPort)

### Step 2: Export from Kernel

- [x] Update `kernel/src/ports/index.ts` to export all ports
- [x] Update `kernel/src/index.ts` to re-export ports

### Step 3: Create Module Adapters

- [x] Create credits module adapter (`packages/modules/credits/src/adapter.ts`)
- [x] Create audit module adapter (`packages/modules/audit/src/adapter.ts`)
- [x] Create usage module adapter (`packages/modules/usage/src/adapter.ts`)
- [x] Create notify module adapter (`packages/modules/notify/src/adapter.ts`)
- [x] Create tenants adapter (`packages/modules/tenants/src/adapter.ts`)

### Step 4: Wire in Bootstrap

- [x] Update `starters/saaskit/src/bootstrap.ts` with port wiring
- [x] All ports wired in `setupRepositories()` function

```typescript
// bootstrap.ts - Actual implementation
const { tenantsAdapter } = await import('@unisane/tenants');
setTenantsProvider(tenantsAdapter);

const { setCreditsProvider } = await import('@unisane/kernel');
const { creditsAdapter } = await import('@unisane/credits');
setCreditsProvider(creditsAdapter);

const { setAuditProvider } = await import('@unisane/kernel');
const { auditAdapter } = await import('@unisane/audit');
setAuditProvider(auditAdapter);

const { setUsageProvider } = await import('@unisane/kernel');
const { usageAdapter } = await import('@unisane/usage');
setUsageProvider(usageAdapter);

const { setNotifyProvider } = await import('@unisane/kernel');
const { notifyAdapter } = await import('@unisane/notify');
setNotifyProvider(notifyAdapter);
```

### Step 5: Verify

- [x] All 5 ports export correctly from `@unisane/kernel`
- [x] `get*Provider()` throws helpful error if not configured
- [x] All modules build successfully with adapters

---

## Success Criteria

Phase 0 is complete when:

1. All 5 ports are defined in kernel
2. All 5 ports have module adapters
3. Bootstrap wires all ports before modules load
4. This works:

```typescript
import { getCreditsPort, getAuditPort, getUsagePort, getNotifyPort, getTenantsQueryPort } from '@unisane/kernel';

// These don't throw
const credits = getCreditsPort();
const audit = getAuditPort();
const usage = getUsagePort();
const notify = getNotifyPort();
const tenants = getTenantsQueryPort();
```

---

## Next Phase

After Phase 0 is complete, proceed to **[PHASE-1-FOUNDATION.md](./PHASE-1-FOUNDATION.md)** to fix critical foundation issues.

---

## Completion Notes

Phase 0 was completed on 2025-01-15. All ports and adapters have been created:

| Port | Interface | Module Adapter | Bootstrap Wired |
|------|-----------|----------------|-----------------|
| CreditsPort | `kernel/src/ports/credits.port.ts` | `credits/src/adapter.ts` | Yes |
| AuditPort | `kernel/src/ports/audit.port.ts` | `audit/src/adapter.ts` | Yes |
| UsagePort | `kernel/src/ports/usage.port.ts` | `usage/src/adapter.ts` | Yes |
| NotifyPort | `kernel/src/ports/notify.port.ts` | `notify/src/adapter.ts` | Yes |
| TenantsPort | `kernel/src/ports/tenants.port.ts` | `tenants/src/adapter.ts` | Yes |

The existing `@unisane/tenants-mongodb` adapter package has been superseded by the module's built-in `tenantsAdapter`.

---

> **Last Updated**: 2025-01-15
