# Migration Guide

> Step-by-step guide for migrating SaasKit into the Unisane monorepo.
>
> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Overview

### Current State (Fragmented)

```
Unisane/
├── unisane-monorepo/    # UI library (pnpm + Turbo)
├── saaskit/             # SaaS starter (npm, standalone)
└── unisane-landing/     # Marketing site
```

### Target State (Unified)

```
unisane/
├── apps/
│   ├── web/             # Docs site
│   └── landing/         # Marketing
├── packages/
│   ├── kernel/          # Core infrastructure
│   ├── gateway/         # HTTP layer
│   ├── {modules}/       # 18 business modules
│   ├── ui/              # UI components
│   └── ...
├── starters/
│   └── saaskit/         # SaaS starter template
└── tools/
    └── release/         # Build & distribution
```

---

## Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
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

## Phase 0: Preparation

### Tasks

```
□ Backup all repositories
□ Document current SaasKit module boundaries
□ Create dependency graph from actual imports
□ Audit UI components: SaasKit vs Unisane UI
□ Set up new branch for migration
□ Create tracking spreadsheet for progress
```

### Dependency Analysis

Run this to find actual dependencies:

```bash
# In saaskit/src/modules/
for dir in */; do
  echo "=== $dir ==="
  grep -r "from '@" "$dir" | grep -v node_modules | cut -d"'" -f2 | sort -u
done
```

### Backup

```bash
# Create dated backup
DATE=$(date +%Y%m%d)
cp -r saaskit saaskit-backup-$DATE
cp -r unisane-monorepo unisane-monorepo-backup-$DATE
```

---

## Phase 1: Restructure Monorepo

### 1.1 Create Directory Structure

```bash
cd unisane-monorepo

# Create new directories
mkdir -p packages/{kernel,gateway}
mkdir -p packages/{identity,settings,storage}
mkdir -p packages/{tenants,auth}
mkdir -p packages/{billing,flags,audit}
mkdir -p packages/{credits,usage,notify,webhooks}
mkdir -p packages/{media,pdf,ai}
mkdir -p packages/{analytics,sso,import-export}  # PRO
mkdir -p packages/{contracts,test-utils}
mkdir -p starters/saaskit
mkdir -p tools/release/src
```

### 1.2 Update pnpm-workspace.yaml

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "starters/*"
  - "tools/*"
```

### 1.3 Update turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.base.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "dependsOn": [],
      "outputs": []
    },
    "check-types": {
      "dependsOn": ["^check-types"]
    },
    "lint": {}
  }
}
```

### 1.4 Create Base tsconfig

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 1.5 Verify Setup

```bash
pnpm install
pnpm build  # Should succeed with existing packages
```

---

## Phase 2: Create Kernel

### 2.1 Initialize Package

```bash
cd packages/kernel

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@unisane/kernel",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./errors": {
      "types": "./dist/errors/index.d.ts",
      "import": "./dist/errors/index.js"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "mongodb": "^6.0.0",
    "pino": "^9.0.0",
    "zod": "^3.23.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

# Create tsup.config.ts
cat > tsup.config.ts << 'EOF'
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/errors/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
EOF
```

### 2.2 Implement Core Components

Create files as specified in [kernel.md](./kernel.md):

```
packages/kernel/src/
├── index.ts
├── context/
├── database/
├── events/
├── cache/
├── errors/
├── observability/
├── utils/
└── rbac/
```

### 2.3 Write Tests

```bash
mkdir -p packages/kernel/__tests__/{unit,integration}
```

### 2.4 Verify Build

```bash
cd packages/kernel
pnpm build
pnpm test
```

---

## Phase 3: Create Gateway

### 3.1 Initialize Package

```bash
cd packages/gateway

# Similar setup to kernel
# See Phase 2 for package.json template
```

### 3.2 Implement Components

```
packages/gateway/src/
├── index.ts
├── handler/
├── auth/
├── middleware/
├── errors/
├── query/
└── response/
```

### 3.3 Dependencies

```json
{
  "dependencies": {
    "@unisane/kernel": "workspace:*",
    "zod": "^3.23.0"
  }
}
```

---

## Phase 4: Extract Modules

### Module Extraction Order

Extract in layer order to respect dependencies:

