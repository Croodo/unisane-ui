# Build & Distribution Guide

> **Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)

This guide covers the build process, starter distribution, and OSS/PRO code stripping mechanism.

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Monorepo structure | **Implemented** | 30 packages, pnpm workspaces, Turbo |
| Package builds | **Implemented** | tsup, ESM output, declarations |
| Codegen (routes/sdk) | **Implemented** | @unisane/devtools |
| `tools/release/` | **Not Implemented** | Design spec below |
| `build-starter.ts` | **Not Implemented** | Design spec below |
| Import transformation | **Not Implemented** | Design spec below |
| OSS/PRO stripping | **Not Implemented** | Design spec below |
| @unisane/cli | **Not Implemented** | Planned for user distribution |

> **Note:** This document describes the **target architecture**. Sections marked "Not Implemented" represent design specifications for future development. The tooling will be built after core features are complete.

---

## Table of Contents

1. [Overview](#overview)
2. [Build System Architecture](#build-system-architecture)
3. [build-starter.ts Deep Dive](#build-starterts-deep-dive)
4. [Module Flattening](#module-flattening)
5. [Import Transformation](#import-transformation)
6. [OSS/PRO Stripping](#osspro-stripping)
7. [UI Package Distribution](#ui-package-distribution)
8. [Release Process](#release-process)
9. [Build Verification](#build-verification)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Unisane uses a monorepo structure during development but distributes **flattened starters** to end users. This allows:

- **Development**: Modular packages with clear boundaries
- **Distribution**: Self-contained starters with copied source
- **Licensing**: OSS and PRO variants from the same codebase

```
DEVELOPMENT                           DISTRIBUTION
────────────                          ────────────

packages/                             starters/saaskit/
├── kernel/                           └── src/
├── gateway/         build-starter      ├── modules/
├── tenants/        ──────────────►     │   ├── kernel/
├── billing/                            │   ├── tenants/
├── credits/                            │   ├── billing/
└── ...                                 │   └── ...
                                        ├── components/
packages/ui/                            │   └── ui/
└── src/                                └── lib/
    └── components/
```

---

## Build System Architecture

### Build Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     BUILD PIPELINE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. COMPILE PACKAGES                                         │
│     pnpm build                                               │
│     └── Turborepo builds all packages in dependency order   │
│                                                              │
│  2. GENERATE CODE                                            │
│     pnpm codegen                                             │
│     ├── routes:gen  → API route handlers                    │
│     ├── sdk:gen     → Client SDK + hooks                    │
│     └── types:gen   → Shared types                          │
│                                                              │
│  3. BUILD STARTER                                            │
│     pnpm build:starter                                       │
│     ├── Flatten packages to src/modules/                    │
│     ├── Transform imports                                    │
│     ├── Copy UI components                                   │
│     └── Generate package.json                                │
│                                                              │
│  4. STRIP PRO (Optional)                                     │
│     pnpm build:oss                                           │
│     └── Remove @pro-only marked code                        │
│                                                              │
│  5. PACKAGE                                                  │
│     pnpm release                                             │
│     ├── Version bump                                         │
│     ├── Generate changelog                                   │
│     └── Publish to npm/registry                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

> **Status:** The `tools/release/` directory is **planned but not yet implemented**. Codegen currently lives in `@unisane/devtools` package.

**Planned structure:**
```
tools/
├── release/
│   └── src/
│       ├── build-starter.ts      # Main build script
│       ├── strip-pro.ts          # OSS/PRO stripping
│       ├── transform-imports.ts  # Import rewriting
│       ├── copy-ui.ts            # UI component copying
│       └── generate-package.ts   # package.json generation
```

**Currently implemented (in packages/devtools):**
```
packages/devtools/
└── src/
    ├── cli.ts                    # CLI entry point
    ├── commands/
    │   ├── routes/gen.ts         # Route handler generation
    │   └── sdk/gen.ts            # SDK generation
    └── generators/
        ├── routes/               # Route templates
        └── sdk/                  # SDK templates
```

---

## build-starter.ts Deep Dive

> **Status: Not Implemented** — This section describes the planned design specification.

### Command

```bash
# Build full PRO starter
pnpm build:starter

# Build OSS starter
pnpm build:starter --oss

# Build specific starter
pnpm build:starter --starter=saaskit

# Dry run (no file writes)
pnpm build:starter --dry-run
```

### Script Structure

```typescript
// tools/release/src/build-starter.ts

import { copySync, removeSync, ensureDirSync } from "fs-extra";
import { glob } from "glob";
import path from "path";
import { transformImports } from "./transform-imports";
import { stripProCode } from "./strip-pro";
import { copyUIComponents } from "./copy-ui";
import { generatePackageJson } from "./generate-package";

interface BuildOptions {
  starter: string;      // e.g., "saaskit"
  oss: boolean;         // Strip PRO code
  dryRun: boolean;      // Don't write files
  verbose: boolean;     // Detailed logging
}

export async function buildStarter(options: BuildOptions) {
  const { starter, oss, dryRun, verbose } = options;

  const rootDir = process.cwd();
  const packagesDir = path.join(rootDir, "packages");
  const starterDir = path.join(rootDir, "starters", starter);
  const outputDir = path.join(starterDir, "src", "modules");

  console.log(`\n🔨 Building ${starter} starter ${oss ? "(OSS)" : "(PRO)"}\n`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Clean output directory
  // ═══════════════════════════════════════════════════════════════
  if (!dryRun) {
    console.log("📁 Cleaning output directory...");
    removeSync(outputDir);
    ensureDirSync(outputDir);
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Determine which packages to include
  // ═══════════════════════════════════════════════════════════════
  const packages = await getPackagesToInclude(starter);
  console.log(`📦 Including ${packages.length} packages:`);
  packages.forEach((p) => console.log(`   - ${p}`));

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Copy and transform each package
  // ═══════════════════════════════════════════════════════════════
  for (const pkg of packages) {
    console.log(`\n📋 Processing ${pkg}...`);

    const srcDir = path.join(packagesDir, pkg, "src");
    const destDir = path.join(outputDir, pkg);

    // Get all TypeScript files
    const files = glob.sync("**/*.{ts,tsx}", { cwd: srcDir });

    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);

      // Read source
      let content = await fs.readFile(srcPath, "utf-8");

      // Transform imports
      content = transformImports(content, {
        packageName: pkg,
        allPackages: packages,
      });

      // Strip PRO code if building OSS
      if (oss) {
        content = stripProCode(content, { file: srcPath, verbose });
      }

      // Write output
      if (!dryRun) {
        ensureDirSync(path.dirname(destPath));
        await fs.writeFile(destPath, content);
      }

      if (verbose) {
        console.log(`   ✓ ${file}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Copy UI components
  // ═══════════════════════════════════════════════════════════════
  console.log("\n🎨 Copying UI components...");
  await copyUIComponents({
    srcDir: path.join(packagesDir, "ui", "src"),
    destDir: path.join(starterDir, "src", "components", "ui"),
    dryRun,
  });

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Generate package.json
  // ═══════════════════════════════════════════════════════════════
  console.log("\n📝 Generating package.json...");
  await generatePackageJson({
    starterDir,
    packages,
    oss,
    dryRun,
  });

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Copy additional files
  // ═══════════════════════════════════════════════════════════════
  console.log("\n📄 Copying additional files...");
  const additionalFiles = [
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    ".env.example",
    "README.md",
  ];

  for (const file of additionalFiles) {
    const src = path.join(starterDir, "..", "..", "templates", starter, file);
    const dest = path.join(starterDir, file);
    if (existsSync(src) && !dryRun) {
      copySync(src, dest);
    }
  }

  console.log("\n✅ Build complete!\n");

  // Return build info
  return {
    starter,
    variant: oss ? "oss" : "pro",
    packages: packages.length,
    outputDir,
  };
}

async function getPackagesToInclude(starter: string): Promise<string[]> {
  // Define which packages each starter needs
  const starterPackages: Record<string, string[]> = {
    saaskit: [
      // Layer 0: Kernel
      "kernel",
      // Layer 1: Gateway
      "gateway",
      // Layer 2: Foundation
      "identity",
      "settings",
      "storage",
      // Layer 3: Core
      "tenants",
      "auth",
      "sso",
      // Layer 4: Business
      "billing",
      "flags",
      "audit",
      // Layer 5: Features
      "credits",
      "usage",
      "notify",
      "webhooks",
      // Additional
      "ai",
      "media",
      "pdf",
      "analytics",
    ],
  };

  return starterPackages[starter] ?? [];
}
```

---

## Module Flattening

### Before (Monorepo)

```
packages/
├── kernel/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── ctx/
│       ├── db/
│       └── events/
│
├── tenants/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── service/
│       └── data/
```

### After (Flattened Starter)

```
starters/saaskit/src/
└── modules/
    ├── kernel/
    │   ├── index.ts
    │   ├── ctx/
    │   ├── db/
    │   └── events/
    │
    ├── tenants/
    │   ├── index.ts
    │   ├── service/
    │   └── data/
```

### Why Flatten?

1. **No package dependencies**: Users don't need to manage workspace packages
2. **Easier customization**: Users can modify any module directly
3. **Single tsconfig**: Simpler TypeScript configuration
4. **Better tree-shaking**: Bundler sees all code as one project

---

## Import Transformation

### Transformation Rules

```typescript
// tools/release/src/transform-imports.ts

import ts from "typescript";
import MagicString from "magic-string";

interface TransformOptions {
  packageName: string;    // Current package being processed
  allPackages: string[];  // All packages in the starter
}

export function transformImports(content: string, options: TransformOptions): string {
  const s = new MagicString(content);
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    content,
    ts.ScriptTarget.Latest,
    true
  );

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        const newPath = transformImportPath(importPath, options);

        if (newPath !== importPath) {
          // Replace the import path
          const start = moduleSpecifier.getStart() + 1; // Skip opening quote
          const end = moduleSpecifier.getEnd() - 1;     // Skip closing quote
          s.overwrite(start, end, newPath);
        }
      }
    }
  });

  return s.toString();
}

function transformImportPath(importPath: string, options: TransformOptions): string {
  // ─────────────────────────────────────────────────────────
  // Rule 1: Transform @unisane/* package imports
  // ─────────────────────────────────────────────────────────
  // From: import { ctx } from "@unisane/kernel"
  // To:   import { ctx } from "@/modules/kernel"

  const packageMatch = importPath.match(/^@unisane\/([a-z-]+)(\/.*)?$/);
  if (packageMatch) {
    const [, packageName, subpath] = packageMatch;

    if (options.allPackages.includes(packageName)) {
      return `@/modules/${packageName}${subpath ?? ""}`;
    }
    // If package not included, it's an external dep - keep as is
  }

  // ─────────────────────────────────────────────────────────
  // Rule 2: Keep relative imports within same package
  // ─────────────────────────────────────────────────────────
  // From: import { foo } from "../service/foo"
  // To:   import { foo } from "../service/foo"  (unchanged)

  if (importPath.startsWith(".")) {
    return importPath;
  }

  // ─────────────────────────────────────────────────────────
  // Rule 3: Keep external dependencies
  // ─────────────────────────────────────────────────────────
  // From: import { z } from "zod"
  // To:   import { z } from "zod"  (unchanged)

  return importPath;
}
```

### Examples

```typescript
// BEFORE (in packages/tenants/src/service/tenants.ts)
import { ctx, logger } from "@unisane/kernel";
import { withAuth } from "@unisane/gateway";
import { z } from "zod";
import { TenantModel } from "../data/tenant.model";

// AFTER (in starters/saaskit/src/modules/tenants/service/tenants.ts)
import { ctx, logger } from "@/modules/kernel";
import { withAuth } from "@/modules/gateway";
import { z } from "zod";
import { TenantModel } from "../data/tenant.model";
```

---

## OSS/PRO Stripping

### Marker Syntax

Use special comments to mark PRO-only code:

```typescript
// ═══════════════════════════════════════════════════════════════
// SINGLE LINE - Remove entire line
// ═══════════════════════════════════════════════════════════════

export const features = {
  basicAnalytics: true,
  advancedAnalytics: true, // @pro-only
};


// ═══════════════════════════════════════════════════════════════
// BLOCK - Remove entire block
// ═══════════════════════════════════════════════════════════════

/* @pro-only:start */
export async function generateAdvancedReport(tenantId: string) {
  // Complex PRO-only analytics logic
  const insights = await ai.analyze(data);
  return insights;
}
/* @pro-only:end */


// ═══════════════════════════════════════════════════════════════
// CONDITIONAL EXPORT
// ═══════════════════════════════════════════════════════════════

export {
  balance,
  consume,
  // @pro-only: advancedCredits,
  // @pro-only: creditForecasting,
};


// ═══════════════════════════════════════════════════════════════
// CONDITIONAL IMPORT
// ═══════════════════════════════════════════════════════════════

import { basicFeature } from "./basic";
// @pro-only: import { advancedFeature } from "./advanced";
```

### Stripping Implementation

```typescript
// tools/release/src/strip-pro.ts

interface StripOptions {
  file: string;
  verbose?: boolean;
}

export function stripProCode(content: string, options: StripOptions): string {
  let result = content;
  let strippedCount = 0;

  // ─────────────────────────────────────────────────────────
  // Pattern 1: Block markers
  // /* @pro-only:start */ ... /* @pro-only:end */
  // ─────────────────────────────────────────────────────────
  const blockPattern = /\/\*\s*@pro-only:start\s*\*\/[\s\S]*?\/\*\s*@pro-only:end\s*\*\//g;
  result = result.replace(blockPattern, () => {
    strippedCount++;
    return "/* [PRO feature removed] */";
  });

  // ─────────────────────────────────────────────────────────
  // Pattern 2: Single line comments at end
  // someCode // @pro-only
  // ─────────────────────────────────────────────────────────
  const lineEndPattern = /^.*\/\/\s*@pro-only\s*$/gm;
  result = result.replace(lineEndPattern, () => {
    strippedCount++;
    return "// [PRO feature removed]";
  });

  // ─────────────────────────────────────────────────────────
  // Pattern 3: Commented exports/imports
  // // @pro-only: export { foo }
  // ─────────────────────────────────────────────────────────
  const commentedPattern = /^\s*\/\/\s*@pro-only:\s*.+$/gm;
  result = result.replace(commentedPattern, () => {
    strippedCount++;
    return "";
  });

  // ─────────────────────────────────────────────────────────
  // Pattern 4: JSDoc @pro-only tag on functions/classes
  // /** @pro-only */
  // export function proFeature() {}
  // ─────────────────────────────────────────────────────────
  const jsdocPattern = /\/\*\*[\s\S]*?@pro-only[\s\S]*?\*\/\s*(export\s+)?(async\s+)?(function|class|const|let|var)\s+\w+[\s\S]*?(?=\n(?:\/\*\*|export|import|$))/g;
  result = result.replace(jsdocPattern, () => {
    strippedCount++;
    return "/* [PRO feature removed] */\n";
  });

  if (options.verbose && strippedCount > 0) {
    console.log(`   Stripped ${strippedCount} PRO markers from ${options.file}`);
  }

  return result;
}
```

### File-Level Stripping

Some entire files are PRO-only:

```typescript
// packages/analytics/src/advanced/insights.ts

/**
 * @pro-only
 * @fileoverview Advanced AI-powered insights (PRO only)
 */

export async function generateInsights() {
  // ...
}
```

The build script checks for `@pro-only` in file-level JSDoc and skips the entire file:

```typescript
function shouldIncludeFile(content: string, options: StripOptions): boolean {
  // Check for file-level @pro-only marker
  const fileDocMatch = content.match(/^\/\*\*[\s\S]*?\*\//);
  if (fileDocMatch && fileDocMatch[0].includes("@pro-only")) {
    return !options.oss; // Include only in PRO build
  }
  return true;
}
```

### Verification

After stripping, verify no PRO code remains:

```bash
# Check for any remaining PRO markers in OSS build
grep -r "@pro-only" starters/saaskit-oss/src/

# Should return no results
```

---

## UI Package Distribution

### UI Component Copying

```typescript
// tools/release/src/copy-ui.ts

import { copySync, ensureDirSync } from "fs-extra";
import { glob } from "glob";
import path from "path";

interface CopyUIOptions {
  srcDir: string;
  destDir: string;
  dryRun?: boolean;
}

export async function copyUIComponents(options: CopyUIOptions) {
  const { srcDir, destDir, dryRun } = options;

  // Components to copy
  const componentDirs = [
    "components",
    "primitives",
    "layout",
    "lib",
    "hooks",
  ];

  if (!dryRun) {
    ensureDirSync(destDir);
  }

  let copiedCount = 0;

  for (const dir of componentDirs) {
    const src = path.join(srcDir, dir);
    const dest = path.join(destDir, dir);

    const files = glob.sync("**/*.{ts,tsx}", { cwd: src });

    for (const file of files) {
      if (!dryRun) {
        copySync(path.join(src, file), path.join(dest, file));
      }
      copiedCount++;
    }
  }

  console.log(`   Copied ${copiedCount} UI files`);

  // Copy styles
  const stylesDir = path.join(srcDir, "styles");
  if (existsSync(stylesDir) && !dryRun) {
    copySync(stylesDir, path.join(destDir, "..", "styles"));
  }
}
```

### Output Structure

```
starters/saaskit/src/
├── components/
│   └── ui/
│       ├── components/
│       │   ├── button.tsx
│       │   ├── dialog.tsx
│       │   └── ...
│       ├── primitives/
│       │   ├── ripple.tsx
│       │   └── ...
│       ├── layout/
│       │   └── theme-provider.tsx
│       └── lib/
│           └── utils.ts
│
└── styles/
    └── unisane.css
```

---

## Release Process

### Version Management

Using Changesets for version management:

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish
pnpm changeset publish
```

### Release Script

```typescript
// tools/release/src/release.ts

import { execSync } from "child_process";
import { buildStarter } from "./build-starter";

interface ReleaseOptions {
  version: string;
  starters: string[];
  publishOss: boolean;
  publishPro: boolean;
}

export async function release(options: ReleaseOptions) {
  const { version, starters, publishOss, publishPro } = options;

  console.log(`\n🚀 Releasing v${version}\n`);

  // ─────────────────────────────────────────────────────────
  // Step 1: Run tests
  // ─────────────────────────────────────────────────────────
  console.log("🧪 Running tests...");
  execSync("pnpm test", { stdio: "inherit" });

  // ─────────────────────────────────────────────────────────
  // Step 2: Build all packages
  // ─────────────────────────────────────────────────────────
  console.log("📦 Building packages...");
  execSync("pnpm build", { stdio: "inherit" });

  // ─────────────────────────────────────────────────────────
  // Step 3: Build starters
  // ─────────────────────────────────────────────────────────
  for (const starter of starters) {
    if (publishPro) {
      console.log(`\n🔨 Building ${starter} (PRO)...`);
      await buildStarter({ starter, oss: false, dryRun: false, verbose: false });
    }

    if (publishOss) {
      console.log(`\n🔨 Building ${starter} (OSS)...`);
      await buildStarter({ starter, oss: true, dryRun: false, verbose: false });
    }
  }

  // ─────────────────────────────────────────────────────────
  // Step 4: Update versions
  // ─────────────────────────────────────────────────────────
  console.log("\n📝 Updating versions...");
  execSync(`pnpm changeset version`, { stdio: "inherit" });

  // ─────────────────────────────────────────────────────────
  // Step 5: Generate changelog
  // ─────────────────────────────────────────────────────────
  console.log("\n📋 Generating changelog...");
  // Changeset handles this automatically

  // ─────────────────────────────────────────────────────────
  // Step 6: Publish
  // ─────────────────────────────────────────────────────────
  if (publishOss) {
    console.log("\n📤 Publishing OSS packages...");
    execSync("pnpm changeset publish", { stdio: "inherit" });
  }

  if (publishPro) {
    console.log("\n📤 Publishing PRO packages...");
    // PRO packages go to private registry
    execSync("pnpm changeset publish --registry https://npm.unisane.dev", {
      stdio: "inherit",
    });
  }

  console.log("\n✅ Release complete!\n");
}
```

### GitHub Actions Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Build Verification

### Verification Script

```typescript
// tools/release/src/verify-build.ts

import { execSync } from "child_process";
import path from "path";

export async function verifyBuild(starterDir: string): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // ─────────────────────────────────────────────────────────
  // Check 1: TypeScript compilation
  // ─────────────────────────────────────────────────────────
  console.log("🔍 Checking TypeScript...");
  try {
    execSync("npx tsc --noEmit", { cwd: starterDir, stdio: "pipe" });
  } catch (e: any) {
    errors.push(`TypeScript errors:\n${e.stdout?.toString()}`);
  }

  // ─────────────────────────────────────────────────────────
  // Check 2: No broken imports
  // ─────────────────────────────────────────────────────────
  console.log("🔍 Checking imports...");
  const brokenImports = findBrokenImports(starterDir);
  if (brokenImports.length > 0) {
    errors.push(`Broken imports:\n${brokenImports.join("\n")}`);
  }

  // ─────────────────────────────────────────────────────────
  // Check 3: No @unisane/* imports remain
  // ─────────────────────────────────────────────────────────
  console.log("🔍 Checking for untransformed imports...");
  try {
    const result = execSync(
      `grep -r "@unisane/" src/modules/ || true`,
      { cwd: starterDir, encoding: "utf-8" }
    );
    if (result.trim()) {
      errors.push(`Untransformed @unisane imports found:\n${result}`);
    }
  } catch {
    // grep returns error code if no matches (which is good)
  }

  // ─────────────────────────────────────────────────────────
  // Check 4: Build succeeds
  // ─────────────────────────────────────────────────────────
  console.log("🔍 Testing build...");
  try {
    execSync("pnpm build", { cwd: starterDir, stdio: "pipe" });
  } catch (e: any) {
    errors.push(`Build failed:\n${e.stdout?.toString()}`);
  }

  // ─────────────────────────────────────────────────────────
  // Check 5: No PRO markers in OSS build
  // ─────────────────────────────────────────────────────────
  if (starterDir.includes("-oss")) {
    console.log("🔍 Checking for PRO markers in OSS...");
    try {
      const result = execSync(
        `grep -r "@pro-only" src/ || true`,
        { cwd: starterDir, encoding: "utf-8" }
      );
      if (result.trim()) {
        errors.push(`PRO markers found in OSS build:\n${result}`);
      }
    } catch {
      // No matches is good
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

function findBrokenImports(dir: string): string[] {
  // Implementation to check all imports resolve
  return [];
}
```

### Running Verification

```bash
# Verify a built starter
pnpm verify:build starters/saaskit

# Output:
# 🔍 Checking TypeScript... ✓
# 🔍 Checking imports... ✓
# 🔍 Checking for untransformed imports... ✓
# 🔍 Testing build... ✓
# ✅ Build verification passed!
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Import not found after build | Missing package in starter config | Add to `starterPackages` in build-starter.ts |
| Type errors after flattening | Circular dependency | Refactor to break cycle |
| PRO code in OSS build | Missing or malformed marker | Check marker syntax |
| Build takes too long | Too many files | Enable parallel processing |
| Package.json wrong deps | Generator bug | Check generatePackageJson logic |

### Debug Mode

```bash
# Run with verbose logging
pnpm build:starter --verbose

# See all transformations
DEBUG=build:* pnpm build:starter

# Dry run to see what would happen
pnpm build:starter --dry-run
```

### Manual Verification

```bash
# Check a specific file's transformations
cat starters/saaskit/src/modules/tenants/service/tenants.ts | grep "import"

# Verify no @unisane imports
grep -r "@unisane/" starters/saaskit/src/modules/

# Check PRO markers were stripped
grep -r "@pro-only" starters/saaskit-oss/src/
```

---

## Quick Reference

### Commands

| Command | Description |
|---------|-------------|
| `pnpm build:starter` | Build PRO starter |
| `pnpm build:starter --oss` | Build OSS starter |
| `pnpm build:starter --dry-run` | Preview changes |
| `pnpm verify:build` | Verify built starter |
| `pnpm release` | Full release process |

### PRO Markers

| Marker | Usage |
|--------|-------|
| `// @pro-only` | Remove entire line |
| `/* @pro-only:start */ ... /* @pro-only:end */` | Remove block |
| `// @pro-only: export { foo }` | Remove commented line |
| `/** @pro-only */` (file) | Exclude entire file |

---

**Parent:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**See Also:** [dev-tools.md](./dev-tools.md), [contracts-guide.md](./contracts-guide.md)
