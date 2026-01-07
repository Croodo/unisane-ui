# Development Tools Configuration

> **Status:** AUTHORITATIVE
> **Last Updated:** 2025-01-06

Complete specification for all development tools in the Unisane monorepo.

---

## Table of Contents

1. [Overview](#overview)
2. [Tool Packages](#tool-packages)
3. [Shared Configurations](#shared-configurations)
4. [Git Hooks](#git-hooks)
5. [CI/CD](#cicd)
6. [CLI Tool](#cli-tool)
7. [Build Tools](#build-tools)
8. [Testing Infrastructure](#testing-infrastructure)
9. [Dependency Management](#dependency-management)

---

## Overview

### Tool Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEV TOOLS ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SHARED CONFIGS (packages/)          TOOLS (tools/)                         │
│  ────────────────────────            ────────────────                        │
│  @unisane/eslint-config              tools/cli/                             │
│  @unisane/typescript-config          tools/release/                         │
│  @unisane/tailwind-config                                                   │
│  @unisane/prettier-config                                                   │
│  @unisane/vitest-config                                                     │
│  @unisane/tsup-config                                                       │
│                                                                              │
│  ROOT CONFIGS                        CI/CD                                  │
│  ────────────────                    ─────                                  │
│  .husky/                             .github/workflows/                     │
│  commitlint.config.js                  ci.yml                               │
│  lint-staged.config.js                 release.yml                          │
│  .changeset/                           preview.yml                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Final Directory Structure

```
unisane/
├── packages/
│   ├── eslint-config/           # @unisane/eslint-config
│   ├── typescript-config/       # @unisane/typescript-config
│   ├── tailwind-config/         # @unisane/tailwind-config
│   ├── prettier-config/         # @unisane/prettier-config (NEW)
│   ├── vitest-config/           # @unisane/vitest-config (NEW)
│   └── tsup-config/             # @unisane/tsup-config (NEW)
│
├── tools/
│   ├── cli/                     # unisane CLI (extended)
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── init.ts      # Project init
│   │   │   │   ├── add.ts       # Add components/modules
│   │   │   │   ├── remove.ts    # Remove modules
│   │   │   │   ├── generate.ts  # Code generation
│   │   │   │   ├── dev.ts       # Dev server
│   │   │   │   ├── build.ts     # Build
│   │   │   │   ├── db.ts        # Database commands
│   │   │   │   ├── diff.ts      # Component diff
│   │   │   │   └── doctor.ts    # Health check
│   │   │   ├── templates/       # Code templates
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── release/                 # Build & release tools
│       ├── src/
│       │   ├── strip-pro.ts     # PRO code removal
│       │   ├── generate.ts      # Source generation
│       │   ├── bundle.ts        # Bundle for npm
│       │   └── publish.ts       # npm publish
│       └── package.json
│
├── .husky/                      # Git hooks
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
│
├── .changeset/                  # Version management
│   └── config.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI pipeline
│       ├── release.yml          # Release pipeline
│       └── preview.yml          # PR preview
│
├── commitlint.config.js
├── lint-staged.config.js
├── prettier.config.js
├── vitest.workspace.ts
└── turbo.json
```

---

## Tool Packages

### @unisane/eslint-config (Existing - Enhanced)

```
packages/eslint-config/
├── base.js              # Base rules for all packages
├── next.js              # Next.js specific rules
├── react-internal.js    # React library rules
├── node.js              # Node.js/server rules (NEW)
├── package.json
└── README.md
```

```javascript
// packages/eslint-config/base.js
import js from "@eslint/js";
import typescript from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  prettier,
  {
    rules: {
      // Prevent console.log in production
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // TypeScript specific
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Import organization
      "import/order": ["error", {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc" },
      }],
    },
  },
];
```

```javascript
// packages/eslint-config/node.js (NEW)
import base from "./base.js";

export default [
  ...base,
  {
    rules: {
      // Allow console in server code
      "no-console": "off",

      // Node.js specific
      "no-process-exit": "error",
      "no-sync": "warn",
    },
  },
];
```

```json
// packages/eslint-config/package.json
{
  "name": "@unisane/eslint-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./base": "./base.js",
    "./next": "./next.js",
    "./react-internal": "./react-internal.js",
    "./node": "./node.js"
  },
  "dependencies": {
    "@eslint/js": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import": "^2.29.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "typescript-eslint": "^7.0.0"
  },
  "peerDependencies": {
    "eslint": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

### @unisane/typescript-config (Existing - Enhanced)

```
packages/typescript-config/
├── base.json            # Base config
├── nextjs.json          # Next.js apps
├── react-library.json   # React packages
├── node-library.json    # Node.js packages (NEW)
├── package.json
└── README.md
```

```json
// packages/typescript-config/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

```json
// packages/typescript-config/node-library.json (NEW)
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "ESNext",
    "target": "ES2022",
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

---

### @unisane/prettier-config (NEW)

```
packages/prettier-config/
├── index.js
├── package.json
└── README.md
```

```javascript
// packages/prettier-config/index.js
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["clsx", "cn", "cva"],
};
```

```json
// packages/prettier-config/package.json
{
  "name": "@unisane/prettier-config",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": "./index.js"
  },
  "dependencies": {
    "prettier-plugin-tailwindcss": "^0.5.0"
  },
  "peerDependencies": {
    "prettier": "^3.0.0"
  }
}
```

**Usage in packages:**

```javascript
// prettier.config.js (in any package)
export { default } from "@unisane/prettier-config";
```

---

### @unisane/vitest-config (NEW)

```
packages/vitest-config/
├── base.ts              # Base config
├── react.ts             # React testing
├── node.ts              # Node.js testing
├── integration.ts       # Integration tests
├── package.json
└── README.md
```

```typescript
// packages/vitest-config/base.ts
import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/index.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});

export default baseConfig;
```

```typescript
// packages/vitest-config/react.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { baseConfig } from './base';

export const reactConfig = mergeConfig(baseConfig, defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}));

export default reactConfig;
```

```typescript
// packages/vitest-config/node.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './base';

export const nodeConfig = mergeConfig(baseConfig, defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // Longer timeout for DB operations
    testTimeout: 30000,
  },
}));

