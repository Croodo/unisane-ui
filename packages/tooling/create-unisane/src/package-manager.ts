/**
 * Package manager detection and utilities.
 */

import { execSync, spawn } from 'child_process';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

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
 */
export function installDependencies(cwd: string, pm: PackageManager): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = pm === 'yarn' ? [] : ['install'];
    const command = pm;
    let settled = false;

    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
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
