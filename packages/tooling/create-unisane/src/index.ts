#!/usr/bin/env node

/**
 * create-unisane
 *
 * Scaffold a new Unisane SaaS application.
 *
 * Usage:
 *   npx create-unisane
 *   npx create-unisane my-app
 *   npx create-unisane my-app --template saaskit
 *   npx create-unisane@latest my-app
 *
 * Inspired by: create-next-app, create-turbo, create-t3-app
 */

import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import path from 'path';
import fse from 'fs-extra';
import ora from 'ora';
import { execSync } from 'child_process';
import validateProjectName from 'validate-npm-package-name';
import { downloadAndExtractTemplate } from './template.js';
import { getPackageManager, installDependencies } from './package-manager.js';
import { initializeGit } from './git.js';

const { existsSync, ensureDirSync, writeFileSync, readFileSync } = fse;

// ════════════════════════════════════════════════════════════════════════════
// DEV-011 FIX: Filesystem safety validation
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validates that a project path is safe for filesystem operations.
 * Prevents path traversal attacks and other filesystem-related issues.
 */
function validateFilesystemSafety(projectPath: string): { valid: boolean; error?: string } {
  // Check for path traversal attempts
  if (projectPath.includes('..')) {
    return { valid: false, error: 'Path traversal (..) is not allowed' };
  }

  // Check for absolute paths (user should specify relative paths)
  if (path.isAbsolute(projectPath) && !projectPath.startsWith(process.cwd())) {
    return { valid: false, error: 'Absolute paths outside current directory are not allowed' };
  }

  // Check for dangerous characters that could cause issues
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(projectPath)) {
    return { valid: false, error: 'Path contains invalid characters' };
  }

  // Check that the resolved path is still under cwd
  const resolved = path.resolve(process.cwd(), projectPath);
  const cwd = process.cwd();
  if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
    return { valid: false, error: 'Resolved path escapes current working directory' };
  }

  return { valid: true };
}

// ════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════

const TEMPLATES = {
  saaskit: {
    name: 'SaaS Kit',
    description: 'Full-featured SaaS starter with auth, billing, teams, and admin dashboard',
    repo: 'unisane/unisane',
    branch: 'main',
    path: 'starters/saaskit',
  },
  minimal: {
    name: 'Minimal',
    description: 'Lightweight starter with core infrastructure only',
    repo: 'unisane/unisane',
    branch: 'main',
    path: 'starters/minimal',
  },
  'api-only': {
    name: 'API Only',
    description: 'Headless API backend without frontend',
    repo: 'unisane/unisane',
    branch: 'main',
    path: 'starters/api-only',
  },
} as const;

type TemplateName = keyof typeof TEMPLATES;

/**
 * DEV-012 FIX: Type guard to validate template name before assertion.
 */
function isValidTemplateName(name: unknown): name is TemplateName {
  return typeof name === 'string' && name in TEMPLATES;
}

const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const;
type PackageManager = (typeof PACKAGE_MANAGERS)[number];

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

