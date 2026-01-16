/**
 * Template downloading and extraction utilities.
 *
 * Downloads templates from GitHub releases or repository.
 *
 * ## Security Note (DEV-007)
 *
 * This module handles untrusted archive extraction which is vulnerable to
 * "Zip Slip" attacks where malicious archives contain entries with path
 * traversal sequences (e.g., "../../../etc/passwd").
 *
 * All path operations validate that resolved paths stay within the expected
 * destination directory to prevent writing files outside the target.
 */

import got from 'got';
import * as tar from 'tar';
import { pipeline } from 'stream/promises';
import path from 'path';
import fse from 'fs-extra';
import os from 'os';

const { createWriteStream, ensureDirSync, moveSync, removeSync, existsSync, readdirSync, statSync } = fse;

/**
 * DEV-007 FIX: Validate that a path stays within a base directory.
 *
 * Prevents path traversal attacks (Zip Slip) where extracted files
 * could be written outside the intended directory.
 *
 * @param basePath - The base directory that paths must stay within
 * @param targetPath - The path to validate
 * @returns true if targetPath is within basePath
 */
function isPathWithinBase(basePath: string, targetPath: string): boolean {
  const normalizedBase = path.resolve(basePath);
  const normalizedTarget = path.resolve(targetPath);

  // Ensure base ends with separator to prevent partial matches
  const baseWithSep = normalizedBase.endsWith(path.sep) ? normalizedBase : normalizedBase + path.sep;

  return normalizedTarget === normalizedBase || normalizedTarget.startsWith(baseWithSep);
}

/**
 * DEV-007 FIX: Validate a path before file operations.
 *
 * @throws Error if path escapes the base directory
 */
function validatePathWithinBase(basePath: string, targetPath: string, context: string): void {
  if (!isPathWithinBase(basePath, targetPath)) {
    throw new Error(
      `Security error: ${context} attempted to access path outside allowed directory.\n` +
      `  Target: ${targetPath}\n` +
      `  Base: ${basePath}\n` +
      `This may indicate a path traversal attack in the archive.`
    );
  }
}

export interface TemplateConfig {
  repo: string;
  branch: string;
  path: string;
}

export interface DownloadOptions {
  template: TemplateConfig;
  destination: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// Default timeout for network requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

/**
 * Download and extract a template from GitHub.
 */
export async function downloadAndExtractTemplate(options: DownloadOptions): Promise<void> {
  const { template, destination } = options;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  // Create temp directory
  const tempDir = path.join(os.tmpdir(), `create-unisane-${Date.now()}`);
  ensureDirSync(tempDir);

  try {
    // Download tarball from GitHub
    const tarballUrl = `https://codeload.github.com/${template.repo}/tar.gz/${template.branch}`;

    const tarballPath = path.join(tempDir, 'template.tar.gz');
    const writeStream = createWriteStream(tarballPath);

    await pipeline(
      got.stream(tarballUrl, { timeout: { request: timeout } }),
      writeStream
    );

    // Extract tarball
    const extractDir = path.join(tempDir, 'extracted');
    ensureDirSync(extractDir);

    // DEV-007 FIX: Use filter to prevent zip slip during extraction
    await tar.extract({
      file: tarballPath,
      cwd: extractDir,
      filter: (entryPath) => {
        // Block entries with path traversal sequences
        if (entryPath.includes('..')) {
          console.warn(`Skipping suspicious archive entry: ${entryPath}`);
          return false;
        }
        // Block absolute paths
        if (path.isAbsolute(entryPath)) {
          console.warn(`Skipping absolute path in archive: ${entryPath}`);
          return false;
        }
        return true;
      },
    });

    // Find the extracted directory (GitHub adds repo-branch prefix)
    const extractedContents = readdirSync(extractDir);

    // DEV-007 FIX: Validate extracted directory
    if (extractedContents.length === 0) {
      throw new Error('Failed to extract template: archive is empty');
    }

    // Find the first directory entry (GitHub archives always have a single root dir)
    const repoDir = extractedContents.find((entry) => {
      const entryPath = path.join(extractDir, entry);
      // DEV-007 FIX: Validate path before stat
      validatePathWithinBase(extractDir, entryPath, 'template extraction');
      try {
        return statSync(entryPath).isDirectory();
      } catch {
        return false;
      }
    });

    if (!repoDir) {
      throw new Error('Failed to extract template: no directory found in archive');
    }

    // DEV-007 FIX: Validate template path construction
    const repoDirPath = path.join(extractDir, repoDir);
    validatePathWithinBase(extractDir, repoDirPath, 'template extraction');

    // Copy template path to destination
    const templateSource = path.join(repoDirPath, template.path);
    validatePathWithinBase(extractDir, templateSource, 'template extraction');

    if (!existsSync(templateSource)) {
      throw new Error(`Template path not found: ${template.path}`);
    }

    // DEV-007 FIX: Validate destination is absolute to prevent confusion
    const resolvedDestination = path.resolve(destination);

    // Copy files with path validation
    const files = readdirSync(templateSource);
    for (const file of files) {
      // DEV-007 FIX: Validate each file path before operations
      // This prevents malicious filenames like "../../../etc/passwd"
      if (file.includes('..') || file.includes('\0')) {
        console.warn(`Skipping suspicious filename: ${file}`);
        continue;
      }

      const src = path.join(templateSource, file);
      const dest = path.join(resolvedDestination, file);

      // Validate both source and destination paths
      validatePathWithinBase(templateSource, src, 'template file copy (source)');
      validatePathWithinBase(resolvedDestination, dest, 'template file copy (destination)');

      moveSync(src, dest, { overwrite: true });
    }
  } finally {
    // Cleanup temp directory
    removeSync(tempDir);
  }
}

/**
 * Download template from npm registry (alternative method).
 */
export async function downloadFromNpm(
  packageName: string,
  destination: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<void> {
  const tempDir = path.join(os.tmpdir(), `create-unisane-${Date.now()}`);
  ensureDirSync(tempDir);

  try {
    // Get package info from npm
    const response = await got(`https://registry.npmjs.org/${packageName}/latest`, {
      timeout: { request: timeout },
    }).json<{
      dist: { tarball: string };
    }>();

    const tarballUrl = response.dist.tarball;
    const tarballPath = path.join(tempDir, 'package.tar.gz');

    // Download tarball
    const writeStream = createWriteStream(tarballPath);
    await pipeline(
      got.stream(tarballUrl, { timeout: { request: timeout } }),
      writeStream
    );

    // DEV-007 FIX: Validate destination is absolute
    const resolvedDestination = path.resolve(destination);

    // Extract with zip slip protection
    await tar.extract({
      file: tarballPath,
      cwd: resolvedDestination,
      strip: 1, // Remove 'package/' prefix
      // DEV-007 FIX: Use filter to prevent zip slip during extraction
      filter: (entryPath) => {
        // Block entries with path traversal sequences
        if (entryPath.includes('..')) {
          console.warn(`Skipping suspicious archive entry: ${entryPath}`);
          return false;
        }
        // Block absolute paths
        if (path.isAbsolute(entryPath)) {
          console.warn(`Skipping absolute path in archive: ${entryPath}`);
          return false;
        }
        return true;
      },
    });
  } finally {
    removeSync(tempDir);
  }
}

/**
 * Check if we can reach GitHub.
 */
export async function canReachGitHub(): Promise<boolean> {
  try {
    await got('https://github.com', { timeout: { request: 5000 } });
    return true;
  } catch {
    return false;
  }
}
