# Modules Reference

> **For LLMs**: Complete inventory of all modules. Load when working with module structure.

---

## Overview

Modules contain domain logic. They communicate through kernel ports and events.

**Rule**: Modules can ONLY import from `@unisane/kernel`.

```typescript
// ✅ Allowed
import { getFlagsPort, events } from '@unisane/kernel';

// ❌ Forbidden
import { something } from '@unisane/other-module';
```

---

## Module Inventory

| Module | Package | Dependencies | Status |
|--------|---------|--------------|--------|
| auth | `@unisane/auth` | kernel | ✅ |
| identity | `@unisane/identity` | kernel | ✅ |
| tenants | `@unisane/tenants` | kernel | ✅ |
| billing | `@unisane/billing` | kernel, ⚠️ flags | Needs fix |
| credits | `@unisane/credits` | kernel | ✅ |
| usage | `@unisane/usage` | kernel | ✅ |
| flags | `@unisane/flags` | kernel | ✅ |
| settings | `@unisane/settings` | kernel | ✅ |
| storage | `@unisane/storage` | kernel | ✅ |
| webhooks | `@unisane/webhooks` | kernel, ⚠️ settings | Needs fix |
| ai | `@unisane/ai` | kernel, ⚠️ flags, billing | Needs fix |
| notify | `@unisane/notify` | kernel | ✅ |
| audit | `@unisane/audit` | kernel | ✅ |
| support | `@unisane/support` | kernel | ✅ |
| admin | `@unisane/admin` | kernel | ✅ |

---

## Module Details

### auth

**Package**: `packages/modules/auth`

**Purpose**: Authentication (login, signup, sessions, OAuth)

**Domain**:
```
┌──────────────┐     ┌──────────────┐
│    Session   │     │    Token     │
├──────────────┤     ├──────────────┤
│ id           │     │ id           │
│ userId       │     │ userId       │
│ expiresAt    │     │ type         │
│ refreshToken │     │ expiresAt    │
└──────────────┘     └──────────────┘
```

**Service Functions**:
- `signup(email, password)` → User + Session
- `login(email, password)` → Session
- `logout(sessionId)` → void
- `refreshSession(refreshToken)` → Session
- `verifyEmail(token)` → void
- `resetPassword(email)` → void
- `oauthCallback(provider, code)` → Session

**Events Emitted**:
- `auth.login.success`
- `auth.login.failed`
- `auth.password.reset`

**Port Dependencies**: NotifyPort (for emails)

---

### identity

**Package**: `packages/modules/identity`

**Purpose**: User management (CRUD, profiles, roles)

**Domain**:
```
┌──────────────┐     ┌──────────────┐
│     User     │     │    Role      │
├──────────────┤     ├──────────────┤
│ id           │     │ id           │
│ email        │     │ name         │
│ name         │     │ permissions  │
│ tenantIds[]  │     │ tenantId     │
│ status       │     └──────────────┘
└──────────────┘
```

**Service Functions**:
- `createUser(data)` → User
- `updateUser(id, data)` → User
- `deleteUser(id)` → void
- `getUserById(id)` → User
- `getUsersByTenant(tenantId)` → User[]
- `assignRole(userId, roleId)` → void

**Events Emitted**:
- `user.created`
- `user.updated`
- `user.deleted`
- `user.verified`

---

### tenants

**Package**: `packages/modules/tenants`

**Purpose**: Multi-tenancy (workspaces, organizations)

**Domain**:
```
┌──────────────┐     ┌──────────────┐
│    Tenant    │     │   Invite     │
├──────────────┤     ├──────────────┤
│ id           │     │ id           │
│ name         │     │ email        │
│ slug         │     │ tenantId     │
│ ownerId      │     │ role         │
│ status       │     │ expiresAt    │
│ plan         │     └──────────────┘
└──────────────┘
```

**Service Functions**:
- `createTenant(data)` → Tenant
- `updateTenant(id, data)` → Tenant
- `deleteTenant(id)` → void
- `inviteMember(tenantId, email, role)` → Invite
- `acceptInvite(token)` → void
- `removeMember(tenantId, userId)` → void

**Events Emitted**:
- `tenant.created`
- `tenant.updated`
- `tenant.suspended`

**Provides Port**: TenantsQueryPort

---

### billing

**Package**: `packages/modules/billing`

**Purpose**: Subscriptions, payments, invoices

**Domain**:
```
┌──────────────┐     ┌──────────────┐
│ Subscription │     │   Invoice    │
├──────────────┤     ├──────────────┤
│ id           │     │ id           │
│ scopeId      │     │ subscriptionId│
│ planId       │     │ amount       │
│ status       │     │ status       │
│ provider     │     │ paidAt       │
└──────────────┘     └──────────────┘
```

**Service Functions**:
- `createCheckoutSession(scopeId, planId)` → Session
- `getSubscription(scopeId)` → Subscription
- `cancelSubscription(scopeId)` → void
- `handleWebhook(provider, payload)` → void

**Events Emitted**:
- `billing.subscription.created`
- `billing.subscription.canceled`
- `billing.subscription.renewed`
- `billing.payment.failed`

**Provides Port**: BillingPort

**Known Issues**: M-001 (imports from @unisane/flags)

---

### credits

**Package**: `packages/modules/credits`

**Purpose**: Token/credit management for metered features

**Domain**:
```
┌──────────────┐     ┌──────────────┐
│   Balance    │     │ Transaction  │
├──────────────┤     ├──────────────┤
│ scopeId      │     │ id           │
│ available    │     │ scopeId      │
│ reserved     │     │ amount       │
│ updatedAt    │     │ type         │
└──────────────┘     │ reason       │
                     └──────────────┘
```

