/**
 * Package manager detection and utilities.
 *
 * SECURITY FIX (SEC-005): Removed shell: true from spawn calls to prevent command injection.
 * All package manager commands now use argument arrays instead of shell execution.
 */

import { execSync, spawn } from 'child_process';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

/**
 * Allowed package managers - used for validation to prevent command injection.
 * SECURITY: Only these exact strings are allowed as commands.
 */
const ALLOWED_PACKAGE_MANAGERS: readonly string[] = ['pnpm', 'npm', 'yarn', 'bun'] as const;

/**
 * Validate that a string is a valid package manager.
 * SECURITY: Prevents command injection by ensuring only allowed values are used.
 */
function isValidPackageManager(pm: string): pm is PackageManager {
  return ALLOWED_PACKAGE_MANAGERS.includes(pm);
}

/**
 * Detect which package manager invoked this script.
 */
export function getPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? '';

  if (userAgent.startsWith('pnpm')) return 'pnpm';
  if (userAgent.startsWith('yarn')) return 'yarn';
  if (userAgent.startsWith('bun')) return 'bun';

  // Check if running via npx
  const execPath = process.env.npm_execpath ?? '';
  if (execPath.includes('pnpm')) return 'pnpm';
  if (execPath.includes('yarn')) return 'yarn';

  // Default to pnpm if available, otherwise npm
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    return 'npm';
  }
}

/**
 * Get the install command for a package manager.
 */
export function getInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case 'yarn':
      return 'yarn';
    case 'pnpm':
      return 'pnpm install';
    case 'bun':
      return 'bun install';
    default:
      return 'npm install';
  }
}

/**
 * Get the run command for a package manager.
 */
export function getRunCommand(pm: PackageManager, script: string): string {
  switch (pm) {
    case 'yarn':
      return `yarn ${script}`;
    case 'pnpm':
      return `pnpm ${script}`;
    case 'bun':
      return `bun run ${script}`;
    default:
      return `npm run ${script}`;
  }
}

/**
 * Install dependencies in a directory.
 *
 * SECURITY FIX (SEC-005): Removed shell: true to prevent command injection.
 * Package manager is validated against allowlist before execution.
 */
export function installDependencies(cwd: string, pm: PackageManager): Promise<void> {
  return new Promise((resolve, reject) => {
    // SECURITY: Validate package manager against allowlist
    if (!isValidPackageManager(pm)) {
      reject(new Error(`Invalid package manager: ${pm}. Allowed: ${ALLOWED_PACKAGE_MANAGERS.join(', ')}`));
      return;
    }

    const args = pm === 'yarn' ? [] : ['install'];
    const command = pm;
    let settled = false;

    // SECURITY FIX (SEC-005): Removed shell: true
    // Using argument array instead of shell string prevents command injection
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      // shell: true - REMOVED for security
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (code !== 0) {
        reject(new Error(`${pm} install failed with exit code ${code}`));
        return;
      }
      resolve();
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

/**
 * Check if a package manager is available.
 */
export function isPackageManagerAvailable(pm: PackageManager): boolean {
  try {
    execSync(`${pm} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