export default nodeConfig;
```

```typescript
// packages/vitest-config/integration.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import { nodeConfig } from './node';

export const integrationConfig = mergeConfig(nodeConfig, defineConfig({
  test: {
    include: ['**/*.integration.{test,spec}.ts'],
    // Sequential for DB tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 60000,
  },
}));

export default integrationConfig;
```

```json
// packages/vitest-config/package.json
{
  "name": "@unisane/vitest-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./base": "./base.ts",
    "./react": "./react.ts",
    "./node": "./node.ts",
    "./integration": "./integration.ts"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.2.0"
  },
  "peerDependencies": {
    "vitest": "^1.0.0"
  }
}
```

**Usage in packages:**

```typescript
// vitest.config.ts (in kernel package)
import { nodeConfig } from '@unisane/vitest-config/node';
export default nodeConfig;

// vitest.config.ts (in UI package)
import { reactConfig } from '@unisane/vitest-config/react';
export default reactConfig;
```

---

### @unisane/tsup-config (NEW)

```
packages/tsup-config/
├── base.ts
├── react.ts
├── node.ts
├── package.json
└── README.md
```

```typescript
// packages/tsup-config/base.ts
import type { Options } from 'tsup';

export const baseConfig: Options = {
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2022',
};

export default baseConfig;
```

```typescript
// packages/tsup-config/react.ts
import type { Options } from 'tsup';
import { baseConfig } from './base';

export const reactConfig: Options = {
  ...baseConfig,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
};

export default reactConfig;
```

```typescript
// packages/tsup-config/node.ts
import type { Options } from 'tsup';
import { baseConfig } from './base';

export const nodeConfig: Options = {
  ...baseConfig,
  platform: 'node',
  target: 'node18',
  external: [
    'mongodb',
    'ioredis',
    // Add other native deps
  ],
};

export default nodeConfig;
```

```json
// packages/tsup-config/package.json
{
  "name": "@unisane/tsup-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./base": "./base.ts",
    "./react": "./react.ts",
    "./node": "./node.ts"
  },
  "peerDependencies": {
    "tsup": "^8.0.0"
  }
}
```

**Usage in packages:**

```typescript
// tsup.config.ts (in kernel package)
import { defineConfig } from 'tsup';
import { nodeConfig } from '@unisane/tsup-config/node';

export default defineConfig({
  ...nodeConfig,
  entry: ['src/index.ts'],
});
```

---

## Shared Configurations

### Root Configuration Files

```javascript
// prettier.config.js (root)
export { default } from "@unisane/prettier-config";
```

```javascript
// commitlint.config.js (root)
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",     // New feature
        "fix",      // Bug fix
        "docs",     // Documentation
        "style",    // Formatting
        "refactor", // Code restructure
        "perf",     // Performance
        "test",     // Tests
        "build",    // Build system
        "ci",       // CI config
        "chore",    // Maintenance
        "revert",   // Revert commit
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "kernel",
        "gateway",
        "identity",
        "auth",
        "tenants",
        "billing",
        "ui",
        "cli",
        "docs",
        "deps",
        // Add all package names
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-max-length": [2, "always", 72],
  },
};
```

```javascript
// lint-staged.config.js (root)
export default {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write",
  ],
  "*.css": [
    "prettier --write",
  ],
};
```

```typescript
// vitest.workspace.ts (root)
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // All packages with tests
  'packages/kernel',
  'packages/gateway',
  'packages/identity',
  'packages/auth',
  'packages/tenants',
  'packages/billing',
  'packages/flags',
  'packages/audit',
  'packages/credits',
  'packages/usage',
  'packages/notify',
  'packages/webhooks',
  'packages/storage',
  'packages/media',
  'packages/pdf',
  'packages/ai',
  'packages/ui',
  'packages/cli',
  'starters/saaskit',
]);
```

---

## Git Hooks

### Husky Setup

```bash
# Install husky
pnpm add -D husky -w
pnpm exec husky init
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged
pnpm exec lint-staged

