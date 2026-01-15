#!/usr/bin/env node
/**
 * Check for direct inter-module imports in packages/modules.
 *
 * Modules should only import from:
 * - @unisane/kernel (for ports and utilities)
 * - @unisane/gateway (for HTTP utilities)
 * - External packages (mongodb, zod, etc.)
 *
 * They should NOT import from other @unisane/* modules directly.
 *
 * Usage:
 *   node scripts/check-module-imports.mjs
 *
 * Exit code:
 *   0 = No violations found
 *   1 = Violations found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, relative, join, extname } from 'path';

const ROOT = resolve(process.cwd());
const MODULES_PATH = resolve(ROOT, 'packages/modules');

// Allowed imports from @unisane/*
const ALLOWED_PACKAGES = new Set([
  'kernel',
  'gateway',
  'contracts', // Foundation contracts
]);

/**
 * Recursively find all .ts files in a directory
 */
function findTsFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    // Skip node_modules and dist
    if (entry === 'node_modules' || entry === 'dist') continue;

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findTsFiles(fullPath, files);
    } else if (extname(entry) === '.ts' && !entry.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const files = findTsFiles(MODULES_PATH);

  const violations = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match both import and import type statements
      const importMatches = line.matchAll(/from ['"]@unisane\/([^'"\/]+)/g);

      for (const match of importMatches) {
        const pkg = match[1];

        if (!ALLOWED_PACKAGES.has(pkg)) {
          // Check if this is a self-import (module importing from itself)
          const moduleName = relative(MODULES_PATH, file).split('/')[0];
          if (pkg === moduleName) continue; // Self-import is OK

          violations.push({
            file: relative(ROOT, file),
            line: i + 1,
            package: pkg,
            content: line.trim(),
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n❌ Direct inter-module import violations found:\n');

    // Group by package
    const byPackage = {};
    for (const v of violations) {
      if (!byPackage[v.package]) byPackage[v.package] = [];
      byPackage[v.package].push(v);
    }

    for (const [pkg, items] of Object.entries(byPackage)) {
      console.error(`  @unisane/${pkg}:`);
      for (const v of items) {
        console.error(`    ${v.file}:${v.line}`);
        console.error(`      ${v.content}\n`);
      }
    }

    console.error(`\nTotal: ${violations.length} violation(s)`);
    console.error('\nFix: Replace with kernel port imports. Example:');
    console.error('  - import { foo } from "@unisane/flags"');
    console.error('  + import { isEnabledForScope } from "@unisane/kernel"\n');

    process.exit(1);
  } else {
    console.log('✅ No direct inter-module imports found');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
