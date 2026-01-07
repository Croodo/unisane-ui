#!/usr/bin/env node

import { Command } from 'commander';
import { log } from './utils/logger.js';
import { loadEnvLocal } from './utils/env.js';
import { ensureCleanWorkingTree } from './utils/git.js';
import { doctor } from './commands/dev/doctor.js';
import { routesGen } from './commands/routes/gen.js';
import { sdkGen } from './commands/sdk/gen.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('unisane-devtools')
  .description('Unisane developer tools and code generators')
  .version(VERSION);

// ============================================================================
// CODE GENERATION COMMANDS
// ============================================================================

program
  .command('routes:gen')
  .description('Generate Next.js API route handlers from contracts')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--rewrite', 'Force rewrite all routes')
  .option('--no-scaffold', 'Skip creating wrapper files')
  .action(async (options) => {
    log.banner();
    loadEnvLocal();
    await ensureCleanWorkingTree();
    const code = await routesGen({
      dryRun: options.dryRun,
      rewrite: options.rewrite,
      scaffold: options.scaffold,
    });
    if (code !== 0) {
      process.exit(code);
    }
  });

program
  .command('sdk:gen')
  .description('Generate SDK clients, hooks, and types')
  .option('--clients', 'Generate clients only')
  .option('--hooks', 'Generate React hooks only')
  .option('--vue', 'Generate Vue composables only')
  .option('--zod', 'Generate Zod schemas only')
  .option('--types', 'Generate TypeScript types only')
  .option('--dry-run', 'Preview changes without writing files')
  .action(async (options) => {
    log.banner();
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
    if (code !== 0) {
      process.exit(code);
    }
  });

program
  .command('openapi:json')
  .description('Generate OpenAPI JSON specification')
  .option('-o, --output <path>', 'Output file path', './openapi.json')
  .action(async (options) => {
    log.banner();
    loadEnvLocal();
    log.warn('openapi:json is not yet implemented');
    // TODO: Import and call OpenAPI generator
  });

program
  .command('openapi:serve')
  .description('Serve Swagger UI locally')
  .option('-p, --port <port>', 'Port to serve on', '4000')
  .action(async (options) => {
    log.banner();
    loadEnvLocal();
    log.warn('openapi:serve is not yet implemented');
    // TODO: Import and call OpenAPI server
  });

program
  .command('crud <name>')
  .description('Scaffold a new CRUD module')
  .option('--tenant', 'Add tenant scoping')
  .option('--slug', 'Add slug field')
  .option('--unique <fields>', 'Comma-separated unique fields')
  .action(async (name, options) => {
    log.banner();
    log.warn('crud is not yet implemented');
    // TODO: Import and call CRUD scaffolder
  });

// ============================================================================
// DATABASE COMMANDS
// ============================================================================

program
  .command('db:query <collection> [filter]')
  .description('Query a database collection')
  .option('-l, --limit <n>', 'Limit results', '50')
  .action(async (collection, filter, options) => {
    log.banner();
    loadEnvLocal();
    log.warn('db:query is not yet implemented');
    // TODO: Import and call DB query
  });

program
  .command('indexes:apply')
  .description('Create or update database indexes')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    log.warn('indexes:apply is not yet implemented');
    // TODO: Import and call indexes apply
  });

program
  .command('seed')
  .description('Seed demo data into the database')
  .option('--config <path>', 'Path to seed data JSON file')
  .action(async (options) => {
    log.banner();
    loadEnvLocal();
    log.warn('seed is not yet implemented');
    // TODO: Import and call seeder
  });

program
  .command('migrate')
  .description('Run database migrations')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    log.warn('migrate is not yet implemented');
    // TODO: Import and call migration runner
  });

// ============================================================================
// TENANT COMMANDS
// ============================================================================

program
  .command('tenant:info <identifier>')
  .description('Display tenant details and aggregates')
  .action(async (identifier) => {
    log.banner();
    loadEnvLocal();
    log.warn('tenant:info is not yet implemented');
    // TODO: Import and call tenant info
  });

program
  .command('tenant:reset-billing <identifier>')
  .description('Reset billing state for a tenant (dev only)')
  .action(async (identifier) => {
    log.banner();
    loadEnvLocal();
    log.warn('tenant:reset-billing is not yet implemented');
    // TODO: Import and call tenant billing reset
  });

// ============================================================================
// BILLING COMMANDS
// ============================================================================

program
  .command('billing:plans')
  .description('Display plan configuration')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    log.warn('billing:plans is not yet implemented');
    // TODO: Import and call billing plans display
  });

program
  .command('billing:seed-stripe')
  .description('Create Stripe products and prices from plan configuration')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    log.warn('billing:seed-stripe is not yet implemented');
    // TODO: Import and call Stripe seeder
  });

program
  .command('billing:configure-stripe-portal')
  .description('Configure Stripe customer portal')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    log.warn('billing:configure-stripe-portal is not yet implemented');
    // TODO: Import and call Stripe portal configurator
  });

// ============================================================================
// CACHE COMMANDS
// ============================================================================

program
  .command('rbac:invalidate-cache')
  .description('Clear RBAC permission cache')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    log.warn('rbac:invalidate-cache is not yet implemented');
    // TODO: Import and call RBAC cache invalidator
  });

// ============================================================================
// DEVELOPMENT COMMANDS
// ============================================================================

program
  .command('doctor')
  .description('Run health checks on the project')
  .option('--fix', 'Attempt to auto-fix issues')
  .action(async (options) => {
    log.banner();
    loadEnvLocal();
    const code = await doctor({ fix: options.fix });
    if (code !== 0) {
      process.exit(code);
    }
  });

program
  .command('watch')
  .description('Watch contracts and regenerate on changes')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    log.warn('watch is not yet implemented');
    // TODO: Import and call watcher
  });

program
  .command('sync')
  .description('Run all generators and doctor --fix')
  .action(async () => {
    log.banner();
    loadEnvLocal();
    await ensureCleanWorkingTree();
    log.warn('sync is not yet implemented');
    // TODO: Import and orchestrate all generators
  });

program
  .command('routes:graph')
  .description('Visualize route dependencies')
  .option('--json', 'Output as JSON')
  .option('--dot', 'Output as DOT format')
  .action(async (options) => {
    log.banner();
    loadEnvLocal();
    log.warn('routes:graph is not yet implemented');
    // TODO: Import and call routes graph
  });

program
  .command('diagrams:generate [format]')
  .description('Generate architecture diagrams')
  .action(async (format = 'svg') => {
    log.banner();
    log.warn('diagrams:generate is not yet implemented');
    // TODO: Import and call diagram generator
  });

// Parse arguments
program.parse();
