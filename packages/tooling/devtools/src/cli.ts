#!/usr/bin/env node

/**
 * @unisane/devtools CLI
 *
 * Unified developer tools for the Unisane platform.
 *
 * Command Structure (following industry standards):
 *
 * Project Setup:
 *   unisane create <name>           Create new project (like create-next-app)
 *   unisane init                    Initialize in existing directory
 *
 * UI Components (shadcn-style):
 *   unisane ui init                 Initialize Unisane UI
 *   unisane ui add <component>      Add UI component(s)
 *   unisane ui diff [component]     Check for updates
 *   unisane ui doctor               Check UI installation
 *
 * Add Resources:
 *   unisane add module <name>       Add business module
 *   unisane add integration <name>  Add third-party integration
 *
 * Code Generation:
 *   unisane generate routes         Generate API routes from contracts
 *   unisane generate sdk            Generate SDK clients
 *   unisane generate types          Generate TypeScript types
 *   unisane generate crud <name>    Scaffold CRUD module
 *
 * Database:
 *   unisane db push                 Push schema changes
 *   unisane db seed                 Seed database
 *   unisane db studio               Open database GUI
 *
 * Environment:
 *   unisane env check               Validate environment variables
 *   unisane env init                Create .env.local from template
 *
 * Development:
 *   unisane dev                     Start development server
 *   unisane build                   Build for production
 *   unisane doctor                  Health checks
 *   unisane upgrade                 Upgrade packages
 *
 * Release (internal):
 *   unisane release build           Build distribution
 *   unisane release verify          Verify build
 */

import { Command } from 'commander';
import { log, setVerbose } from '@unisane/cli-core';
import { loadEnvLocal } from './utils/env.js';
import { ensureCleanWorkingTree } from './utils/git.js';

// Commands
import { doctor } from './commands/dev/doctor.js';
import { routesGen } from './commands/routes/gen.js';
import { sdkGen } from './commands/sdk/gen.js';
import { watchContracts, checkStaleness, sync, preBuildCheck } from './commands/generate/index.js';
import { buildStarter } from './commands/release/build-starter.js';
import { verifyBuild } from './commands/release/verify.js';
import { listVersions as listAllVersions, showPublishable } from './commands/release/version.js';
import { create } from './commands/create/index.js';
import {
  addModule,
  listModules,
  addIntegration,
  listIntegrations,
} from './commands/add/index.js';
import { envCheck, envInit, envGenerate, envPull, envPush } from './commands/env/index.js';
import { upgrade, listVersions } from './commands/upgrade/index.js';
import { uiInit, uiAdd, uiDiff, uiDoctor } from './commands/ui/index.js';
import { dbQuery, dbRename, dbListCollections, dbIndexes, dbMigrate, dbSeed } from './commands/db/index.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('unisane')
  .description('Unisane CLI - Build production-ready SaaS applications')
  .version(VERSION)
  .option('-v, --verbose', 'Enable verbose output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
  });

// ════════════════════════════════════════════════════════════════════════════
// PROJECT SETUP
// ════════════════════════════════════════════════════════════════════════════

program
  .command('create [name]')
  .description('Create a new Unisane project')
  .option('-t, --template <template>', 'Starter template (saaskit, minimal, api-only)', 'saaskit')
  .option('--use-npm', 'Use npm as package manager')
  .option('--use-yarn', 'Use yarn as package manager')
  .option('--use-pnpm', 'Use pnpm as package manager')
  .option('--use-bun', 'Use bun as package manager')
  .option('--skip-git', 'Skip git initialization')
  .option('--skip-install', 'Skip dependency installation')
  .option('--typescript', 'Use TypeScript strict mode')
  .option('--example', 'Include example code')
  .action(async (name, options) => {
    log.banner('Unisane');
    const pm = options.useNpm
      ? 'npm'
      : options.useYarn
        ? 'yarn'
        : options.usePnpm
          ? 'pnpm'
          : options.useBun
            ? 'bun'
            : undefined;
    const code = await create({
      name,
      template: options.template,
      packageManager: pm,
      skipGit: options.skipGit,
      skipInstall: options.skipInstall,
      typescript: options.typescript,
      example: options.example,
    });
    process.exit(code);
  });

