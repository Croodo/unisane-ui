#!/usr/bin/env node

/**
 * unisane CLI
 *
 * The unified CLI for building and managing Unisane SaaS applications.
 *
 * Installation:
 *   npm install -g unisane
 *   # or
 *   pnpm add -g unisane
 *
 * Usage:
 *   unisane create my-app
 *   unisane add ui button card
 *   unisane generate sdk
 *   unisane upgrade
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import path from 'path';
import fse from 'fs-extra';
import { execSync, spawn } from 'child_process';

const { existsSync, readFileSync, writeFileSync, ensureDirSync } = fse;

// ════════════════════════════════════════════════════════════════════════════
// Version
// ════════════════════════════════════════════════════════════════════════════

const VERSION = '0.1.0';

// ════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════

function banner(title = 'Unisane') {
  console.log(chalk.cyan.bold(`\n  ${title}\n`));
}

function success(message: string) {
  console.log(chalk.green(`  ✔ ${message}`));
}

function error(message: string) {
  console.error(chalk.red(`  ✖ ${message}`));
}

function warn(message: string) {
  console.warn(chalk.yellow(`  ⚠ ${message}`));
}

function info(message: string) {
  console.log(chalk.blue(`  ℹ ${message}`));
}

function dim(message: string) {
  console.log(chalk.dim(`  ${message}`));
}

function findProjectRoot(): string | null {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, 'package.json'))) {
      const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      // Check if this is a Unisane project
      if (pkg.dependencies?.['@unisane/kernel'] || pkg.dependencies?.['next']) {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  return null;
}

function detectPackageManager(projectRoot?: string): 'pnpm' | 'npm' | 'yarn' | 'bun' {
  const root = projectRoot ?? process.cwd();

  // Check for lock files
  if (existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  if (existsSync(path.join(root, 'bun.lockb'))) return 'bun';
  if (existsSync(path.join(root, 'package-lock.json'))) return 'npm';

  // Check package.json for packageManager field
  const pkgPath = path.join(root, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.packageManager) {
        if (pkg.packageManager.startsWith('pnpm')) return 'pnpm';
        if (pkg.packageManager.startsWith('yarn')) return 'yarn';
        if (pkg.packageManager.startsWith('bun')) return 'bun';
        if (pkg.packageManager.startsWith('npm')) return 'npm';
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Default to npm
  return 'npm';
}

function getRunCommand(pm: 'pnpm' | 'npm' | 'yarn' | 'bun'): string {
  // For running package scripts or binaries
  switch (pm) {
    case 'pnpm': return 'pnpm';
    case 'yarn': return 'yarn';
    case 'bun': return 'bun';
    case 'npm': return 'npx';
  }
}

function getAddCommand(pm: 'pnpm' | 'npm' | 'yarn' | 'bun'): string {
  switch (pm) {
    case 'pnpm': return 'pnpm add';
    case 'yarn': return 'yarn add';
    case 'bun': return 'bun add';
    case 'npm': return 'npm install';
  }
}

function getUpdateCommand(pm: 'pnpm' | 'npm' | 'yarn' | 'bun'): string {
  switch (pm) {
    case 'pnpm': return 'pnpm update';
    case 'yarn': return 'yarn upgrade';
    case 'bun': return 'bun update';
    case 'npm': return 'npm update';
  }
}

function isDevtoolsInstalled(projectRoot: string): boolean {
  // Check if @unisane/devtools is in dependencies or devDependencies
  const pkgPath = path.join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return '@unisane/devtools' in deps;
    } catch {
      return false;
    }
  }
  return false;
}

function requireDevtools(projectRoot: string, pm: 'pnpm' | 'npm' | 'yarn' | 'bun'): boolean {
  if (!isDevtoolsInstalled(projectRoot)) {
    error('@unisane/devtools is not installed');
    info('This command requires devtools. Install it with:');
    dim(`  ${getAddCommand(pm)} -D @unisane/devtools`);
    return false;
  }
  return true;
}

/**
 * Run a command safely by splitting into command and arguments.
 *
 * SECURITY FIX (SEC-004): Removed shell: true to prevent command injection.
 * Commands are now parsed into command + arguments array.
 *
 * @param command - The command string (e.g., "npx create-unisane --template saaskit")
 * @param cwd - Working directory
 */
