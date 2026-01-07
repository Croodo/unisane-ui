import { execSync } from 'node:child_process';

export interface EnsureCleanOptions {
  failOnDirty?: boolean;
}

/**
 * Check if git working tree is clean.
 * Warns or throws if there are uncommitted changes.
 */
export async function ensureCleanWorkingTree(
  opts: EnsureCleanOptions = {}
): Promise<void> {
  try {
    const out = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (out) {
      const msg =
        'Working tree is not clean. Consider committing/stashing before regeneration.';
      if (opts.failOnDirty || process.env.DEVTOOLS_FAIL_ON_DIRTY === '1') {
        throw new Error(msg);
      }
      console.warn(`\x1b[33m⚠️  ${msg}\x1b[0m`);
    }
  } catch (e) {
    // Re-throw if it's our own error
    if (String(e).includes('Working tree is not clean')) throw e;
    // Otherwise ignore - git might not be available (CI containers, etc.)
  }
}

/**
 * Check if we're in a git repository
 */
export function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the git root directory
 */
export function getGitRoot(): string | null {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}
