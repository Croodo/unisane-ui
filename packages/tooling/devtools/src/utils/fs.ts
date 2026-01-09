import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import fse from 'fs-extra';

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fse.ensureDir(dirPath);
}

/**
 * Write text to a file, creating parent directories if needed
 */
export async function writeText(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, content, 'utf8');
}

/**
 * Read text from a file
 */
export async function readText(filePath: string): Promise<string> {
  return fsp.readFile(filePath, 'utf8');
}

/**
 * Check if a file exists
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file exists (sync)
 */
export function existsSync(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Remove a file or directory
 */
export async function remove(targetPath: string): Promise<void> {
  await fse.remove(targetPath);
}

/**
 * Copy a file or directory
 */
export async function copy(src: string, dest: string): Promise<void> {
  await fse.copy(src, dest);
}

/**
 * Read JSON from a file
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  const text = await readText(filePath);
  return JSON.parse(text) as T;
}

/**
 * Write JSON to a file
 */
export async function writeJson(filePath: string, data: unknown, indent = 2): Promise<void> {
  const content = JSON.stringify(data, null, indent) + '\n';
  await writeText(filePath, content);
}

/**
 * Get file stats
 */
export async function stat(filePath: string): Promise<fs.Stats | null> {
  try {
    return await fsp.stat(filePath);
  } catch {
    return null;
  }
}

/**
 * List files in a directory
 */
export async function readdir(dirPath: string): Promise<string[]> {
  try {
    return await fsp.readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * Walk a directory recursively
 */
export async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

/**
 * Get relative path from cwd
 */
export function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}