**Service Functions**:
- `consume(scopeId, amount, reason)` → Balance
- `grant(scopeId, amount, reason)` → Balance
- `getBalance(scopeId)` → Balance
- `getTransactions(scopeId)` → Transaction[]

**Events Emitted**:
- `credits.consumed`
- `credits.granted`
- `credits.expired`

**Provides Port**: CreditsPort

---

### usage

**Package**: `packages/modules/usage`

**Purpose**: Track usage metrics for billing/limits

**Domain**:
```
┌──────────────┐
│ UsageRecord  │
├──────────────┤
│ scopeId      │
│ metric       │
│ value        │
│ timestamp    │
│ metadata     │
└──────────────┘
```

**Service Functions**:
- `record(scopeId, metric, value)` → void
- `getUsage(scopeId, metric, from, to)` → Aggregates
- `getCurrentPeriod(scopeId, metric)` → { used, limit }

**Provides Port**: UsagePort

---

### flags

**Package**: `packages/modules/flags`

**Purpose**: Feature flags and A/B testing

**Domain**:
```
┌──────────────┐     ┌──────────────┐
│     Flag     │     │   Override   │
├──────────────┤     ├──────────────┤
│ key          │     │ flagKey      │
│ default      │     │ scopeId      │
│ rules[]      │     │ value        │
└──────────────┘     └──────────────┘
```

**Service Functions**:
- `isEnabled(key, scopeId)` → boolean
- `getValue(key, scopeId)` → any
- `getAllFlags(scopeId)` → Record<string, any>
- `setOverride(key, scopeId, value)` → void

**Events Emitted**:
- `flags.override.set`
- `flags.override.removed`

**Provides Port**: FlagsPort

---

### settings

**Package**: `packages/modules/settings`

**Purpose**: Configuration storage per scope

**Service Functions**:
- `get(key, scopeId)` → any
- `set(key, scopeId, value)` → void
- `getAll(scopeId)` → Record<string, any>
- `delete(key, scopeId)` → void

**Provides Port**: SettingsPort

---

### storage

**Package**: `packages/modules/storage`

**Purpose**: File storage abstraction

**Service Functions**:
- `upload(file, path)` → FileInfo
- `download(path)` → Buffer
- `delete(path)` → void
- `getSignedUrl(path, expiresIn)` → string
- `listFiles(prefix)` → FileInfo[]

**Events Emitted**:
- `storage.file.uploaded`
- `storage.file.deleted`

---

### webhooks

**Package**: `packages/modules/webhooks`

**Purpose**: Outbound webhook delivery

**Domain**:
```
┌──────────────┐     ┌──────────────┐
│   Webhook    │     │   Delivery   │
├──────────────┤     ├──────────────┤
│ id           │     │ id           │
│ scopeId      │     │ webhookId    │
│ url          │     │ event        │
│ events[]     │     │ status       │
│ secret       │     │ response     │
└──────────────┘     └──────────────┘
```

**Service Functions**:
- `createWebhook(scopeId, url, events)` → Webhook
- `deleteWebhook(id)` → void
- `deliver(scopeId, event, payload)` → Delivery
- `getDeliveries(webhookId)` → Delivery[]

**Known Issues**: M-001 (imports from @unisane/settings)

---

### ai

**Package**: `packages/modules/ai`

**Purpose**: AI generation features

**Service Functions**:
- `generate(prompt, options)` → GenerationResult
- `generateStream(prompt, options)` → AsyncIterable
- `embeddings(text)` → number[]

**Known Issues**: M-001 (imports from @unisane/flags, @unisane/billing)

---

### notify

**Package**: `packages/modules/notify`

**Purpose**: Notification delivery (email, in-app, push)

**Service Functions**:
- `sendEmail(to, template, data)` → MessageId
- `sendInApp(userId, notification)` → NotificationId
- `sendPush(userId, message)` → void
- `getNotifications(userId)` → Notification[]

**Provides Port**: NotifyPort

---

### audit

**Package**: `packages/modules/audit`

**Purpose**: Audit logging for compliance

**Service Functions**:
- `log(entry)` → void
- `query(scopeId, filters)` → AuditEntry[]

**Provides Port**: AuditPort

---

### support

**Package**: `packages/modules/support`

**Purpose**: Help desk / support tickets

**Service Functions**:
- `createTicket(scopeId, subject, body)` → Ticket
- `replyToTicket(ticketId, message)` → void
- `closeTicket(ticketId)` → void
- `getTickets(scopeId)` → Ticket[]

---

### admin

**Package**: `packages/modules/admin`

**Purpose**: Admin dashboard features

**Service Functions**:
- `getStats()` → AdminStats
- `getUsers(filters)` → User[]
- `getTenants(filters)` → Tenant[]
- `impersonate(userId)` → Session

---

## Module Structure

Standard module structure:

```
packages/modules/{name}/
├── src/
│   ├── index.ts           # Public exports
│   ├── service/           # Business logic
│   │   ├── {feature}.ts
│   │   └── {feature}.test.ts
│   ├── domain/            # Domain types
│   │   ├── types.ts
│   │   └── ports/         # Repository interfaces
│   ├── data/              # Repository implementations
│   │   └── {entity}.repository.ts
│   └── adapter.ts         # Port adapter (if provides port)
├── package.json
└── tsconfig.json
```

---

## Module Compliance Checklist

For each module, verify:

- [ ] Only imports from `@unisane/kernel`
- [ ] Uses ports for cross-module calls
- [ ] Emits only its own events
- [ ] Has clear service layer
- [ ] Implements port adapter (if applicable)
- [ ] Has tests for service functions

---

> **Last Updated**: 2025-01-15