program
  .command('init')
  .description('Initialize Unisane in an existing project')
  .option('--skip-install', 'Skip dependency installation')
  .action(async () => {
    log.banner('Unisane');
    log.warn('init command is not yet implemented');
    log.info('Use: unisane create <name> instead');
  });

// ════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS (shadcn-style workflow)
// ════════════════════════════════════════════════════════════════════════════

const ui = program.command('ui').description('UI component management (shadcn-style)');

ui.command('init')
  .description('Initialize Unisane UI in your project')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (options) => {
    log.banner('Unisane');
    const code = await uiInit({ force: options.force });
    process.exit(code);
  });

ui.command('add [components...]')
  .description('Add UI components to your project')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-o, --overwrite', 'Overwrite existing files')
  .option('-a, --all', 'Add all components')
  .action(async (components, options) => {
    log.banner('Unisane');
    const code = await uiAdd({
      components: components?.length ? components : undefined,
      all: options.all,
      overwrite: options.overwrite,
      yes: options.yes,
    });
    process.exit(code);
  });

ui.command('diff [component]')
  .description('Check for component updates')
  .action(async (component) => {
    log.banner('Unisane');
    const code = await uiDiff({ component });
    process.exit(code);
  });

ui.command('doctor')
  .description('Check UI installation health')
  .action(async () => {
    const code = await uiDoctor();
    process.exit(code);
  });

// ════════════════════════════════════════════════════════════════════════════
// ADD RESOURCES
// ════════════════════════════════════════════════════════════════════════════

const add = program.command('add').description('Add modules or integrations');

// Modules
add
  .command('module <name>')
  .description('Add a business module to your project')
  .option('--skip-install', 'Skip dependency installation')
  .option('--dry-run', 'Preview changes without writing files')
  .action(async (name, options) => {
    log.banner('Unisane');
    const code = await addModule({
      module: name,
      skipInstall: options.skipInstall,
      dryRun: options.dryRun,
    });
    process.exit(code);
  });

// Integrations
add
  .command('integration <name>')
  .description('Add a third-party integration')
  .option('--skip-config', 'Skip configuration prompts')
  .action(async (name, options) => {
    log.banner('Unisane');
    const code = await addIntegration({
      integration: name,
      skipConfig: options.skipConfig,
    });
    process.exit(code);
  });

// ════════════════════════════════════════════════════════════════════════════
// LIST RESOURCES
// ════════════════════════════════════════════════════════════════════════════

const list = program.command('list').alias('ls').description('List available resources');

list
  .command('ui')
  .alias('components')
  .description('List available UI components')
  .action(async () => {
    // Runs ui add with no components to show interactive list
    log.info('Use: unisane ui add (interactive component selection)');
    process.exit(0);
  });

list
  .command('modules')
  .description('List available modules')
  .action(async () => {
    const code = await listModules();
    process.exit(code);
  });

list
  .command('integrations')
  .description('List available integrations')
  .action(async () => {
    const code = await listIntegrations();
    process.exit(code);
  });

// ════════════════════════════════════════════════════════════════════════════
// CODE GENERATION
// ════════════════════════════════════════════════════════════════════════════

const generate = program
  .command('generate')
  .alias('gen')
  .alias('g')
  .description('Generate code from contracts and schemas');

generate
  .command('routes')
  .description('Generate Next.js API route handlers from contracts')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--rewrite', 'Force rewrite all routes')
  .option('--no-scaffold', 'Skip creating wrapper files')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    await ensureCleanWorkingTree();
    const code = await routesGen({
      dryRun: options.dryRun,
      rewrite: options.rewrite,
      scaffold: options.scaffold,
    });
    process.exit(code);
  });

generate
  .command('sdk')
  .description('Generate SDK clients, hooks, and types')
  .option('--clients', 'Generate API clients only')
  .option('--hooks', 'Generate React hooks only')
  .option('--vue', 'Generate Vue composables only')
  .option('--zod', 'Generate Zod schemas only')
  .option('--types', 'Generate TypeScript types only')
  .option('--dry-run', 'Preview changes without writing files')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    await ensureCleanWorkingTree();
    const code = await sdkGen({
      clients: options.clients,
      hooks: options.hooks,
      vue: options.vue,
      zod: options.zod,
      types: options.types,
      dryRun: options.dryRun,
    });
    process.exit(code);
  });

