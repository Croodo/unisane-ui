# SaasKit → Unisane Monorepo Migration Steps

> **Status:** EXECUTION GUIDE
> **Last Updated:** 2025-01-06

Practical step-by-step commands to migrate SaasKit into the Unisane monorepo.

---

## Current State

```
Unisane/
├── saaskit/                    # Source (standalone Next.js app)
│   ├── src/
│   │   ├── core/               # → packages/kernel
│   │   ├── gateway/            # → packages/gateway
│   │   ├── modules/            # → packages/{module}
│   │   ├── contracts/          # → packages/contracts
│   │   ├── platform/           # → starters/saaskit/src/platform
│   │   ├── sdk/                # → starters/saaskit/src/sdk
│   │   ├── app/                # → starters/saaskit/src/app
│   │   ├── components/         # → starters/saaskit/src/components
│   │   └── shared/             # → split across packages
│   ├── devtools/               # → packages/devtools
│   └── scripts/codegen/        # → packages/devtools/src/codegen
│
└── unisane-monorepo/           # Target
    ├── packages/
    │   ├── ui/                 # ✅ Exists
    │   ├── cli/                # ✅ Exists (UI components)
    │   ├── data-table/         # ✅ Exists
    │   ├── tokens/             # ✅ Exists
    │   ├── eslint-config/      # ✅ Exists
    │   ├── typescript-config/  # ✅ Exists
    │   ├── tailwind-config/    # ✅ Exists
    │   ├── kernel/             # 🔴 To create
    │   ├── gateway/            # 🔴 To create
    │   ├── devtools/           # 🔴 To create
    │   ├── contracts/          # 🔴 To create
    │   └── {17 modules}/       # 🔴 To create
    └── starters/
        └── saaskit/            # 🔴 To create
```

---

## Pre-Migration Checklist

```bash
# 1. Backup everything
cd /Users/bhaskarbarma/Desktop/TOP/Unisane
cp -r saaskit saaskit-backup-$(date +%Y%m%d)

# 2. Ensure monorepo is clean
cd unisane-monorepo
git status  # Should be clean
pnpm install
pnpm build  # Should pass

# 3. Create migration branch
git checkout -b migration/saaskit-integration
```

---

## Phase 1: Create Package Structure

### Step 1.1: Create Directory Structure

```bash
cd /Users/bhaskarbarma/Desktop/TOP/Unisane/unisane-monorepo

# Foundation packages
mkdir -p packages/kernel/src/{context,database,events,cache,errors,observability,utils,rbac}
mkdir -p packages/gateway/src/{handler,auth,middleware,errors,query,response}
mkdir -p packages/contracts/src
mkdir -p packages/devtools/src/{commands,generators}

# Business modules (Layer 1-5)
for module in identity settings storage tenants auth billing flags audit credits usage notify webhooks media pdf ai; do
  mkdir -p packages/$module/src/{domain,service,data}
  mkdir -p packages/$module/__tests__
done

# PRO modules
for module in analytics sso import-export; do
  mkdir -p packages/$module/src/{domain,service,data}
  mkdir -p packages/$module/__tests__
done

# Starter
mkdir -p starters/saaskit/src/{app,platform,sdk,components,hooks,lib}

# Shared configs
mkdir -p packages/test-utils/src
```

### Step 1.2: Create Package.json Files

```bash
# Helper function to create package.json
create_package() {
  local name=$1
  local deps=$2

  cat > packages/$name/package.json << EOF
{
  "name": "@unisane/$name",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    $deps
  },
  "devDependencies": {
    "@unisane/typescript-config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
EOF
}

# Create kernel (no deps)
create_package "kernel" '"zod": "^3.22.0", "mongodb": "^6.3.0", "ioredis": "^5.3.0"'

# Create gateway (depends on kernel)
create_package "gateway" '"@unisane/kernel": "workspace:*", "zod": "^3.22.0"'

# Create contracts
create_package "contracts" '"@ts-rest/core": "^3.45.0", "zod": "^3.22.0"'

# Create business modules
for module in identity settings storage; do
  create_package "$module" '"@unisane/kernel": "workspace:*"'
done

for module in tenants auth; do
  create_package "$module" '"@unisane/kernel": "workspace:*", "@unisane/identity": "workspace:*"'
done

# ... continue for other modules based on layer dependencies
```

