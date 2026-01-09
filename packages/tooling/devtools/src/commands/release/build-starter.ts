/**
 * @module commands/release/build-starter
 *
 * Build a starter for distribution.
 * Flattens packages, transforms imports, strips PRO code.
 */

import fse from 'fs-extra';
const { copySync, ensureDirSync, existsSync, removeSync, readFileSync, writeFileSync } = fse;
import { glob } from 'glob';
import path from 'path';
import { log } from '../../utils/logger.js';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface BuildStarterOptions {
  starter: string;
  oss: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export interface BuildResult {
  starter: string;
  variant: 'oss' | 'pro';
  packagesProcessed: number;
  filesProcessed: number;
  outputDir: string;
  errors: string[];
}

interface StarterConfig {
  foundation: string[];
  modules: string[];
  pro: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// Configuration
// ════════════════════════════════════════════════════════════════════════════

const STARTER_PACKAGES: Record<string, StarterConfig> = {
  saaskit: {
    foundation: ['kernel', 'gateway', 'contracts'],
    modules: [
      'identity',
      'settings',
      'storage',
      'tenants',
      'auth',
      'sso',
      'billing',
      'flags',
      'audit',
      'credits',
      'usage',
      'notify',
      'webhooks',
      'media',
      'import-export',
    ],
    pro: ['ai', 'pdf', 'analytics'],
  },
};

const UI_PACKAGES = ['core', 'data-table', 'cli'] as const;
const UI_DIRS = ['components', 'primitives', 'layout', 'lib', 'hooks', 'types'] as const;

// ════════════════════════════════════════════════════════════════════════════
// Main Command
// ════════════════════════════════════════════════════════════════════════════

export async function buildStarter(options: BuildStarterOptions): Promise<number> {
  const { starter, oss, dryRun, verbose } = options;
  const rootDir = process.cwd();

  const packagesDir = path.join(rootDir, 'packages');
  const starterDir = path.join(rootDir, 'starters', starter);
  const outputDir = path.join(starterDir, 'src', 'modules');

  log.section(`Building ${starter} starter ${oss ? '(OSS)' : '(PRO)'}`);

  const errors: string[] = [];
  let filesProcessed = 0;

  // Validate starter exists
  const config = STARTER_PACKAGES[starter];
  if (!config) {
    log.error(`Unknown starter: ${starter}. Available: ${Object.keys(STARTER_PACKAGES).join(', ')}`);
    return 1;
  }

  // Determine packages to include
  const allPackages = [
    ...config.foundation,
    ...config.modules,
    ...(oss ? [] : config.pro),
  ];

  // Step 1: Clean output directory
  if (!dryRun) {
    log.info('Cleaning output directory...');
    removeSync(outputDir);
    ensureDirSync(outputDir);
  }

  // Step 2: Process each package
  log.info(`Including ${allPackages.length} packages`);
  if (verbose) {
    allPackages.forEach((p) => log.dim(`   - ${p}`));
  }

  for (const pkg of allPackages) {
    if (verbose) {
      log.info(`Processing ${pkg}...`);
    }

    const pkgDir = findPackageDir(packagesDir, pkg);
    if (!pkgDir) {
      errors.push(`Package not found: ${pkg}`);
      continue;
    }

    const srcDir = path.join(pkgDir, 'src');
    const destDir = path.join(outputDir, pkg);

    if (!existsSync(srcDir)) {
      errors.push(`Source directory not found: ${srcDir}`);
      continue;
    }

    const files = await glob('**/*.{ts,tsx}', { cwd: srcDir });

    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);

      let content = readFileSync(srcPath, 'utf-8');

      // Check for file-level @pro-only exclusion
      if (oss && shouldExcludeFile(content)) {
        if (verbose) {
          log.dim(`   Skipping ${file} (PRO-only)`);
        }
        continue;
      }

      // Transform imports
      content = transformImports(content, allPackages);

      // Strip PRO code if building OSS
      if (oss) {
        const result = stripProCode(content);
        content = result.content;
        if (result.excludeFile) {
          continue;
        }
      }

      if (!dryRun) {
        ensureDirSync(path.dirname(destPath));
        writeFileSync(destPath, content);
      }

      filesProcessed++;
    }
  }

  // Step 3: Copy UI components
  log.info('Copying UI components...');
  const uiCount = await copyUIComponents(packagesDir, path.join(starterDir, 'src', 'components', 'ui'), dryRun, verbose);
  filesProcessed += uiCount;

  // Step 4: Generate package.json
  log.info('Generating package.json...');
  await generatePackageJson(starterDir, allPackages, oss, dryRun);

  // Summary
  if (errors.length > 0) {
    log.warn(`Build completed with ${errors.length} warning(s):`);
    errors.forEach((e) => log.dim(`   - ${e}`));
  } else {
    log.success('Build complete!');
  }

  log.kv('Packages', allPackages.length);
  log.kv('Files', filesProcessed);
  log.kv('Output', outputDir);

  return errors.length > 0 ? 1 : 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════════════════════════

function findPackageDir(packagesDir: string, pkgName: string): string | null {
  const categories = ['foundation', 'modules', 'pro'];

  for (const category of categories) {
    const dir = path.join(packagesDir, category, pkgName);
    if (existsSync(dir)) {
      return dir;
    }
  }

  const direct = path.join(packagesDir, pkgName);
  if (existsSync(direct)) {
    return direct;
  }

  return null;
}

function transformImports(content: string, allPackages: string[]): string {
  return content.replace(
    /(['"])@unisane\/([a-z-]+)(\/[^'"]*)?(['"])/g,
    (match, openQuote, pkgName, subpath, closeQuote) => {
      if (pkgName && allPackages.includes(pkgName)) {
        return `${openQuote}@/modules/${pkgName}${subpath ?? ''}${closeQuote}`;
      }
      return match;
    }
  );
}

function shouldExcludeFile(content: string): boolean {
  const fileDocMatch = content.match(/^\s*\/\*\*[\s\S]*?\*\//);
  if (fileDocMatch && fileDocMatch[0].includes('@pro-only')) {
    return true;
  }
  return false;
}

function stripProCode(content: string): { content: string; excludeFile: boolean } {
  let result = content;

  // Block markers
  result = result.replace(
    /\/\*\s*@pro-only:start\s*\*\/[\s\S]*?\/\*\s*@pro-only:end\s*\*\//g,
    '/* [PRO feature removed] */'
  );

  // Single line comments
  result = result.replace(/^.*\/\/\s*@pro-only\s*$/gm, '// [PRO feature removed]');

  // Commented exports/imports
  result = result.replace(/^\s*\/\/\s*@pro-only:\s*.+$/gm, '');

  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return { content: result, excludeFile: false };
}

async function copyUIComponents(
  packagesDir: string,
  destDir: string,
  dryRun: boolean,
  verbose: boolean
): Promise<number> {
  if (!dryRun) {
    ensureDirSync(destDir);
  }

  let copiedCount = 0;

  for (const uiPkg of UI_PACKAGES) {
    const uiSrcDir = path.join(packagesDir, 'ui', uiPkg, 'src');

    if (!existsSync(uiSrcDir)) {
      continue;
    }

    for (const dir of UI_DIRS) {
      const srcDir = path.join(uiSrcDir, dir);
      if (!existsSync(srcDir)) continue;

      const destSubDir = path.join(destDir, uiPkg, dir);
      const files = await glob('**/*.{ts,tsx}', { cwd: srcDir });

      for (const file of files) {
        if (!dryRun) {
          ensureDirSync(path.dirname(path.join(destSubDir, file)));
          copySync(path.join(srcDir, file), path.join(destSubDir, file));
        }
        copiedCount++;
      }
    }

    // Root-level files
    const rootFiles = await glob('*.{ts,tsx,css}', { cwd: uiSrcDir });
    for (const file of rootFiles) {
      if (!dryRun) {
        ensureDirSync(path.join(destDir, uiPkg));
        copySync(path.join(uiSrcDir, file), path.join(destDir, uiPkg, file));
      }
      copiedCount++;
    }
  }

  log.dim(`   Copied ${copiedCount} UI files`);
  return copiedCount;
}

async function generatePackageJson(
  starterDir: string,
  packages: string[],
  oss: boolean,
  dryRun: boolean
): Promise<void> {
  const pkgPath = path.join(starterDir, 'package.json');

  if (!existsSync(pkgPath)) {
    log.warn('package.json not found');
    return;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
  const dependencies = (pkg.dependencies ?? {}) as Record<string, string>;
  const devDependencies = (pkg.devDependencies ?? {}) as Record<string, string>;

  const newDeps: Record<string, string> = {};
  const newDevDeps: Record<string, string> = {};

  const internalPkgs = ['devtools', 'eslint-config', 'tailwind-config', 'typescript-config'];
  const proPkgs = ['ai', 'analytics', 'credits', 'pdf'];
  const uiPkgs = ['ui', 'data-table', 'tokens', 'cli'];

  for (const [name, version] of Object.entries(dependencies)) {
    if (name.startsWith('@unisane/')) {
      const pkgName = name.replace('@unisane/', '');
      if (internalPkgs.includes(pkgName)) continue;
      if (oss && proPkgs.includes(pkgName)) continue;
      if (packages.includes(pkgName)) continue;
      if (uiPkgs.includes(pkgName)) continue;
      newDeps[name] = version;
    } else {
      newDeps[name] = version;
    }
  }

  for (const [name, version] of Object.entries(devDependencies)) {
    if (name.startsWith('@unisane/')) continue;
    if (version.startsWith('workspace:')) continue;
    newDevDeps[name] = version;
  }

  const newPkg: Record<string, unknown> = {
    name: oss ? `${pkg.name}-oss` : pkg.name,
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'check-types': 'tsc --noEmit',
    },
    dependencies: newDeps,
    devDependencies: newDevDeps,
  };

  if (pkg.engines) {
    newPkg.engines = pkg.engines;
  }

  if (!dryRun) {
    writeFileSync(pkgPath, JSON.stringify(newPkg, null, 2) + '\n');
    log.dim('   Generated package.json');
  }
}