generate
  .command('types')
  .description('Generate TypeScript types from contracts')
  .option('--dry-run', 'Preview changes without writing files')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await sdkGen({
      types: true,
      dryRun: options.dryRun,
    });
    process.exit(code);
  });

generate
  .command('check')
  .description('Check if generated files are stale')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await checkStaleness();
    process.exit(code);
  });

generate
  .command('prebuild')
  .description('Pre-build check for CI/CD - fails if generated files are stale')
  .option('--no-strict', 'Warn instead of fail when stale')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await preBuildCheck({ strict: options.strict });
    process.exit(code);
  });

generate
  .command('openapi')
  .description('Generate OpenAPI JSON specification')
  .option('-o, --output <path>', 'Output file path', './openapi.json')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('generate openapi is not yet implemented');
  });

generate
  .command('crud <name>')
  .description('Scaffold a new CRUD module')
  .option('--tenant', 'Add tenant scoping')
  .option('--slug', 'Add slug field')
  .option('--soft-delete', 'Add soft delete support')
  .option('--audit', 'Add audit logging')
  .option('--unique <fields>', 'Comma-separated unique fields')
  .action(async () => {
    log.banner('Unisane');
    log.warn('generate crud is not yet implemented');
  });

// ════════════════════════════════════════════════════════════════════════════
// DATABASE
// ════════════════════════════════════════════════════════════════════════════

const db = program.command('db').description('Database commands');

db.command('query <collection> [filter]')
  .description('Query a collection (returns first 50 documents)')
  .option('-l, --limit <n>', 'Limit results', '50')
  .action(async (collection, filter, options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await dbQuery(collection, filter, { limit: parseInt(options.limit, 10) });
    process.exit(code);
  });

db.command('collections')
  .alias('ls')
  .description('List all collections in the database')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await dbListCollections();
    process.exit(code);
  });

db.command('rename [from] [to]')
  .description('Rename a collection')
  .option('--apply-migrations', 'Apply all known collection renames')
  .option('--dry-run', 'Preview changes without applying')
  .action(async (from, to, options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await dbRename(from, to, {
      applyMigrations: options.applyMigrations,
      dryRun: options.dryRun,
    });
    process.exit(code);
  });

db.command('push')
  .description('Push schema changes to database')
  .option('--force', 'Force push without confirmation')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('db push is not yet implemented');
  });

db.command('pull')
  .description('Pull schema from database')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('db pull is not yet implemented');
  });

db.command('seed')
  .description('Seed database with demo data')
  .option('--config <path>', 'Path to seed configuration file')
  .option('--reset', 'Reset database before seeding')
  .option('--dry-run', 'Preview changes without applying')
  .option('--generate', 'Generate default config file')
  .option('--only <types>', 'Only run specific seeders (comma-separated)')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const only = options.only ? options.only.split(',') : undefined;
    const code = await dbSeed({
      config: options.config,
      reset: options.reset,
      dryRun: options.dryRun,
      generate: options.generate,
      only,
    });
    process.exit(code);
  });

db.command('migrate')
  .description('Run database migrations')
  .option('--dry-run', 'Preview migrations without applying')
  .option('--status', 'Show migration status')
  .option('--down', 'Rollback migrations')
  .option('--target <id>', 'Run up to specific migration')
  .option('--reset', 'Reset migration history')
  .option('--force', 'Force re-run applied migrations')
  .option('--path <path>', 'Path to migrations directory')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await dbMigrate({
      dryRun: options.dryRun,
      status: options.status,
      down: options.down,
      target: options.target,
      reset: options.reset,
      force: options.force,
      migrationsPath: options.path,
    });
    process.exit(code);
  });

db.command('studio')
  .description('Open database studio GUI')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('db studio is not yet implemented');
    log.info('For MongoDB, use: mongosh or MongoDB Compass');
  });

