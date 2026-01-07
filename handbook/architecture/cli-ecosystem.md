# Unisane CLI Ecosystem Architecture

## Overview

The Unisane ecosystem has **two distinct CLI packages** that serve different purposes:

| Package | Binary | Purpose | Audience |
|---------|--------|---------|----------|
| `@unisane/cli` | `unisane` | UI component management | App developers |
| `@unisane/devtools` | `unisane-devtools` | Code generation & ops | Framework developers |

**Should they be combined?** No. They serve different purposes and audiences.

---

## Decision: Keep CLIs Separate

### Reasons for Separation

| Factor | @unisane/cli | @unisane/devtools |
|--------|--------------|-------------------|
| **Primary User** | App developers consuming UI | Framework maintainers |
| **Publishing** | npm public | Internal/workspace only |
| **Dependencies** | Minimal (fs, prompts) | Heavy (ts-morph, mongodb) |
| **Execution Context** | Any project | Only inside starters |
| **Update Frequency** | Stable, versioned | Iterates with contracts |

### Use Case Comparison

**@unisane/cli (`unisane`):**
```bash
# Used by any developer installing Unisane components
npx @unisane/cli init              # Initialize new project
npx @unisane/cli add button card   # Add UI components
npx @unisane/cli diff              # Check for component updates
npx @unisane/cli doctor            # Verify installation
```

**@unisane/devtools (`unisane-devtools`):**
```bash
# Used only inside starter projects (saaskit, etc.)
pnpm devtools routes:gen           # Generate API routes
pnpm devtools sdk:gen              # Generate SDK
pnpm devtools db:query tenants     # Query database
pnpm devtools billing:seed-stripe  # Setup Stripe
```

### Dependency Contrast

```
@unisane/cli dependencies:
├── commander        (CLI)
├── chalk           (colors)
├── ora             (spinners)
├── prompts         (interactive)
└── fs-extra        (files)
Total: ~500KB

@unisane/devtools dependencies:
├── commander        (CLI)
├── chalk           (colors)
├── ora             (spinners)
├── ts-morph        (AST parsing - 15MB!)
├── mongodb         (database)
├── stripe          (billing)
├── chokidar        (watch)
├── express         (openapi:serve)
├── swagger-ui-express
└── @unisane/kernel (peer)
Total: ~20MB+
```

Combining them would force `ts-morph` and `mongodb` on users who just want UI components.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UNISANE CLI ECOSYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                       @unisane/cli                                 │      │
│  │                    Binary: unisane                                 │      │
│  │                                                                    │      │
│  │  Purpose: UI component management for app developers              │      │
│  │  Publishing: npm (public)                                          │      │
│  │                                                                    │      │
│  │  Commands:                                                         │      │
│  │  ├── init    → Initialize project with design system              │      │
│  │  ├── add     → Add UI components (shadcn-style)                   │      │
│  │  ├── diff    → Check for component updates                        │      │
│  │  └── doctor  → Verify installation health                         │      │
│  │                                                                    │      │
│  │  Dependencies: Minimal (commander, chalk, prompts, fs-extra)      │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                     @unisane/devtools                              │      │
│  │                  Binary: unisane-devtools                          │      │
│  │                                                                    │      │
│  │  Purpose: Code generation & developer operations                   │      │
│  │  Publishing: workspace:* only (internal)                           │      │
│  │                                                                    │      │
│  │  Command Categories:                                               │      │
│  │  ├── Code Generation (routes:gen, sdk:gen, openapi, crud)         │      │
│  │  ├── Database (db:query, indexes:apply, seed, migrate)            │      │
│  │  ├── Tenant Ops (tenant:info, tenant:reset-billing)               │      │
│  │  ├── Billing (billing:plans, billing:seed-stripe)                 │      │
│  │  ├── Cache (rbac:invalidate-cache)                                │      │
│  │  └── Development (doctor, watch, sync, diagrams)                  │      │
│  │                                                                    │      │
│  │  Dependencies: Heavy (ts-morph, mongodb, stripe, express)         │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Both CLIs share
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED INFRASTRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  @unisane/kernel       → Core utilities, types, constants                   │
│  @unisane/typescript-config → TSConfig presets                              │
│  commander/chalk/ora   → CLI framework (common dependencies)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Publishing Strategy

### @unisane/cli (Public npm)

