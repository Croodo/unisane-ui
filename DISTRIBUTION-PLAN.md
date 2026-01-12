# Unisane Distribution System: Vision & Reality Check

> **Document Purpose**: Complete overview of Unisane's distribution model - what users should get, current implementation status, and gaps to fill
>
> **Status**: 🟡 Infrastructure exists but untested (0% functional)
>
> **Last Updated**: 2026-01-13

---

## 📋 Table of Contents

1. [Vision: What Users Should Get](#vision-what-users-should-get)
2. [Distribution Model](#distribution-model)
3. [Reality Check: Current Implementation Status](#reality-check-current-implementation-status)
4. [Critical Issues Found](#critical-issues-found)
5. [Gap Analysis](#gap-analysis)
6. [Roadmap to Working Distribution](#roadmap-to-working-distribution)

---

## 🎯 Vision: What Users Should Get

### User Experience

```bash
# What we want users to be able to do:
npx create-unisane-app my-saas-app

# What happens:
# 1. Downloads pre-built distribution (OSS or PRO variant)
# 2. Extracts complete Next.js project (~89K-93K LOC)
# 3. Installs dependencies
# 4. Ready to customize and deploy
```

### Complete Project Structure

When a user creates a Unisane app, they should receive:

```
my-saas-app/                              # User's standalone project
├── 📄 package.json                       # Clean deps (no workspace:*)
├── 📄 .env.example                       # 177 lines of configuration
├── 📄 tsconfig.json
├── 📄 next.config.mjs
├── 📄 tailwind.config.ts
├── 📄 playwright.config.ts
├── 📄 README.md
│
├── 📁 public/                            # Static assets
│
├── 📁 e2e/                               # 51 E2E test files
│   ├── auth.spec.ts
│   ├── billing.spec.ts
│   ├── tenants.spec.ts
│   └── [48 more...]
│
└── 📁 src/
    │
    ├── 📁 modules/                       # 🔥 FLATTENED from packages/
    │   ├── kernel/                       # Foundation: Core utilities
    │   ├── gateway/                      # Foundation: API gateway
    │   ├── contracts/                    # Foundation: API contracts
    │   ├── identity/                     # Module: User management
    │   ├── auth/                         # Module: Authentication
    │   ├── tenants/                      # Module: Multi-tenancy
    │   ├── billing/                      # Module: Stripe subscriptions
    │   ├── credits/                      # Module: Credit system
    │   ├── usage/                        # Module: Usage tracking
    │   ├── audit/                        # Module: Audit logging
    │   ├── settings/                     # Module: Settings
    │   ├── storage/                      # Module: S3 file storage
    │   ├── notify/                       # Module: Email notifications
    │   ├── webhooks/                     # Module: Outbound webhooks
    │   ├── media/                        # Module: Media processing
    │   ├── flags/                        # Module: Feature flags
    │   ├── sso/                          # PRO: SSO (SAML/OAuth)
    │   ├── import-export/                # PRO: Data import/export
    │   ├── ai/                           # PRO: AI features (OpenAI)
    │   ├── analytics/                    # PRO: Analytics
    │   └── pdf/                          # PRO: PDF generation
    │
    ├── 📁 components/ui/                 # 🔥 FLATTENED from packages/ui/
    │   ├── core/                         # 61 Material Design components
    │   └── cli/                          # CLI-style components
    │   # NOTE: data-table remains as @unisane/data-table npm package (not flattened)
    │
    ├── 📁 app/                           # Next.js App Router pages
    │   ├── (auth)/                       # Auth routes
    │   ├── (tenant)/w/[slug]/            # Tenant-scoped routes
    │   ├── api/v1/[...routes]/           # API endpoints
    │   └── page.tsx                      # Landing page
    │
    ├── 📁 contracts/                     # 🔥 USER EDITS - API definitions
    │   ├── users.contract.ts
    │   ├── tenants.contract.ts
    │   └── [custom contracts...]
    │
    ├── 📁 sdk/                           # 🤖 AUTO-GENERATED
    │   ├── client.ts                     # Client-side SDK
    │   ├── server.ts                     # Server-side SDK
    │   ├── hooks/                        # React Query hooks
    │   └── routes/                       # Route handlers
    │
    ├── 📁 platform/                      # Integration layer
    │   ├── auth/config.ts
    │   ├── db/mongodb.ts
    │   ├── cache/redis.ts
    │   ├── storage/s3.ts
    │   └── email/resend.ts
    │
    └── 📁 openapi/                       # 🤖 AUTO-GENERATED
        └── openapi.json                  # OpenAPI 3.1 spec
```

### Code Statistics

| Variant | Lines of Code | Files | Modules | UI Components (Flattened) | NPM Packages |
|---------|---------------|-------|---------|---------------------------|--------------|
| **OSS** | ~89,000 | ~850 | 18 | 61 (from ui/core + ui/cli) | @unisane/data-table |
| **PRO** | ~93,000 | ~890 | 21 | 61 (from ui/core + ui/cli) | @unisane/data-table |

**Note:** `@unisane/data-table` remains as an npm package dependency, not flattened into user's source code.

---

## 🏗️ Distribution Model

### "shadcn/ui for Full-Stack"

Unisane uses the **code ownership model**, not package dependencies:

```typescript
// ❌ Traditional framework (package dependency)
import { Auth } from '@framework/auth';  // Black box, can't modify

// ✅ Unisane (code ownership)
import { Auth } from '@/modules/auth';   // Full source in your project
// File exists: src/modules/auth/domain/auth.service.ts
```

### Build Process

The `build-starter.ts` command transforms the monorepo:

```bash
# Monorepo structure (what we maintain)
packages/
├── foundation/
│   ├── kernel/src/...       →  src/modules/kernel/
│   ├── gateway/src/...      →  src/modules/gateway/
│   └── contracts/src/...    →  src/modules/contracts/
├── modules/
│   ├── identity/src/...     →  src/modules/identity/
│   ├── auth/src/...         →  src/modules/auth/
│   └── [13 more...]         →  src/modules/[module]/
├── pro/
│   ├── ai/src/...           →  src/modules/ai/ (PRO only)
│   └── [3 more...]          →  src/modules/[pro-module]/
└── ui/
    ├── core/src/...         →  src/components/ui/core/
    └── cli/src/...          →  src/components/ui/cli/
    # NOTE: data-table stays as @unisane/data-table npm dependency
```

### Import Transformation

```typescript
// Before (in monorepo)
import { createLogger } from '@unisane/kernel';
import { authenticate } from '@unisane/auth';
import { Button } from '@unisane/ui';
import { DataTable } from '@unisane/data-table';

// After (in user project)
import { createLogger } from '@/modules/kernel';
import { authenticate } from '@/modules/auth';
import { Button } from '@/components/ui/core';
import { DataTable } from '@unisane/data-table';  // ← Stays as npm package
```

### PRO Code Stripping (OSS variant)

```typescript
// Before (in monorepo)
export function analyzeUser(userId: string) {
  const basicData = getUserData(userId);

  /* @pro-only:start */
  const insights = generateAIInsights(userId);
  return { ...basicData, insights };
  /* @pro-only:end */

  return basicData;
}

// After (in OSS distribution)
export function analyzeUser(userId: string) {
  const basicData = getUserData(userId);

  /* [PRO feature removed] */

  return basicData;
}
```

### Package.json Transformation

```json
// Before (in monorepo - starters/saaskit/package.json)
{
  "name": "@unisane/saaskit",
  "dependencies": {
    "@unisane/kernel": "workspace:*",
    "@unisane/auth": "workspace:*",
    "@unisane/billing": "workspace:*",
    "@unisane/data-table": "workspace:*",
    "stripe": "^14.0.0",
    "mongodb": "^7.0.0"
  }
}

// After (in user distribution)
{
  "name": "my-saas-app",
  "version": "1.0.0",
  "dependencies": {
    // Most @unisane/* packages removed (code flattened)
    // EXCEPT data-table which stays as npm package
    "@unisane/data-table": "^1.0.0",
    "stripe": "^14.0.0",
    "mongodb": "^7.0.0",
    "next": "16.0.0",
    "react": "^19.2.0"
  }
}
```

---

## ❌ Reality Check: Current Implementation Status

### Overall Status: 🔴 0% Functional

The distribution infrastructure **exists as code but has NEVER been executed or tested**.

### Component Status

| Component | Should Work | Actually Works | Evidence |
|-----------|-------------|----------------|----------|
| **build-starter.ts command** | ✅ CLI exists | ❌ Never executed | No flattened modules exist |
| **Module flattening** | ✅ Code written | ❌ Not working | `src/modules/` is empty |
| **Import transformation** | ✅ Code written | ❌ Not working | 879 untransformed imports |
| **Package.json cleanup** | ✅ Code written | ❌ Not working | 21 workspace:* deps remain |
| **PRO code stripping** | ✅ Code written | ❌ Never tested | No OSS builds exist |
| **Multiple starters** | ✅ Config supports it | ❌ Only saaskit exists | 1/4 starters |
| **Module reusability** | ✅ Intended | ❌ Heavy SaaS coupling | Not multi-platform |
| **create-unisane-app CLI** | ❌ Doesn't exist | ❌ Doesn't exist | No user distribution |

---

## 🐛 Critical Issues Found

### Issue #1: Build Process Never Executed

**Evidence:**
```bash
# Current state of starters/saaskit/
$ ls src/modules/
# (empty directory or doesn't exist)

$ grep -r "@unisane/" src/ | wc -l
879  # ← Should be 0 after build

$ cat package.json | grep "workspace:"
"@unisane/kernel": "workspace:*",
"@unisane/auth": "workspace:*",
# ... 19 more workspace:* dependencies
```

**Impact:** Users cannot get a standalone distribution. The starter only works within the monorepo.

---

### Issue #2: Configuration Bugs

#### Bug 2.1: PRO Package List Incomplete

**Location:** `packages/tooling/devtools/src/commands/release/build-starter.ts:329`

```typescript
// CURRENT (WRONG)
const proPkgs = ['ai', 'analytics', 'credits', 'pdf'];
//                                   ^^^^^^^ BUG: credits is OSS, not PRO

// CORRECT
const proPkgs = ['ai', 'analytics', 'pdf', 'sso', 'import-export'];
```

**Impact:**
- OSS builds would incorrectly strip `credits` module (it's OSS!)
- PRO builds would incorrectly include `sso` and `import-export` in OSS

#### Bug 2.2: Module Classification Wrong

**Location:** `packages/tooling/devtools/src/commands/release/build-starter.ts:45-62`

```typescript
// CURRENT (WRONG)
const STARTER_PACKAGES = {
  saaskit: {
    foundation: ['kernel', 'gateway', 'contracts'],
    modules: [
      'identity', 'settings', 'storage', 'tenants', 'auth',
      'sso',            // ← BUG: sso is in /packages/pro/, not /packages/modules/
      'billing', 'flags', 'audit', 'credits', 'usage', 'notify',
      'webhooks', 'media',
      'import-export',  // ← BUG: import-export is in /packages/pro/
    ],
    pro: ['ai', 'pdf', 'analytics'],
  },
};

// CORRECT
const STARTER_PACKAGES = {
  saaskit: {
    foundation: ['kernel', 'gateway', 'contracts'],
    modules: [
      'identity', 'settings', 'storage', 'tenants', 'auth',
      'billing', 'flags', 'audit', 'credits', 'usage',
      'notify', 'webhooks', 'media'
    ],
    pro: ['ai', 'pdf', 'analytics', 'sso', 'import-export'],
  },
};
```

**Impact:** OSS builds would include PRO-only modules (licensing violation!)

#### Bug 2.3: Data-Table Should Stay as NPM Package

**Location:** `packages/tooling/devtools/src/commands/release/build-starter.ts:68, 330`

**Current behavior:**
```typescript
// Line 68
const UI_PACKAGES = ['core', 'data-table', 'cli'] as const;
// ← data-table is being flattened with core and cli

// Line 330
const uiPkgs = ['ui', 'data-table', 'tokens', 'cli'];
// ← data-table is being removed from dependencies
```

**Correct behavior:** `@unisane/data-table` should remain as a runtime npm package dependency, NOT flattened into user's source code.

**Why:** Data-table is a complex, frequently updated component library that benefits from:
- Version updates without code changes
- Bug fixes via npm update
- Reduced user codebase size
- Centralized maintenance

**Fix needed:**
```typescript
// Line 68 - Remove data-table from UI_PACKAGES
const UI_PACKAGES = ['core', 'cli'] as const;

// Line 330 - Keep data-table in dependencies (don't filter it out)
const uiPkgs = ['ui', 'tokens', 'cli']; // Remove 'data-table'
```

**Impact:** Users won't get data-table source code, they'll import it as `@unisane/data-table`.

#### Bug 2.4: Dependency Filtering Logic Needs Review

**Location:** `packages/tooling/devtools/src/commands/release/build-starter.ts:337`

```typescript
// CURRENT (POTENTIALLY WRONG)
for (const [name, version] of Object.entries(dependencies)) {
  if (name.startsWith('@unisane/')) {
    const pkgName = name.replace('@unisane/', '');
    if (internalPkgs.includes(pkgName)) continue;
    if (oss && proPkgs.includes(pkgName)) continue;
    if (packages.includes(pkgName)) continue;  // ← This seems backward
    if (uiPkgs.includes(pkgName)) continue;
    newDeps[name] = version;
  }
}
```

**Expected behavior:** If a package is in the `packages` list (meaning it's being flattened), it should be REMOVED from dependencies, not kept.

**Impact:** Unclear - needs testing to verify actual behavior.

---

### Issue #3: Module SaaS Coupling (NOT A BUG - By Design)

**Location:** Throughout all modules

**Current State:**

```typescript
// packages/modules/storage/src/domain/storage.service.ts
const tenantId = getTenantId();  // Multi-tenant context
await col('files').insertOne(withTenantId({ ... }));

// packages/modules/billing/src/domain/billing.service.ts
import { TenantsRepo } from '@unisane/tenants';  // SaaS tenant dependency
import { grant } from '@unisane/credits';        // SaaS credits system

// packages/modules/webhooks/src/domain/webhooks.service.ts
import { addSuppression } from '@unisane/notify';
import { patchSetting } from '@unisane/settings';
// Module interdependencies
```

**Assessment:** This coupling is **INTENTIONAL and CORRECT** for a SaaS-first product.

**Module Categories:**

**Category A: Core SaaS Modules** (Coupling is by design)
- 🟢 **tenants** - Multi-tenancy IS the core SaaS feature
- 🟢 **billing** - Stripe subscriptions ARE the SaaS business model
- 🟢 **credits** - Usage-based pricing IS for SaaS metering
- 🟢 **usage** - API tracking IS for SaaS analytics
- 🟢 **webhooks** - Integrations ARE for SaaS platforms
- 🟢 **sso** - Enterprise auth IS for SaaS customers

**Category B: Infrastructure Modules** (Already reusable)
- ✅ **kernel** - Logger, errors, config (zero SaaS coupling)
- ✅ **gateway** - HTTP gateway (domain-agnostic)
- ✅ **contracts** - API definitions (works anywhere)
- ✅ **storage** - File storage (tenant context optional)
- ✅ **media** - Image processing (reusable)
- ✅ **notify** - Email notifications (reusable)
- ✅ **audit** - Event logging (reusable)

**Category C: Adaptable Modules** (Easy to modify if needed)
- 🟡 **identity** - User management (can remove tenant assumptions)
- 🟡 **auth** - Authentication (adaptable to other contexts)
- 🟡 **settings** - Configuration storage (can be rescoped)

**Impact:**
- ✅ **For saaskit:** Perfect architecture, modules work together seamlessly
- ❓ **For hypothetical ecommerce/crm-kit:** Would need refactoring (but those don't exist yet)

**Recommendation:**
- 🎯 **Phase 0-3:** KEEP current architecture (optimized for SaaS)
- 🔄 **Phase 4-5:** ONLY decouple IF/WHEN building a second starter (requirement-driven refactoring, not speculative)

---

### Issue #4: No User Distribution Infrastructure

**Missing components:**

```bash
# None of these exist:
❌ npx create-unisane-app          # CLI command
❌ Distribution hosting/CDN        # Where pre-built packages live
❌ npm package @unisane/create-app # Package to install CLI
❌ Pre-built distributions         # .tar.gz files for download
❌ Version management              # Semver for distributions
❌ Update mechanism                # How users get updates
```

**Impact:** Even if build-starter works, there's no way for users to receive the distribution.

---

### Issue #5: Only One Starter Exists

**Vision:** Multiple starters for different app types
- saaskit (SaaS applications)
- ecommerce-kit (E-commerce platforms)
- crm-kit (CRM systems)
- ai-kit (AI applications)

**Reality:** Only `saaskit` exists

**Impact:** Cannot validate module reusability across different app types.

---

## 📊 Gap Analysis

| Feature | Vision | Current Reality | Gap Size |
|---------|--------|-----------------|----------|
| **Module Flattening** | All packages → src/modules/ | 0 modules flattened | 🔴 100% |
| **Import Transformation** | @unisane/* → @/modules/* | 879 untransformed imports | 🔴 100% |
| **Package.json Cleanup** | No workspace:* deps | 21 workspace:* deps remain | 🔴 100% |
| **PRO Code Stripping** | Auto-strip @pro-only markers | Never tested, has bugs | 🔴 100% |
| **Config Correctness** | Accurate module classification | 3 critical bugs | 🔴 100% |
| **Multiple Starters** | 4 starter variants | Only 1 (saaskit) | 🟡 75% gap |
| **Module Reusability** | Works across app types | SaaS-optimized (by design) | 🟢 0% gap (correct for SaaS) |
| **User Distribution** | npx create-unisane-app | Doesn't exist | 🔴 100% |
| **Documentation** | Accurate reflects reality | Describes aspirational state | 🟡 50% gap |

**Overall Distribution System Status: 🔴 0% Functional**

---

## 🛣️ Roadmap to Working Distribution

### Phase 0: Before Starting (Current Focus)

**Status:** ⏳ In Progress (ISSUES-ROADMAP.md)

**Goal:** Get monorepo to 100% production-ready

**Timeline:** 3-5 weeks

**Tasks from ISSUES-ROADMAP.md:**
1. ✅ Security fixes (PII encryption, headers)
2. ✅ Quality foundation (tests, CI)
3. ✅ Production hardening (reliability, architecture)
4. ✅ Launch prep (verification, docs)

**Why This First:** Distribution is useless if the monorepo code isn't production-ready.

---

### Phase 1: Fix Build Infrastructure (After Phase 0)

**Timeline:** 1-2 weeks

**Priority:** 🔴 CRITICAL (blocks everything else)

#### Task 1.1: Fix Configuration Bugs

**File:** `packages/tooling/devtools/src/commands/release/build-starter.ts`

```typescript
// Fix PRO package list (line 329)
- const proPkgs = ['ai', 'analytics', 'credits', 'pdf'];
+ const proPkgs = ['ai', 'analytics', 'pdf', 'sso', 'import-export'];

// Fix STARTER_PACKAGES config (lines 44-66)
const STARTER_PACKAGES: Record<string, StarterConfig> = {
  saaskit: {
    foundation: ['kernel', 'gateway', 'contracts'],
    modules: [
      'identity', 'settings', 'storage', 'tenants', 'auth',
      'billing', 'flags', 'audit', 'credits', 'usage',
      'notify', 'webhooks', 'media'
    ],
-   pro: ['ai', 'pdf', 'analytics'],
+   pro: ['ai', 'pdf', 'analytics', 'sso', 'import-export'],
  },
};
```

**Verification:**
```bash
# Verify package classification matches filesystem
ls packages/modules/     # Should match modules: []
ls packages/pro/         # Should match pro: []
```

#### Task 1.2: Test Build Process (First Execution)

```bash
# Build OSS variant
pnpm devtools release build --starter saaskit --oss

# Expected results:
# ✅ src/modules/ contains all OSS modules (flattened)
# ✅ 879 @unisane/* imports transformed to @/modules/*
# ✅ package.json has 0 workspace:* dependencies
# ✅ All PRO code stripped (/* [PRO feature removed] */)
```

**Verification checklist:**
- [ ] `src/modules/` directory populated with 18 modules
- [ ] No `@unisane/*` imports remain in src/
- [ ] `package.json` has no workspace:* dependencies
- [ ] PRO modules (ai, analytics, pdf, sso, import-export) NOT present
- [ ] Code compiles: `pnpm check-types`
- [ ] Tests pass: `pnpm test`

#### Task 1.3: Test PRO Build Variant

```bash
# Build PRO variant
pnpm devtools release build --starter saaskit

# Expected results:
# ✅ src/modules/ contains all 21 modules (OSS + PRO)
# ✅ PRO code NOT stripped
# ✅ package.json clean
```

**Verification checklist:**
- [ ] `src/modules/` directory has 21 modules (18 OSS + 3 PRO)
- [ ] PRO modules present: ai, analytics, pdf, sso, import-export
- [ ] PRO code markers intact (not stripped)
- [ ] Code compiles
- [ ] Tests pass

#### Task 1.4: Add Verification Tests

**File:** `packages/tooling/devtools/src/commands/release/verify.ts`

Add automated checks:
```typescript
// Check 1: No workspace:* dependencies
const workspaceDeps = /* check package.json */
if (workspaceDeps.length > 0) {
  throw new Error(`Found workspace dependencies: ${workspaceDeps}`);
}

// Check 2: No @unisane/* imports
const unisaneImports = /* grep for @unisane/ */
if (unisaneImports.length > 0) {
  throw new Error(`Found untransformed imports: ${unisaneImports.length}`);
}

// Check 3: All expected modules present
const expectedModules = /* based on variant */
const actualModules = /* ls src/modules/ */
// Assert match

// Check 4: PRO code stripped (OSS only)
if (oss) {
  const proMarkers = /* search for @pro-only:start */
  if (proMarkers.length > 0) {
    throw new Error(`Found PRO code in OSS build`);
  }
}
```

---

### Phase 2: Standalone Distribution Testing

**Timeline:** 1 week

**Priority:** 🟡 HIGH

#### Task 2.1: Test Standalone Build

```bash
# Copy built distribution to temp directory
cp -r starters/saaskit /tmp/saaskit-test
cd /tmp/saaskit-test

# Install dependencies (not in monorepo!)
npm install

# Verify everything works
npm run dev           # Should start
npm run build         # Should build
npm run test:e2e      # Should pass
```

**Verification:**
- [ ] `npm install` succeeds (no workspace:* errors)
- [ ] `npm run dev` starts successfully
- [ ] App accessible at http://localhost:3000
- [ ] Can create account, login, use features
- [ ] `npm run build` succeeds
- [ ] All 51 E2E tests pass

#### Task 2.2: Test Customization Flow

Verify users can actually customize the code:

```bash
# Test 1: Add custom module
mkdir src/modules/projects
# Add domain/data/service files
# Verify imports work

# Test 2: Modify existing module
# Edit src/modules/billing/domain/billing.service.ts
# Verify changes work

# Test 3: Add custom UI component
# Create src/components/custom/my-component.tsx
# Verify can import from app/

# Test 4: Generate SDK from contract
# Edit src/contracts/custom.contract.ts
npm run sdk:gen
# Verify hooks generated
```

---

### Phase 3: User Distribution Infrastructure

**Timeline:** 2-3 weeks

**Priority:** 🟡 MEDIUM

#### Task 3.1: Create `create-unisane-app` CLI

**New package:** `packages/tooling/create-unisane-app/`

```typescript
// packages/tooling/create-unisane-app/src/cli.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('create-unisane-app')
  .argument('<project-name>', 'Name of the project')
  .option('--pro', 'Use PRO variant (requires license key)')
  .option('--oss', 'Use OSS variant (default)')
  .action(async (projectName, options) => {
    // 1. Download distribution from CDN
    const variant = options.pro ? 'pro' : 'oss';
    const tarball = await downloadDistribution(variant);

    // 2. Extract to project directory
    await extractTarball(tarball, projectName);

    // 3. Initialize git
    await initGit(projectName);

    // 4. Install dependencies
    await installDependencies(projectName);

    // 5. Create .env.local
    await createEnvFile(projectName);

    console.log(`✅ Created ${projectName}`);
    console.log(`📁 cd ${projectName}`);
    console.log(`🚀 npm run dev`);
  });
```

#### Task 3.2: Publish Pre-Built Distributions

**Infrastructure needed:**
- CDN or GitHub Releases for hosting
- Build artifacts: `saaskit-oss-v1.0.0.tar.gz`, `saaskit-pro-v1.0.0.tar.gz`
- Version manifest: `versions.json`

```json
// versions.json
{
  "latest": "1.0.0",
  "versions": {
    "1.0.0": {
      "oss": "https://cdn.unisane.com/saaskit-oss-v1.0.0.tar.gz",
      "pro": "https://cdn.unisane.com/saaskit-pro-v1.0.0.tar.gz",
      "checksums": {
        "oss": "sha256:abc123...",
        "pro": "sha256:def456..."
      }
    }
  }
}
```

#### Task 3.3: Publish NPM Package

```bash
# Publish create-unisane-app to npm
cd packages/tooling/create-unisane-app
npm publish --access public

# Users can now run:
npx create-unisane-app my-app
```

---

### Phase 4: Module Decoupling (ONLY IF Building Second Starter)

**Timeline:** 2-4 weeks

**Priority:** 🔵 SKIP (until you actually build ecommerce-kit/crm-kit)

**Goal:** Refactor modules based on REAL requirements from building a second starter

**⚠️ IMPORTANT:** Do NOT do this phase unless you're actively building a second starter. Current SaaS coupling is correct for saaskit.

#### Task 4.1: Identify Coupling Points

Audit all modules for:
- Hard-coded tenant context assumptions
- Dependencies on other modules
- SaaS-specific business logic

#### Task 4.2: Refactor High-Coupling Modules

**Example: Make billing provider-agnostic**

```typescript
// Before (SaaS-specific)
import { TenantsRepo } from '@unisane/tenants';
import { grant } from '@unisane/credits';

export class BillingService {
  async processPayment(tenantId: string) {
    // Tightly coupled to tenants + credits
  }
}

// After (provider-agnostic)
interface BillingContext {
  entityId: string;      // Could be tenantId, userId, orgId
  onSuccess?: () => void;
}

export class BillingService {
  constructor(private context: BillingContext) {}

  async processPayment() {
    // Decoupled from specific entity types
  }
}
```

---

### Phase 5: Additional Starters (Optional)

**Timeline:** 4-8 weeks

**Priority:** 🟢 LOW (validate multi-platform vision)

#### Task 5.1: Build ecommerce-kit

- Reuse: identity, auth, storage, media, notify, billing (with PayPal/Square)
- New modules: products, inventory, orders, cart, shipping
- Remove: tenants, credits, usage, webhooks, sso

#### Task 5.2: Build crm-kit

- Reuse: identity, auth, storage, notify, audit
- New modules: contacts, deals, pipeline, activities, reports
- Adapt: tenants → organizations, billing → invoicing

---

## 📅 Recommended Timeline

| Phase | Description | Duration | Dependencies | Priority |
|-------|-------------|----------|--------------|----------|
| **Phase 0** | Production-ready monorepo | 3-5 weeks | None | 🔴 CRITICAL |
| **Phase 1** | Fix build infrastructure | 1-2 weeks | Phase 0 | 🔴 CRITICAL |
| **Phase 2** | Standalone testing | 1 week | Phase 1 | 🟡 HIGH |
| **Phase 3** | User distribution | 2-3 weeks | Phase 2 | 🟡 MEDIUM |
| **Phase 4** | Module decoupling | 2-4 weeks | Phase 3 | 🟢 LOW |
| **Phase 5** | Additional starters | 4-8 weeks | Phase 4 | 🟢 LOW |

**Total time to working distribution:** 7-11 weeks (after Phase 0 completes)

**Total time to full multi-platform vision:** 16-27 weeks

---

## ✅ Success Criteria

### Minimum Viable Distribution (Phase 1-3)

- [ ] `pnpm devtools release build --starter saaskit --oss` succeeds
- [ ] Built distribution has 0 @unisane/* imports (except @unisane/data-table)
- [ ] Built distribution has 1 @unisane/* dependency: @unisane/data-table only
- [ ] Built distribution has 0 workspace:* dependencies
- [ ] data-table NOT flattened (stays as npm package)
- [ ] Standalone distribution compiles and runs
- [ ] All 51 E2E tests pass in standalone mode
- [ ] `npx create-unisane-app` works end-to-end
- [ ] Users can customize and deploy

### Full Multi-Platform Vision (Phase 4-5)

- [ ] At least 2 starters exist (saaskit + one other)
- [ ] Modules successfully reused across starters
- [ ] No hard-coded SaaS assumptions in shared modules
- [ ] Documentation updated to reflect multi-platform capability

---

## 📚 Related Documents

- **[ISSUES-ROADMAP.md](ISSUES-ROADMAP.md)** - Current focus: Production-ready monorepo
- **[MASTER-ROADMAP.md](MASTER-ROADMAP.md)** - Long-term vision and strategic goals
- **build-starter.ts** - `packages/tooling/devtools/src/commands/release/build-starter.ts`
- **verify.ts** - `packages/tooling/devtools/src/commands/release/verify.ts`

---

## 🎯 Conclusion

**Current State:**
- ✅ Vision is clear and well-documented
- ✅ Infrastructure code exists
- ❌ Infrastructure has never been executed
- ❌ Multiple critical bugs in configuration
- ❌ No user distribution mechanism

**Next Steps:**
1. Complete [ISSUES-ROADMAP.md](ISSUES-ROADMAP.md) (3-5 weeks)
2. Fix build-starter bugs and test (1-2 weeks)
3. Build user distribution infrastructure (2-3 weeks)
4. Launch distribution system (Phase 1-3 total: 7-11 weeks)

The distribution system is **technically feasible** but requires focused execution to move from "theoretical" to "functional".