function runCommand(command: string, cwd?: string): Promise<number> {
  return new Promise((resolve) => {
    // SECURITY FIX (SEC-004): Parse command into parts instead of using shell
    // This prevents command injection via shell metacharacters
    const parts = parseCommand(command);
    if (parts.length === 0) {
      resolve(1);
      return;
    }

    const [cmd, ...args] = parts;

    const child = spawn(cmd!, args, {
      cwd: cwd ?? process.cwd(),
      stdio: 'inherit',
      // shell: true - REMOVED for security
    });
    child.on('close', (code) => resolve(code ?? 0));
    child.on('error', () => resolve(1));
  });
}

/**
 * Parse a command string into an array of arguments.
 * Handles quoted strings properly.
 *
 * SECURITY: This is a simple parser that splits on whitespace while respecting quotes.
 * It does NOT execute any shell metacharacters.
 */
function parseCommand(command: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote: '"' | "'" | null = null;

  for (let i = 0; i < command.length; i++) {
    const char = command[i]!;

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (char === ' ' || char === '\t') {
      if (current) {
        result.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    result.push(current);
  }

  return result;
}

// ════════════════════════════════════════════════════════════════════════════
// Commands
// ════════════════════════════════════════════════════════════════════════════

const program = new Command();

program
  .name('unisane')
  .description('CLI for building and managing Unisane SaaS applications')
  .version(VERSION);

// ─────────────────────────────────────────────────────────────────────────────
// create
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('create [name]')
  .description('Create a new Unisane project')
  .option('-t, --template <name>', 'Template to use', 'saaskit')
  .option('--use-npm', 'Use npm')
  .option('--use-yarn', 'Use yarn')
  .option('--use-pnpm', 'Use pnpm')
  .option('--use-bun', 'Use bun')
  .option('--skip-git', 'Skip git init')
  .option('--skip-install', 'Skip installing dependencies')
  .action(async (name, options) => {
    // Delegate to create-unisane
    const args = ['create-unisane'];
    if (name) args.push(name);
    if (options.template) args.push('--template', options.template);
    if (options.useNpm) args.push('--use-npm');
    if (options.useYarn) args.push('--use-yarn');
    if (options.usePnpm) args.push('--use-pnpm');
    if (options.useBun) args.push('--use-bun');
    if (options.skipGit) args.push('--skip-git');
    if (options.skipInstall) args.push('--skip-install');

    const code = await runCommand(`npx ${args.join(' ')}`);
    process.exit(code);
  });

// ─────────────────────────────────────────────────────────────────────────────
// add
// ─────────────────────────────────────────────────────────────────────────────

const add = program.command('add').description('Add components, modules, or integrations');

add
  .command('ui [components...]')
  .description('Add UI components to your project')
  .option('-y, --yes', 'Skip prompts')
  .option('-o, --overwrite', 'Overwrite existing')
  .option('-a, --all', 'Add all components')
  .action(async (components, options) => {
    banner();
    const root = findProjectRoot();
    if (!root) {
      error('Not in a Unisane project. Run from your project directory.');
      process.exit(1);
    }

    // TODO: Implement component fetching from registry
    warn('UI component installation will be available soon');
    info('For now, copy components from: https://unisane.dev/docs/components');
  });

add
  .command('module <name>')
  .description('Add a business module')
  .action(async (name) => {
    banner();
    const root = findProjectRoot();
    if (!root) {
      error('Not in a Unisane project');
      process.exit(1);
    }

    const modules: Record<string, { packages: string[]; description: string }> = {
      auth: { packages: ['@unisane/auth', '@unisane/identity'], description: 'Authentication' },
      billing: { packages: ['@unisane/billing'], description: 'Stripe billing' },
      tenants: { packages: ['@unisane/tenants'], description: 'Multi-tenancy' },
      storage: { packages: ['@unisane/storage', '@unisane/media'], description: 'File storage' },
      ai: { packages: ['@unisane/ai', '@unisane/credits'], description: 'AI integration' },
      analytics: { packages: ['@unisane/analytics'], description: 'Product analytics' },
      notifications: { packages: ['@unisane/notify'], description: 'Notifications' },
      webhooks: { packages: ['@unisane/webhooks'], description: 'Webhook management' },
      audit: { packages: ['@unisane/audit'], description: 'Audit logging' },
      flags: { packages: ['@unisane/flags'], description: 'Feature flags' },
    };

    const mod = modules[name];
    if (!mod) {
      error(`Unknown module: ${name}`);
      info('Available modules:');
      Object.entries(modules).forEach(([key, val]) => {
        dim(`  ${key.padEnd(15)} ${val.description}`);
      });
      process.exit(1);
    }

    const pm = detectPackageManager(root);
    info(`Adding ${mod.description}...`);
    info('Install packages:');
    dim(`  ${getAddCommand(pm)} ${mod.packages.join(' ')}`);
  });

add
  .command('integration <name>')
  .description('Add a third-party integration')
  .action(async (name) => {
    banner();

    const integrations: Record<string, { description: string; envVars: string[] }> = {
      stripe: { description: 'Stripe payments', envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] },
      resend: { description: 'Resend email', envVars: ['RESEND_API_KEY'] },
      's3': { description: 'AWS S3 storage', envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'] },
      openai: { description: 'OpenAI', envVars: ['OPENAI_API_KEY'] },
      anthropic: { description: 'Anthropic Claude', envVars: ['ANTHROPIC_API_KEY'] },
      posthog: { description: 'PostHog analytics', envVars: ['NEXT_PUBLIC_POSTHOG_KEY'] },
      sentry: { description: 'Sentry error tracking', envVars: ['SENTRY_DSN'] },
    };

    const integration = integrations[name];
    if (!integration) {
      error(`Unknown integration: ${name}`);
      info('Available integrations:');
      Object.entries(integrations).forEach(([key, val]) => {
        dim(`  ${key.padEnd(12)} ${val.description}`);
      });
      process.exit(1);
    }

    info(`Setting up ${integration.description}...`);
    info('Add these environment variables:');
    integration.envVars.forEach((v) => dim(`  ${v}=`));
  });

// ─────────────────────────────────────────────────────────────────────────────
// list
// ─────────────────────────────────────────────────────────────────────────────

const list = program.command('list').alias('ls').description('List available resources');

list.command('modules').description('List available modules').action(() => {
  banner();
  console.log(chalk.bold('  Available Modules\n'));
  const modules = [
    ['auth', 'User authentication with multiple providers'],
    ['billing', 'Stripe subscriptions and payments'],
    ['tenants', 'Multi-tenancy (teams/organizations)'],
    ['storage', 'S3-compatible file storage'],
    ['ai', 'OpenAI/Anthropic integration'],
    ['analytics', 'Product analytics'],
    ['notifications', 'Email, push, in-app notifications'],
    ['webhooks', 'Outgoing webhook management'],
    ['audit', 'Activity logging'],
    ['flags', 'Feature toggles'],
  ];
  modules.forEach(([name, desc]) => {
    console.log(`  ${chalk.cyan(name?.padEnd(15) ?? '')} ${chalk.dim(desc)}`);
  });
  console.log();
});

list.command('integrations').description('List available integrations').action(() => {
  banner();
  console.log(chalk.bold('  Available Integrations\n'));
  const integrations = [
    ['stripe', 'Payment processing'],
    ['resend', 'Transactional email'],
    ['s3', 'AWS S3 file storage'],
    ['cloudflare', 'Cloudflare R2 storage'],
    ['openai', 'GPT and embeddings'],
    ['anthropic', 'Claude AI'],
    ['github', 'GitHub OAuth'],
    ['google', 'Google OAuth'],
    ['posthog', 'Product analytics'],
    ['sentry', 'Error tracking'],
  ];
  integrations.forEach(([name, desc]) => {
    console.log(`  ${chalk.cyan(name?.padEnd(12) ?? '')} ${chalk.dim(desc)}`);
  });
  console.log();
});

// ─────────────────────────────────────────────────────────────────────────────
// generate
// ─────────────────────────────────────────────────────────────────────────────

const generate = program.command('generate').alias('gen').alias('g').description('Generate code');

generate.command('routes').description('Generate API routes from contracts').action(async () => {
  banner();
  const root = findProjectRoot();
  if (!root) {
    error('Not in a Unisane project');
    process.exit(1);
  }

  const pm = detectPackageManager(root);
  if (!requireDevtools(root, pm)) {
    process.exit(1);
  }

  info('Generating routes...');
  const code = await runCommand(`${getRunCommand(pm)} unisane-devtools gen routes`, root);
  process.exit(code);
});

generate.command('sdk').description('Generate SDK clients and hooks').action(async () => {
  banner();
  const root = findProjectRoot();
  if (!root) {
    error('Not in a Unisane project');
    process.exit(1);
  }

  const pm = detectPackageManager(root);
  if (!requireDevtools(root, pm)) {
    process.exit(1);
  }

  info('Generating SDK...');
  const code = await runCommand(`${getRunCommand(pm)} unisane-devtools gen sdk`, root);
  process.exit(code);
});

generate.command('types').description('Generate TypeScript types').action(async () => {
  banner();
  const root = findProjectRoot();
  if (!root) {
    error('Not in a Unisane project');
    process.exit(1);
  }

  const pm = detectPackageManager(root);
  if (!requireDevtools(root, pm)) {
    process.exit(1);
  }

  info('Generating types...');
  const code = await runCommand(`${getRunCommand(pm)} unisane-devtools gen sdk --types`, root);
  process.exit(code);
});

// ─────────────────────────────────────────────────────────────────────────────
// env
// ─────────────────────────────────────────────────────────────────────────────

const env = program.command('env').description('Environment variable management');

env.command('check').description('Validate environment variables').action(async () => {
  banner();
  const root = findProjectRoot();
  if (!root) {
    error('Not in a Unisane project');
    process.exit(1);
  }

  const envPath = path.join(root, '.env.local');
  if (!existsSync(envPath)) {
    error('.env.local not found');
    info('Run: unisane env init');
    process.exit(1);
  }

  const pm = detectPackageManager(root);
  success('.env.local exists');
  info(`For detailed check, run: ${getRunCommand(pm)} unisane-devtools env check`);
});

env.command('init').description('Create .env.local from .env.example').action(async () => {
  banner();
  const root = findProjectRoot();
  if (!root) {
    error('Not in a Unisane project');
    process.exit(1);
  }

  const examplePath = path.join(root, '.env.example');
  const localPath = path.join(root, '.env.local');

  if (!existsSync(examplePath)) {
    error('.env.example not found');
    process.exit(1);
  }

  if (existsSync(localPath)) {
    warn('.env.local already exists');
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'Overwrite?',
      initial: false,
    });
    if (!response.overwrite) {
      process.exit(0);
    }
  }

  fse.copySync(examplePath, localPath);
  success('Created .env.local');
  info('Edit .env.local with your values');
});