# Type check changed packages
pnpm exec turbo check-types --filter='...[HEAD^]'
```

```bash
# .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm exec commitlint --edit $1
```

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests for changed packages
pnpm exec turbo test --filter='...[origin/main]'
```

---

## CI/CD

### GitHub Actions - CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm check-types

  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm test
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          REDIS_URL: redis://localhost:6379

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            packages/*/dist
            starters/*/dist
```

### GitHub Actions - Release Pipeline

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
          registry-url: "https://registry.npmjs.org"

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - run: pnpm test

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version-packages
          commit: "chore: release packages"
          title: "chore: release packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### GitHub Actions - Preview Deployments

```yaml
# .github/workflows/preview.yml
name: Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm build --filter=web

      - uses: amondnet/vercel-action@v25
        id: vercel-action
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/web

      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: ${{ steps.vercel-action.outputs.preview-url }}'
            })
```

---

## CLI Tool

### Extended CLI Commands

The existing CLI handles UI components. We need to extend it for platform features.

```
tools/cli/
├── src/
│   ├── index.ts
│   ├── commands/
│   │   ├── ui/                  # Existing UI commands
│   │   │   ├── init.ts
│   │   │   ├── add.ts
│   │   │   ├── diff.ts
│   │   │   └── doctor.ts
│   │   │
│   │   └── platform/            # NEW: Platform commands
│   │       ├── init.ts          # Initialize platform project
│   │       ├── add.ts           # Add modules
│   │       ├── remove.ts        # Remove modules
│   │       ├── generate.ts      # Code generation
│   │       ├── dev.ts           # Dev server
│   │       ├── build.ts         # Build
│   │       └── db.ts            # Database commands
│   │
│   ├── templates/
│   │   ├── module/              # Module templates
│   │   ├── service/             # Service templates
│   │   ├── contract/            # Contract templates
│   │   └── migration/           # Migration templates
│   │
│   └── utils/
│       ├── prompts.ts
│       ├── fs.ts
│       └── deps.ts
│
└── package.json
```

```typescript
// tools/cli/src/index.ts (Extended)
#!/usr/bin/env node

import { Command } from "commander";

// UI commands (existing)
import { initCommand as uiInit } from "./commands/ui/init.js";
import { addCommand as uiAdd } from "./commands/ui/add.js";
import { diffCommand } from "./commands/ui/diff.js";
import { doctorCommand } from "./commands/ui/doctor.js";

// Platform commands (new)
import { initCommand as platformInit } from "./commands/platform/init.js";
import { addCommand as platformAdd } from "./commands/platform/add.js";
import { removeCommand } from "./commands/platform/remove.js";
import { generateCommand } from "./commands/platform/generate.js";
import { devCommand } from "./commands/platform/dev.js";
import { buildCommand } from "./commands/platform/build.js";
import { dbCommand } from "./commands/platform/db.js";

const program = new Command();

program
  .name("unisane")
  .description("Unisane CLI - UI components and platform tools")
  .version("1.0.0");

// ══════════════════════════════════════════════════════════════════════════
// UI COMMANDS (shadcn-style component management)
// ══════════════════════════════════════════════════════════════════════════

const ui = program.command("ui").description("UI component management");

ui.command("init")
  .description("Initialize Unisane UI in your project")
  .option("-y, --yes", "Skip confirmation prompts")
  .action(uiInit);

ui.command("add")
  .description("Add UI components")
  .argument("[components...]", "Components to add")
  .option("-a, --all", "Add all components")
  .action(uiAdd);

ui.command("diff")
  .description("Check for component updates")
  .argument("[component]", "Component to check")
  .action(diffCommand);

ui.command("doctor")
  .description("Check UI installation")
  .action(doctorCommand);

// ══════════════════════════════════════════════════════════════════════════
// PLATFORM COMMANDS (SaaS module management)
// ══════════════════════════════════════════════════════════════════════════

program
  .command("init")
  .description("Initialize a new Unisane platform project")
  .option("-t, --template <template>", "Template (saaskit, minimal)")
  .option("-d, --directory <dir>", "Target directory")
  .action(platformInit);

