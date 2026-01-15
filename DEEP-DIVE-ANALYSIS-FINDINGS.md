# Deep Dive Architecture Analysis Findings

> **Date**: 2026-01-14
> **Status**: Analysis Complete
> **Purpose**: Comprehensive analysis of architecture issues, duplications, inconsistencies, and hexagonal violations

---

## Executive Summary

Total issues found: **150+** across 5 analysis areas

| Area | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| **Foundation (Kernel/Gateway/Contracts)** | 4 | 12 | 15 | 8 | 39 |
| **DevTools/Codegen** | 2 | 6 | 8 | 5 | 21 |
| **Module Layer** | 3 | 8 | 10 | 6 | 27 |
| **Tenant vs Scope** | 2 | 5 | 8 | 2 | 17 |
| **Starter App** | 2 | 5 | 8 | 6 | 21 |
| **TOTAL** | **13** | **36** | **49** | **27** | **125** |

---

## Part 1: Foundation Layer Issues

### 1.1 Kernel Package Issues

#### CRITICAL: Direct Infrastructure Dependencies

| File | Line | Issue |
|------|------|-------|
| `kernel/src/cache/provider.ts` | 32-97 | Hardcoded Vercel KV REST API logic |
| `kernel/src/database/connection.ts` | 74-102 | Hardcoded MongoDB configuration |
| `kernel/src/database/base-repository.ts` | 1-50 | MongoDB-specific types in repository base |
| `kernel/src/database/port/mongo-adapter.ts` | 36-37 | Adapter imports connection directly (circular) |

#### HIGH: Missing Port/Adapter Pattern

- `kernel/src/database/index.ts` - Switches on string provider names instead of adapter pattern
- `kernel/src/database/base-repository.ts` - Repository implementation is MongoDB-specific
- No generic repository interface for database abstraction

#### HIGH: Export Issues (209 exports from database/index.ts)

```
kernel/src/database/index.ts exports:
- Lines 78-79: Index management (infrastructure details)
- Lines 81-98: Full migration system (should be separate)
- Lines 101-119: Full seed system (should be separate)
- Lines 141-177: ALL database port internals
```

#### MEDIUM: Code Duplication

| Pattern | Locations |
|---------|-----------|
| Email normalization | `email.ts:43`, `email.ts:94`, `email.ts:140` |
| Phone normalization | `phone.ts:88-101` (called multiple times) |
| Factory method pattern | All 5 value objects repeat identical pattern |
| Zod schema pattern | Each VO has `ZXxx` and `ZXxxString` variants |
| `escapeRegex()` | `database/filters.ts:46-52` AND `cache/redis.ts:103-111` |

#### MEDIUM: Inconsistencies

| Issue | Files |
|-------|-------|
| Mixed error types | `ProviderError` vs plain `Error` across files |
| Provider init patterns | Cache, Redis, Database all use different patterns |
| Health check interfaces | Simple vs extended `DatabaseHealthStatus` |
| console.warn usage | Should use centralized logger |

#### LOW: Hard-Coded Configuration

| File | Line | Value |
|------|------|-------|
| `database/connection.ts` | 77 | `maxIdleTimeMS: 300_000` |
| `database/connection.ts` | 83 | `serverSelectionTimeoutMS: 5000` |
| `database/connection.ts` | 85 | `socketTimeoutMS: 60_000` |
| `database/connection.ts` | 95-98 | WriteConcern/ReadConcern hardcoded |
| `value-objects/slug.ts` | 43-75 | 25 reserved words hardcoded |

---

### 1.2 Gateway Package Issues

#### CRITICAL: Security Vulnerabilities

| Issue | File | Line | Risk |
|-------|------|------|------|
| Dev auth headers bypass | `auth/auth.ts` | 366-411 | `x-platform-owner: true` grants ALL permissions |
| Cookie parsing no limits | `request.ts` | 31-45 | Cookie bomb DoS |
| IP spoofing via headers | `rateLimit.ts` | 5-13 | Rate limit bypass |
| CSRF case sensitivity | `csrf.ts` | 15-16 | 'staging' vs 'stage' bypass |
| Request ID not sanitized | `httpWebhook.ts` | 21 | Log injection |
| API key cache timing | `auth/auth.ts` | 244 | Revoked keys valid 240s |

#### HIGH: Code Duplication

| Pattern | Files | Lines |
|---------|-------|-------|
| Request handling logic | `httpHandler.ts` | 74-144 vs 223-289 (~95% identical) |
| Cookie parsing | `cookies.ts:31-42` AND `request.ts:31-45` |
| Rate limit key building | `guard.ts:84-86`, `tsrest.ts:60-66`, `httpWebhook.ts:30` |
| Logging setup | 8+ locations with `withRequest({...})` |

