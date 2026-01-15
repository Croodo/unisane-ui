# Kernel Ports Reference

> **For LLMs**: Complete inventory of all kernel ports. Load when working with cross-module communication.

---

## Overview

Ports are interfaces defined in kernel that allow modules to communicate without direct imports.

**Pattern**:
```typescript
// In your module
import { get*Port } from '@unisane/kernel';

const port = get*Port();
await port.method(args);
```

---

## Port Inventory

| Port | Module Owner | Status | Used By |
|------|--------------|--------|---------|
| FlagsPort | flags | ✅ Exists | ai, billing, all modules |
| BillingPort | billing | ✅ Exists | ai, tenants |
| SettingsPort | settings | ✅ Exists | webhooks, all modules |
| CreditsPort | credits | ⚠️ Phase 0 | ai, billing |
| AuditPort | audit | ⚠️ Phase 0 | all modules |
| UsagePort | usage | ⚠️ Phase 0 | billing, ai |
| NotifyPort | notify | ⚠️ Phase 0 | auth, billing |
| TenantsQueryPort | tenants | ⚠️ Phase 0 | billing, identity |

---

## Existing Ports

### FlagsPort

**Location**: `packages/foundation/kernel/src/ports/flags.port.ts`

```typescript
export interface FlagsPort {
  /**
   * Check if a feature flag is enabled for a scope
   */
  isEnabled(key: string, scopeId: string): Promise<boolean>;

  /**
   * Get all flags for a scope
   */
  getAllFlags(scopeId: string): Promise<Record<string, boolean>>;

  /**
   * Get flag value (for non-boolean flags)
   */
  getValue<T>(key: string, scopeId: string, defaultValue: T): Promise<T>;
}
```

**Usage**:
```typescript
import { getFlagsPort } from '@unisane/kernel';

const flags = getFlagsPort();
const enabled = await flags.isEnabled('feature.new-ui', scopeId);
```

---

### BillingPort

**Location**: `packages/foundation/kernel/src/ports/billing.port.ts`

```typescript
export interface BillingPort {
  /**
   * Get subscription status for a scope
   */
  getSubscriptionStatus(scopeId: string): Promise<{
    hasActiveSubscription: boolean;
    planId?: string;
    expiresAt?: Date;
  }>;

  /**
   * Create checkout session for subscription
   */
  createCheckoutSession(args: {
    scopeId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; url: string }>;

  /**
   * Create customer portal session
   */
  createPortalSession(args: {
    scopeId: string;
    returnUrl: string;
  }): Promise<{ id: string; url: string }>;

  /**
   * Cancel subscription
   */
  cancelSubscription(args: {
    scopeId: string;
    immediately?: boolean;
  }): Promise<void>;
}
```

**Usage**:
```typescript
import { getBillingPort } from '@unisane/kernel';

const billing = getBillingPort();
const status = await billing.getSubscriptionStatus(scopeId);
if (!status.hasActiveSubscription) {
  throw new NoActiveSubscriptionError();
}
```

---

### SettingsPort

**Location**: `packages/foundation/kernel/src/ports/settings.port.ts`

```typescript
export interface SettingsPort {
  /**
   * Get a typed setting value
   */
  get<T>(key: string, scopeId: string): Promise<T | null>;

  /**
   * Set a setting value
   */
  set<T>(key: string, scopeId: string, value: T): Promise<void>;

  /**
   * Get all settings for a scope
   */
  getAll(scopeId: string): Promise<Record<string, unknown>>;

  /**
   * Delete a setting
   */
  delete(key: string, scopeId: string): Promise<void>;
}
```

**Usage**:
```typescript
import { getSettingsPort } from '@unisane/kernel';

interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
}

const settings = getSettingsPort();
const config = await settings.get<WebhookConfig>('webhooks.config', scopeId);
```

---

## Ports to Create (Phase 0)

### CreditsPort

**Purpose**: Token/credit management for AI and metered features.

```typescript
export interface CreditsPort {
  consume(args: {
    scopeId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ remaining: number }>;

  grant(args: {
    scopeId: string;
    amount: number;
    reason: string;
    expiresAt?: Date;
  }): Promise<{ newBalance: number }>;

  getBalance(scopeId: string): Promise<{
    available: number;
    reserved: number;
    expiring: { amount: number; expiresAt: Date }[];
  }>;

  hasSufficient(scopeId: string, amount: number): Promise<boolean>;
}
```

---

### AuditPort

**Purpose**: Audit logging for compliance and debugging.

```typescript
export interface AuditEntry {
  action: string;
  actor: { type: 'user' | 'system' | 'api'; id: string };
  target: { type: string; id: string };
  changes?: { field: string; from: unknown; to: unknown }[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface AuditPort {
  log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void>;

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
```

---

### UsagePort

**Purpose**: Track and query usage metrics for billing and limits.

```typescript
export interface UsagePort {
  record(args: {
    scopeId: string;
    metric: string;
    value: number;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  getUsage(args: {
    scopeId: string;
    metric: string;
    from: Date;
    to: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
  }): Promise<{ period: string; value: number }[]>;

  getCurrentPeriodUsage(args: {
    scopeId: string;
    metric: string;
  }): Promise<{ used: number; limit: number | null }>;
}
```

---

### NotifyPort

**Purpose**: Send notifications via email, in-app, webhooks.

```typescript
export interface NotifyPort {
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

  sendInApp(args: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actions?: { label: string; url: string }[];
  }): Promise<{ notificationId: string }>;

  sendWebhook(args: {
    scopeId: string;
    event: string;
    payload: Record<string, unknown>;
  }): Promise<{ delivered: boolean; webhookId?: string }>;
}
```

---

### TenantsQueryPort

**Purpose**: Read-only tenant queries (no mutations).

```typescript
// Import SSOT types from kernel constants
import { UserStatus, SubscriptionStatus } from '@unisane/kernel';

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
  getById(tenantId: string): Promise<TenantView | null>;
  getByIds(tenantIds: string[]): Promise<Map<string, TenantView>>;
  isActive(tenantId: string): Promise<boolean>;
  getSubscriptionStatus(tenantId: string): Promise<{
    hasActiveSubscription: boolean;
    planId?: string;
    expiresAt?: Date;
  }>;
}
```

---

## Creating a New Port

See [PATTERNS.md](../PATTERNS.md#pattern-1-creating-a-new-port) for the complete pattern.

Quick checklist:
1. [ ] Define interface in `kernel/src/ports/{name}.port.ts`
2. [ ] Create getter/setter functions
3. [ ] Export from `kernel/src/ports/index.ts`
4. [ ] Re-export from `kernel/src/index.ts`
5. [ ] Create adapter in owning module
6. [ ] Wire in bootstrap

---

## Port Best Practices

### DO
- Keep ports focused (single responsibility)
- Use descriptive method names
- Include JSDoc comments
- Return typed results

### DON'T
- Put business logic in ports
- Return raw database types
- Include implementation details
- Make ports stateful

---

> **Last Updated**: 2025-01-15
