/**
 * @module commands/add
 *
 * Add components, modules, and integrations to an existing project.
 * Similar to: shadcn/ui add, ng add, nx generate
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, writeFileSync, ensureDirSync, copySync } = fse;
import path from 'path';
import { log, prompt } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface AddComponentOptions {
  /** Component names to add */
  components?: string[];
  /** Overwrite existing files */
  overwrite?: boolean;
  /** Output directory */
  path?: string;
  /** Skip confirmation prompts */
  yes?: boolean;
}

export interface AddModuleOptions {
  /** Module name to add */
  module: string;
  /** Skip dependency installation */
  skipInstall?: boolean;
  /** Dry run mode */
  dryRun?: boolean;
}

export interface AddIntegrationOptions {
  /** Integration name */
  integration: string;
  /** Skip configuration prompts */
  skipConfig?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// Component Registry
// ════════════════════════════════════════════════════════════════════════════

const UI_COMPONENTS = {
  // Primitives
  button: { category: 'primitives', dependencies: [] },
  input: { category: 'primitives', dependencies: [] },
  label: { category: 'primitives', dependencies: [] },
  textarea: { category: 'primitives', dependencies: [] },
  select: { category: 'primitives', dependencies: [] },
  checkbox: { category: 'primitives', dependencies: [] },
  radio: { category: 'primitives', dependencies: [] },
  switch: { category: 'primitives', dependencies: [] },
  slider: { category: 'primitives', dependencies: [] },
  badge: { category: 'primitives', dependencies: [] },
  avatar: { category: 'primitives', dependencies: [] },
  separator: { category: 'primitives', dependencies: [] },
  skeleton: { category: 'primitives', dependencies: [] },
  spinner: { category: 'primitives', dependencies: [] },

  // Components
  accordion: { category: 'components', dependencies: [] },
  alert: { category: 'components', dependencies: [] },
  'alert-dialog': { category: 'components', dependencies: ['button'] },
  breadcrumb: { category: 'components', dependencies: [] },
  calendar: { category: 'components', dependencies: ['button'] },
  card: { category: 'components', dependencies: [] },
  carousel: { category: 'components', dependencies: ['button'] },
  collapsible: { category: 'components', dependencies: [] },
  combobox: { category: 'components', dependencies: ['button', 'input', 'popover'] },
  command: { category: 'components', dependencies: ['dialog'] },
  'context-menu': { category: 'components', dependencies: [] },
  'data-table': { category: 'components', dependencies: ['table', 'button', 'input'] },
  'date-picker': { category: 'components', dependencies: ['calendar', 'popover', 'button'] },
  dialog: { category: 'components', dependencies: ['button'] },
  drawer: { category: 'components', dependencies: [] },
  dropdown: { category: 'components', dependencies: ['button'] },
  form: { category: 'components', dependencies: ['label', 'input', 'button'] },
  'hover-card': { category: 'components', dependencies: [] },
  menubar: { category: 'components', dependencies: [] },
  'navigation-menu': { category: 'components', dependencies: [] },
  pagination: { category: 'components', dependencies: ['button'] },
  popover: { category: 'components', dependencies: [] },
  progress: { category: 'components', dependencies: [] },
  'scroll-area': { category: 'components', dependencies: [] },
  sheet: { category: 'components', dependencies: ['button'] },
  table: { category: 'components', dependencies: [] },
  tabs: { category: 'components', dependencies: [] },
  toast: { category: 'components', dependencies: [] },
  toggle: { category: 'components', dependencies: [] },
  tooltip: { category: 'components', dependencies: [] },

  // Layout
  container: { category: 'layout', dependencies: [] },
  grid: { category: 'layout', dependencies: [] },
  stack: { category: 'layout', dependencies: [] },
  flex: { category: 'layout', dependencies: [] },
} as const;

const MODULES = {
  auth: {
    name: 'Authentication',
    description: 'User authentication with multiple providers',
    packages: ['@unisane/auth', '@unisane/identity'],
  },
  billing: {
    name: 'Billing',
    description: 'Stripe integration for subscriptions and payments',
    packages: ['@unisane/billing'],
  },
  tenants: {
    name: 'Multi-tenancy',
    description: 'Team/organization support with workspaces',
    packages: ['@unisane/tenants'],
  },
  storage: {
    name: 'File Storage',
    description: 'S3-compatible file uploads and management',
    packages: ['@unisane/storage', '@unisane/media'],
  },
  ai: {
    name: 'AI Integration',
    description: 'OpenAI/Anthropic integration with usage tracking',
    packages: ['@unisane/ai', '@unisane/credits'],
  },
  analytics: {
    name: 'Analytics',
    description: 'Product analytics and event tracking',
    packages: ['@unisane/analytics'],
  },
  notifications: {
    name: 'Notifications',
    description: 'Email, push, and in-app notifications',
    packages: ['@unisane/notify'],
  },
  webhooks: {
    name: 'Webhooks',
    description: 'Outgoing webhook management',
    packages: ['@unisane/webhooks'],
  },
  audit: {
    name: 'Audit Logs',
    description: 'Activity logging and compliance',
    packages: ['@unisane/audit'],
  },
  flags: {
    name: 'Feature Flags',
    description: 'Feature toggles and gradual rollouts',
    packages: ['@unisane/flags'],
  },
} as const;

const INTEGRATIONS = {
  stripe: {
    name: 'Stripe',
    description: 'Payment processing and billing',
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PUBLISHABLE_KEY'],
  },
  resend: {
    name: 'Resend',
    description: 'Transactional email service',
    envVars: ['RESEND_API_KEY'],
  },
  'aws-s3': {
    name: 'AWS S3',
    description: 'File storage',
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
  },
  cloudflare: {
    name: 'Cloudflare R2',
    description: 'S3-compatible storage',
    envVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_KEY'],
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT and embeddings',
    envVars: ['OPENAI_API_KEY'],
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude AI models',
    envVars: ['ANTHROPIC_API_KEY'],
  },
  github: {
    name: 'GitHub OAuth',
    description: 'GitHub authentication',
    envVars: ['AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET'],
  },
  google: {
    name: 'Google OAuth',
    description: 'Google authentication',
    envVars: ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'],
  },
  posthog: {
    name: 'PostHog',
    description: 'Product analytics',
    envVars: ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
  },
  sentry: {
    name: 'Sentry',
    description: 'Error tracking',
    envVars: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN'],
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// UI Component Commands
// ════════════════════════════════════════════════════════════════════════════

export async function addComponent(options: AddComponentOptions): Promise<number> {
  log.section('Add UI Components');

  let components = options.components ?? [];

  // Interactive selection if no components specified
  if (components.length === 0) {
    const selected = await prompt.multiselect({
      message: 'Which components would you like to add?',
      choices: Object.entries(UI_COMPONENTS).map(([key, value]) => ({
        title: key,
        value: key,
        description: value.category,
      })),
    });

    if (!selected || selected.length === 0) {
      log.warn('No components selected');
      return 1;
    }
    components = selected;
  }

  // Resolve dependencies
  const allComponents = resolveDependencies(components);

  if (allComponents.length > components.length) {
    const deps = allComponents.filter((c) => !components.includes(c));
    log.info(`Adding ${deps.length} dependencies: ${deps.join(', ')}`);
  }

  // Determine output path
  const outputPath = options.path ?? 'src/components/ui';

  // Confirmation
  if (!options.yes) {
    log.newline();
    log.info('Components to add:');
    allComponents.forEach((c) => log.dim(`  - ${c}`));
    log.kv('Output', outputPath);
    log.newline();

    const confirmed = await prompt.confirm({
      message: 'Proceed?',
      initial: true,
    });

    if (!confirmed) {
      log.warn('Cancelled');
      return 1;
    }
  }

  // Add components
  const spinner = log.spinner('Adding components...');
  spinner.start();

  let added = 0;
  let skipped = 0;

  for (const component of allComponents) {
    const destPath = path.join(process.cwd(), outputPath, `${component}.tsx`);

    if (existsSync(destPath) && !options.overwrite) {
      skipped++;
      continue;
    }

    ensureDirSync(path.dirname(destPath));

    // Generate component stub (in real implementation, fetch from registry)
    const content = generateComponentStub(component);
    writeFileSync(destPath, content);
    added++;
  }

  spinner.succeed(`Added ${added} components${skipped > 0 ? `, skipped ${skipped} existing` : ''}`);

  return 0;
}

export async function listComponents(): Promise<number> {
  log.section('Available UI Components');

  const categories: Record<string, string[]> = {};

  for (const [name, config] of Object.entries(UI_COMPONENTS)) {
    const cat = config.category;
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(name);
  }

  for (const [category, components] of Object.entries(categories)) {
    log.info(category.charAt(0).toUpperCase() + category.slice(1));
    components.forEach((c) => log.dim(`  ${c}`));
    log.newline();
  }

  log.dim(`Total: ${Object.keys(UI_COMPONENTS).length} components`);
  log.newline();
  log.info('Usage: unisane add ui <component> [component...]');

  return 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Module Commands
// ════════════════════════════════════════════════════════════════════════════

export async function addModule(options: AddModuleOptions): Promise<number> {
  log.section('Add Module');

  const moduleConfig = MODULES[options.module as keyof typeof MODULES];

  if (!moduleConfig) {
    log.error(`Unknown module: ${options.module}`);
    log.info('Available modules:');
    Object.keys(MODULES).forEach((m) => log.dim(`  - ${m}`));
    return 1;
  }

  log.info(`Adding ${moduleConfig.name}`);
  log.dim(moduleConfig.description);
  log.newline();
  log.info('Packages:');
  moduleConfig.packages.forEach((p) => log.dim(`  - ${p}`));

  if (options.dryRun) {
    log.warn('Dry run - no changes made');
    return 0;
  }

  // In real implementation:
  // 1. Install packages
  // 2. Copy module source to src/modules/
  // 3. Update configuration files
  // 4. Add required environment variables to .env.example

  log.warn(`Module installation not yet implemented`);
  log.info('To add manually, run:');
  log.dim(`  pnpm add ${moduleConfig.packages.join(' ')}`);

  return 0;
}

export async function listModules(): Promise<number> {
  log.section('Available Modules');

  const headers = ['Module', 'Description'];
  const rows = Object.entries(MODULES).map(([key, config]) => [key, config.description]);

  log.table(headers, rows);
  log.newline();
  log.info('Usage: unisane add module <name>');

  return 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Integration Commands
// ════════════════════════════════════════════════════════════════════════════

export async function addIntegration(options: AddIntegrationOptions): Promise<number> {
  log.section('Add Integration');

  const integrationConfig = INTEGRATIONS[options.integration as keyof typeof INTEGRATIONS];

  if (!integrationConfig) {
    log.error(`Unknown integration: ${options.integration}`);
    log.info('Available integrations:');
    Object.keys(INTEGRATIONS).forEach((i) => log.dim(`  - ${i}`));
    return 1;
  }

  log.info(`Configuring ${integrationConfig.name}`);
  log.dim(integrationConfig.description);
  log.newline();

  // Show required environment variables
  log.info('Required environment variables:');
  integrationConfig.envVars.forEach((v) => log.dim(`  - ${v}`));

  // In real implementation:
  // 1. Add env vars to .env.example
  // 2. Install required packages
  // 3. Generate configuration files

  log.newline();
  log.warn('Integration setup not yet implemented');
  log.info('Add these to your .env.local:');
  integrationConfig.envVars.forEach((v) => log.dim(`  ${v}=`));

  return 0;
}

export async function listIntegrations(): Promise<number> {
  log.section('Available Integrations');

  const headers = ['Integration', 'Description'];
  const rows = Object.entries(INTEGRATIONS).map(([key, config]) => [key, config.description]);

  log.table(headers, rows);
  log.newline();
  log.info('Usage: unisane add integration <name>');

  return 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════════════════════════

function resolveDependencies(components: string[]): string[] {
  const resolved = new Set<string>();
  const queue = [...components];

  while (queue.length > 0) {
    const component = queue.shift()!;
    if (resolved.has(component)) continue;

    resolved.add(component);
    const config = UI_COMPONENTS[component as keyof typeof UI_COMPONENTS];
    if (config) {
      queue.push(...config.dependencies);
    }
  }

  return Array.from(resolved);
}

function generateComponentStub(name: string): string {
  const pascalName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return `/**
 * ${pascalName} component
 *
 * @see https://unisane.dev/docs/components/${name}
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ${pascalName}Props extends React.HTMLAttributes<HTMLDivElement> {
  // Add component props here
}

export const ${pascalName} = React.forwardRef<HTMLDivElement, ${pascalName}Props>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('', className)}
        {...props}
      />
    );
  }
);

${pascalName}.displayName = '${pascalName}';
`;
}