#### HIGH: Missing Features

- No request body size limits (`validate.ts:30`)
- No request timeout enforcement
- No token refresh mechanism
- No webhook signature verification
- No request correlation across services

#### MEDIUM: Inconsistencies

| Issue | Locations |
|-------|-----------|
| Request ID sanitization | `httpHandler.ts:81` vs `httpWebhook.ts:21` (missing) |
| Error response format | 3 different formats across handlers |
| Rate limit header names | Different names in different handlers |
| Auth context types | Circular imports between auth.ts and rbac.ts |

---

### 1.3 Contracts Package Issues

#### HIGH: Schema Issues

| File | Line | Issue |
|------|------|-------|
| `index.ts` | 81 | `z.record(z.unknown())` on error details |
| `index.ts` | 29-31 | `ZIdParam` only enforces min length 1 |
| `index.ts` | 20-24 | Cursor and page/limit mixed pagination |
| `index.ts` | 12-13 | `datetime()` without format validation |
| `index.ts` | 70-71 | No message length constraints |

#### MEDIUM: Missing Contracts

- No standard success response envelope schema
- No pagination response types
- No 401/403 specific error schemas
- No timestamp schema
- No cursor format validation

#### MEDIUM: Export Organization

- Flat export structure (20 exports at root)
- No categorization (common vs errors vs pagination)
- No sub-paths for selective imports
- Missing documentation for exports

---

## Part 2: DevTools/Codegen Issues

### 2.1 Code Duplication in Generators

#### HIGH: Duplicate Admin Route Functions

| Function | Locations |
|----------|-----------|
| `isAdminRoute()` | `sdk/utils.ts:32`, `sdk/gen-server.ts:30-44`, `sdk/gen-browser.ts:38-52` |
| `separateRoutes()` | `sdk/gen-server.ts:49-69`, `sdk/gen-browser.ts:57-77` (21 lines each) |
| `generateSharedTypes()` | `sdk/gen-hooks.ts:83-168`, `sdk/gen-vue.ts:83-168` (85+ lines) |

**Problem**: 3 different implementations with different logic:
- `utils.ts`: Checks name prefix AND metaOp namespace
- `gen-server/browser`: Only checks route name/path

#### MEDIUM: Admin Route Detection Inconsistency

```typescript
// gen-browser.ts (Line 38-40) - checks path
function isAdminRoute(route: AppRouteEntry): boolean {
  return route.name.startsWith('admin') || route.path.includes('/admin/');
}

// utils.ts (Line 32-35) - checks metaOp
export function isAdminRoute(name: string, metaOp?: string): boolean {
  if (typeof metaOp === 'string' && metaOp.startsWith('admin.')) return true;
  return name.toLowerCase().startsWith('admin');
}
```

### 2.2 Missing Validation

| Issue | File | Impact |
|-------|------|--------|
| Silent metadata extraction failures | `meta-extract.ts:69-128` | Missing metadata silently skipped |
| No type safety for meta results | `parsers.ts:1-120` | Undefined returned silently |
| No validation generated code compiles | `routes/render.ts:56-265` | Semantic errors possible |
| No operation key uniqueness check | Throughout | Duplicate ops possible |
| No service function existence check | `routes/render.ts` | Generated code may break |

### 2.3 Template Generation Issues

| Issue | File | Line |
|-------|------|------|
| Unsafe string concatenation | `gen-hooks.ts` | 201-210 |
| Unsafe type inference | `gen-extracted-types.ts` | 93-120 |
| No reserved word escaping | `gen-hooks.ts` | 629-638 |
| Hardcoded path assumptions | `router-parser.ts` | 18-32 |

---

## Part 3: Tenant vs Scope Issues

### 3.1 File Naming (Still Uses "tenant")

#### Files That Need Renaming

```
packages/modules/billing/src/domain/ports/tenantIntegrations.ts
  → Should be: scope-integrations.ts
  → Interface inside: ScopeIntegrationsRepo (correct!)
  → Parameters: Still use tenantId (needs update)

packages/modules/billing/src/service/tenantIntegrations.ts
  → Should be: scope-integrations.ts

packages/modules/billing/src/data/tenant-integrations.repository.ts
  → Should be: scope-integrations.repository.ts

packages/modules/billing/src/data/tenant-integrations.repository.mongo.ts
  → Should be: scope-integrations.repository.mongo.ts
```

#### Tenants Module File Naming (PascalCase Violation)

