/**
 * Git initialization utilities.
 */

import { execSync } from 'child_process';

/**
 * Check if git is available.
 */
export function isGitAvailable(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're inside a git repository.
 */
export function isInsideGitRepo(cwd: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize a git repository.
 */
export function initializeGit(cwd: string): boolean {
  if (!isGitAvailable()) {
    return false;
  }

  // Don't init if already inside a git repo
  if (isInsideGitRepo(cwd)) {
    return false;
  }

  try {
    execSync('git init', { cwd, stdio: 'ignore' });
    execSync('git add -A', { cwd, stdio: 'ignore' });
    execSync('git commit -m "Initial commit from create-unisane"', {
      cwd,
      stdio: 'ignore',
    });
    return true;
  } catch {
    // Git init failed, clean up
    try {
      execSync('rm -rf .git', { cwd, stdio: 'ignore' });
    } catch {
      // Ignore cleanup errors
    }
    return false;
  }
}