### Step 1.3: Create tsconfig.json for Each Package

```bash
for pkg in kernel gateway contracts identity settings storage tenants auth billing flags audit credits usage notify webhooks media pdf ai analytics sso import-export devtools test-utils; do
  cat > packages/$pkg/tsconfig.json << 'EOF'
{
  "extends": "@unisane/typescript-config/node-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
EOF
done
```

### Step 1.4: Update Workspace Config

```bash
# Update pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
  - "starters/*"
EOF
```

---

## Phase 2: Extract Kernel

### Step 2.1: Copy Core Files

```bash
SAASKIT="/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit"
MONOREPO="/Users/bhaskarbarma/Desktop/TOP/Unisane/unisane-monorepo"

# Context system
cp $SAASKIT/src/core/db/context.ts $MONOREPO/packages/kernel/src/context/

# Database
cp $SAASKIT/src/core/db/connection.ts $MONOREPO/packages/kernel/src/database/
cp $SAASKIT/src/core/db/types.ts $MONOREPO/packages/kernel/src/database/

# KV/Cache
cp -r $SAASKIT/src/core/kv/* $MONOREPO/packages/kernel/src/cache/

# Repository base
cp -r $SAASKIT/src/core/repo/* $MONOREPO/packages/kernel/src/database/repo/

# Pagination
cp -r $SAASKIT/src/core/pagination/* $MONOREPO/packages/kernel/src/utils/pagination/

# Shared utils
cp $SAASKIT/src/shared/utils/crypto.ts $MONOREPO/packages/kernel/src/utils/
cp $SAASKIT/src/shared/utils/ids.ts $MONOREPO/packages/kernel/src/utils/
cp $SAASKIT/src/shared/utils/money.ts $MONOREPO/packages/kernel/src/utils/
cp $SAASKIT/src/shared/utils/dates.ts $MONOREPO/packages/kernel/src/utils/

# RBAC
cp -r $SAASKIT/src/shared/rbac/* $MONOREPO/packages/kernel/src/rbac/
```

### Step 2.2: Create Kernel Index

```bash
cat > $MONOREPO/packages/kernel/src/index.ts << 'EOF'
// Context
export { ctx, type RequestContext } from './context/context';

// Database
export { connectDb, getDb, getClient, setClient, col } from './database/connection';
export { withTransaction } from './database/transaction';
export { tenantFilter, assertTenantOwnership } from './database/tenant-scope';

// Cache
export { kv } from './cache/kv';

// Events
export { events } from './events/emitter';
export type { EventRegistry, TypedEvent } from './events/types';

// Errors
export * from './errors/domain-errors';
export { ErrorCatalog } from './errors/catalog';

// Utils
export * from './utils/crypto';
export * from './utils/ids';
export * from './utils/money';
export * from './utils/dates';
export { paginate, type PaginationParams } from './utils/pagination';

// RBAC
export { checkPermission, type Permission } from './rbac';

// Observability
export { logger } from './observability/logger';
export { tracer } from './observability/tracer';
export { metrics } from './observability/metrics';
EOF
```

### Step 2.3: Fix Imports in Kernel

```bash
# Replace saaskit imports with local imports
cd $MONOREPO/packages/kernel/src

# Find and replace patterns
find . -name "*.ts" -exec sed -i '' \
  -e "s|from '@/src/core/|from './|g" \
  -e "s|from '@/src/shared/|from '../|g" \
  {} \;
```

### Step 2.4: Build and Test Kernel

```bash
cd $MONOREPO/packages/kernel
pnpm build
pnpm check-types
```

---

## Phase 3: Extract Gateway

### Step 3.1: Copy Gateway Files