db.command('indexes')
  .description('Create or list database indexes')
  .option('--apply', 'Apply indexes to database')
  .option('--list', 'List existing indexes from database')
  .option('--collection <name>', 'Only process specific collection')
  .option('--dry-run', 'Preview changes without applying')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await dbIndexes({
      apply: options.apply,
      list: options.list,
      collection: options.collection,
      dryRun: options.dryRun,
    });
    process.exit(code);
  });

// ════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT
// ════════════════════════════════════════════════════════════════════════════

const env = program.command('env').description('Environment variable management');

env
  .command('check')
  .description('Validate environment variables')
  .option('-f, --file <path>', 'Environment file to check', '.env.local')
  .option('--show-values', 'Show values (masked for sensitive)')
  .action(async (options) => {
    log.banner('Unisane');
    const code = await envCheck({
      file: options.file,
      showValues: options.showValues,
    });
    process.exit(code);
  });

env
  .command('init')
  .description('Create .env.local from template')
  .option('-f, --force', 'Overwrite existing file')
  .option('-s, --source <path>', 'Source file', '.env.example')
  .option('-t, --target <path>', 'Target file', '.env.local')
  .action(async (options) => {
    log.banner('Unisane');
    const code = await envInit({
      force: options.force,
      source: options.source,
      target: options.target,
    });
    process.exit(code);
  });

env
  .command('pull')
  .description('Pull environment variables from remote')
  .option('--provider <name>', 'Provider (vercel, doppler, railway)')
  .action(async () => {
    log.banner('Unisane');
    const code = await envPull();
    process.exit(code);
  });

env
  .command('push')
  .description('Push environment variables to remote')
  .option('--provider <name>', 'Provider (vercel, doppler, railway)')
  .action(async () => {
    log.banner('Unisane');
    const code = await envPush();
    process.exit(code);
  });

env
  .command('generate')
  .description('Generate .env.example from schema')
  .action(async () => {
    log.banner('Unisane');
    const code = await envGenerate();
    process.exit(code);
  });

// ════════════════════════════════════════════════════════════════════════════
// DEVELOPMENT
// ════════════════════════════════════════════════════════════════════════════

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('--turbo', 'Use Turbopack')
  .action(async () => {
    log.banner('Unisane');
    log.warn('dev command is a passthrough to your project scripts');
    log.info('Use: pnpm dev');
  });

program
  .command('build')
  .description('Build for production')
  .action(async () => {
    log.banner('Unisane');
    log.warn('build command is a passthrough to your project scripts');
    log.info('Use: pnpm build');
  });

program
  .command('doctor')
  .description('Run health checks on your project')
  .option('--fix', 'Attempt to auto-fix issues')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await doctor({ fix: options.fix });
    process.exit(code);
  });

program
  .command('upgrade')
  .description('Upgrade Unisane packages')
  .option('--target <version>', 'Target version (latest, next, or specific)', 'latest')
  .option('--dry-run', 'Preview changes without applying')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--codemods', 'Run codemods after upgrade')
  .action(async (options) => {
    log.banner('Unisane');
    const code = await upgrade({
      target: options.target,
      dryRun: options.dryRun,
      yes: options.yes,
      codemods: options.codemods,
    });
    process.exit(code);
  });

program
  .command('info')
  .description('Show project information and versions')
  .action(async () => {
    log.banner('Unisane');
    log.section('CLI Version');
    log.kv('unisane', VERSION);
    log.newline();
    const code = await listVersions();
    process.exit(code);
  });

program
  .command('sync')
  .description('Run all generators and health checks')
  .option('--skip-routes', 'Skip routes generation')
  .option('--skip-sdk', 'Skip SDK generation')
  .option('--skip-doctor', 'Skip doctor checks')
  .option('--force', 'Force regeneration even if not stale')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--fix', 'Auto-fix doctor issues')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await sync({
      skipRoutes: options.skipRoutes,
      skipSdk: options.skipSdk,
      skipDoctor: options.skipDoctor,
      force: options.force,
      dryRun: options.dryRun,
      fix: options.fix,
    });
    process.exit(code);
  });

