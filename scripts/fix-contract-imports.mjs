#!/usr/bin/env node
/**
 * Fix contract imports from @/src/* to @unisane/*
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CONTRACTS_DIR = './starters/saaskit/src/contracts';

// Simple string replacements (exact matches only)
const REPLACEMENTS = [
  // Contract-local references
  ['@/src/contracts/meta', './meta'],

  // Shared → kernel (these are type imports at top of file)
  ['@/src/shared/rbac/permissions', '@unisane/kernel'],
  ['@/src/shared/rbac/roles', '@unisane/kernel'],
  ['@/src/shared/constants/billing', '@unisane/kernel'],
  ['@/src/shared/constants/billing-mode', '@unisane/kernel'],
  ['@/src/shared/constants/plan', '@unisane/kernel'],
  ['@/src/shared/constants/credits', '@unisane/kernel'],
  ['@/src/shared/constants/features', '@unisane/kernel'],
  ['@/src/shared/constants/flags', '@unisane/kernel'],
  ['@/src/shared/constants/notify', '@unisane/kernel'],
  ['@/src/shared/constants/outbox', '@unisane/kernel'],
  ['@/src/shared/constants/storage', '@unisane/kernel'],
  ['@/src/shared/constants/media', '@unisane/kernel'],
  ['@/src/shared/constants/webhooks', '@unisane/kernel'],
  ['@/src/shared/constants/jobs', '@unisane/kernel'],
  ['@/src/shared/constants/identity', '@unisane/kernel'],
  ['@/src/shared/constants/auth', '@unisane/kernel'],
  ['@/src/shared/constants/settings', '@unisane/kernel'],
  ['@/src/shared/constants/usage', '@unisane/kernel'],
  ['@/src/shared/constants/feature-flags', '@unisane/kernel'],
  ['@/src/shared/constants/rbac', '@unisane/kernel'],
  ['@/src/shared/dto', '@unisane/kernel'],
  ['@/src/shared/crypto', '@unisane/kernel'],
  ['@/src/shared/env', '@unisane/kernel'],

  // Module schemas → @unisane/<pkg>
  ['@/src/modules/billing/domain/schemas', '@unisane/billing'],
  ['@/src/modules/credits/domain/schemas', '@unisane/credits'],
  ['@/src/modules/identity/domain/schemas', '@unisane/identity'],
  ['@/src/modules/tenants/domain/schemas', '@unisane/tenants'],
  ['@/src/modules/auth/domain/schemas', '@unisane/auth'],
  ['@/src/modules/flags/domain/schemas', '@unisane/flags'],
  ['@/src/modules/notify/domain/schemas', '@unisane/notify'],
  ['@/src/modules/settings/domain/schemas', '@unisane/settings'],
  ['@/src/modules/storage/domain/schemas', '@unisane/storage'],
  ['@/src/modules/webhooks/domain/schemas', '@unisane/webhooks'],
  ['@/src/modules/audit/domain/schemas', '@unisane/audit'],
  ['@/src/modules/usage/domain/schemas', '@unisane/usage'],
  ['@/src/modules/import-export/domain/schemas', '@unisane/import-export'],
  ['@/src/modules/media/domain/schemas', '@unisane/media'],
  ['@/src/modules/pdf/domain/schemas', '@unisane/pdf'],
  ['@/src/modules/ai/domain/schemas', '@unisane/ai'],
  ['@/src/modules/analytics/domain/schemas', '@unisane/analytics'],
  ['@/src/modules/sso/domain/schemas', '@unisane/sso'],

  // Module services (various paths) → @unisane/<pkg>
  ['@/src/modules/billing/service/', '@unisane/billing'],
  ['@/src/modules/credits/service/', '@unisane/credits'],
  ['@/src/modules/identity/service/', '@unisane/identity'],
  ['@/src/modules/tenants/service/', '@unisane/tenants'],
  ['@/src/modules/auth/service/', '@unisane/auth'],
  ['@/src/modules/flags/service/', '@unisane/flags'],
  ['@/src/modules/notify/service/', '@unisane/notify'],
  ['@/src/modules/settings/service/', '@unisane/settings'],
  ['@/src/modules/storage/service/', '@unisane/storage'],
  ['@/src/modules/webhooks/service/', '@unisane/webhooks'],
  ['@/src/modules/audit/service/', '@unisane/audit'],
  ['@/src/modules/usage/service/', '@unisane/usage'],
  ['@/src/modules/import-export/service/', '@unisane/import-export'],
  ['@/src/modules/media/service/', '@unisane/media'],
  ['@/src/modules/pdf/service/', '@unisane/pdf'],
  ['@/src/modules/ai/service/', '@unisane/ai'],
  ['@/src/modules/analytics/service/', '@unisane/analytics'],
  ['@/src/modules/sso/service/', '@unisane/sso'],

  // Platform → appropriate packages
  ['@/src/platform/outbox/service.admin', '@unisane/notify'],
  ['@/src/platform/metering/entitlements', '@unisane/billing'],
  ['@/src/platform/jobs/service/triggerFactory', '@unisane/import-export'],

  // Storage special case
  ['@/src/modules/storage', '@unisane/storage'],
];

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      // For service paths that have variable endings, we need to be smarter
      if (from.endsWith('/')) {
        // Match the pattern and strip the service path part
        const regex = new RegExp(escapeRegex(from) + '[^"\']+', 'g');
        const newContent = content.replace(regex, to);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      } else {
        content = content.split(from).join(to);
        changed = true;
      }
    }
  }

  // Fix local contract references (./foo.contract → ./foo.contract)
  content = content.replace(/@\/src\/contracts\/([^"']+)\.contract/g, './$1.contract');

  if (changed || content.includes('@/src/contracts/')) {
    writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`Unchanged: ${filePath}`);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process all .ts files
const files = readdirSync(CONTRACTS_DIR).filter(f => f.endsWith('.ts'));
console.log(`Processing ${files.length} files...\n`);

for (const file of files) {
  fixFile(join(CONTRACTS_DIR, file));
}

console.log('\nDone!');
