/**
 * @module commands/env
 *
 * Environment variable management commands.
 * Similar to: vercel env, railway env, doppler
 */

import fse from 'fs-extra';
const { existsSync, readFileSync, writeFileSync } = fse;
import path from 'path';
import { log, prompt } from '@unisane/cli-core';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

export interface EnvCheckOptions {
  /** Environment file to check */
  file?: string;
  /** Show values (masked) */
  showValues?: boolean;
}

export interface EnvInitOptions {
  /** Force overwrite existing .env.local */
  force?: boolean;
  /** Source file */
  source?: string;
  /** Target file */
  target?: string;
}

export interface EnvVariable {
  name: string;
  required: boolean;
  description?: string;
  default?: string;
  sensitive?: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// Environment Schema
// ════════════════════════════════════════════════════════════════════════════

const ENV_SCHEMA: EnvVariable[] = [
  // Database
  { name: 'DATABASE_URL', required: true, description: 'MongoDB connection string', sensitive: true },

  // Authentication
  { name: 'AUTH_SECRET', required: true, description: 'NextAuth.js secret key', sensitive: true },
  { name: 'AUTH_URL', required: false, description: 'Auth callback URL', default: 'http://localhost:3000' },

  // OAuth Providers
  { name: 'AUTH_GITHUB_ID', required: false, description: 'GitHub OAuth client ID' },
  { name: 'AUTH_GITHUB_SECRET', required: false, description: 'GitHub OAuth client secret', sensitive: true },
  { name: 'AUTH_GOOGLE_ID', required: false, description: 'Google OAuth client ID' },
  { name: 'AUTH_GOOGLE_SECRET', required: false, description: 'Google OAuth client secret', sensitive: true },

  // Stripe
  { name: 'STRIPE_SECRET_KEY', required: false, description: 'Stripe secret API key', sensitive: true },
  { name: 'STRIPE_WEBHOOK_SECRET', required: false, description: 'Stripe webhook signing secret', sensitive: true },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: false, description: 'Stripe publishable key' },

  // Email
  { name: 'RESEND_API_KEY', required: false, description: 'Resend API key for emails', sensitive: true },
  { name: 'EMAIL_FROM', required: false, description: 'Default from email address', default: 'noreply@example.com' },

  // Storage
  { name: 'AWS_ACCESS_KEY_ID', required: false, description: 'AWS access key', sensitive: true },
  { name: 'AWS_SECRET_ACCESS_KEY', required: false, description: 'AWS secret key', sensitive: true },
  { name: 'AWS_REGION', required: false, description: 'AWS region', default: 'us-east-1' },
  { name: 'AWS_S3_BUCKET', required: false, description: 'S3 bucket name' },

  // AI
  { name: 'OPENAI_API_KEY', required: false, description: 'OpenAI API key', sensitive: true },
  { name: 'ANTHROPIC_API_KEY', required: false, description: 'Anthropic API key', sensitive: true },

  // Analytics
  { name: 'NEXT_PUBLIC_POSTHOG_KEY', required: false, description: 'PostHog project key' },
  { name: 'NEXT_PUBLIC_POSTHOG_HOST', required: false, description: 'PostHog host URL' },

  // Monitoring
  { name: 'SENTRY_DSN', required: false, description: 'Sentry DSN for error tracking' },
];

// ════════════════════════════════════════════════════════════════════════════
// Commands
// ════════════════════════════════════════════════════════════════════════════

export async function envCheck(options: EnvCheckOptions): Promise<number> {
  log.section('Environment Check');

  const envFile = options.file ?? '.env.local';
  const envPath = path.join(process.cwd(), envFile);

  // Load environment variables
  const envVars = loadEnvFile(envPath);
  const processEnv = process.env;

  // Check each variable
  let missing = 0;
  let present = 0;
  let optional = 0;

  const results: Array<{ name: string; status: string; value?: string }> = [];

  for (const variable of ENV_SCHEMA) {
    const value = envVars[variable.name] ?? processEnv[variable.name];
    const hasValue = value !== undefined && value !== '';

    if (hasValue) {
      present++;
      results.push({
        name: variable.name,
        status: '✔',
        value: options.showValues ? maskValue(value, variable.sensitive) : undefined,
      });
    } else if (variable.required) {
      missing++;
      results.push({
        name: variable.name,
        status: '✖ missing',
      });
    } else {
      optional++;
      results.push({
        name: variable.name,
        status: '○ optional',
      });
    }
  }

  // Display results
  if (options.showValues) {
    const headers = ['Variable', 'Status', 'Value'];
    const rows = results.map((r) => [r.name, r.status, r.value ?? '']);
    log.table(headers, rows);
  } else {
    const headers = ['Variable', 'Status'];
    const rows = results.map((r) => [r.name, r.status]);
    log.table(headers, rows);
  }

  log.newline();
  log.kv('Present', present);
  log.kv('Missing (required)', missing);
  log.kv('Missing (optional)', optional);

  if (missing > 0) {
    log.newline();
    log.error(`${missing} required environment variable(s) missing`);
    log.info('Run: unisane env init');
    return 1;
  }

  log.newline();
  log.success('All required environment variables are set');
  return 0;
}

