/**
 * @module commands/upgrade
 *
 * Upgrade Unisane packages and apply codemods.
 * Similar to: next upgrade, @angular/cli update
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, writeFileSync } = fse;
import path from 'path';
import { execSync } from 'child_process';
import { log, prompt } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface UpgradeOptions {
  /** Target version (latest, next, or specific version) */
  target?: string;
  /** Dry run mode */
  dryRun?: boolean;
  /** Skip confirmation prompts */
  yes?: boolean;
  /** Run codemods after upgrade */
  codemods?: boolean;
}

export interface PackageInfo {
  name: string;
  current: string;
  latest: string;
  wanted: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Main Command
// ════════════════════════════════════════════════════════════════════════════

export async function upgrade(options: UpgradeOptions): Promise<number> {
  log.section('Upgrade Unisane');

  const target = options.target ?? 'latest';

  // Find all @unisane/* packages in the project
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) {
    log.error('package.json not found');
    return 1;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const unisanePackages = Object.entries(deps)
    .filter(([name]) => name.startsWith('@unisane/'))
    .map(([name, version]) => ({ name, current: version as string }));

  if (unisanePackages.length === 0) {
    log.info('No @unisane/* packages found in this project');
    return 0;
  }

  log.info(`Found ${unisanePackages.length} Unisane package(s)`);
  log.newline();

  // Check for updates
  const spinner = log.spinner('Checking for updates...');
  spinner.start();

  const updates: PackageInfo[] = [];

  for (const pkg of unisanePackages) {
    try {
      // In real implementation, fetch from npm registry
      const latest = await getLatestVersion(pkg.name, target);
      if (latest && latest !== pkg.current.replace(/^[\^~]/, '')) {
        updates.push({
          name: pkg.name,
          current: pkg.current,
          latest,
          wanted: target === 'latest' ? `^${latest}` : latest,
        });
      }
    } catch {
      // Package not found in registry
    }
  }

  spinner.stop();

  if (updates.length === 0) {
    log.success('All packages are up to date!');
    return 0;
  }

  // Show available updates
  log.info('Available updates:');
  log.newline();

  const headers = ['Package', 'Current', 'Latest'];
  const rows = updates.map((u) => [u.name, u.current, u.latest]);
  log.table(headers, rows);

  if (options.dryRun) {
    log.newline();
    log.info('Dry run - no changes made');
    return 0;
  }

  // Confirm upgrade
  if (!options.yes) {
    log.newline();
    const confirmed = await prompt.confirm({
      message: `Upgrade ${updates.length} package(s)?`,
      initial: true,
    });

    if (!confirmed) {
      log.warn('Cancelled');
      return 0;
    }
  }

  // Perform upgrade
  const upgradeSpinner = log.spinner('Upgrading packages...');
  upgradeSpinner.start();

  try {
    // Update package.json
    for (const update of updates) {
      if (pkg.dependencies?.[update.name]) {
        pkg.dependencies[update.name] = update.wanted;
      }
      if (pkg.devDependencies?.[update.name]) {
        pkg.devDependencies[update.name] = update.wanted;
      }
    }

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

    // Install updated packages
    const pm = detectPackageManager();
    execSync(`${pm} install`, { stdio: 'inherit' });

    upgradeSpinner.succeed('Packages upgraded successfully');
  } catch (error) {
    upgradeSpinner.fail('Failed to upgrade packages');
    throw error;
  }

  // Run codemods if requested
  if (options.codemods) {
    log.newline();
    log.info('Running codemods...');
    await runCodemods(target);
  }

  // Show post-upgrade instructions
  log.newline();
  log.success('Upgrade complete!');
  log.newline();
  log.info('Next steps:');
  log.dim('  1. Review CHANGELOG for breaking changes');
  log.dim('  2. Run: pnpm check-types');
  log.dim('  3. Run: pnpm test');
  log.dim('  4. Run: pnpm dev');

  return 0;
}

export async function listVersions(): Promise<number> {
  log.section('Installed Unisane Packages');

  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) {
    log.error('package.json not found');
    return 1;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};

  const packages: Array<{ name: string; version: string; type: string }> = [];

  for (const [name, version] of Object.entries(deps)) {
    if (name.startsWith('@unisane/')) {
      packages.push({ name, version: version as string, type: 'dependency' });
    }
  }

  for (const [name, version] of Object.entries(devDeps)) {
    if (name.startsWith('@unisane/')) {
      packages.push({ name, version: version as string, type: 'devDependency' });
    }
  }

  if (packages.length === 0) {
    log.info('No @unisane/* packages found');
    return 0;
  }

  const headers = ['Package', 'Version', 'Type'];
  const rows = packages.map((p) => [p.name, p.version, p.type]);
  log.table(headers, rows);

  return 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════════════════════════

async function getLatestVersion(packageName: string, tag: string): Promise<string | null> {
  // In real implementation, fetch from npm registry
  // For now, return a mock version
  try {
    const result = execSync(`npm view ${packageName}@${tag} version 2>/dev/null`, {
      encoding: 'utf-8',
    }).trim();
    return result || null;
  } catch {
    return null;
  }
}

function detectPackageManager(): string {
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (existsSync('yarn.lock')) return 'yarn';
  if (existsSync('bun.lockb')) return 'bun';
  return 'npm';
}

async function runCodemods(targetVersion: string): Promise<void> {
  // In real implementation, run version-specific codemods
  // Similar to how Next.js handles migrations
  log.warn('Codemods not yet implemented');
  log.info('Manual migration may be required. Check:');
  log.dim('  https://unisane.dev/docs/upgrade-guide');
}
