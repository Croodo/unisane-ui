#!/usr/bin/env node

/**
 * @module scripts/sync-versions
 *
 * Synchronizes versions across workspace packages.
 * Ensures workspace:* dependencies are consistent.
 *
 * Usage:
 *   node scripts/sync-versions.mjs [--check] [--fix]
 *
 * Options:
 *   --check  Only check for inconsistencies (exit 1 if found)
 *   --fix    Automatically fix inconsistencies
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// ════════════════════════════════════════════════════════════════════════════
// Configuration
// ════════════════════════════════════════════════════════════════════════════

const WORKSPACE_DIRS = [
  'packages/foundation',
  'packages/modules',
  'packages/pro',
  'packages/ui',
  'packages/tooling',
];

// Packages that should have synchronized versions
const VERSION_GROUPS = {
  foundation: ['@unisane/kernel', '@unisane/gateway', '@unisane/contracts'],
  auth: ['@unisane/auth', '@unisane/identity'],
  ui: ['@unisane/ui-core', '@unisane/ui-cli', '@unisane/ui-tokens'],
  cli: ['create-unisane', 'unisane', '@unisane/cli-core', '@unisane/devtools'],
};

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function getAllPackages() {
  const packages = new Map();

  for (const dir of WORKSPACE_DIRS) {
    const fullPath = join(rootDir, dir);
    if (!existsSync(fullPath)) continue;

    const subdirs = readdirSync(fullPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const subdir of subdirs) {
      const pkgPath = join(fullPath, subdir, 'package.json');
      if (!existsSync(pkgPath)) continue;

      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        packages.set(pkg.name, {
          name: pkg.name,
          version: pkg.version,
          path: pkgPath,
          pkg,
        });
      } catch (e) {
        console.error(`Error reading ${pkgPath}:`, e.message);
      }
    }
  }

  return packages;
}

function checkVersionGroups(packages) {
  const issues = [];

  for (const [groupName, groupPackages] of Object.entries(VERSION_GROUPS)) {
    const versions = new Map();

    for (const pkgName of groupPackages) {
      const pkg = packages.get(pkgName);
      if (pkg) {
        versions.set(pkgName, pkg.version);
      }
    }

    // Check if all versions in group match
    const uniqueVersions = new Set(versions.values());
    if (uniqueVersions.size > 1) {
      issues.push({
        type: 'version-mismatch',
        group: groupName,
        packages: Object.fromEntries(versions),
      });
    }
  }

  return issues;
}

function checkWorkspaceDeps(packages) {
  const issues = [];

  for (const [name, info] of packages) {
    const { pkg, path } = info;
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    for (const [depName, depVersion] of Object.entries(allDeps)) {
      // Check if it's a workspace package
      if (packages.has(depName)) {
        const depPkg = packages.get(depName);

        // If using workspace:* protocol, that's correct
        if (depVersion === 'workspace:*' || depVersion === 'workspace:^') {
          continue;
        }

        // If using exact version, check if it matches
        if (!depVersion.startsWith('workspace:')) {
          issues.push({
            type: 'non-workspace-dep',
            package: name,
            dependency: depName,
            currentVersion: depVersion,
            expectedVersion: 'workspace:*',
            path,
          });
        }
      }
    }
  }

  return issues;
}

function fixIssues(issues, packages) {
  const filesToUpdate = new Map();

  for (const issue of issues) {
    if (issue.type === 'non-workspace-dep') {
      const pkgInfo = packages.get(issue.package);
      if (!pkgInfo) continue;

      if (!filesToUpdate.has(issue.path)) {
        filesToUpdate.set(issue.path, { ...pkgInfo.pkg });
      }

      const pkg = filesToUpdate.get(issue.path);

      // Update the dependency version
      for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (pkg[depType]?.[issue.dependency]) {
          pkg[depType][issue.dependency] = 'workspace:*';
        }
      }
    }
  }

  // Write updated files
  for (const [filePath, pkg] of filesToUpdate) {
    writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  Updated: ${filePath}`);
  }

  return filesToUpdate.size;
}

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const shouldFix = args.includes('--fix');

console.log('\n  Unisane Version Sync\n');

const packages = getAllPackages();
console.log(`  Found ${packages.size} packages\n`);

// Check version groups
const groupIssues = checkVersionGroups(packages);
if (groupIssues.length > 0) {
  console.log('  Version Group Mismatches:\n');
  for (const issue of groupIssues) {
    console.log(`    ${issue.group}:`);
    for (const [pkg, version] of Object.entries(issue.packages)) {
      console.log(`      ${pkg}: ${version}`);
    }
    console.log();
  }
}

// Check workspace dependencies
const depIssues = checkWorkspaceDeps(packages);
if (depIssues.length > 0) {
  console.log('  Non-Workspace Dependencies:\n');
  for (const issue of depIssues) {
    console.log(`    ${issue.package}`);
    console.log(`      ${issue.dependency}: ${issue.currentVersion} -> ${issue.expectedVersion}`);
  }
  console.log();
}

const totalIssues = groupIssues.length + depIssues.length;

if (totalIssues === 0) {
  console.log('  All versions are in sync!\n');
  process.exit(0);
}

if (checkOnly) {
  console.log(`  Found ${totalIssues} issue(s)\n`);
  process.exit(1);
}

if (shouldFix) {
  console.log('  Fixing issues...\n');
  const fixed = fixIssues(depIssues, packages);
  console.log(`\n  Fixed ${fixed} file(s)\n`);

  if (groupIssues.length > 0) {
    console.log('  Note: Version group mismatches must be fixed manually or via changesets.\n');
  }
} else {
  console.log('  Run with --fix to automatically fix workspace dependency issues.\n');
  console.log('  Run with --check to exit with error code for CI.\n');
}