program
  .command("add")
  .description("Add modules to your project")
  .argument("<modules...>", "Modules to add (e.g., billing credits)")
  .action(platformAdd);

program
  .command("remove")
  .description("Remove modules from your project")
  .argument("<modules...>", "Modules to remove")
  .action(removeCommand);

// ══════════════════════════════════════════════════════════════════════════
// GENERATE COMMANDS
// ══════════════════════════════════════════════════════════════════════════

const generate = program
  .command("generate")
  .alias("g")
  .description("Generate code scaffolds");

generate
  .command("module <name>")
  .description("Generate a new module")
  .option("--layer <layer>", "Module layer (1-5)")
  .action((name, opts) => generateCommand("module", name, opts));

generate
  .command("service <name>")
  .description("Generate a service file")
  .option("-m, --module <module>", "Target module")
  .action((name, opts) => generateCommand("service", name, opts));

generate
  .command("contract <name>")
  .description("Generate an API contract")
  .action((name, opts) => generateCommand("contract", name, opts));

generate
  .command("migration <name>")
  .description("Generate a migration file")
  .action((name, opts) => generateCommand("migration", name, opts));

// ══════════════════════════════════════════════════════════════════════════
// DEV COMMANDS
// ══════════════════════════════════════════════════════════════════════════

program
  .command("dev")
  .description("Start development server")
  .option("--seed", "Seed database on start")
  .option("-p, --port <port>", "Port number")
  .action(devCommand);

program
  .command("build")
  .description("Build for production")
  .option("--analyze", "Analyze bundle size")
  .action(buildCommand);

// ══════════════════════════════════════════════════════════════════════════
// DATABASE COMMANDS
// ══════════════════════════════════════════════════════════════════════════

const db = program.command("db").description("Database operations");

db.command("seed")
  .description("Seed the database")
  .option("--fresh", "Reset before seeding")
  .action((opts) => dbCommand("seed", opts));

db.command("migrate")
  .description("Run migrations")
  .option("--rollback", "Rollback last migration")
  .action((opts) => dbCommand("migrate", opts));

db.command("reset")
  .description("Reset database (DESTRUCTIVE)")
  .option("--force", "Skip confirmation")
  .action((opts) => dbCommand("reset", opts));

// ══════════════════════════════════════════════════════════════════════════
// LIST COMMAND
// ══════════════════════════════════════════════════════════════════════════

program
  .command("list")
  .description("List available modules")
  .option("--installed", "Show only installed modules")
  .action(async (opts) => {
    const { listModules } = await import("./commands/platform/list.js");
    await listModules(opts);
  });