```bash
# Handler
cp $SAASKIT/src/gateway/handler.ts $MONOREPO/packages/gateway/src/handler/
cp $SAASKIT/src/gateway/sidecar.ts $MONOREPO/packages/gateway/src/handler/

# Auth strategies
cp $SAASKIT/src/gateway/auth/session.ts $MONOREPO/packages/gateway/src/auth/
cp $SAASKIT/src/gateway/auth/apikey.ts $MONOREPO/packages/gateway/src/auth/
cp $SAASKIT/src/gateway/auth/bearer.ts $MONOREPO/packages/gateway/src/auth/
cp $SAASKIT/src/gateway/auth/types.ts $MONOREPO/packages/gateway/src/auth/

# Middleware
cp $SAASKIT/src/gateway/rateLimit.ts $MONOREPO/packages/gateway/src/middleware/
cp $SAASKIT/src/gateway/idempotency.ts $MONOREPO/packages/gateway/src/middleware/
cp $SAASKIT/src/gateway/csrf.ts $MONOREPO/packages/gateway/src/middleware/
cp $SAASKIT/src/gateway/tenantFilter.ts $MONOREPO/packages/gateway/src/middleware/

# Errors
cp $SAASKIT/src/gateway/errors.ts $MONOREPO/packages/gateway/src/errors/

# Query DSL
cp $SAASKIT/src/gateway/queryDsl.ts $MONOREPO/packages/gateway/src/query/

# Response
cp $SAASKIT/src/gateway/response.ts $MONOREPO/packages/gateway/src/response/
```

### Step 3.2: Create Gateway Index

```bash
cat > $MONOREPO/packages/gateway/src/index.ts << 'EOF'
// Handler
export { createHandler, type HandlerConfig } from './handler/handler';
export { createSidecar } from './handler/sidecar';

// Auth
export { sessionAuth } from './auth/session';
export { apiKeyAuth } from './auth/apikey';
export { bearerAuth } from './auth/bearer';
export type { AuthStrategy, AuthResult } from './auth/types';

// Middleware
export { rateLimit } from './middleware/rateLimit';
export { idempotency } from './middleware/idempotency';
export { csrf } from './middleware/csrf';

// Errors
export { mapError, HttpError } from './errors/errors';

// Query
export { parseQueryDsl, type QueryDslOptions } from './query/queryDsl';

// Response
export { success, error, paginated } from './response/response';
EOF
```

### Step 3.3: Fix Imports in Gateway

```bash
cd $MONOREPO/packages/gateway/src

find . -name "*.ts" -exec sed -i '' \
  -e "s|from '@/src/gateway/|from './|g" \
  -e "s|from '@/src/core/|from '@unisane/kernel|g" \
  -e "s|from '@/src/shared/|from '@unisane/kernel|g" \
  {} \;
```

---

## Phase 4: Extract Modules

### Step 4.1: Module Extraction Script

```bash
#!/bin/bash
# extract-module.sh

SAASKIT="/Users/bhaskarbarma/Desktop/TOP/Unisane/saaskit"
MONOREPO="/Users/bhaskarbarma/Desktop/TOP/Unisane/unisane-monorepo"

extract_module() {
  local module=$1
  echo "Extracting module: $module"

  # Copy source files
  cp -r $SAASKIT/src/modules/$module/* $MONOREPO/packages/$module/src/

  # Move domain files
  mkdir -p $MONOREPO/packages/$module/src/domain
  mv $MONOREPO/packages/$module/src/schemas.ts $MONOREPO/packages/$module/src/domain/ 2>/dev/null || true
  mv $MONOREPO/packages/$module/src/types.ts $MONOREPO/packages/$module/src/domain/ 2>/dev/null || true
  mv $MONOREPO/packages/$module/src/constants.ts $MONOREPO/packages/$module/src/domain/ 2>/dev/null || true

  # Move service files
  mkdir -p $MONOREPO/packages/$module/src/service
  mv $MONOREPO/packages/$module/src/*.service.ts $MONOREPO/packages/$module/src/service/ 2>/dev/null || true
  mv $MONOREPO/packages/$module/src/crud.ts $MONOREPO/packages/$module/src/service/ 2>/dev/null || true

  # Move data files
  mkdir -p $MONOREPO/packages/$module/src/data
  mv $MONOREPO/packages/$module/src/*.repo.ts $MONOREPO/packages/$module/src/data/ 2>/dev/null || true
  mv $MONOREPO/packages/$module/src/*.repo.mongo.ts $MONOREPO/packages/$module/src/data/ 2>/dev/null || true

  echo "✓ Module $module extracted"
}

# Extract all modules in order
for module in identity settings storage tenants auth billing flags audit credits usage notify webhooks media pdf ai analytics sso import-export; do
  if [ -d "$SAASKIT/src/modules/$module" ]; then
    extract_module $module
  fi
done
```