```json
{
  "name": "@unisane/cli",
  "version": "0.4.0",
  "publishConfig": {
    "access": "public"
  },
  "bin": {
    "unisane": "./dist/index.js"
  }
}
```

**Usage:**
```bash
# Global install
npm i -g @unisane/cli
unisane init

# Or npx (recommended)
npx @unisane/cli init
npx @unisane/cli add button
```

### @unisane/devtools (Internal Only)

```json
{
  "name": "@unisane/devtools",
  "version": "0.0.0",
  "private": true,
  "bin": {
    "unisane-devtools": "./dist/index.js"
  }
}
```

**Usage (from starter package.json):**
```json
{
  "scripts": {
    "devtools": "unisane-devtools",
    "routes:gen": "unisane-devtools routes:gen",
    "sdk:gen": "unisane-devtools sdk:gen",
    "sync": "unisane-devtools sync"
  },
  "devDependencies": {
    "@unisane/devtools": "workspace:*"
  }
}
```

---

## Package Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MONOREPO STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  packages/                                                                   │
│  ├── cli/                    # @unisane/cli (PUBLIC - UI components)        │
│  │   ├── src/                                                                │
│  │   │   ├── index.ts        # CLI entry point                              │
│  │   │   └── commands/       # init, add, diff, doctor                      │
│  │   └── package.json        # publishable to npm                           │
│  │                                                                           │
│  ├── devtools/               # @unisane/devtools (PRIVATE - internal)       │
│  │   ├── src/                                                                │
│  │   │   ├── index.ts        # CLI entry point                              │
│  │   │   ├── commands/       # 20+ commands organized by category           │
│  │   │   ├── generators/     # Code generation engines                      │
│  │   │   └── utils/          # Shared utilities                             │
│  │   └── package.json        # private: true                                │
│  │                                                                           │
│  ├── kernel/                 # @unisane/kernel (shared by both)             │
│  ├── gateway/                # @unisane/gateway                             │
│  ├── billing/                # @unisane/billing                             │
│  └── ... (18 more modules)                                                  │
│                                                                              │
│  starters/                                                                   │
│  └── saaskit/                # Uses @unisane/devtools                        │
│      ├── src/contracts/      # Contract definitions                          │
│      ├── src/app/api/        # Generated routes (via devtools)               │
│      ├── src/sdk/            # Generated SDK (via devtools)                  │
│      └── package.json        # devDependencies: @unisane/devtools            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Future Considerations

### Option A: Create @unisane/cli-utils (Shared)

If significant code duplication emerges, extract shared utilities:

```
packages/
├── cli-utils/              # Shared CLI utilities
│   ├── src/
│   │   ├── prompts.ts      # Interactive prompts
│   │   ├── logger.ts       # Logging with ora/chalk
│   │   ├── fs.ts           # File operations
│   │   └── git.ts          # Git operations
│   └── package.json
├── cli/                    # Uses @unisane/cli-utils
└── devtools/               # Uses @unisane/cli-utils
```

**When to do this:**
- When 3+ files are duplicated between cli and devtools
- When maintaining consistency becomes difficult

### Option B: Shared Templates Repository

For component templates used by @unisane/cli:

```
packages/
├── templates/              # Component templates (used by cli)
│   ├── components/
│   │   ├── button/
│   │   ├── card/
│   │   └── ...
│   └── package.json
└── cli/                    # Imports from @unisane/templates
```

### Option C: Plugin System (Future)

Allow devtools to be extended:

```typescript
// devtools.config.ts
import { defineConfig } from '@unisane/devtools';
import customPlugin from './custom-plugin';

export default defineConfig({
  plugins: [
    customPlugin(),
    // Third-party plugins
  ],
});
```

---

## Summary

| Decision | Rationale |
|----------|-----------|
| **Keep CLIs separate** | Different audiences, dependencies, publishing |
| **@unisane/cli = public** | For any developer using UI components |
| **@unisane/devtools = private** | For framework maintainers only |
| **Share via kernel** | Both import from @unisane/kernel |
| **Consider cli-utils later** | Only if significant duplication |

This architecture ensures:
1. **Scalability** - Each CLI evolves independently
2. **Maintainability** - Clear boundaries and responsibilities
3. **Reusability** - Shared utilities in kernel
4. **Best Practice** - Right tool for the right audience