program.parse();
```

---

## Build Tools

### Release Tool Structure

```
tools/release/
├── src/
│   ├── index.ts           # CLI entry
│   ├── strip-pro.ts       # PRO code removal
│   ├── generate.ts        # Source generation
│   ├── bundle.ts          # Bundle creation
│   └── verify.ts          # Verification
├── package.json
└── tsconfig.json
```

```json
// tools/release/package.json
{
  "name": "@unisane/release-tools",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "bin": {
    "unisane-release": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm",
    "strip-pro": "tsx src/strip-pro.ts",
    "generate": "tsx src/generate.ts",
    "bundle": "tsx src/bundle.ts",
    "verify": "tsx src/verify.ts"
  },
  "dependencies": {
    "recast": "^0.23.0",
    "ast-types": "^0.14.0",
    "glob": "^10.0.0",
    "fs-extra": "^11.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Testing Infrastructure

### Test Utils Package

```
packages/test-utils/
├── src/
│   ├── index.ts
│   ├── db.ts              # Database test helpers
│   ├── fixtures.ts        # Fixture factories
│   ├── mocks.ts           # Common mocks
│   ├── context.ts         # Test context setup
│   └── assertions.ts      # Custom assertions
├── package.json
└── tsconfig.json
```

```typescript
// packages/test-utils/src/db.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { setClient } from '@unisane/kernel';

let mongod: MongoMemoryServer | null = null;
let client: MongoClient | null = null;

export async function setupTestDb() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = await MongoClient.connect(uri);
  setClient(client);
  return client;
}

export async function teardownTestDb() {
  if (client) {
    await client.close();
    client = null;
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

export async function clearCollections() {
  if (!client) return;
  const db = client.db();
  const collections = await db.listCollections().toArray();
  await Promise.all(
    collections.map(({ name }) => db.collection(name).deleteMany({}))
  );
}
```

```typescript
// packages/test-utils/src/context.ts
import { ctx } from '@unisane/kernel';
import type { RequestContext } from '@unisane/kernel';

export function createTestContext(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    requestId: 'test-request-id',
    startTime: Date.now(),
    isAuthenticated: true,
    userId: 'test-user-id',
    tenantId: 'test-tenant-id',
    role: 'admin',
    permissions: ['*'],
    ...overrides,
  };
}

export async function runWithTestContext<T>(
  fn: () => Promise<T>,
  overrides: Partial<RequestContext> = {}
): Promise<T> {
  const context = createTestContext(overrides);
  return ctx.run(context, fn);
}
```

```typescript
// packages/test-utils/src/fixtures.ts
import { faker } from '@faker-js/faker';

export const fixtures = {
  user: (overrides = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    createdAt: faker.date.past(),
    ...overrides,
  }),

  tenant: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    createdAt: faker.date.past(),
    ...overrides,
  }),

  subscription: (overrides = {}) => ({
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    planId: 'pro',
    status: 'active',
    currentPeriodStart: faker.date.recent(),
    currentPeriodEnd: faker.date.future(),
    ...overrides,
  }),
};
```

---

## Dependency Management

### Changesets Configuration

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "unisane/unisane" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [
    ["@unisane/kernel", "@unisane/gateway"],
    ["@unisane/ui", "@unisane/data-table", "@unisane/tokens"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@unisane/eslint-config",
    "@unisane/typescript-config",
    "@unisane/prettier-config"
  ]
}
```

### Renovate Configuration

```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":preserveSemverRanges",
    "group:allNonMajor"
  ],
  "labels": ["dependencies"],
  "schedule": ["before 6am on monday"],
  "packageRules": [
    {
      "groupName": "TypeScript",
      "matchPackagePatterns": ["typescript", "@types/*"]
    },
    {
      "groupName": "Testing",
      "matchPackagePatterns": ["vitest", "@testing-library/*"]
    },
    {
      "groupName": "ESLint",
      "matchPackagePatterns": ["eslint", "eslint-*", "@typescript-eslint/*"]
    },
    {
      "groupName": "Next.js",
      "matchPackagePatterns": ["next", "@next/*"]
    }
  ],
  "ignoreDeps": []
}
```

---

## SaasKit DevTools (Migration)

> **CRITICAL:** These are the existing SaasKit developer tools that MUST be preserved and enhanced during migration. They form the backbone of the DX and productivity story.

### DevTools Overview

The existing SaasKit has a comprehensive `devtools/` directory with CLI commands for:

```
saaskit/devtools/
├── index.ts                    # Main devtools entry
├── env.ts                      # Environment loader
├── utils.ts                    # Shared utilities
└── commands/
    ├── billing-plans.ts        # Print billing plans
    ├── billing-stripe-seed.ts  # Seed Stripe products/prices
    ├── billing-configure-stripe-portal.ts  # Configure Stripe portal
    ├── crud.ts                 # CRUD module scaffolding
    ├── db-query.ts             # Database queries
    ├── diagrams.generate.ts    # Generate architecture diagrams
    ├── doctor.ts               # Code health checks
    ├── indexes.apply.ts        # Apply database indexes
    ├── openapi.serve.ts        # Serve OpenAPI docs
    ├── rbac-cache.ts           # Invalidate RBAC cache
    ├── routes.graph.ts         # Route dependency graph
    ├── tenant-info.ts          # Get tenant information
    ├── tenant-reset.ts         # Reset tenant billing
    └── watch.ts                # Watch mode for devtools
```

### Command Reference

#### Code Generation Commands

##### `routes:gen` - Route Handler Generation

Generates Next.js route handlers from ts-rest contracts with metadata.

```bash
npm run devtools routes:gen
npm run devtools routes:gen --rewrite    # Force rewrite all
npm run devtools routes:gen --no-scaffold # Skip missing wrappers
```

**What it does:**
1. Scans all `*.contract.ts` files in `src/contracts/`
2. Reads `defineOpMeta()` service mappings
3. Generates route handlers at `src/app/api/**/route.ts`
4. Merges imports and method handlers per route file
5. Sets runtime (`nodejs` or `edge`) from contract metadata

**Generated Output Example:**
```typescript
/* AUTO-GENERATED by 'npm run routes:gen' — DO NOT EDIT */
import { NextResponse } from 'next/server';
import { listUsers } from '@/src/modules/users/service/crud';
import { createUser } from '@/src/modules/users/service/crud';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Auto-generated handler with validation, auth, rate limiting
}

export async function POST(request: Request) {
  // Auto-generated handler
}
```

##### `sdk:gen` - SDK Generation

Generates typed API clients and React Query hooks from contracts.

```bash
npm run devtools sdk:gen
```

**Sub-generators:**
1. **`gen-clients.ts`** — Generates browser + server API clients
2. **`gen-hooks.ts`** — Generates React Query hooks (useQuery, useMutation)
3. **`gen-invalidate.ts`** — Generates cache invalidation utilities
4. **`gen-types.ts`** — Generates request/response types

**Generated Files:**
```
src/sdk/clients/generated/
├── browser.ts          # Browser fetch client
├── server.ts           # Server-side client (with cookies forwarding)
└── index.ts            # Barrel export