```
1. Layer 1: identity, settings, storage
2. Layer 2: tenants, auth
3. Layer 3: billing, flags, audit
4. Layer 4: credits, usage, notify, webhooks
5. Layer 5: media, pdf, ai
6. PRO: analytics, sso, import-export
```

### Extraction Process (Per Module)

#### Step 1: Create Package

```bash
cd packages/billing

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@unisane/billing",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest"
  },
  "dependencies": {
    "@unisane/kernel": "workspace:*",
    "@unisane/tenants": "workspace:*",
    "@unisane/settings": "workspace:*",
    "@unisane/flags": "workspace:*",
    "zod": "^3.23.0"
  }
}
EOF
```

#### Step 2: Copy Code from SaasKit

```bash
# Copy from saaskit
cp -r ../../../saaskit/src/modules/billing/domain src/domain
cp -r ../../../saaskit/src/modules/billing/data src/data
cp -r ../../../saaskit/src/modules/billing/service src/service
```

#### Step 3: Consolidate Service Files

SaasKit has one-file-per-function. Consolidate to grouped files:

**Before (SaasKit):**
```
service/
├── subscribe.ts
├── subscribeFactory.ts
├── cancel.ts
├── cancelFactory.ts
├── getSubscription.ts
└── ... (20+ files)
```

**After (Unified):**
```
service/
├── subscription.service.ts  # subscribe, cancel, get, list
├── invoice.service.ts       # create, get, list
├── payment.service.ts       # process, refund
├── admin/
│   └── admin.service.ts     # admin operations
└── handlers.ts              # event handlers
```

#### Step 4: Refactor Imports

Replace SaasKit imports with kernel:

```typescript
// Before (SaasKit)
import { ctx } from '@/core/context';
import { col } from '@/core/db';
import { emit } from '@/core/events';

// After (Unified)
import { ctx, col, events } from '@unisane/kernel';
```

#### Step 5: Create Barrel Export

```typescript
// packages/billing/src/index.ts

// Types
export type { Subscription, Invoice } from './domain/types';

// Schemas
export { ZSubscribeInput, ZCancelInput } from './domain/schemas';

// Errors
export { SubscriptionNotFoundError } from './domain/errors';

// Service
export { subscribe, cancel, getSubscription } from './service';
export * as billingAdmin from './service/admin/admin.service';

// Provider
export type { BillingProvider } from './service/types';
export { setBillingProvider } from './service/provider';

// Repository
export { setSubscriptionRepo } from './data';
export { createMongoSubscriptionRepo } from './data/mongo';

// Event handlers
export { registerBillingHandlers } from './service/handlers';
```

#### Step 6: Write Tests

```bash
mkdir -p __tests__/{unit,integration}
# Write tests...
```

#### Step 7: Verify Build

```bash
pnpm build
pnpm test
```

### Module Checklist Template

For each module:

```
□ Create package structure
□ Copy code from SaasKit
□ Consolidate service files (100-300 lines each)
□ Refactor imports to use @unisane/kernel
□ Create barrel export (index.ts)
□ Write unit tests
□ Write integration tests
□ Verify build passes
□ Update module docs
```

---

## Phase 5: Create Starter Template

### 5.1 Structure

```
starters/saaskit/
├── src/
│   ├── app/              # Next.js App Router
│   ├── platform/         # Providers, jobs, outbox
│   │   ├── providers/
│   │   ├── jobs/
│   │   └── outbox/
│   ├── routes/           # API route handlers
│   ├── contracts/        # ts-rest contracts
│   └── bootstrap.ts      # Wire everything
├── package.json
├── next.config.mjs
└── tsconfig.json
```

### 5.2 Package.json

```json
{
  "name": "saaskit",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@unisane/kernel": "workspace:*",
    "@unisane/gateway": "workspace:*",
    "@unisane/identity": "workspace:*",
    "@unisane/tenants": "workspace:*",
    "@unisane/billing": "workspace:*",
    "@unisane/ui": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0"
  }
}
```

### 5.3 Bootstrap

