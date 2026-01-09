/**
 * Template downloading and extraction utilities.
 *
 * Downloads templates from GitHub releases or repository.
 */

import got from 'got';
import * as tar from 'tar';
import { pipeline } from 'stream/promises';
import path from 'path';
import fse from 'fs-extra';
import os from 'os';

const { createWriteStream, ensureDirSync, moveSync, removeSync, existsSync, readdirSync } = fse;

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

    await tar.extract({
      file: tarballPath,
      cwd: extractDir,
    });

    // Find the extracted directory (GitHub adds repo-branch prefix)
    const extractedContents = readdirSync(extractDir);
    const repoDir = extractedContents[0]; // e.g., "unisane-main"

    if (!repoDir) {
      throw new Error('Failed to extract template');
    }

    // Copy template path to destination
    const templateSource = path.join(extractDir, repoDir, template.path);

    if (!existsSync(templateSource)) {
      throw new Error(`Template path not found: ${template.path}`);
    }

    // Copy files
    const files = readdirSync(templateSource);
    for (const file of files) {
      const src = path.join(templateSource, file);
      const dest = path.join(destination, file);
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

    // Extract
    await tar.extract({
      file: tarballPath,
      cwd: destination,
      strip: 1, // Remove 'package/' prefix
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