src/sdk/hooks/generated/
├── users.hooks.ts      # useUsersList, useUserCreate, etc.
├── tenants.hooks.ts
└── index.ts
```

**Client Usage:**
```typescript
// Browser
import { browserApi } from '@/src/sdk/clients/generated/browser';
const api = await browserApi();
const users = await api.users.list({ limit: 20 });

// Server (RSC/Server Actions)
import { serverApi } from '@/src/sdk/clients/generated/server';
const api = await serverApi();
const user = await api.users.read('user-123');
```

##### `crud` - CRUD Module Scaffolding

Scaffolds a complete CRUD module with types, schemas, repo, service, and contract.

```bash
npm run devtools crud <module-name> [options]

# Options:
#   --tenant         # Tenant-scoped module
#   --slug           # Add slug field
#   --unique=<field> # Add unique constraint
#   --ui             # Generate list page
#   --ui=form        # Generate list + form pages
```

**Example:**
```bash
npm run devtools crud products --tenant --slug --ui=form
```

**Generated Structure:**
```
src/modules/products/
├── domain/
│   ├── types.ts        # Product type definition
│   └── schemas.ts      # Zod validation schemas
├── data/
│   └── repo.mongo.ts   # MongoDB repository
├── service/
│   └── crud.ts         # CRUD service functions
└── index.ts            # Barrel export

src/contracts/products.contract.ts  # ts-rest contract

src/app/(tenant)/w/[slug]/products/ # UI pages (if --ui)
├── page.tsx            # List page
├── new/page.tsx        # Create form
├── [id]/edit/page.tsx  # Edit form
└── [id]/delete/page.tsx # Delete confirmation
```

**Auto-patches:**
- `src/contracts/app.router.ts` — Adds contract import
- `scripts/indexes/apply.ts` — Adds DB indexes
- `src/shared/constants/rateLimits.ts` — Adds rate-limit policies

##### `sync` - Full Sync Command

Regenerates all routes and SDK, runs doctor with fixes.

```bash
npm run devtools sync
```

**What it does:**
1. `routes:gen --rewrite`
2. `fixRouteWrappers()`
3. `gen-clients`
4. `gen-hooks`
5. `gen-invalidate`
6. `gen-types`
7. `doctor --fix`

---

#### Billing Commands

##### `billing:plans` - Print Billing Plans

Displays all configured billing plans and their metadata.

```bash
npm run devtools billing:plans
```

##### `billing:seed-stripe` - Seed Stripe Products

Creates Stripe products and prices from `PLAN_META` configuration.

```bash
npm run devtools billing:seed-stripe
```

**What it does:**
1. Reads plans from `PLANS` and `PLAN_META` constants
2. Checks for existing active prices by lookup key
3. Creates Stripe product + recurring price if not found
4. Configures Stripe Billing Portal for plan switching
5. Seeds top-up credit packs from `TOPUP_OPTIONS`
6. Outputs `BILLING_PLAN_MAP_JSON` and `BILLING_TOPUP_MAP_JSON` env vars

**Output Example:**
```
=== Plan 'pro' (Professional) ===
Created product for 'pro': prod_xxx
Created price for 'pro': price_xxx

Add this to your env as BILLING_PLAN_MAP_JSON:
BILLING_PLAN_MAP_JSON='{"stripe":{"pro":"price_xxx"}}'
```

##### `billing:configure-stripe-portal` - Configure Stripe Portal

Updates Stripe Billing Portal configuration from existing plans.

```bash
npm run devtools billing:configure-stripe-portal
```

---

#### Database Commands

##### `db:query` - Database Query

Quick database query utility for debugging.

```bash
npm run devtools db:query <collection> [filterJson]

# Examples:
npm run devtools db:query tenants
npm run devtools db:query users '{"email":"admin@example.com"}'
npm run devtools db:query subscriptions '{"status":"active"}'
```

**Returns:** First 50 documents matching the filter as JSON.

##### `indexes:apply` - Apply Database Indexes

Ensures all defined indexes exist on MongoDB collections.

```bash
npm run devtools indexes:apply
```

**Index Configuration:**
```typescript
// scripts/indexes/apply.ts
await ensureIndexesFor('users', [
  { name: 'email_unique', keys: { email: 1 }, options: { unique: true } },
  { name: 'tenantId_asc', keys: { tenantId: 1 } },
]);

await ensureIndexesFor('tenants', [
  { name: 'slug_unique', keys: { slug: 1 }, options: { unique: true } },
]);
```

---

#### Tenant Commands

##### `tenant:info` - Get Tenant Information

Displays tenant details, subscription, members.

```bash
npm run devtools tenant:info <slug-or-id>

