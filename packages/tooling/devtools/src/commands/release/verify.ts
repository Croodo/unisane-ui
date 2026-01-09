/**
 * @module commands/release/verify
 *
 * Verify a built starter is ready for distribution.
 */

import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { log } from '../../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface VerifyOptions {
  starter: string;
}

export interface VerifyResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// Main Command
// ════════════════════════════════════════════════════════════════════════════

export async function verifyBuild(options: VerifyOptions): Promise<number> {
  const { starter } = options;
  const rootDir = process.cwd();
  const starterDir = path.join(rootDir, 'starters', starter);

  log.section('Verifying Build');

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Starter directory exists
  log.dim('Checking starter directory...');
  if (!existsSync(starterDir)) {
    log.error(`Starter directory not found: ${starterDir}`);
    return 1;
  }
  log.success('Starter directory exists');

  // Check 2: Modules directory exists
  log.dim('Checking modules directory...');
  const modulesDir = path.join(starterDir, 'src', 'modules');
  if (!existsSync(modulesDir)) {
    log.error(`Modules directory not found: ${modulesDir}`);
    return 1;
  }
  log.success('Modules directory exists');

  // Check 3: No @unisane/* imports remain
  log.dim('Checking for untransformed imports...');
  const moduleFiles = await glob('**/*.{ts,tsx}', { cwd: modulesDir });

  const untransformedFiles: string[] = [];
  for (const file of moduleFiles) {
    const content = readFileSync(path.join(modulesDir, file), 'utf-8');
    const importPattern = /(?:from\s+|import\s*\()(['"])@unisane\/([a-z-]+)/g;
    const matches = [...content.matchAll(importPattern)];
    if (matches.length > 0) {
      const pkgs = [...new Set(matches.map(m => `@unisane/${m[2]}`))];
      untransformedFiles.push(`${file}: ${pkgs.join(', ')}`);
    }
  }

  if (untransformedFiles.length > 0) {
    errors.push(`Found untransformed @unisane/* imports:\n     ${untransformedFiles.join('\n     ')}`);
  } else {
    log.success('No untransformed @unisane/* imports');
  }

  // Check 4: No PRO markers in OSS build
  const pkgPath = path.join(starterDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const isOss = pkg.name?.includes('-oss');

  if (isOss) {
    log.dim('Checking for PRO markers in OSS build...');
    const proMarkerFiles: string[] = [];

    for (const file of moduleFiles) {
      const content = readFileSync(path.join(modulesDir, file), 'utf-8');
      if (/@pro-only/.test(content) && !content.includes('[PRO feature removed]')) {
        proMarkerFiles.push(file);
      }
    }

    if (proMarkerFiles.length > 0) {
      errors.push(`Found active PRO markers in OSS build:\n     ${proMarkerFiles.join('\n     ')}`);
    } else {
      log.success('No active PRO markers in OSS build');
    }
  }

  // Check 5: TypeScript configuration
  log.dim('Checking TypeScript configuration...');
  const tsconfigPath = path.join(starterDir, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    warnings.push('tsconfig.json not found');
  } else {
    log.success('tsconfig.json exists');

    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
    const paths = tsconfig.compilerOptions?.paths ?? {};

    if (!paths['@/modules/*'] && !paths['@/*']) {
      warnings.push('Missing @/modules/* path alias in tsconfig.json');
    } else {
      log.success('Path aliases configured');
    }
  }

  // Check 6: Package.json structure
  log.dim('Checking package.json...');

  const deps = pkg.dependencies ?? {};
  const workspaceDeps = Object.entries(deps).filter(([, v]) =>
    String(v).startsWith('workspace:')
  );

  if (workspaceDeps.length > 0) {
    errors.push(
      `Found workspace:* dependencies:\n     ${workspaceDeps.map(([k]) => k).join('\n     ')}`
    );
  } else {
    log.success('No workspace:* dependencies');
  }

  // Summary
  log.newline();

  if (warnings.length > 0) {
    log.warn(`Warnings (${warnings.length}):`);
    warnings.forEach((w) => log.dim(`   - ${w}`));
  }

  if (errors.length > 0) {
    log.error(`Verification failed with ${errors.length} error(s):`);
    errors.forEach((e) => log.dim(`   - ${e}`));
    return 1;
  }

  log.success('Verification passed!');
  return 0;
}