### Step 4.2: Fix Module Imports

```bash
#!/bin/bash
# fix-module-imports.sh

MONOREPO="/Users/bhaskarbarma/Desktop/TOP/Unisane/unisane-monorepo"

fix_imports() {
  local pkg=$1
  cd $MONOREPO/packages/$pkg/src

  find . -name "*.ts" -exec sed -i '' \
    -e "s|from '@/src/modules/identity|from '@unisane/identity|g" \
    -e "s|from '@/src/modules/settings|from '@unisane/settings|g" \
    -e "s|from '@/src/modules/storage|from '@unisane/storage|g" \
    -e "s|from '@/src/modules/tenants|from '@unisane/tenants|g" \
    -e "s|from '@/src/modules/auth|from '@unisane/auth|g" \
    -e "s|from '@/src/modules/billing|from '@unisane/billing|g" \
    -e "s|from '@/src/modules/flags|from '@unisane/flags|g" \
    -e "s|from '@/src/modules/audit|from '@unisane/audit|g" \
    -e "s|from '@/src/modules/credits|from '@unisane/credits|g" \
    -e "s|from '@/src/modules/usage|from '@unisane/usage|g" \
    -e "s|from '@/src/modules/notify|from '@unisane/notify|g" \
    -e "s|from '@/src/modules/webhooks|from '@unisane/webhooks|g" \
    -e "s|from '@/src/modules/media|from '@unisane/media|g" \
    -e "s|from '@/src/modules/pdf|from '@unisane/pdf|g" \
    -e "s|from '@/src/modules/ai|from '@unisane/ai|g" \
    -e "s|from '@/src/core/|from '@unisane/kernel|g" \
    -e "s|from '@/src/gateway/|from '@unisane/gateway|g" \
    -e "s|from '@/src/shared/|from '@unisane/kernel|g" \
    {} \;
}

for pkg in identity settings storage tenants auth billing flags audit credits usage notify webhooks media pdf ai analytics sso import-export; do
  fix_imports $pkg
done
```

### Step 4.3: Create Module Index Files

```bash
#!/bin/bash
# create-module-indexes.sh

create_index() {
  local module=$1
  local pkg_dir="$MONOREPO/packages/$module/src"

  cat > $pkg_dir/index.ts << EOF
// Domain
export * from './domain/types';
export * from './domain/schemas';

// Service
export * from './service';

// Data (for DI setup)
export * from './data';
EOF
}

for module in identity settings storage tenants auth billing flags audit credits usage notify webhooks media pdf ai analytics sso import-export; do
  create_index $module
done
```

---

## Phase 5: Extract DevTools

### Step 5.1: Copy DevTools

```bash
# Copy devtools
cp -r $SAASKIT/devtools/* $MONOREPO/packages/devtools/src/

# Copy codegen scripts
cp -r $SAASKIT/scripts/codegen/* $MONOREPO/packages/devtools/src/codegen/
```

### Step 5.2: Create DevTools Package.json

```bash
cat > $MONOREPO/packages/devtools/package.json << 'EOF'
{
  "name": "@unisane/devtools",
  "version": "0.0.0",
  "type": "module",
  "bin": {
    "unisane-devtools": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm",
    "dev": "tsup src/index.ts --format esm --watch"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.1",
    "prompts": "^2.4.2",
    "fs-extra": "^11.1.1",
    "diff": "^5.2.0"
  },
  "devDependencies": {
    "@unisane/typescript-config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
EOF
```

---