# Example:
npm run devtools tenant:info acme
npm run devtools tenant:info 507f1f77bcf86cd799439011
```

##### `tenant:reset-billing` - Reset Tenant Billing

Resets a tenant's billing state (for testing/debugging).

```bash
npm run devtools tenant:reset-billing <slug-or-id>
```

---

#### Code Quality Commands

##### `doctor` - Health Check

Comprehensive code health checker with auto-fix capability.

```bash
npm run devtools doctor
npm run devtools doctor --fix    # Auto-fix issues
```

**Checks Performed:**

| Check | Description |
|-------|-------------|
| Sidecar verification | Wrappers re-exporting `./route.gen` have matching sidecars |
| Runtime export | All route wrappers have `export const runtime = 'nodejs'` |
| Factory audit | Only auth/jobs/export factories allowed (prefer sidecars) |
| Service purity | Services don't reference `Request` or `new URL()` |
| UI boundaries | UI imports from SDK only, not contracts/modules/gateway |
| Inline types | Discourages inline type aliases in UI (use generated types) |
| Config cleanup | `ROUTE_GEN_CONFIG` should be empty (meta is SSOT) |
| Contract meta | All `defineOpMeta` have service mapping and rate-limit keys |
| Stripe env | Validates billing env vars when Stripe is enabled |
| Import hygiene | Splits combined value+type import specifiers |

**Output Example:**
```
[WARN] src/app/(tenant)/dashboard/page.tsx — UI should use generated SDK only
[WARN] contracts:users — Op key 'users.export' not found in rate-limits
[ERROR] src/app/api/users/route.ts — Wrapper re-exports ./route.gen but sidecar is missing
```

##### `rbac:invalidate-cache` - Invalidate RBAC Cache

Clears the Redis RBAC permission cache.

```bash
npm run devtools rbac:invalidate-cache
```

---

#### Documentation Commands

##### `openapi:json` - Dump OpenAPI Spec

Generates OpenAPI JSON specification from contracts.

```bash
npm run devtools openapi:json
```

##### `openapi:serve` - Serve OpenAPI Docs

Starts a local Swagger UI server.

```bash
npm run devtools openapi:serve
```

##### `routes:graph` - Route Dependency Graph

Generates route dependency visualization.

```bash
npm run devtools routes:graph
npm run devtools routes:graph --json    # JSON output
npm run devtools routes:graph --dot     # Graphviz DOT format
```

##### `diagrams:generate` - Generate Diagrams

Generates architecture diagrams from code.

```bash
npm run devtools diagrams:generate [format]
# format: svg (default), png, pdf
```

---

### Code Generation System

#### Route Generation Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ *.contract.ts   │────▶│ gen-routes.ts    │────▶│ route.ts       │
│ (defineOpMeta)  │     │ (discover+render)│     │ (auto-gen)     │
└─────────────────┘     └──────────────────┘     └────────────────┘
                               │
                        ┌──────┴──────┐
                        │             │
                   ┌────▼────┐   ┌────▼────┐
                   │discover │   │render   │
                   │   .ts   │   │  .ts    │
                   └─────────┘   └─────────┘
```

**Key Files:**
- `scripts/codegen/routes/discover.ts` — Scans contracts, collects operations
- `scripts/codegen/routes/meta.ts` — Reads `defineOpMeta` from contract AST
- `scripts/codegen/routes/render.ts` — Renders route handler code
- `scripts/codegen/routes/gen-routes.config.ts` — Legacy config (should be empty)

#### SDK Generation Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ app.router.ts   │────▶│ gen-clients.ts   │────▶│ browser.ts     │
│ (all contracts) │     │                  │     │ server.ts      │
└─────────────────┘     └──────────────────┘     └────────────────┘
        │
        │               ┌──────────────────┐     ┌────────────────┐
        └──────────────▶│ gen-hooks.ts     │────▶│ *.hooks.ts     │
                        │ (React Query)    │     │                │
                        └──────────────────┘     └────────────────┘
