/**
 * Staleness detection utilities for generated files.
 *
 * Compares modification times between source contracts and generated outputs
 * to determine if regeneration is needed.
 */
import { statSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { glob } from 'glob';
import { createHash } from 'node:crypto';

export interface StalenessResult {
  isStale: boolean;
  reason?: string;
  sourceFiles: string[];
  generatedFiles: string[];
  newestSource?: { path: string; mtime: Date };
  oldestGenerated?: { path: string; mtime: Date };
}

/**
 * Get the modification time of a file, or null if it doesn't exist.
 */
export function getFileMtime(filePath: string): Date | null {
  try {
    const stat = statSync(filePath);
    return stat.mtime;
  } catch {
    return null;
  }
}

/**
 * Find the newest file in a list by modification time.
 */
export function findNewestFile(files: string[]): { path: string; mtime: Date } | null {
  let newest: { path: string; mtime: Date } | null = null;

  for (const file of files) {
    const mtime = getFileMtime(file);
    if (mtime && (!newest || mtime > newest.mtime)) {
      newest = { path: file, mtime };
    }
  }

  return newest;
}

/**
 * Find the oldest file in a list by modification time.
 */
export function findOldestFile(files: string[]): { path: string; mtime: Date } | null {
  let oldest: { path: string; mtime: Date } | null = null;

  for (const file of files) {
    const mtime = getFileMtime(file);
    if (mtime && (!oldest || mtime < oldest.mtime)) {
      oldest = { path: file, mtime };
    }
  }

  return oldest;
}

/**
 * Check if generated routes are stale compared to contract sources.
 */
export async function checkRoutesStaleness(args: {
  contractsDir: string;
  routesDir: string;
  contractsGlob?: string;
}): Promise<StalenessResult> {
  const { contractsDir, routesDir, contractsGlob = '**/*.contract.ts' } = args;

  // Find all contract source files
  const sourceFiles = await glob(contractsGlob, { cwd: contractsDir, absolute: true });

  // Find all generated route files
  const generatedFiles = await glob('**/route.ts', { cwd: routesDir, absolute: true });

  // No generated files = definitely stale
  if (generatedFiles.length === 0) {
    return {
      isStale: true,
      reason: 'No generated route files found',
      sourceFiles,
      generatedFiles,
    };
  }

  // No source files = nothing to generate from
  if (sourceFiles.length === 0) {
    return {
      isStale: false,
      reason: 'No contract source files found',
      sourceFiles,
      generatedFiles,
    };
  }

  const newestSource = findNewestFile(sourceFiles);
  const oldestGenerated = findOldestFile(generatedFiles);

  if (!newestSource || !oldestGenerated) {
    return {
      isStale: true,
      reason: 'Could not determine file timestamps',
      sourceFiles,
      generatedFiles,
    };
  }

  const isStale = newestSource.mtime > oldestGenerated.mtime;

  return {
    isStale,
    reason: isStale
      ? `Contract ${newestSource.path} (${newestSource.mtime.toISOString()}) is newer than generated ${oldestGenerated.path} (${oldestGenerated.mtime.toISOString()})`
      : 'All generated files are up to date',
    sourceFiles,
    generatedFiles,
    newestSource,
    oldestGenerated,
  };
}

/**
 * Check if generated SDK is stale compared to contract sources.
 */
export async function checkSdkStaleness(args: {
  contractsDir: string;
  sdkDir: string;
  contractsGlob?: string;
}): Promise<StalenessResult> {
  const { contractsDir, sdkDir, contractsGlob = '**/*.contract.ts' } = args;

  // Find all contract source files
  const sourceFiles = await glob(contractsGlob, { cwd: contractsDir, absolute: true });

  // Find all generated SDK files
  const generatedFiles = await glob('**/*.ts', { cwd: sdkDir, absolute: true });

  // No generated files = definitely stale
  if (generatedFiles.length === 0) {
    return {
      isStale: true,
      reason: 'No generated SDK files found',
      sourceFiles,
      generatedFiles,
    };
  }

  // No source files = nothing to generate from
  if (sourceFiles.length === 0) {
    return {
      isStale: false,
      reason: 'No contract source files found',
      sourceFiles,
      generatedFiles,
    };
  }

  const newestSource = findNewestFile(sourceFiles);
  const oldestGenerated = findOldestFile(generatedFiles);

  if (!newestSource || !oldestGenerated) {
    return {
      isStale: true,
      reason: 'Could not determine file timestamps',
      sourceFiles,
      generatedFiles,
    };
  }

  const isStale = newestSource.mtime > oldestGenerated.mtime;

  return {
    isStale,
    reason: isStale
      ? `Contract ${newestSource.path} is newer than generated SDK`
      : 'SDK is up to date',
    sourceFiles,
    generatedFiles,
    newestSource,
    oldestGenerated,
  };
}

/**
 * Staleness manifest for tracking generation state.
 * Stores hashes of source files to detect content changes.
 */
export interface StalenessManifest {
  version: 1;
  generatedAt: string;
  generator: 'routes' | 'sdk' | 'all';
  sourceHashes: Record<string, string>;
}

const MANIFEST_FILENAME = '.unisane-generated.json';

/**
 * Compute a hash of file contents.
 */
export function hashFileContents(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}

/**
 * Write a staleness manifest after generation.
 */
export function writeStalenessManifest(args: {
  outputDir: string;
  generator: StalenessManifest['generator'];
  sourceFiles: string[];
}): void {
  const { outputDir, generator, sourceFiles } = args;

  const sourceHashes: Record<string, string> = {};
  for (const file of sourceFiles) {
    const hash = hashFileContents(file);
    if (hash) {
      sourceHashes[file] = hash;
    }
  }

  const manifest: StalenessManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    generator,
    sourceHashes,
  };

  const manifestPath = join(outputDir, MANIFEST_FILENAME);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Read staleness manifest from output directory.
 */
export function readStalenessManifest(outputDir: string): StalenessManifest | null {
  const manifestPath = join(outputDir, MANIFEST_FILENAME);
  try {
    const content = readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as StalenessManifest;
  } catch {
    return null;
  }
}

/**
 * Check if generation is needed based on manifest and current source files.
 * More accurate than mtime comparison as it detects content changes.
 */
export async function checkStalenessWithManifest(args: {
  outputDir: string;
  sourceFiles: string[];
}): Promise<{ isStale: boolean; changedFiles: string[]; newFiles: string[]; deletedFiles: string[] }> {
  const { outputDir, sourceFiles } = args;

  const manifest = readStalenessManifest(outputDir);

  // No manifest = definitely stale
  if (!manifest) {
    return {
      isStale: true,
      changedFiles: [],
      newFiles: sourceFiles,
      deletedFiles: [],
    };
  }

  const changedFiles: string[] = [];
  const newFiles: string[] = [];
  const currentHashes: Record<string, string> = {};

  // Check each source file
  for (const file of sourceFiles) {
    const hash = hashFileContents(file);
    if (hash) {
      currentHashes[file] = hash;

      if (!manifest.sourceHashes[file]) {
        newFiles.push(file);
      } else if (manifest.sourceHashes[file] !== hash) {
        changedFiles.push(file);
      }
    }
  }

  // Check for deleted files
  const deletedFiles = Object.keys(manifest.sourceHashes).filter(
    (file) => !currentHashes[file]
  );

  const isStale = changedFiles.length > 0 || newFiles.length > 0 || deletedFiles.length > 0;

  return { isStale, changedFiles, newFiles, deletedFiles };
}
