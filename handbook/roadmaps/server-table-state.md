# Server Table State Implementation Roadmap

> **Status**: Planning
> **Created**: 2026-01-09
> **Last Updated**: 2026-01-09
> **Owner**: Engineering Team

> **IMPORTANT:** When completing any phase, update [implementation-status.md](../architecture/implementation-status.md) and follow the [Phase Completion Protocol](./MASTER-ROADMAP.md#phase-completion-protocol).

## Executive Summary

This document outlines the implementation plan for a unified table state management system in saaskit. The goal is to create a reusable, maintainable, and scalable pattern for all data tables that:

1. Keeps `@unisane/data-table` package independent (no Next.js dependencies)
2. Provides **two approaches** for different use cases:
   - **Server-first**: URL as SSOT, server-side data fetching (recommended for admin/SEO pages)
   - **Client-first**: React Query + SDK hooks (for highly interactive pages)
3. Updates SDK generators to support both patterns with page persistence in URL
4. Follows Single Source of Truth (SSOT) principle

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Design](#architecture-design)
3. [SDK Generator Architecture](#sdk-generator-architecture)
4. [SDK Output Quality Standards](#sdk-output-quality-standards)
5. [Implementation Phases](#implementation-phases)
6. [API Reference](#api-reference)
7. [Decision Matrix](#decision-matrix)
8. [Success Metrics](#success-metrics)
9. [Risks & Mitigations](#risks--mitigations)

---

## Problem Statement

### Current State

Two conflicting patterns exist in saaskit for data tables:

| Pattern | Example | Pros | Cons |
|---------|---------|------|------|
| **Manual (Server-first)** | `UsersClient.tsx` | Fast initial load, SEO, URL shareable | 150+ lines boilerplate, not reusable |
| **SDK Hooks (Client-first)** | `TenantsClient.tsx` | Less boilerplate, instant navigation | Page lost on refresh, double data loading |

### Issues

1. **No SSOT**: URL state vs React state conflict
2. **Not DRY**: Same patterns duplicated across pages
3. **Package coupling risk**: data-table could become Next.js dependent
4. **Inconsistent UX**: Different behaviors across pages
5. **Maintenance burden**: Bug fixes needed in multiple places
6. **SDK Generator Gap**: Generated hooks don't persist page to URL

---

## Architecture Design

### Package Separation Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                    @unisane/data-table                          │
│  ─────────────────────────────────────────────────────────────  │
│  STANDALONE - Framework agnostic                                │
│  - DataTable component                                          │
│  - Types (Column, CursorPagination, FilterState, etc.)          │
│  - Internal hooks (useSelection, useSort, usePagination)        │
│  - useRemoteDataTable (generic client-side adapter)             │
│  - NO Next.js dependencies                                      │
│  - NO saaskit dependencies                                      │
│  - Works with React, Vue adapters, or vanilla JS                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Uses (one-way dependency)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    @unisane/gateway                             │
│  ─────────────────────────────────────────────────────────────  │
│  SDK GENERATOR SOURCE                                           │
│  - AdminListConfig registry (source of truth)                   │
│  - Field registries (metadata for columns)                      │
│  - Filter mappers                                               │
│  - Generates: hooks, types, clients                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Generates
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         saaskit                                  │
│  ─────────────────────────────────────────────────────────────  │
│  APP-LEVEL - Next.js specific                                   │
│  - Generated SDK hooks (useAdminListParams, etc.)               │
│  - useServerTable (NEW - for server-first pattern)              │
│  - Page components (Server + Client)                            │
│  - Can use @unisane/data-table OR ag-grid OR any other grid     │
└─────────────────────────────────────────────────────────────────┘
```

### Two Supported Patterns

#### Pattern A: Server-First (Recommended for Admin Pages)

```
┌──────────────────────────────────────────────────────────────────┐
│                         URL (SSOT)                                │
│  ?sort=-createdAt&q=search&limit=25&cursor=abc123&page=2         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Parse params
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              Server Component (page.tsx)                          │
│  - Parse URL params                                               │
│  - Fetch data from API (server-side)                              │
│  - Pass data + state as props                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Props (data + state)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              Client Component (*Client.tsx)                       │
│  - useServerTable hook (URL updates)                               │
│  - Render DataTable with data from props                          │
│  - NO client-side data fetching                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Best for**: Admin pages, SEO-important pages, shareable URLs, first-load performance

#### Pattern B: Client-First (For Interactive Pages)

```
┌──────────────────────────────────────────────────────────────────┐
│                    URL + React State                              │
│  URL: ?sort=-createdAt&q=search&page=2                           │
│  State: { data, isLoading, isFetching }                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Read URL + trigger query
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              Client Component (*Client.tsx)                       │
│  - useAdminListParams hook (URL state)                            │
│  - hooks.entity.list() (React Query)                              │
│  - Instant cache-based navigation                                 │
│  - Background refetching                                          │
└──────────────────────────────────────────────────────────────────┘
```

**Best for**: Highly interactive dashboards, real-time updates, offline-first apps

---

## SDK Generator Architecture

### Current Generator Structure

```
packages/devtools/src/generators/sdk/
├── gen-hooks.ts              # React Query hooks
├── gen-browser.ts            # Browser client
├── gen-server.ts             # Node.js client
├── gen-extracted-types.ts    # Standalone types
├── gen-types.ts              # Type definitions
├── gen-zod.ts                # Zod schemas
├── router-parser.ts          # Router structure parser
├── utils.ts                  # Helper utilities
└── index.ts                  # Generator exports

packages/gateway/src/registry/
├── admin.lists.ts            # AdminListConfig[] (SOURCE OF TRUTH)
├── users.admin.fields.ts     # User field metadata
└── tenants.admin.fields.ts   # Tenant field metadata

starters/saaskit/src/sdk/hooks/generated/
├── useAdminListParams.ts     # Base list params hook (GENERATED)
├── admin-list-params.ts      # Domain-specific wrappers (GENERATED)
├── keys.ts                   # React Query key factories
└── domains/                  # Per-domain hooks
```

### Generator Input → Output Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   INPUT: AdminListConfig                         │
│  ─────────────────────────────────────────────────────────────  │
│  {                                                               │
│    id: "admin.users",                                            │
│    path: "admin.users",                                          │
│    hookName: "useAdminUsersListParams",                          │
│    defaultSort: "-updatedAt",                                    │
│    defaultLimit: 25,                                             │
│    fieldsRegistry: usersAdminFields,                             │
│    mapFilters: (filters, search) => ({ ... }),                   │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ gen-admin-grid-registries.ts
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OUTPUT: Generated Files                        │
│  ─────────────────────────────────────────────────────────────  │
│  1. useAdminListParams.ts     (base hook with URL state)         │
│  2. admin-list-params.ts      (domain wrappers)                  │
│  3. admin.users.grid.ts       (grid registry)                    │
│  4. admin.users.fields.gen.ts (field definitions)                │
└─────────────────────────────────────────────────────────────────┘
```

### What Needs to Change in SDK Generator

#### Current Issue: pageIndex in React State Only

```typescript
// useAdminListParams.ts (CURRENT - PROBLEMATIC)
const [pageIndex, setPageIndex] = useState<number>(1);  // ❌ Lost on refresh
```

#### Solution: pageIndex in URL

```typescript
// useAdminListParams.ts (UPDATED)
const pageFromUrl = Number(sp.get("page")) || 1;
const [pageIndex, setPageIndex] = useState<number>(pageFromUrl);

// Sync with URL
useEffect(() => {
  setPageIndex(pageFromUrl);
}, [pageFromUrl]);

// Update URL when page changes
const setPageIndexWithUrl = (page: number) => {
  setPageIndex(page);
  updateUrl((url) => {
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");
  });
};
```

---

## SDK Output Quality Standards

### Current Issues in Generated SDK

The current SDK generator produces code with several quality issues that need to be addressed:

#### 1. Naming Convention Issues

| Current | Proposed | Reason |
|---------|----------|--------|
| `useAdminListParams` | `useAdminList` | "Params" suffix is redundant |
| `useAdminUsersListParams` | `useAdminUserList` | Admin-first, singular entity |
| `useAdminTenantsListParams` | `useAdminTenantList` | Consistent with above |
| `webhooksHooks` | `webhooks` | Avoids stutter in `hooks.webhooks` |

#### 2. Type Safety Issues

```typescript
// CURRENT (problematic)
// @ts-nocheck  ← Hides all type errors
export function useAdminUserList(arg1?: unknown) {  // ← Loses type safety

// PROPOSED
// No @ts-nocheck - fix actual type issues
export function useAdminUserList<TFilters extends AdminUserFilters>(
  options?: UseAdminUserListOptions<TFilters>
) {
```

#### 3. Code Duplication

Currently, `useAdminTenantsListParams` and `useAdminUsersListParams` have 100+ lines of duplicated code. This should be:
- Base hook: Generic implementation (1 file)
- Domain wrappers: Thin wrappers with defaults (few lines each)

#### 4. File Structure Issues

```
# CURRENT STRUCTURE
hooks/generated/
├── useAdminListParams.ts     # Base hook (good)
├── admin-list-params.ts      # All wrappers in one file (messy)
├── domains/
│   ├── users.hooks.ts        # @ts-nocheck, unknown types
│   └── tenants.hooks.ts
└── keys.ts

# PROPOSED STRUCTURE
hooks/generated/
├── base/
│   ├── useAdminList.ts       # Base hook (renamed)
│   └── types.ts              # Shared types
├── admin/
│   ├── users/
│   │   ├── useAdminUserList.ts      # Thin wrapper
│   │   ├── adminUserQueries.ts      # React Query hooks
│   │   └── types.ts                 # Domain types
│   ├── tenants/
│   │   ├── useAdminTenantList.ts
│   │   ├── adminTenantQueries.ts
│   │   └── types.ts
│   └── index.ts              # Barrel export
├── keys.ts                   # Query key factories
└── index.ts                  # Public API
```

### Naming Convention Rules

#### Hook Names

| Pattern | Example | Applies To |
|---------|---------|------------|
| `use{Domain}{Entity}{Action}` | `useAdminUserList` | Admin domain, User entity, List action |
| `use{Entity}{Action}` | `useTenantList` | Current tenant scope |
| No trailing "Params" | `useAdminList` not `useAdminListParams` | All hooks |
| Singular entity | `useAdminUser` not `useAdminUsers` | Entity references |

#### Query Key Names

```typescript
// Pattern: {domain}.{entity}.{action}
export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (params: ListParams) => [...adminUserKeys.lists(), params] as const,
  details: () => [...adminUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
};
```

#### Type Names

| Pattern | Example |
|---------|---------|
| `{Entity}ListItem` | `AdminUserListItem` |
| `{Entity}Detail` | `AdminUserDetail` |
| `{Entity}Filters` | `AdminUserFilters` |
| `Use{Hook}Options` | `UseAdminUserListOptions` |
| `Use{Hook}Return` | `UseAdminUserListReturn` |

### Code Quality Rules

1. **No `@ts-nocheck`**: Fix actual type issues instead of suppressing
2. **No `any` types**: Use proper generics or `unknown` with type guards
3. **No `unknown` without guards**: If using `unknown`, provide type narrowing
4. **Single Responsibility**: Each file should have one purpose
5. **DRY Principle**: Extract shared logic to base hooks/utilities
6. **Explicit Exports**: Use named exports, avoid default exports in generated code
7. **JSDoc Comments**: Document public APIs with examples

---

## Implementation Phases

### Phase 0: SDK Generator Updates (CRITICAL - DO FIRST)

**Goal**: Update SDK generators to support page persistence, improve naming conventions, type safety, and optimize client code splitting.

**Location**:
- `packages/devtools/src/generators/sdk/`
- `starters/saaskit/src/sdk/hooks/generated/`

#### Checklist

##### 0.A - Page Persistence in URL

- [ ] **0.A.1** Update `useAdminListParams.ts` generator template
  - [ ] Read `page` from URL on init
  - [ ] Sync `pageIndex` state with URL param
  - [ ] Add `setPageIndexWithUrl` that updates URL
  - [ ] Clean URL when page is 1 (remove param)

- [ ] **0.A.2** Update `admin-list-params.ts` generator template
  - [ ] Update `buildCursorPagination.onNext` to set page in URL
  - [ ] Update `buildCursorPagination.onPrev` to set page in URL
  - [ ] Add URL cleanup effect for page 1

- [ ] **0.A.3** Update `AdminListConfig` type (if needed)
  - [ ] Add `persistPageToUrl?: boolean` option (default: true)
  - [ ] Document the option

##### 0.B - Naming Convention Fixes

- [ ] **0.B.1** Rename hooks (remove "Params" suffix)
  - [ ] `useAdminListParams` → `useAdminList`
  - [ ] `useAdminUsersListParams` → `useAdminUserList`
  - [ ] `useAdminTenantsListParams` → `useAdminTenantList`
  - [ ] Update all imports in saaskit

- [ ] **0.B.2** Fix entity naming (singular, domain-first)
  - [ ] Use `useAdminUser` not `useAdminUsers`
  - [ ] Use `adminUserKeys` not `usersKeys`

- [ ] **0.B.3** Update file structure
  ```
  hooks/generated/
  ├── base/
  │   ├── useAdminList.ts
  │   └── types.ts
  ├── admin/
  │   ├── users/
  │   │   ├── useAdminUserList.ts
  │   │   ├── queries.ts
  │   │   └── types.ts
  │   └── tenants/
  │       └── ...
  └── index.ts
  ```

##### 0.C - Type Safety Improvements

- [ ] **0.C.1** Remove `@ts-nocheck` from all generated files
- [ ] **0.C.2** Replace `unknown` with proper generics
  ```typescript
  // Before
  export function useList(arg1?: unknown)
  // After
  export function useList<T extends ListFilters>(options?: UseListOptions<T>)
  ```
- [ ] **0.C.3** Add proper type guards where needed
- [ ] **0.C.4** Export all types from barrel files

##### 0.D - Code Deduplication

- [ ] **0.D.1** Extract shared logic to base hook
- [ ] **0.D.2** Make domain wrappers thin (< 20 lines each)
- [ ] **0.D.3** Create shared type definitions

##### 0.E - Client Code Splitting & Optimization

**Goal**: Split browser/server clients into well-organized chunks for better tree-shaking and bundle size.

- [ ] **0.E.1** Split browser client by domain
  ```
  sdk/browser/
  ├── index.ts              # Main entry (re-exports domains)
  ├── client.ts             # Base client setup
  ├── admin/
  │   ├── index.ts          # Admin domain entry
  │   ├── users.ts          # Admin users API
  │   ├── tenants.ts        # Admin tenants API
  │   └── audit.ts          # Admin audit API
  ├── tenant/
  │   ├── index.ts          # Tenant domain entry
  │   ├── members.ts        # Team members API
  │   ├── webhooks.ts       # Webhooks API
  │   └── settings.ts       # Settings API
  └── user/
      ├── index.ts          # User domain entry
      └── profile.ts        # User profile API
  ```

- [ ] **0.E.2** Split server client similarly
  ```
  sdk/server/
  ├── index.ts              # Main entry with createApi()
  ├── client.ts             # Base server client
  └── domains/              # Same structure as browser
  ```

- [ ] **0.E.3** Enable tree-shaking
  - [ ] Use named exports only (no default exports)
  - [ ] Mark package.json with `"sideEffects": false`
  - [ ] Use `/* #__PURE__ */` annotations where needed

- [ ] **0.E.4** Lazy loading for large domains
  ```typescript
  // Only load admin module when accessed
  export const admin = {
    get users() { return import('./admin/users').then(m => m.users); },
    get tenants() { return import('./admin/tenants').then(m => m.tenants); },
  };
  ```

- [ ] **0.E.5** Optimize bundle output
  - [ ] Generate separate chunks per domain
  - [ ] Ensure no circular dependencies between chunks
  - [ ] Add bundle analysis to CI

##### 0.F - Regenerate & Test

- [ ] **0.F.1** Regenerate SDK
  ```bash
  pnpm sdk:gen
  ```

- [ ] **0.F.2** Test client-first pattern
  - [ ] Verify page persists on refresh
  - [ ] Verify browser back/forward works
  - [ ] Verify URL is shareable

- [ ] **0.F.3** Test bundle sizes
  - [ ] Measure before/after bundle sizes
  - [ ] Verify tree-shaking works
  - [ ] Document size improvements

#### Files to Modify

| File | Change |
|------|--------|
| `packages/devtools/src/generators/sdk/gen-hooks.ts` | Update hook generation |
| `packages/devtools/src/generators/sdk/gen-browser.ts` | Split into domain chunks |
| `packages/devtools/src/generators/sdk/gen-server.ts` | Split into domain chunks |
| `packages/devtools/src/generators/sdk/templates/` | Update all templates |
| `packages/gateway/src/registry/types.ts` | Add `persistPageToUrl` option |

#### Acceptance Criteria

- [ ] `pnpm sdk:gen` produces updated hooks
- [ ] Generated hooks read/write `page` param to URL
- [ ] No `@ts-nocheck` in any generated file
- [ ] No `unknown` types without proper narrowing
- [ ] Browser client split by domain (tree-shakeable)
- [ ] Server client split by domain
- [ ] All existing tests pass
- [ ] No breaking changes to public API (or migration guide provided)

---

### Phase 1: Create `useServerTable` Hook

**Goal**: Extract reusable URL state management for server-first pattern.

**Location**: `starters/saaskit/src/hooks/useServerTable.ts`

#### Checklist

- [ ] **1.1** Create hook file with TypeScript interfaces
  ```typescript
  // Types to define
  - UseServerTableOptions (input from server component)
  - UseServerTableReturn (output for client component)
  - DataTableCompatProps (convenience props for @unisane/data-table)
  ```

- [ ] **1.2** Implement URL state management
  - [ ] `useRouter` and `useSearchParams` integration
  - [ ] `useTransition` for non-blocking updates
  - [ ] URL update helper with proper param handling

- [ ] **1.3** Implement debounced search
  - [ ] Local state for immediate UI feedback
  - [ ] Debounce timer (300ms) for URL updates
  - [ ] Pending search tracking to handle race conditions
  - [ ] Sync with external changes (browser back/forward)
  - [ ] Cleanup on unmount

- [ ] **1.4** Implement sort handling
  - [ ] Parse sort string to key + direction
  - [ ] Handler to update URL with new sort
  - [ ] Reset cursor and page on sort change

- [ ] **1.5** Implement pagination handling
  - [ ] `onNextPage`: Set cursor + increment page in URL
  - [ ] `onPrevPage`: Set cursor + decrement page in URL
  - [ ] `onLimitChange`: Update limit, reset cursor and page
  - [ ] URL cleanup effect (remove cursor/page when on page 1)

- [ ] **1.6** Return convenience props for @unisane/data-table
  - [ ] `dataTableProps` object ready to spread
  - [ ] Includes: mode, paginationMode, disableLocalProcessing, etc.

- [ ] **1.7** Export hook from saaskit hooks index

#### Acceptance Criteria

- [ ] Hook compiles without errors
- [ ] All URL params properly synced
- [ ] Browser back/forward works correctly
- [ ] Page number persists on refresh
- [ ] Search is debounced (no excessive requests)
- [ ] No memory leaks (timers cleaned up)

---

### Phase 2: Refactor UsersClient (Server-First)

**Goal**: Replace manual boilerplate with the new hook.

**Location**: `starters/saaskit/src/app/(admin)/admin/users/UsersClient.tsx`

#### Checklist

- [ ] **2.1** Import `useServerTable` hook

- [ ] **2.2** Remove manual implementations
  - [ ] Remove `useState` for localSearch
  - [ ] Remove `useRef` for debounce timer
  - [ ] Remove `useRef` for pending search
  - [ ] Remove manual `useEffect` for search sync
  - [ ] Remove manual `useEffect` for URL cleanup
  - [ ] Remove `updateUrl` callback
  - [ ] Remove `handleSearchChange` callback
  - [ ] Remove `handleSortChange` callback
  - [ ] Remove `handleLimitChange` callback
  - [ ] Remove `handleNextPage` callback
  - [ ] Remove `handlePrevPage` callback
  - [ ] Remove `sortDescriptor` memo
  - [ ] Remove `cursorPagination` memo

- [ ] **2.3** Use hook instead
  ```typescript
  const { dataTableProps } = useServerTable({
    currentSort,
    currentSearch,
    currentLimit,
    currentPage,
    nextCursor,
    prevCursor,
  });
  ```

- [ ] **2.4** Spread props on DataTable
  ```typescript
  <DataTable
    data={data}
    columns={columns}
    {...dataTableProps}
    totalCount={stats?.total}
  />
  ```

- [ ] **2.5** Keep page-specific code only
  - [ ] Column definitions
  - [ ] Bulk actions
  - [ ] Stats display
  - [ ] Page header

#### Acceptance Criteria

- [ ] UsersClient reduced from ~150 lines to ~80 lines
- [ ] All functionality preserved
- [ ] No regressions in behavior
- [ ] TypeScript compiles without errors

---

### Phase 3: Verify TenantsClient (Client-First with Updated SDK)

**Goal**: Verify TenantsClient works correctly with updated SDK hooks.

**Location**: `starters/saaskit/src/app/(admin)/admin/tenants/`

#### Checklist

- [ ] **3.1** Verify page persistence
  - [ ] Navigate to page 2, refresh, verify still on page 2
  - [ ] Use browser back/forward, verify correct page

- [ ] **3.2** Verify URL is shareable
  - [ ] Copy URL with page=3, open in new tab
  - [ ] Verify correct page loads

- [ ] **3.3** Verify no regressions
  - [ ] Search works
  - [ ] Sort works
  - [ ] Filters work
  - [ ] Pagination works

- [ ] **3.4** Document the client-first pattern
  - [ ] Add comments explaining when to use this pattern
  - [ ] Reference the decision matrix

#### Acceptance Criteria

- [ ] TenantsClient works with page persistence
- [ ] No changes needed to TenantsClient code
- [ ] Pattern documented for future use

---

### Phase 4: Apply Patterns to Other Admin Pages

**Goal**: Standardize all admin list pages using appropriate pattern.

#### Decision for Each Page

| Page | Recommended Pattern | Reason |
|------|---------------------|--------|
| `AdminUsersClient` | Server-first | Admin, SEO, shareable |
| `TenantsClient` | Client-first | Complex filters, real-time |
| `AdminAuditClient` | Server-first | Log viewing, shareable |
| `OutboxClient` | Server-first | Simple list |
| `FlagsClient` | Server-first | Simple list |

#### Checklist

- [ ] **4.1** `AdminAuditClient.tsx` → Server-first
- [ ] **4.2** `OutboxClient.tsx` → Server-first
- [ ] **4.3** `FlagsClient.tsx` → Server-first
- [ ] **4.4** Keep `TenantsClient.tsx` as Client-first (already works)

---

### Phase 5: Apply Pattern to Tenant Pages

**Goal**: Standardize tenant-level list pages.

#### Pages to Update

- [ ] **5.1** `AuditClient.tsx` (tenant audit)
- [ ] **5.2** `TeamClient.tsx`
- [ ] **5.3** `ApiKeysClient.tsx`
- [ ] **5.4** `WebhooksClient.tsx`

#### Considerations

- [ ] Tenant context (slug in URL path)
- [ ] Permission checks
- [ ] Tenant-scoped API calls

---

### Phase 6: Documentation & Cleanup

**Goal**: Document the patterns and clean up.

#### Checklist

- [ ] **6.1** Create developer documentation
  - [ ] Decision matrix: when to use server-first vs client-first
  - [ ] How to use `useServerTable`
  - [ ] How to use SDK hooks (client-first)
  - [ ] Example implementations for both patterns
  - [ ] Migration guide

- [ ] **6.2** Update SDK generator documentation
  - [ ] Document `persistPageToUrl` option
  - [ ] Document generated hook APIs

- [ ] **6.3** Add tests
  - [ ] Unit tests for `useServerTable`
  - [ ] Unit tests for updated SDK hooks
  - [ ] Integration tests for pagination flow
  - [ ] E2E tests for critical paths

---

## API Reference

### `useServerTable` Hook (Server-First Pattern)

```typescript
// Input: State from server component
interface UseServerTableOptions {
  // Parsed from URL in server component
  currentSort: string;        // e.g., "-createdAt" or "email"
  currentSearch: string;      // e.g., "john"
  currentLimit: number;       // e.g., 25
  currentPage: number;        // e.g., 2

  // From API response
  nextCursor?: string;
  prevCursor?: string;

  // Optional configuration
  searchDebounceMs?: number;  // Default: 300
}

// Output: State and handlers for client component
interface UseServerTableReturn {
  // Parsed sort
  sortKey: string;
  sortDirection: "asc" | "desc";

  // Search with local state for immediate feedback
  searchValue: string;

  // Pagination state
  limit: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  // Handlers (update URL via router.push)
  onSortChange: (key: string | null, direction: "asc" | "desc") => void;
  onSearchChange: (value: string) => void;
  onLimitChange: (limit: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;

  // Loading state
  isPending: boolean;

  // Convenience: Pre-built props for @unisane/data-table
  dataTableProps: DataTableCompatProps;
}
```

### SDK Hooks (Client-First Pattern)

```typescript
// Updated useAdminListParams (with page URL persistence)
interface AdminListParams {
  sort: string;
  cursor: string | undefined;
  search: string;
  searchCommitted: string;
  filters: Record<string, unknown>;
  limit: number;
  pageIndex: number;  // NOW: synced with URL

  // Setters
  setSort: (next: string) => void;
  setCursor: (next?: string) => void;
  setSearch: (next: string) => void;
  setFilters: (next: Record<string, unknown>) => void;
  setLimit: (next: number) => void;
  setPageIndex: (next: number) => void;  // NOW: updates URL

  // URL management
  updateUrl: (mutate: (url: URL) => void) => void;
  sortDescriptor: { key: string; direction: "asc" | "desc" };
}

// Domain-specific wrapper
function useAdminUsersListParams(options?: ListParamsHookOpts) {
  // Returns AdminListParams + queryArgs + buildCursorPagination
}
```

---

## Decision Matrix

### When to Use Each Pattern

| Factor | Server-First | Client-First |
|--------|--------------|--------------|
| **SEO Important** | ✅ Use | ❌ Avoid |
| **Shareable URLs** | ✅ Better | ⚠️ Works (with SDK update) |
| **First Load Speed** | ✅ Faster | ⚠️ Shows loading |
| **Navigation Speed** | ⚠️ Full reload | ✅ Instant (cached) |
| **Real-time Updates** | ❌ Manual refresh | ✅ Background refetch |
| **Complex Filters** | ⚠️ URL gets long | ✅ State-based |
| **Offline Support** | ❌ No | ✅ With service worker |
| **Bundle Size** | ✅ Smaller | ⚠️ Includes React Query |

### Recommended Pattern by Page Type

| Page Type | Pattern | Reason |
|-----------|---------|--------|
| Admin lists | Server-first | SEO, shareability, simplicity |
| User dashboards | Client-first | Interactivity, real-time |
| Public pages | Server-first | SEO critical |
| Settings pages | Either | Depends on complexity |
| Audit logs | Server-first | Shareability, compliance |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code reduction | 50%+ | Lines in list components |
| Consistency | 100% | All pages use documented pattern |
| Page persistence | 100% | Page survives refresh (both patterns) |
| URL shareability | 100% | All state in URL works |
| No regressions | 0 | Existing functionality preserved |
| SDK regeneration | Pass | `pnpm sdk:gen` succeeds |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking SDK changes | High | Version bump, migration guide |
| Complex filter URLs | Medium | Use base64 encoding for filters |
| Generator template bugs | Medium | Thorough testing before release |
| Pattern confusion | Low | Clear documentation, decision matrix |

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 0: SDK Generator | 1 day | None |
| Phase 1: Create hook | 1 day | None (parallel with Phase 0) |
| Phase 2: Refactor UsersClient | 0.5 day | Phase 1 |
| Phase 3: Verify TenantsClient | 0.5 day | Phase 0 |
| Phase 4: Other admin pages | 1-2 days | Phase 2, 3 |
| Phase 5: Tenant pages | 1-2 days | Phase 4 |
| Phase 6: Documentation | 0.5 day | Phase 5 |

**Total: 5-8 days**

---

## Appendix

### A. Files to Create

```
starters/saaskit/src/hooks/
├── index.ts                    # Export all hooks
├── useServerTableState.ts      # Server-first hook
└── useServerTableState.test.ts # Tests
```

### B. Files to Modify (SDK Generator)

```
packages/devtools/src/generators/sdk/
├── templates/
│   ├── useAdminListParams.ts.template   # Add page URL sync
│   └── admin-list-params.ts.template    # Update pagination handlers

packages/gateway/src/registry/
└── types.ts                             # Add persistPageToUrl option
```

### C. Files to Modify (saaskit)

```
starters/saaskit/src/app/(admin)/admin/
├── users/
│   └── UsersClient.tsx        # Refactor to use hook
├── audit/
│   └── AdminAuditClient.tsx   # Refactor
├── outbox/
│   └── OutboxClient.tsx       # Refactor
└── flags/
    └── FlagsClient.tsx        # Refactor
```

### D. URL Parameter Specification

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sort` | string | `-createdAt` | Sort field, prefix `-` for desc |
| `q` | string | `""` | Search query |
| `limit` | number | `25` | Items per page (1-100) |
| `cursor` | string | - | Opaque cursor for data fetch |
| `page` | number | `1` | Display page number |
| `filters` | string | - | Base64 encoded filter object |

### E. SDK Generator Template Changes

#### useAdminListParams.ts Changes

```typescript
// BEFORE
const [pageIndex, setPageIndex] = useState<number>(1);

// AFTER
const pageFromUrl = Number(sp.get("page")) || 1;
const [pageIndex, setPageIndex] = useState<number>(pageFromUrl);

// Sync with URL changes
useEffect(() => {
  const urlPage = Number(sp.get("page")) || 1;
  if (urlPage !== pageIndex) {
    setPageIndex(urlPage);
  }
}, [sp]);

// Update setPageIndex to also update URL
const setPageIndexWithUrl = useCallback((page: number) => {
  setPageIndex(page);
  updateUrl((url) => {
    if (page > 1) {
      url.searchParams.set("page", String(page));
    } else {
      url.searchParams.delete("page");
    }
  });
}, [updateUrl]);
```

#### admin-list-params.ts Changes

```typescript
// BEFORE (in buildCursorPagination)
onNext: () => {
  if (!cursors.next) return;
  params.setCursor(cursors.next);
  params.setPageIndex(params.pageIndex + 1);
  params.updateUrl((url) => url.searchParams.set("cursor", cursors.next));
},

// AFTER
onNext: () => {
  if (!cursors.next) return;
  params.setCursor(cursors.next);
  const nextPage = params.pageIndex + 1;
  params.setPageIndex(nextPage);
  params.updateUrl((url) => {
    url.searchParams.set("cursor", cursors.next);
    url.searchParams.set("page", String(nextPage));
  });
},
```

### F. Related Documents

- [Cursor Pagination Design](/docs/architecture/cursor-pagination.md)
- [DataTable Component API](/packages/data-table/README.md)
- [SDK Generator Documentation](/packages/devtools/README.md)
- [SDK Hooks Documentation](/starters/saaskit/src/sdk/hooks/README.md)