## Phase 6: Create Starter

### Step 6.1: Copy App Files

```bash
# Copy Next.js app
cp -r $SAASKIT/src/app/* $MONOREPO/starters/saaskit/src/app/

# Copy platform (providers, jobs)
cp -r $SAASKIT/src/platform/* $MONOREPO/starters/saaskit/src/platform/

# Copy SDK
cp -r $SAASKIT/src/sdk/* $MONOREPO/starters/saaskit/src/sdk/

# Copy components
cp -r $SAASKIT/src/components/* $MONOREPO/starters/saaskit/src/components/

# Copy hooks
cp -r $SAASKIT/src/hooks/* $MONOREPO/starters/saaskit/src/hooks/

# Copy context
cp -r $SAASKIT/src/context/* $MONOREPO/starters/saaskit/src/context/

# Copy config files
cp $SAASKIT/next.config.js $MONOREPO/starters/saaskit/
cp $SAASKIT/tailwind.config.ts $MONOREPO/starters/saaskit/
cp $SAASKIT/postcss.config.js $MONOREPO/starters/saaskit/
cp $SAASKIT/tsconfig.json $MONOREPO/starters/saaskit/
cp $SAASKIT/.env.example $MONOREPO/starters/saaskit/
```

### Step 6.2: Create Starter Package.json

```bash
cat > $MONOREPO/starters/saaskit/package.json << 'EOF'
{
  "name": "@unisane/saaskit",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "check-types": "tsc --noEmit",
    "devtools": "unisane-devtools",
    "routes:gen": "unisane-devtools routes:gen",
    "sdk:gen": "unisane-devtools sdk:gen",
    "doctor": "unisane-devtools doctor",
    "sync": "unisane-devtools sync"
  },
  "dependencies": {
    "@unisane/kernel": "workspace:*",
    "@unisane/gateway": "workspace:*",
    "@unisane/contracts": "workspace:*",
    "@unisane/identity": "workspace:*",
    "@unisane/settings": "workspace:*",
    "@unisane/storage": "workspace:*",
    "@unisane/tenants": "workspace:*",
    "@unisane/auth": "workspace:*",
    "@unisane/billing": "workspace:*",
    "@unisane/flags": "workspace:*",
    "@unisane/audit": "workspace:*",
    "@unisane/credits": "workspace:*",
    "@unisane/usage": "workspace:*",
    "@unisane/notify": "workspace:*",
    "@unisane/webhooks": "workspace:*",
    "@unisane/media": "workspace:*",
    "@unisane/pdf": "workspace:*",
    "@unisane/ai": "workspace:*",
    "@unisane/ui": "workspace:*",
    "@unisane/data-table": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@unisane/devtools": "workspace:*",
    "@unisane/typescript-config": "workspace:*",
    "@unisane/eslint-config": "workspace:*",
    "@unisane/tailwind-config": "workspace:*",
    "typescript": "^5.3.0"
  }
}
EOF
```

### Step 6.3: Create Bootstrap File