```

**Hooks Generation:**
- Parses contract routes for HTTP method
- Generates `useQuery` for GET, `useMutation` for POST/PATCH/DELETE
- Creates invalidation helpers for cache management
- Supports optimistic updates

---

### Migration to Monorepo

#### DevTools Package Structure

```
unisane-monorepo/
└── packages/
    └── devtools/                    # @unisane/devtools
        ├── src/
        │   ├── index.ts             # Main CLI entry
        │   ├── env.ts
        │   ├── utils.ts
        │   ├── commands/
        │   │   ├── codegen/
        │   │   │   ├── routes.ts    # routes:gen
        │   │   │   ├── sdk.ts       # sdk:gen
        │   │   │   ├── crud.ts      # crud scaffold
        │   │   │   └── sync.ts      # sync all
        │   │   ├── billing/
        │   │   │   ├── plans.ts
        │   │   │   ├── stripe-seed.ts
        │   │   │   └── portal.ts
        │   │   ├── db/
        │   │   │   ├── query.ts
        │   │   │   ├── indexes.ts
        │   │   │   └── seed.ts
        │   │   ├── tenant/
        │   │   │   ├── info.ts
        │   │   │   └── reset.ts
        │   │   ├── doctor/
        │   │   │   ├── index.ts
        │   │   │   └── checks/      # Modular checks
        │   │   ├── docs/
        │   │   │   ├── openapi.ts
        │   │   │   ├── diagrams.ts
        │   │   │   └── graph.ts
        │   │   └── cache/
        │   │       └── rbac.ts
        │   └── generators/          # Code templates
        │       ├── route.template.ts
        │       ├── client.template.ts
        │       ├── hook.template.ts
        │       └── crud/
        │           ├── types.template.ts
        │           ├── schema.template.ts
        │           ├── repo.template.ts
        │           ├── service.template.ts
        │           └── contract.template.ts
        └── package.json
```

#### Package Configuration

```json
// packages/devtools/package.json
{
  "name": "@unisane/devtools",
  "version": "1.0.0",
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
    "ora": "^7.0.0",
    "prompts": "^2.4.2",
    "fs-extra": "^11.0.0"
  },
  "peerDependencies": {
    "@unisane/kernel": "workspace:*",
    "@unisane/billing": "workspace:*"
  }
}
```

#### Starter Integration

```json
// starters/saaskit/package.json
{
  "scripts": {
    "devtools": "unisane-devtools",
    "routes:gen": "unisane-devtools routes:gen",
    "sdk:gen": "unisane-devtools sdk:gen",
    "doctor": "unisane-devtools doctor"
  },
  "devDependencies": {
    "@unisane/devtools": "workspace:*"
  }
}
```

---

### Enhancements for Unisane

#### New Commands to Add

| Command | Description | Priority |
|---------|-------------|----------|
| `devtools module:add <name>` | Interactive module generator | P0 |
| `devtools module:remove <name>` | Safe module removal | P1 |
| `devtools seed` | Database seeding with fixtures | P0 |
| `devtools seed:demo` | Demo data for showcase | P1 |
| `devtools migrate` | Run database migrations | P0 |
| `devtools migrate:create <name>` | Create migration file | P0 |
| `devtools test:gen` | Generate test stubs | P2 |
| `devtools audit` | Security audit | P1 |
| `devtools upgrade` | Upgrade Unisane packages | P0 |
| `devtools info` | Project info and health | P0 |

#### Enhanced Doctor Checks

```typescript
// Additional checks for monorepo
const additionalChecks = [
  'module-layer-violations',     // Layer dependency rules
  'circular-imports',            // Cross-module cycles
  'transaction-boundaries',      // Proper withTransaction usage
  'event-type-coverage',         // All events have types
  'api-versioning',              // Contracts have version
  'test-coverage',               // Minimum test coverage
  'security-patterns',           // OWASP checks
  'performance-antipatterns',    // N+1, unbounded queries
];
```

---

## Summary

### Dev Tools Checklist

| Category | Tool | Status | Priority |
|----------|------|--------|----------|
| **Configs** | eslint-config | Exists | - |
| | typescript-config | Exists | - |
| | tailwind-config | Exists | - |
| | prettier-config | **NEW** | P0 |
| | vitest-config | **NEW** | P0 |
| | tsup-config | **NEW** | P1 |
| **Git Hooks** | Husky | **NEW** | P0 |
| | lint-staged | **NEW** | P0 |
| | commitlint | **NEW** | P1 |
| **CI/CD** | GitHub Actions CI | **NEW** | P0 |
| | GitHub Actions Release | **NEW** | P0 |
| | Preview deployments | **NEW** | P1 |
| **CLI** | UI commands | Exists | - |
| | Platform commands | **NEW** | P0 |
| **Build** | Release tools | **NEW** | P1 |
| **Testing** | test-utils | **NEW** | P0 |
| **Deps** | Changesets | **NEW** | P0 |
| | Renovate | **NEW** | P2 |

### Implementation Order

1. **Phase 1** (Foundation): prettier-config, vitest-config, test-utils
2. **Phase 2** (Automation): husky, lint-staged, changesets
3. **Phase 3** (CI/CD): GitHub Actions CI, Release workflow
4. **Phase 4** (Extended): Platform CLI commands, tsup-config
5. **Phase 5** (Polish): Preview deployments, Renovate, release tools

---

**Document Status:** Ready for implementation