// ─────────────────────────────────────────────────────────────────────────────
// upgrade
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('upgrade')
  .description('Upgrade Unisane packages')
  .option('--dry-run', 'Preview without applying')
  .action(async (options) => {
    banner();
    const root = findProjectRoot();
    if (!root) {
      error('Not in a Unisane project');
      process.exit(1);
    }

    const pkgPath = path.join(root, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const unisanePackages = Object.keys(deps).filter((name) => name.startsWith('@unisane/'));

    if (unisanePackages.length === 0) {
      info('No @unisane/* packages found');
      process.exit(0);
    }

    info(`Found ${unisanePackages.length} Unisane package(s)`);
    unisanePackages.forEach((p) => dim(`  ${p}`));

    if (options.dryRun) {
      warn('Dry run - no changes made');
      process.exit(0);
    }

    const pm = detectPackageManager(root);
    console.log();
    info('Upgrading packages...');
    const code = await runCommand(`${getUpdateCommand(pm)} ${unisanePackages.join(' ')}`, root);
    process.exit(code);
  });

// ─────────────────────────────────────────────────────────────────────────────
// doctor
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('doctor')
  .description('Run health checks')
  .option('--fix', 'Auto-fix issues')
  .action(async (options) => {
    banner();
    const root = findProjectRoot();
    if (!root) {
      error('Not in a Unisane project');
      process.exit(1);
    }

    const pm = detectPackageManager(root);
    if (!requireDevtools(root, pm)) {
      process.exit(1);
    }

    const runner = getRunCommand(pm);
    info('Running health checks...');
    const cmd = options.fix ? `${runner} unisane-devtools doctor --fix` : `${runner} unisane-devtools doctor`;
    const code = await runCommand(cmd, root);
    process.exit(code);
  });

// ─────────────────────────────────────────────────────────────────────────────
// info
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('info')
  .description('Show version information')
  .action(async () => {
    banner();
    console.log(chalk.bold('  Version Information\n'));
    console.log(`  ${chalk.dim('CLI:')}     ${VERSION}`);

    const root = findProjectRoot();
    if (root) {
      const pkgPath = path.join(root, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      console.log(`  ${chalk.dim('Project:')} ${pkg.name}@${pkg.version}`);

      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const unisanePackages = Object.entries(deps).filter(([name]) => name.startsWith('@unisane/'));

      if (unisanePackages.length > 0) {
        console.log();
        console.log(chalk.bold('  Unisane Packages\n'));
        unisanePackages.forEach(([name, version]) => {
          console.log(`  ${chalk.cyan(name?.padEnd(25) ?? '')} ${chalk.dim(String(version))}`);
        });
      }
    }
    console.log();
  });

// Parse
program.parse();