program
  .command('watch')
  .description('Watch contracts and regenerate on changes')
  .option('--routes-only', 'Only regenerate routes')
  .option('--sdk-only', 'Only regenerate SDK')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '500')
  .option('--no-initial', 'Skip initial generation')
  .action(async (options) => {
    log.banner('Unisane');
    loadEnvLocal();
    const code = await watchContracts({
      routes: !options.sdkOnly,
      sdk: !options.routesOnly,
      debounce: parseInt(options.debounce, 10),
      initial: options.initial,
    });
    process.exit(code);
  });

// ════════════════════════════════════════════════════════════════════════════
// TENANT MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

const tenant = program.command('tenant').description('Tenant/organization management');

tenant
  .command('info <identifier>')
  .description('Display tenant details and aggregates')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('tenant info is not yet implemented');
  });

tenant
  .command('list')
  .description('List all tenants')
  .option('-l, --limit <n>', 'Limit results', '50')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('tenant list is not yet implemented');
  });

tenant
  .command('create')
  .description('Create a new tenant')
  .option('--name <name>', 'Tenant name')
  .option('--slug <slug>', 'Tenant slug')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('tenant create is not yet implemented');
  });

tenant
  .command('delete <identifier>')
  .description('Delete a tenant (soft delete)')
  .option('--hard', 'Hard delete (irreversible)')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('tenant delete is not yet implemented');
  });

// ════════════════════════════════════════════════════════════════════════════
// BILLING
// ════════════════════════════════════════════════════════════════════════════

const billing = program.command('billing').description('Billing and subscription management');

billing
  .command('plans')
  .description('Display plan configuration')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('billing plans is not yet implemented');
  });

billing
  .command('sync-stripe')
  .description('Sync plans with Stripe products')
  .option('--dry-run', 'Preview changes without applying')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('billing sync-stripe is not yet implemented');
  });

billing
  .command('portal-config')
  .description('Configure Stripe customer portal')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('billing portal-config is not yet implemented');
  });

// ════════════════════════════════════════════════════════════════════════════
// CACHE
// ════════════════════════════════════════════════════════════════════════════

const cache = program.command('cache').description('Cache management');

cache
  .command('clear')
  .description('Clear all caches')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('cache clear is not yet implemented');
  });

cache
  .command('clear-rbac')
  .description('Clear RBAC permission cache')
  .action(async () => {
    log.banner('Unisane');
    loadEnvLocal();
    log.warn('cache clear-rbac is not yet implemented');
  });

// ════════════════════════════════════════════════════════════════════════════
// RELEASE (Internal tooling)
// ════════════════════════════════════════════════════════════════════════════

const release = program.command('release').description('Build distribution packages (internal)');

release
  .command('build')
  .description('Build a starter for distribution')
  .option('-s, --starter <name>', 'Starter to build', 'saaskit')
  .option('--oss', 'Build OSS variant (strip PRO code)')
  .option('--dry-run', 'Preview changes without writing files')
  .option('-v, --verbose', 'Detailed logging')
  .action(async (options) => {
    log.banner('Unisane');
    const code = await buildStarter({
      starter: options.starter,
      oss: !!options.oss,
      dryRun: !!options.dryRun,
      verbose: !!options.verbose,
    });
    process.exit(code);
  });

release
  .command('verify')
  .description('Verify a built starter')
  .option('-s, --starter <name>', 'Starter to verify', 'saaskit')
  .action(async (options) => {
    log.banner('Unisane');
    const code = await verifyBuild({
      starter: options.starter,
    });
    process.exit(code);
  });

release
  .command('versions')
  .description('List all package versions')
  .action(async () => {
    const code = await listAllVersions();
    process.exit(code);
  });

release
  .command('publishable')
  .description('Show packages that can be published')
  .action(async () => {
    const code = await showPublishable();
    process.exit(code);
  });

// ════════════════════════════════════════════════════════════════════════════
// LEGACY ALIASES (for backwards compatibility)
// ════════════════════════════════════════════════════════════════════════════

program.command('routes:gen', { hidden: true }).action(async () => {
  log.warn('routes:gen is deprecated, use: unisane generate routes');
  process.exit(1);
});

program.command('sdk:gen', { hidden: true }).action(async () => {
  log.warn('sdk:gen is deprecated, use: unisane generate sdk');
  process.exit(1);
});

// Parse arguments
program.parse();
