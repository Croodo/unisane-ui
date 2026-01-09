/**
 * @module commands/ui/doctor
 *
 * Health check for Unisane UI installation.
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, readJsonSync } = fse;
import path from 'path';
import { log } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  fix?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

export interface UiDoctorOptions {
  cwd?: string;
}

export async function uiDoctor(options: UiDoctorOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const results: CheckResult[] = [];

  log.banner('UI Doctor');
  log.info('Checking Unisane UI installation...');
  log.newline();

  // Check 1: package.json
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    log.error('Not in a project directory');
    return 1;
  }

  const pkg = readJsonSync(packageJsonPath);

  // Check 2: Next.js
  if (pkg.dependencies?.next) {
    results.push({
      name: 'Next.js',
      status: 'pass',
      message: `Found Next.js ${pkg.dependencies.next}`,
    });
  } else {
    results.push({
      name: 'Next.js',
      status: 'fail',
      message: 'Not a Next.js project',
      fix: 'Unisane UI requires Next.js',
    });
  }

  // Check 3: Tailwind CSS v4
  const tailwindVersion = pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss;
  if (tailwindVersion) {
    if (tailwindVersion.startsWith('^4') || tailwindVersion.startsWith('4')) {
      results.push({
        name: 'Tailwind CSS',
        status: 'pass',
        message: `Found Tailwind CSS v4 (${tailwindVersion})`,
      });
    } else {
      results.push({
        name: 'Tailwind CSS',
        status: 'warn',
        message: `Found Tailwind CSS ${tailwindVersion} (v4 recommended)`,
        fix: 'pnpm add tailwindcss@^4',
      });
    }
  } else {
    results.push({
      name: 'Tailwind CSS',
      status: 'fail',
      message: 'Tailwind CSS not found',
      fix: 'pnpm add tailwindcss@^4',
    });
  }

  // Check 4: @unisane/ui package
  if (pkg.dependencies?.['@unisane/ui'] || pkg.devDependencies?.['@unisane/ui']) {
    results.push({
      name: '@unisane/ui',
      status: 'pass',
      message: 'Package installed',
    });
  } else {
    results.push({
      name: '@unisane/ui',
      status: 'fail',
      message: 'Package not installed',
      fix: 'pnpm add @unisane/ui',
    });
  }

  // Check 5: Token files
  const hasSrc = existsSync(path.join(cwd, 'src'));
  const srcDir = hasSrc ? path.join(cwd, 'src') : cwd;
  const stylesDir = path.join(srcDir, 'styles');
  const unisaneCssPath = path.join(stylesDir, 'unisane.css');

  if (existsSync(unisaneCssPath)) {
    results.push({
      name: 'Design Tokens',
      status: 'pass',
      message: 'unisane.css found',
    });
  } else {
    results.push({
      name: 'Design Tokens',
      status: 'fail',
      message: 'unisane.css not found',
      fix: 'unisane ui init',
    });
  }

  // Check 6: globals.css imports
  const globalsCssPath = path.join(srcDir, 'app', 'globals.css');
  if (existsSync(globalsCssPath)) {
    const globalsContent = readFileSync(globalsCssPath, 'utf-8');
    if (globalsContent.includes('unisane.css')) {
      results.push({
        name: 'CSS Imports',
        status: 'pass',
        message: 'Token imports configured',
      });
    } else {
      results.push({
        name: 'CSS Imports',
        status: 'fail',
        message: 'Missing token imports in globals.css',
        fix: 'Add: @import "../styles/unisane.css";',
      });
    }
  } else {
    results.push({
      name: 'CSS Imports',
      status: 'warn',
      message: 'globals.css not found',
    });
  }

  // Check 7: Required dependencies
  const requiredDeps = ['class-variance-authority', 'clsx', 'tailwind-merge'];
  const missingDeps = requiredDeps.filter(
    (dep) => !pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]
  );

  if (missingDeps.length === 0) {
    results.push({
      name: 'Dependencies',
      status: 'pass',
      message: 'All required dependencies installed',
    });
  } else {
    results.push({
      name: 'Dependencies',
      status: 'fail',
      message: `Missing: ${missingDeps.join(', ')}`,
      fix: `pnpm add ${missingDeps.join(' ')}`,
    });
  }

  // Check 8: utils.ts
  const utilsPath = path.join(srcDir, 'lib', 'utils.ts');
  if (existsSync(utilsPath)) {
    results.push({
      name: 'Utils',
      status: 'pass',
      message: 'lib/utils.ts found',
    });
  } else {
    results.push({
      name: 'Utils',
      status: 'fail',
      message: 'lib/utils.ts not found',
      fix: 'unisane ui init',
    });
  }

  // Display results
  for (const result of results) {
    const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '!' : '✗';

    if (result.status === 'pass') {
      log.success(`${result.name}: ${result.message}`);
    } else if (result.status === 'warn') {
      log.warn(`${result.name}: ${result.message}`);
    } else {
      log.error(`${result.name}: ${result.message}`);
    }

    if (result.fix) {
      log.dim(`  Fix: ${result.fix}`);
    }
  }

  // Summary
  const passCount = results.filter((r) => r.status === 'pass').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const warnCount = results.filter((r) => r.status === 'warn').length;

  log.newline();
  log.info(`Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);

  if (failCount > 0) {
    log.newline();
    log.info('Run "unisane ui init" to fix most issues');
    return 1;
  }

  log.newline();
  log.success('Unisane UI installation looks good!');
  return 0;
}