interface CreateOptions {
  template?: TemplateName;
  useNpm?: boolean;
  useYarn?: boolean;
  usePnpm?: boolean;
  useBun?: boolean;
  skipGit?: boolean;
  skipInstall?: boolean;
  yes?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );

  const program = new Command()
    .name('create-unisane')
    .description('Create a new Unisane SaaS application')
    .version(packageJson.version)
    .argument('[project-directory]', 'Directory to create the project in')
    .option('-t, --template <name>', 'Template to use (saaskit, minimal, api-only)')
    .option('--use-npm', 'Use npm as package manager')
    .option('--use-yarn', 'Use yarn as package manager')
    .option('--use-pnpm', 'Use pnpm as package manager')
    .option('--use-bun', 'Use bun as package manager')
    .option('--skip-git', 'Skip git initialization')
    .option('--skip-install', 'Skip dependency installation')
    .option('-y, --yes', 'Use defaults and skip prompts')
    .parse();

  const options = program.opts<CreateOptions>();
  let projectPath = program.args[0];

  // Banner
  console.log();
  console.log(chalk.bold.cyan('  Create Unisane App'));
  console.log(chalk.dim('  Build production-ready SaaS applications\n'));

  // Get project directory
  if (!projectPath) {
    if (options.yes) {
      projectPath = 'my-unisane-app';
    } else {
      const response = await prompts({
        type: 'text',
        name: 'projectPath',
        message: 'What is your project named?',
        initial: 'my-unisane-app',
        validate: (name) => {
          const validation = validateProjectName(name);
          if (!validation.validForNewPackages) {
            return `Invalid project name: ${validation.errors?.[0] ?? validation.warnings?.[0]}`;
          }
          return true;
        },
      });

      if (!response.projectPath) {
        console.log(chalk.red('\n  Cancelled.\n'));
        process.exit(1);
      }
      projectPath = response.projectPath;
    }
  }

  // DEV-011 FIX: Validate filesystem safety first
  const fsSafety = validateFilesystemSafety(projectPath);
  if (!fsSafety.valid) {
    console.log(chalk.red(`\n  Invalid project path: ${fsSafety.error}\n`));
    process.exit(1);
  }

  // Validate project name
  const validation = validateProjectName(path.basename(projectPath));
  if (!validation.validForNewPackages) {
    console.log(chalk.red(`\n  Invalid project name: ${validation.errors?.[0] ?? validation.warnings?.[0]}\n`));
    process.exit(1);
  }

  // Resolve absolute path
  const resolvedPath = path.resolve(process.cwd(), projectPath);
  const projectName = path.basename(resolvedPath);

  // Check if directory exists
  if (existsSync(resolvedPath)) {
    const files = fse.readdirSync(resolvedPath);
    if (files.length > 0) {
      console.log(chalk.red(`\n  Directory ${chalk.bold(projectPath)} is not empty.\n`));
      process.exit(1);
    }
  }

  // Get template - DEV-012 FIX: Validate before type assertion
  let template: TemplateName;
  if (isValidTemplateName(options.template)) {
    template = options.template;
  } else if (!options.template) {
    if (options.yes) {
      template = 'saaskit';
    } else {
      const response = await prompts({
        type: 'select',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: Object.entries(TEMPLATES).map(([key, value]) => ({
          title: value.name,
          description: value.description,
          value: key,
        })),
        initial: 0,
      });

      if (!response.template) {
        console.log(chalk.red('\n  Cancelled.\n'));
        process.exit(1);
      }
      template = response.template;
    }
  } else {
    // Invalid template name was provided
    const validNames = Object.keys(TEMPLATES).join(', ');
    console.log(chalk.red(`\n  Invalid template: "${options.template}". Valid templates: ${validNames}\n`));
    process.exit(1);
  }

  // Get package manager
  let packageManager: PackageManager;
  if (options.useNpm) {
    packageManager = 'npm';
  } else if (options.useYarn) {
    packageManager = 'yarn';
  } else if (options.usePnpm) {
    packageManager = 'pnpm';
  } else if (options.useBun) {
    packageManager = 'bun';
  } else if (options.yes) {
    packageManager = getPackageManager();
  } else {
    const detected = getPackageManager();
    const response = await prompts({
      type: 'select',
      name: 'packageManager',
      message: 'Which package manager do you want to use?',
      choices: PACKAGE_MANAGERS.map((pm) => ({
        title: pm === detected ? `${pm} (detected)` : pm,
        value: pm,
      })),
      initial: PACKAGE_MANAGERS.indexOf(detected),
    });

    if (!response.packageManager) {
      console.log(chalk.red('\n  Cancelled.\n'));
      process.exit(1);
    }
    packageManager = response.packageManager;
  }

  // Confirmation
  console.log();
  console.log(chalk.bold('  Creating a new Unisane app:\n'));
  console.log(`  ${chalk.dim('Project:')}     ${chalk.cyan(projectName)}`);
  console.log(`  ${chalk.dim('Template:')}    ${chalk.cyan(TEMPLATES[template].name)}`);
  console.log(`  ${chalk.dim('Location:')}    ${chalk.cyan(resolvedPath)}`);
  console.log(`  ${chalk.dim('Package Mgr:')} ${chalk.cyan(packageManager)}`);
  console.log();

  // Create project
  const spinner = ora('Creating project...').start();

  try {
    // Create directory
    ensureDirSync(resolvedPath);

    // Download template
    spinner.text = 'Downloading template...';
    await downloadAndExtractTemplate({
      template: TEMPLATES[template],
      destination: resolvedPath,
    });

    // Update package.json with project name
    spinner.text = 'Configuring project...';
    const pkgJsonPath = path.join(resolvedPath, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      pkgJson.name = projectName;
      pkgJson.version = '0.1.0';
      writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    }

    // Initialize git
    if (!options.skipGit) {
      spinner.text = 'Initializing git...';
      initializeGit(resolvedPath);
    }

    // Install dependencies
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
      spinner.stop();
      console.log();
      await installDependencies(resolvedPath, packageManager);
      spinner.start();
    }

    spinner.succeed(chalk.green('Project created successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(error);
    process.exit(1);
  }

  // Success message
  console.log();
  console.log(chalk.bold('  Next steps:\n'));
  console.log(chalk.dim(`  cd ${projectPath}`));
  if (options.skipInstall) {
    console.log(chalk.dim(`  ${packageManager} install`));
  }
  console.log(chalk.dim('  cp .env.example .env.local'));
  console.log(chalk.dim(`  ${packageManager === 'npm' ? 'npm run' : packageManager} dev`));
  console.log();
  console.log(chalk.dim('  Documentation: https://unisane.dev/docs'));
  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
