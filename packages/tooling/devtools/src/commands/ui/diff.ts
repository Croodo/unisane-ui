/**
 * @module commands/ui/diff
 *
 * Check for component updates.
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, readJsonSync } = fse;
import path from 'path';
import { log } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

interface ComponentMeta {
  name: string;
  type: string;
  files: string[];
}

interface Registry {
  version: string;
  components: Record<string, ComponentMeta>;
}

interface UnisaneConfig {
  srcDir?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function loadConfig(cwd: string): UnisaneConfig {
  const configPath = path.join(cwd, 'unisane.json');

  if (existsSync(configPath)) {
    try {
      return readJsonSync(configPath);
    } catch {
      // Fall through
    }
  }

  return {
    srcDir: existsSync(path.join(cwd, 'src')) ? 'src' : '',
  };
}

function getTargetDir(type: string, config: UnisaneConfig, cwd: string): string {
  const srcDir = config.srcDir || '';
  const basePath = srcDir ? path.join(cwd, srcDir) : cwd;

  if (type === 'lib:util') return path.join(basePath, 'lib');
  if (type === 'hooks:ui') return path.join(basePath, 'hooks');

  return path.join(basePath, 'components', 'ui');
}

function normalizeContent(content: string): string {
  return content
    .replace(/@ui\/(primitives|layout|components)\//g, '@/components/ui/')
    .replace(/@ui\/lib\//g, '@/lib/')
    .replace(/@ui\/hooks\//g, '@/hooks/');
}

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

export interface UiDiffOptions {
  cwd?: string;
  component?: string;
}

export async function uiDiff(options: UiDiffOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();

  const registryPath = path.join(cwd, 'node_modules', '@unisane', 'ui', 'registry', 'registry.json');

  if (!existsSync(registryPath)) {
    log.error('Registry not found');
    log.dim('Make sure @unisane/ui is installed');
    return 1;
  }

  const registry: Registry = readJsonSync(registryPath);
  const config = loadConfig(cwd);
  const registryDir = path.join(cwd, 'node_modules', '@unisane', 'ui', 'registry');

  const componentsToCheck: string[] = [];

  if (options.component) {
    if (!registry.components[options.component]) {
      log.error(`Unknown component: ${options.component}`);
      return 1;
    }
    componentsToCheck.push(options.component);
  } else {
    // Find all installed components
    for (const [key, meta] of Object.entries(registry.components)) {
      const targetDir = getTargetDir(meta.type, config, cwd);
      const fileName = path.basename(meta.files[0] || '');
      const localPath = path.join(targetDir, fileName);

      if (existsSync(localPath)) {
        componentsToCheck.push(key);
      }
    }
  }

  if (componentsToCheck.length === 0) {
    log.warn('No components found to check');
    log.dim('Run: unisane ui add <component>');
    return 0;
  }

  log.info(`Checking ${componentsToCheck.length} component(s) for updates...`);
  log.newline();

  let hasChanges = false;
  let upToDate = 0;

  for (const comp of componentsToCheck) {
    const meta = registry.components[comp];
    if (!meta) continue;

    const targetDir = getTargetDir(meta.type, config, cwd);

    for (const file of meta.files) {
      const fileName = path.basename(file);
      const localPath = path.join(targetDir, fileName);
      const registryFilePath = path.join(registryDir, file);

      if (!existsSync(localPath)) continue;

      try {
        const localContent = readFileSync(localPath, 'utf-8');
        const registryContent = readFileSync(registryFilePath, 'utf-8');
        const normalizedRegistry = normalizeContent(registryContent);

        if (localContent !== normalizedRegistry) {
          hasChanges = true;

          // Simple diff counting
          const localLines = localContent.split('\n').length;
          const registryLines = normalizedRegistry.split('\n').length;
          const diff = Math.abs(localLines - registryLines);

          log.warn(`${meta.name}`);
          log.dim(`  ${path.relative(cwd, localPath)}`);
          log.dim(`  ~${diff} line(s) different`);
        } else {
          upToDate++;
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  log.newline();

  if (!hasChanges) {
    log.success(`All ${upToDate} component(s) are up to date!`);
  } else {
    log.info('To update components:');
    log.dim('  unisane ui add <component> --overwrite');
    log.dim('  unisane ui add --all --overwrite');
  }

  return 0;
}