export async function envInit(options: EnvInitOptions): Promise<number> {
  log.section('Initialize Environment');

  const sourcePath = path.join(process.cwd(), options.source ?? '.env.example');
  const targetPath = path.join(process.cwd(), options.target ?? '.env.local');

  // Check if target exists
  if (existsSync(targetPath) && !options.force) {
    log.warn(`${options.target ?? '.env.local'} already exists`);
    const overwrite = await prompt.confirm({
      message: 'Overwrite existing file?',
      initial: false,
    });
    if (!overwrite) {
      log.info('Cancelled');
      return 0;
    }
  }

  // Check if source exists
  if (!existsSync(sourcePath)) {
    log.warn(`${options.source ?? '.env.example'} not found, generating from schema`);
    await generateEnvExample(sourcePath);
  }

  // Copy source to target
  const content = readFileSync(sourcePath, 'utf-8');
  writeFileSync(targetPath, content);

  log.success(`Created ${options.target ?? '.env.local'}`);
  log.newline();
  log.info('Next steps:');
  log.dim(`  1. Edit ${options.target ?? '.env.local'} with your values`);
  log.dim('  2. Run: unisane env check');

  return 0;
}

export async function envPull(): Promise<number> {
  log.section('Pull Environment Variables');
  log.warn('env pull is not yet implemented');
  log.info('This command will pull environment variables from:');
  log.dim('  - Vercel (vercel env pull)');
  log.dim('  - Doppler (doppler secrets download)');
  log.dim('  - Railway (railway env)');
  return 1;
}

export async function envPush(): Promise<number> {
  log.section('Push Environment Variables');
  log.warn('env push is not yet implemented');
  return 1;
}

export async function envGenerate(): Promise<number> {
  log.section('Generate .env.example');

  const targetPath = path.join(process.cwd(), '.env.example');

  if (existsSync(targetPath)) {
    const overwrite = await prompt.confirm({
      message: '.env.example already exists. Overwrite?',
      initial: false,
    });
    if (!overwrite) {
      return 0;
    }
  }

  await generateEnvExample(targetPath);
  log.success('Generated .env.example');

  return 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════════════════════════

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf-8');
  const vars: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && match[1] && match[2] !== undefined) {
      let value = match[2];
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      vars[match[1]] = value;
    }
  }

  return vars;
}

function maskValue(value: string, sensitive?: boolean): string {
  if (!sensitive) return value;
  if (value.length <= 4) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}

async function generateEnvExample(targetPath: string): Promise<void> {
  const lines: string[] = [
    '# ════════════════════════════════════════════════════════════════════════════',
    '# Unisane Environment Variables',
    '# ════════════════════════════════════════════════════════════════════════════',
    '#',
    '# Copy this file to .env.local and fill in your values.',
    '# Run `unisane env check` to verify your configuration.',
    '#',
    '# Variables marked with [REQUIRED] must be set for the app to work.',
    '# Variables marked with [OPTIONAL] can be left empty.',
    '#',
    '',
  ];

  // Group variables by category
  const categories: Record<string, EnvVariable[]> = {
    'Database': [],
    'Authentication': [],
    'OAuth Providers': [],
    'Stripe': [],
    'Email': [],
    'Storage': [],
    'AI': [],
    'Analytics': [],
    'Monitoring': [],
  };

  for (const variable of ENV_SCHEMA) {
    if (variable.name.startsWith('DATABASE')) {
      categories['Database']!.push(variable);
    } else if (variable.name.startsWith('AUTH_') && !variable.name.includes('GITHUB') && !variable.name.includes('GOOGLE')) {
      categories['Authentication']!.push(variable);
    } else if (variable.name.includes('GITHUB') || variable.name.includes('GOOGLE')) {
      categories['OAuth Providers']!.push(variable);
    } else if (variable.name.includes('STRIPE')) {
      categories['Stripe']!.push(variable);
    } else if (variable.name.includes('RESEND') || variable.name.includes('EMAIL')) {
      categories['Email']!.push(variable);
    } else if (variable.name.includes('AWS') || variable.name.includes('S3')) {
      categories['Storage']!.push(variable);
    } else if (variable.name.includes('OPENAI') || variable.name.includes('ANTHROPIC')) {
      categories['AI']!.push(variable);
    } else if (variable.name.includes('POSTHOG')) {
      categories['Analytics']!.push(variable);
    } else if (variable.name.includes('SENTRY')) {
      categories['Monitoring']!.push(variable);
    }
  }

  for (const [category, variables] of Object.entries(categories)) {
    if (variables.length === 0) continue;

    lines.push(`# ${category}`);
    lines.push(`# ${'─'.repeat(76)}`);

    for (const variable of variables) {
      const tag = variable.required ? '[REQUIRED]' : '[OPTIONAL]';
      if (variable.description) {
        lines.push(`# ${tag} ${variable.description}`);
      }
      const defaultValue = variable.default ?? '';
      lines.push(`${variable.name}=${defaultValue}`);
      lines.push('');
    }
  }

  writeFileSync(targetPath, lines.join('\n'));
}