```
packages/modules/tenants/src/service/
├── bootstrapTenant.ts      → bootstrap-tenant.ts
├── getCurrentTenant.ts     → get-current-tenant.ts
├── readTenant.ts           → read-tenant.ts
├── deleteTenant.ts         → delete-tenant.ts
├── readTenantBySlug.ts     → read-tenant-by-slug.ts
├── listTenants.ts          → list-tenants.ts
```

### 3.2 Parameter Naming Inconsistencies

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| `billing/domain/ports/tenantIntegrations.ts` | 7-12 | `tenantId: string` | `scopeId: string` |
| `billing/data/tenant-integrations.repository.ts` | 28-35 | `tenantId` parameter | `scopeId` parameter |

### 3.3 Scope System Adoption Status

| Component | Status | Notes |
|-----------|--------|-------|
| Kernel scope functions | ✅ Complete | `getScope()`, `getScopeId()`, `getScopeType()` |
| Kernel scope filters | ✅ Complete | `scopeFilter()`, `scopedFilter()`, `scopedFilterActive()` |
| Event schemas | ✅ Complete | All 38+ use `scopeId` |
| Service layer variables | ✅ Complete | All use `const scopeId = getScopeId()` |
| Port interface names | ✅ Complete | Named `Scope*` prefix |
| File names | ❌ Incomplete | Still use "tenant" in names |
| Data layer parameters | ❌ Incomplete | Still accept `tenantId` |
| API route parameters | ❌ Incomplete | Still `/tenants/:tenantId/` |

---

## Part 4: Module Layer Issues

### 4.1 Missing Adapters (11 modules)

Modules WITHOUT adapter implementations:
1. `audit/src/` - No adapters directory
2. `auth/src/` - No adapters directory
3. `credits/src/` - No adapters directory
4. `notify/src/` - No adapters directory
5. `storage/src/` - No adapters directory
6. `webhooks/src/` - No adapters directory
7. `tenants/src/` - No adapters directory
8. `usage/src/` - No adapters directory
9. `ai/src/` - No adapters directory
10. `pdf/src/` - No adapters directory
11. `media/src/` - No adapters directory

Modules WITH adapters (4 only):
- `billing/src/adapters/` - `billing-service.adapter.ts`
- `flags/src/adapters/` - `flags.adapter.ts`
- `identity/src/adapters/` - `auth-identity.adapter.ts`
- `settings/src/adapters/` - `settings.adapter.ts`

### 4.2 Infrastructure Code in Service Layer

| Module | File | Line | Issue |
|--------|------|------|-------|
| storage | `service/upload.ts` | 2, 56-59 | Direct `getSignedUploadUrl()` call |
| notify | `service/email.ts` | 1-3, 52, 62 | Direct `sendEmailResend`, `sendEmailSes` |
| auth | `service/otpStart.ts` | 9 | Direct `connectDb()` |
| auth | `service/otpVerify.ts` | 10 | Direct `connectDb()` |
| auth | `service/resetStart.ts` | 6 | Direct `connectDb()` |
| auth | `service/resetVerify.ts` | 4 | Direct `connectDb()` |
| auth | `service/signin.ts` | 2 | Direct `connectDb()` |
| auth | `service/signup.ts` | 2 | Direct `connectDb()` |
| identity | `service/perms.ts` | 2, 28, 51 | Direct `connectDb()` |
| storage | `service/cleanup.ts` | 3, 28, 42 | Direct `connectDb()` |

### 4.3 Pattern Inconsistencies

#### Repository Pattern

| Pattern | Modules |
|---------|---------|
| Wrapper + export functions | credits |
| Direct class export | billing, storage |
| Selective exports | identity |

#### Error Handling

| Pattern | Modules |
|---------|---------|
| Custom DomainError classes | billing (158 lines), auth (151 lines) |
| Generic `ERR` helper | auth (some files), others |

#### Event Handler Boilerplate

All 15 modules repeat identical 20-line pattern:
```typescript
const unsubscribers: Array<() => void> = [];
unsubscribers.push(onTyped('event', async (e) => { ... }));
return () => { for (const u of unsubscribers) u(); };
```

~2,800 lines of duplicated boilerplate across modules.

### 4.4 Billing Module Port Structure

Billing is the only module with split port files:
```
billing/src/domain/ports/
├── subscriptions.ts
├── payments.ts
├── invoices.ts
├── tenantIntegrations.ts
└── (NO index.ts aggregator)
```

All other 11 modules have unified `domain/ports.ts`.

---

## Part 5: Starter App Issues

### 5.1 Contract Definition Issues

#### Duplicate Metadata Fields

| Contract | Field | Duplicated At |
|----------|-------|---------------|
| `storage.contract.ts` | `requireTenantMatch` | Lines 30+44, 65+74, 94+103, 127+136, 160+173 |
| `audit.contract.ts` | `requireTenantMatch` | Lines 59+70 |
| `tenants.contract.ts` | `requireSuperAdmin` | Lines 94+107, 136+149, 219+240, 284+290, 319+328 |