```bash
cat > $MONOREPO/starters/saaskit/src/bootstrap.ts << 'EOF'
/**
 * Bootstrap - Wire all modules together
 * Called once at app startup (instrumentation.ts or first request)
 */

import { setClient, connectDb } from '@unisane/kernel';

// Module setup functions
import { setUserRepo, createMongoUserRepo, registerIdentityHandlers } from '@unisane/identity';
import { setSettingsRepo, createMongoSettingsRepo } from '@unisane/settings';
import { setTenantRepo, createMongoTenantRepo, registerTenantHandlers } from '@unisane/tenants';
import { setAuthRepo, createMongoAuthRepo, registerAuthHandlers } from '@unisane/auth';
import { setBillingProvider, registerBillingHandlers } from '@unisane/billing';
import { setFlagsRepo, createMongoFlagsRepo } from '@unisane/flags';
import { registerAuditHandlers } from '@unisane/audit';
import { registerCreditsHandlers } from '@unisane/credits';
import { registerUsageHandlers } from '@unisane/usage';
import { setNotifyProvider } from '@unisane/notify';
import { registerWebhookHandlers } from '@unisane/webhooks';
import { setStorageProvider } from '@unisane/storage';
import { setMediaRepo, createMongoMediaRepo } from '@unisane/media';
import { setAiProvider } from '@unisane/ai';

// Providers
import { createStripeProvider } from './platform/providers/billing/stripe';
import { createResendProvider } from './platform/providers/email/resend';
import { createS3Provider } from './platform/providers/storage/s3';
import { createOpenAIProvider } from './platform/providers/ai/openai';

let bootstrapped = false;

export async function bootstrap() {
  if (bootstrapped) return;

  // 1. Database
  await connectDb();

  // 2. Set up repositories (DI)
  setUserRepo(createMongoUserRepo());
  setSettingsRepo(createMongoSettingsRepo());
  setTenantRepo(createMongoTenantRepo());
  setAuthRepo(createMongoAuthRepo());
  setFlagsRepo(createMongoFlagsRepo());
  setMediaRepo(createMongoMediaRepo());

  // 3. Set up providers
  setBillingProvider(createStripeProvider());
  setNotifyProvider(createResendProvider());
  setStorageProvider(createS3Provider());
  setAiProvider(createOpenAIProvider());

  // 4. Register event handlers
  registerIdentityHandlers();
  registerTenantHandlers();
  registerAuthHandlers();
  registerBillingHandlers();
  registerAuditHandlers();
  registerCreditsHandlers();
  registerUsageHandlers();
  registerWebhookHandlers();

  bootstrapped = true;
  console.log('✓ Bootstrap complete');
}
EOF
```

---

## Phase 7: Validation

### Step 7.1: Install Dependencies

```bash
cd $MONOREPO
pnpm install
```

### Step 7.2: Build All Packages

```bash
pnpm build
```

### Step 7.3: Type Check

```bash
pnpm check-types
```

### Step 7.4: Run Tests

```bash
pnpm test
```

### Step 7.5: Test Starter Dev Server

```bash
cd starters/saaskit
pnpm dev
```

---

## Quick Reference: Import Mapping

| SaasKit Import | Monorepo Import |
|----------------|-----------------|
| `@/src/core/db` | `@unisane/kernel` |
| `@/src/core/kv` | `@unisane/kernel` |
| `@/src/gateway/handler` | `@unisane/gateway` |
| `@/src/gateway/auth/*` | `@unisane/gateway` |
| `@/src/modules/identity` | `@unisane/identity` |
| `@/src/modules/billing` | `@unisane/billing` |
| `@/src/modules/{module}` | `@unisane/{module}` |
| `@/src/shared/utils` | `@unisane/kernel` |
| `@/src/shared/rbac` | `@unisane/kernel` |
| `@/src/contracts/*` | `@unisane/contracts` |

---

## Troubleshooting

### Common Issues

**1. Circular dependency detected**
```bash
# Check which packages have cycles
pnpm why @unisane/billing
# Refactor to break the cycle or use dynamic imports
```

**2. Type errors after migration**
```bash
# Check specific package
cd packages/billing
pnpm check-types 2>&1 | head -50
```

**3. Module not found**
```bash
# Ensure package is built
pnpm --filter @unisane/kernel build

# Check exports in package.json
```

**4. Runtime import errors**
```bash
# Check the dist folder was created
ls packages/kernel/dist/

# Rebuild
pnpm build --force
```

---

## Order of Operations

```
1. Create directories              [5 min]
2. Create package.json files       [10 min]
3. Extract kernel                  [30 min]
4. Fix kernel imports, build       [20 min]
5. Extract gateway                 [20 min]
6. Fix gateway imports, build      [15 min]
7. Extract modules (batch)         [45 min]
8. Fix module imports              [30 min]
9. Create module indexes           [15 min]
10. Build all modules              [10 min]
11. Extract devtools               [20 min]
12. Create starter                 [30 min]
13. Create bootstrap               [15 min]
14. Full build & test              [20 min]
15. Fix remaining issues           [variable]

Total: ~4-5 hours (excluding fixes)
```

---

**Document Status:** Ready for execution