```typescript
// starters/saaskit/src/bootstrap.ts

import { connectDb, events } from '@unisane/kernel';

// Module repositories
import { setSubscriptionRepo, createMongoSubscriptionRepo } from '@unisane/billing';
import { setUserRepo, createMongoUserRepo } from '@unisane/identity';
// ... more modules

// Module event handlers
import { registerBillingHandlers } from '@unisane/billing';
import { registerNotifyHandlers } from '@unisane/notify';
// ... more handlers

// Platform providers
import { createBillingProvider } from './platform/providers/billing';
import { createEmailProvider } from './platform/providers/email';
import { setBillingProvider } from '@unisane/billing';

export async function bootstrap() {
  // 1. Connect database
  await connectDb(process.env.MONGODB_URI!);

  // 2. Initialize repositories
  const db = getDb();
  setSubscriptionRepo(createMongoSubscriptionRepo(db));
  setUserRepo(createMongoUserRepo(db));
  // ... more repos

  // 3. Initialize providers
  setBillingProvider(createBillingProvider());

  // 4. Register event handlers
  registerBillingHandlers();
  registerNotifyHandlers();
  // ... more handlers

  console.log('Bootstrap complete');
}
```

---

## Phase 6: Build Tools

### 6.1 Build Script

```typescript
// tools/release/src/build-starter.ts

import { copySync, rmSync, readFileSync, writeFileSync } from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

interface BuildOptions {
  template: 'oss' | 'pro';
  starter: string;
  outputDir: string;
  version: string;
}

export async function buildStarter(options: BuildOptions) {
  const { template, starter, outputDir, version } = options;

  console.log(`Building ${starter} (${template}) v${version}...`);

  // 1. Clean
  rmSync(outputDir, { recursive: true, force: true });

  // 2. Copy starter
  copySync(`starters/${starter}`, outputDir);

  // 3. Flatten modules
  await flattenModules(outputDir);

  // 4. Copy UI
  await copyUIPackages(outputDir);

  // 5. Strip PRO (if OSS)
  if (template === 'oss') {
    await stripProContent(outputDir);
  }

  // 6. Transform imports
  await transformImports(outputDir);

  // 7. Update package.json
  await updatePackageJson(outputDir, version);

  console.log(`Done: ${outputDir}`);
}
```

### 6.2 Import Transform

```typescript
async function transformImports(outputDir: string) {
  const files = glob.sync(path.join(outputDir, 'src/**/*.{ts,tsx}'));

  for (const file of files) {
    let content = readFileSync(file, 'utf-8');

    // Module imports
    content = content.replace(
      /@unisane\/(kernel|gateway|identity|tenants|auth|billing|...)/g,
      '@/modules/$1'
    );

    // UI imports
    content = content.replace(/@unisane\/ui/g, '@/components/ui');

    writeFileSync(file, content);
  }
}
```

---

## Phase 7: CLI

### Commands

```bash
# Create new project
npx unisane create my-app

# Add UI component
npx unisane add button dialog

# Check for updates
npx unisane upgrade --check

# Apply upgrade
npx unisane upgrade

# Database commands
npx unisane db migrate
npx unisane db seed

# Health check
npx unisane doctor
```

---

## Phase 8: Testing

### Test All Layers

```bash
# Schema tests
pnpm test --project=schema

# Unit tests
pnpm test --project=unit

# Integration tests
pnpm test --project=integration

# E2E tests
pnpm test --project=e2e
```

### E2E Test: Create Project

```bash
# Test CLI create
npx unisane create test-project --template=saaskit

cd test-project
pnpm install
pnpm dev  # Should start

# Test features
curl http://localhost:3000/api/health
```

---

## Phase 9: Launch

### Checklist

```
□ All tests passing
□ Build scripts working
□ CLI published to npm
□ Documentation complete
□ Changelog written
□ Archive old repos
□ Update landing page
□ Announce on social media
```

### Post-Launch

- Monitor GitHub issues
- Respond to feedback
- Plan v1.1 based on feedback

---

## Rollback Plan

If migration fails:

1. **Keep old repos active** until migration is verified
2. **Test thoroughly** before archiving
3. **Document breaking changes** for existing users

---

## FAQ

### Q: Why not just update SaasKit in place?

A: Monorepo enables:
- Shared UI between projects
- Turbo caching for faster builds
- Single source of truth
- Easier testing

### Q: How long will this take?

A: ~30 days for a focused effort. Can be longer if done part-time.

### Q: What if something breaks?

A: Keep old repos as backup. Only archive after full verification.

### Q: Do users need to migrate?

A: Existing SaasKit users keep their code. New users get new structure.

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