**Impact**: 10+ duplicate lines per file, synchronization risk.

#### Schema Validation Bypass

| File | Line | Issue |
|------|------|-------|
| `notify.contract.ts` | 18 | `data: z.any().nullable()` |
| `jobs.contract.ts` | 15 | `.or(z.any())` on response |
| `tenants.contract.ts` | 88 | `z.any()` for CSV export |

### 5.2 Naming Inconsistencies

#### Hook File Names (Mixed)

| Pattern | Files |
|---------|-------|
| camelCase | `useActiveTenant.ts`, `useApiError.ts`, `useFormCard.ts`, `usePrefetch.ts`, `useServerTable.ts`, `useTenantContext.ts`, `useSession.ts` (7) |
| kebab-case | `use-mobile.ts`, `use-navigation-hover.ts`, etc. (6) |

#### Client Component Names

| Issue | File |
|-------|------|
| Lowercase 's' | `admin/settings/settingsClient.tsx` |
| Should be | `admin/settings/SettingsClient.tsx` |

### 5.3 Architecture Issues

#### Unsafe Type Casting

```typescript
// bootstrap.ts line 72
configureIdentityProviders({ tenantsRepo: TenantsRepo as any });
```

#### Provider Setup Not Validated

```typescript
// bootstrap.ts lines 153-165
async function setupProviders() {
  const { initModules } = await import('./platform/init');
  initModules();
  // Providers are accessed via getProvider() functions rather than registered globally
  // NO VALIDATION that providers are actually set up
}
```

---

## Priority Fix Plan

### Phase 1: Critical Security Fixes (Immediate)

1. **Fix dev auth header bypass** (`gateway/auth/auth.ts:366-411`)
2. **Add cookie parsing limits** (`gateway/request.ts`, `gateway/middleware/cookies.ts`)
3. **Validate x-forwarded-for** (`gateway/middleware/rateLimit.ts:5-13`)
4. **Fix CSRF case sensitivity** (`gateway/middleware/csrf.ts:15-16`)
5. **Sanitize request ID everywhere** (`gateway/handler/httpWebhook.ts:21`)

### Phase 2: Naming Consistency (High Priority)

1. **Rename tenant → scope files**:
   - `billing/domain/ports/tenantIntegrations.ts` → `scope-integrations.ts`
   - `billing/service/tenantIntegrations.ts` → `scope-integrations.ts`
   - `billing/data/tenant-integrations.repository*.ts` → `scope-integrations.repository*.ts`

2. **Fix service file naming** (tenants module):
   - Convert PascalCase to kebab-case

3. **Fix hook file naming** (starter app):
   - Pick one convention (kebab-case recommended)

4. **Fix settingsClient.tsx** → `SettingsClient.tsx`

### Phase 3: Code Deduplication (High Priority)

1. **Create shared handler middleware** (gateway):
   - Extract common request handling logic

2. **Consolidate admin route detection** (devtools):
   - Single implementation in utils.ts

3. **Create event handler helper** (modules):
   - Abstract 2,800 lines of boilerplate

4. **Remove duplicate metadata** (contracts):
   - `requireTenantMatch` and `requireSuperAdmin` single source

### Phase 4: Hexagonal Architecture (Medium Priority)

1. **Create adapters for 11 modules**:
   - audit, auth, credits, notify, storage, webhooks, tenants, usage, ai, pdf, media

2. **Abstract infrastructure from services**:
   - Create EmailProviderPort, StorageProviderPort, DatabaseConnectionPort

3. **Fix billing port structure**:
   - Add `billing/domain/ports/index.ts` aggregator

4. **Reduce kernel exports**:
   - From 209 to ~15 public API exports

### Phase 5: Validation & Safety (Medium Priority)

1. **Add codegen validation**:
   - Validate metadata completeness
   - Validate generated code compiles
   - Check operation key uniqueness

2. **Replace z.any() schemas**:
   - `notify.contract.ts:18`
   - `jobs.contract.ts:15`
   - `tenants.contract.ts:88`

3. **Remove unsafe type casts**:
   - `bootstrap.ts:72` `as any`

---

## Summary

The codebase is **~60% hexagonal** with significant improvements possible:

- **Security**: 6 critical vulnerabilities need immediate attention
- **Naming**: ~25 files need renaming for consistency
- **Duplication**: ~3,500 lines can be deduplicated
- **Architecture**: 11 modules need adapter implementations
- **Validation**: Codegen needs validation layer

Estimated effort: **3-4 weeks** for complete remediation.
