/**
 * @module commands/release/version
 *
 * Version management utilities.
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, readdirSync } = fse;
import path from 'path';
import { execSync } from 'child_process';
import { log } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface VersionInfo {
  name: string;
  version: string;
  path: string;
  private: boolean;
}

export interface VersionCheckResult {
  packages: VersionInfo[];
  groups: Record<string, VersionInfo[]>;
  issues: VersionIssue[];
}

export interface VersionIssue {
  type: 'mismatch' | 'non-workspace-dep';
  message: string;
  packages?: string[];
}

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

const VERSION_GROUPS: Record<string, string[]> = {
  foundation: ['@unisane/kernel', '@unisane/gateway', '@unisane/contracts'],
  auth: ['@unisane/auth', '@unisane/identity'],
  ui: ['@unisane/ui-core', '@unisane/ui-cli', '@unisane/ui-tokens'],
  cli: ['create-unisane', 'unisane', '@unisane/cli-core', '@unisane/devtools'],
};

// ════════════════════════════════════════════════════════════════════════════
// Functions
// ════════════════════════════════════════════════════════════════════════════

function findRoot(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function getAllPackages(root: string): Map<string, VersionInfo> {
  const packages = new Map<string, VersionInfo>();

  for (const dir of WORKSPACE_DIRS) {
    const fullPath = path.join(root, dir);
    if (!existsSync(fullPath)) continue;

    const subdirs = readdirSync(fullPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const subdir of subdirs) {
      const pkgPath = path.join(fullPath, subdir, 'package.json');
      if (!existsSync(pkgPath)) continue;

      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        packages.set(pkg.name, {
          name: pkg.name,
          version: pkg.version,
          path: pkgPath,
          private: pkg.private ?? false,
        });
      } catch {
        // Skip invalid packages
      }
    }
  }

  return packages;
}

/**
 * Check version consistency across workspace.
 */
export async function checkVersions(): Promise<VersionCheckResult> {
  const root = findRoot();
  const packages = getAllPackages(root);
  const issues: VersionIssue[] = [];

  // Group packages
  const groups: Record<string, VersionInfo[]> = {};
  for (const [groupName, groupPackages] of Object.entries(VERSION_GROUPS)) {
    groups[groupName] = [];
    for (const pkgName of groupPackages) {
      const pkg = packages.get(pkgName);
      if (pkg) {
        groups[groupName].push(pkg);
      }
    }
  }

  // Check for version mismatches in groups
  for (const [groupName, groupPkgs] of Object.entries(groups)) {
    if (groupPkgs.length < 2) continue;

    const versions = new Set(groupPkgs.map((p) => p.version));
    if (versions.size > 1) {
      issues.push({
        type: 'mismatch',
        message: `Version mismatch in ${groupName} group`,
        packages: groupPkgs.map((p) => `${p.name}@${p.version}`),
      });
    }
  }

  return {
    packages: Array.from(packages.values()),
    groups,
    issues,
  };
}

/**
 * List all package versions.
 */
export async function listVersions(): Promise<number> {
  log.banner('Package Versions');

  const result = await checkVersions();

  // Group by version category
  const byCategory: Record<string, VersionInfo[]> = {
    'CLI Tools': [],
    'Foundation': [],
    'UI': [],
    'Modules': [],
    'Pro': [],
    'Other': [],
  };

  for (const pkg of result.packages) {
    if (pkg.name.includes('cli') || pkg.name === 'unisane' || pkg.name.startsWith('create-')) {
      byCategory['CLI Tools'].push(pkg);
    } else if (['kernel', 'gateway', 'contracts'].some((n) => pkg.name.includes(n))) {
      byCategory['Foundation'].push(pkg);
    } else if (pkg.name.includes('ui') || pkg.name.includes('tokens')) {
      byCategory['UI'].push(pkg);
    } else if (pkg.path.includes('/pro/')) {
      byCategory['Pro'].push(pkg);
    } else if (pkg.path.includes('/modules/')) {
      byCategory['Modules'].push(pkg);
    } else {
      byCategory['Other'].push(pkg);
    }
  }

  for (const [category, pkgs] of Object.entries(byCategory)) {
    if (pkgs.length === 0) continue;

    log.newline();
    log.info(category);
    log.dim('─'.repeat(40));

    for (const pkg of pkgs.sort((a, b) => a.name.localeCompare(b.name))) {
      const status = pkg.private ? '(private)' : '';
      log.kv(pkg.name.padEnd(30), `${pkg.version} ${status}`);
    }
  }

  // Show issues
  if (result.issues.length > 0) {
    log.newline();
    log.warn('Issues Found:');
    for (const issue of result.issues) {
      log.error(`  ${issue.message}`);
      if (issue.packages) {
        for (const pkg of issue.packages) {
          log.dim(`    - ${pkg}`);
        }
      }
    }
  }

  log.newline();
  return result.issues.length > 0 ? 1 : 0;
}

/**
 * Bump version using changesets.
 */
export async function bumpVersion(type: 'patch' | 'minor' | 'major'): Promise<number> {
  log.banner('Version Bump');

  const root = findRoot();

  try {
    // Check if there are changesets
    const changesetsDir = path.join(root, '.changeset');
    if (!existsSync(changesetsDir)) {
      log.error('No .changeset directory found');
      log.info('Run: pnpm changeset');
      return 1;
    }

    // Run changeset version
    log.info('Applying changesets...');
    execSync('pnpm changeset version', { cwd: root, stdio: 'inherit' });

    log.success('Versions bumped successfully');
    log.info('Review changes and commit when ready');

    return 0;
  } catch (error) {
    log.error('Failed to bump versions');
    return 1;
  }
}

/**
 * Show what would be published.
 */
export async function showPublishable(): Promise<number> {
  log.banner('Publishable Packages');

  const result = await checkVersions();
  const publishable = result.packages.filter((p) => !p.private);

  if (publishable.length === 0) {
    log.info('No publishable packages found');
    return 0;
  }

  log.newline();
  log.info(`${publishable.length} packages can be published:`);
  log.newline();

  for (const pkg of publishable.sort((a, b) => a.name.localeCompare(b.name))) {
    log.kv(pkg.name.padEnd(30), pkg.version);
  }

  log.newline();
  log.info('To publish: pnpm release');

  return 0;
}
