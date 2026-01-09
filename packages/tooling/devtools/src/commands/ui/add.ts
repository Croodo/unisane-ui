/**
 * @module commands/ui/add
 *
 * Add UI components to project (shadcn-style).
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, writeFileSync, mkdirSync, readJsonSync } = fse;
import path from 'path';
import { log, prompt } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

interface ComponentMeta {
  name: string;
  type: string;
  description: string;
  files: string[];
  dependencies: string[];
  registryDependencies: string[];
  devDependencies?: string[];
}

interface Registry {
  version: string;
  components: Record<string, ComponentMeta>;
}

interface UnisaneConfig {
  aliases?: {
    components?: string;
    lib?: string;
    hooks?: string;
  };
  srcDir?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function loadRegistry(cwd: string): Registry | null {
  const registryPath = path.join(cwd, 'node_modules', '@unisane', 'ui', 'registry', 'registry.json');

  if (!existsSync(registryPath)) {
    return null;
  }

  return readJsonSync(registryPath);
}

function loadConfig(cwd: string): UnisaneConfig {
  const configPath = path.join(cwd, 'unisane.json');
  const packageJsonPath = path.join(cwd, 'package.json');

  if (existsSync(configPath)) {
    try {
      return readJsonSync(configPath);
    } catch {
      // Fall through
    }
  }

  if (existsSync(packageJsonPath)) {
    try {
      const pkg = readJsonSync(packageJsonPath);
      if (pkg.unisane) return pkg.unisane;
    } catch {
      // Fall through
    }
  }

  return {
    aliases: {
      components: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
    },
    srcDir: existsSync(path.join(cwd, 'src')) ? 'src' : '',
  };
}

function getAllDependencies(components: string[], registry: Registry, visited = new Set<string>()): Set<string> {
  for (const comp of components) {
    if (visited.has(comp)) continue;

    const meta = registry.components[comp];
    if (!meta) continue;

    visited.add(comp);

    for (const dep of meta.registryDependencies || []) {
      if (!visited.has(dep)) {
        getAllDependencies([dep], registry, visited);
      }
    }
  }

  return visited;
}

function getTargetDir(type: string, config: UnisaneConfig, cwd: string): string {
  const srcDir = config.srcDir || '';
  const basePath = srcDir ? path.join(cwd, srcDir) : cwd;

  if (type === 'lib:util') return path.join(basePath, 'lib');
  if (type === 'hooks:ui') return path.join(basePath, 'hooks');
  if (type === 'types:ui') return path.join(basePath, 'types');

  return path.join(basePath, 'components', 'ui');
}

function transformImports(content: string, config: UnisaneConfig): string {
  const componentsAlias = config.aliases?.components || '@/components/ui';
  const libAlias = config.aliases?.lib || '@/lib';
  const hooksAlias = config.aliases?.hooks || '@/hooks';

  return content
    .replace(/from\s+['"]@ui\/(primitives|layout|components)\/([^'"]+)['"]/g, `from '${componentsAlias}/$2'`)
    .replace(/from\s+['"]@ui\/lib\/([^'"]+)['"]/g, `from '${libAlias}/$1'`)
    .replace(/from\s+['"]@ui\/hooks\/([^'"]+)['"]/g, `from '${hooksAlias}/$1'`);
}

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

export interface UiAddOptions {
  cwd?: string;
  components?: string[];
  all?: boolean;
  overwrite?: boolean;
  yes?: boolean;
}

export async function uiAdd(options: UiAddOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();

  const registry = loadRegistry(cwd);
  if (!registry) {
    log.error('Registry not found');
    log.dim('Make sure @unisane/ui is installed:');
    log.dim('  pnpm add @unisane/ui');
    return 1;
  }

  const config = loadConfig(cwd);
  const registryDir = path.join(cwd, 'node_modules', '@unisane', 'ui', 'registry');

  // Get available components (exclude lib utils)
  const availableComponents = Object.entries(registry.components)
    .filter(([_, meta]) => meta.type !== 'lib:util')
    .map(([key]) => key)
    .sort();

  let selectedComponents: string[] = [];

  // Handle --all
  if (options.all) {
    selectedComponents = availableComponents;
    log.info(`Adding all ${selectedComponents.length} components...`);
  }
  // Handle components from args
  else if (options.components && options.components.length > 0) {
    const invalid = options.components.filter((name) => !registry.components[name]);
    if (invalid.length > 0) {
      log.error(`Unknown components: ${invalid.join(', ')}`);
      log.dim('Run: unisane ui add (to see available components)');
      return 1;
    }
    selectedComponents = options.components;
  }
  // Interactive selection
  else {
    const choices = availableComponents.map((key) => {
      const comp = registry.components[key];
      return {
        title: comp?.name || key,
        value: key,
        description: comp?.description || '',
      };
    });

    const selected = await prompt.multiselect<string>({
      message: 'Which components would you like to add?',
      choices,
    });

    if (!selected || selected.length === 0) {
      log.warn('No components selected');
      return 0;
    }

    selectedComponents = selected;
  }

  // Get all dependencies (including transitive)
  const allComponents = getAllDependencies(selectedComponents, registry);
  allComponents.add('utils'); // Always include utils

  const depsCount = allComponents.size - selectedComponents.length;
  if (depsCount > 0) {
    log.dim(`Resolving ${depsCount} dependencies...`);
  }

  // Confirm
  if (!options.yes && !options.all) {
    const componentList = Array.from(allComponents).sort();
    log.newline();
    log.info('Components to add:');

    for (const comp of componentList) {
      const meta = registry.components[comp];
      const isSelected = selectedComponents.includes(comp);
      const prefix = isSelected ? '◉' : '○';
      const suffix = isSelected ? '' : ' (dependency)';
      log.dim(`  ${prefix} ${meta?.name || comp}${suffix}`);
    }

    const confirm = await prompt.confirm({ message: 'Proceed?', initial: true });
    if (!confirm) {
      log.warn('Cancelled');
      return 0;
    }
  }

  // Copy components
  log.info('Installing components...');

  const copied: string[] = [];
  const skipped: string[] = [];

  for (const comp of allComponents) {
    const meta = registry.components[comp];
    if (!meta) continue;

    const targetDir = getTargetDir(meta.type, config, cwd);
    mkdirSync(targetDir, { recursive: true });

    for (const file of meta.files) {
      const srcFile = path.join(registryDir, file);
      const fileName = path.basename(file);
      const destFile = path.join(targetDir, fileName);

      if (existsSync(destFile) && !options.overwrite) {
        skipped.push(fileName);
        continue;
      }

      try {
        let content = readFileSync(srcFile, 'utf-8');
        content = transformImports(content, config);
        writeFileSync(destFile, content);
        copied.push(path.relative(cwd, destFile));
      } catch {
        log.warn(`Could not copy ${file}`);
      }
    }
  }

  log.success('Components installed!');

  if (copied.length > 0) {
    log.newline();
    log.info('Created files:');
    for (const file of copied) {
      log.dim(`  ${file}`);
    }
  }

  if (skipped.length > 0) {
    log.newline();
    log.warn('Skipped existing files:');
    for (const file of skipped) {
      log.dim(`  ${file}`);
    }
    log.dim('Use --overwrite to replace existing files');
  }

  // Show npm dependencies
  const npmDeps = new Set<string>();
  const npmDevDeps = new Set<string>();

  for (const comp of allComponents) {
    const meta = registry.components[comp];
    if (!meta) continue;
    for (const dep of meta.dependencies || []) npmDeps.add(dep);
    for (const dep of meta.devDependencies || []) npmDevDeps.add(dep);
  }

  if (npmDeps.size > 0 || npmDevDeps.size > 0) {
    log.newline();
    log.info('Required npm packages:');
    if (npmDeps.size > 0) {
      log.dim(`  pnpm add ${Array.from(npmDeps).join(' ')}`);
    }
    if (npmDevDeps.size > 0) {
      log.dim(`  pnpm add -D ${Array.from(npmDevDeps).join(' ')}`);
    }
  }

  return 0;
}
