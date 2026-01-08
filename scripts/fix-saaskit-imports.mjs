#!/usr/bin/env node
/**
 * Fix saaskit imports from @/src/modules/* and @/src/gateway/* to @unisane/*
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SAASKIT_SRC = './starters/saaskit/src';

// Mapping from old paths to new package imports
const REPLACEMENTS = [
  // Gateway - all subpaths
  ['@/src/gateway/cookies', '@unisane/gateway'],
  ['@/src/gateway/errors', '@unisane/gateway'],
  ['@/src/gateway/headers', '@unisane/gateway'],
  ['@/src/gateway/httpHandler', '@unisane/gateway'],
  ['@/src/gateway/httpWebhook', '@unisane/gateway'],
  ['@/src/gateway/jwt', '@unisane/gateway'],
  ['@/src/gateway/rateLimit', '@unisane/gateway'],
  ['@/src/gateway/auth', '@unisane/gateway'],
  ['@/src/gateway/errorCatalog', '@unisane/gateway'],
  ['@/src/gateway/filterParams', '@unisane/gateway'],
  ['@/src/gateway/query', '@unisane/gateway'],
  ['@/src/gateway/queryDsl', '@unisane/gateway'],
  ['@/src/gateway/rbac', '@unisane/gateway'],
  ['@/src/gateway/registry/admin.lists', '@unisane/gateway'],

  // Core → Kernel
  ['@/src/core/db/connection', '@unisane/kernel'],
  ['@/src/core/db/mongo/objectId', '@unisane/kernel'],
  ['@/src/core/db', '@unisane/kernel'],
  ['@/src/core/kv/redis', '@unisane/kernel'],
  ['@/src/core/kv', '@unisane/kernel'],
  ['@/src/core/metrics', '@unisane/kernel'],
  ['@/src/core/pagination', '@unisane/kernel'],
  ['@/src/core/storage', '@unisane/kernel'],
  ['@/src/core/inngest', '@unisane/kernel'],

  // Modules - direct imports (include all subpaths before base paths)
  ['@/src/modules/analytics/service', '@unisane/analytics'],
  ['@/src/modules/analytics', '@unisane/analytics'],
  ['@/src/modules/ai/service', '@unisane/ai'],
  ['@/src/modules/ai', '@unisane/ai'],
  ['@/src/modules/audit/service', '@unisane/audit'],
  ['@/src/modules/audit', '@unisane/audit'],
  ['@/src/modules/auth/service', '@unisane/auth'],
  ['@/src/modules/auth', '@unisane/auth'],
  ['@/src/modules/billing/service/reconcile', '@unisane/billing'],
  ['@/src/modules/billing/service', '@unisane/billing'],
  ['@/src/modules/billing/domain', '@unisane/billing'],
  ['@/src/modules/billing', '@unisane/billing'],
  ['@/src/modules/credits/service', '@unisane/credits'],
  ['@/src/modules/credits/domain', '@unisane/credits'],
  ['@/src/modules/credits', '@unisane/credits'],
  ['@/src/modules/flags/data/overrides.repository', '@unisane/flags'],
  ['@/src/modules/flags/service/get', '@unisane/flags'],
  ['@/src/modules/flags/service/overrides', '@unisane/flags'],
  ['@/src/modules/flags/service', '@unisane/flags'],
  ['@/src/modules/flags', '@unisane/flags'],
  ['@/src/modules/identity/service', '@unisane/identity'],
  ['@/src/modules/identity/domain', '@unisane/identity'],
  ['@/src/modules/identity', '@unisane/identity'],
  ['@/src/modules/import-export/service/jobs', '@unisane/import-export'],
  ['@/src/modules/import-export/service', '@unisane/import-export'],
  ['@/src/modules/import-export', '@unisane/import-export'],
  ['@/src/modules/media/service', '@unisane/media'],
  ['@/src/modules/media', '@unisane/media'],
  ['@/src/modules/notify/service/email', '@unisane/notify'],
  ['@/src/modules/notify/service', '@unisane/notify'],
  ['@/src/modules/notify', '@unisane/notify'],
  ['@/src/modules/pdf/service', '@unisane/pdf'],
  ['@/src/modules/pdf', '@unisane/pdf'],
  ['@/src/modules/settings/service/read', '@unisane/settings'],
  ['@/src/modules/settings/service/readTyped', '@unisane/settings'],
  ['@/src/modules/settings/service', '@unisane/settings'],
  ['@/src/modules/settings', '@unisane/settings'],
  ['@/src/modules/storage/service', '@unisane/storage'],
  ['@/src/modules/storage', '@unisane/storage'],
  ['@/src/modules/tenants/service', '@unisane/tenants'],
  ['@/src/modules/tenants', '@unisane/tenants'],
  ['@/src/modules/usage/service/rollupDay', '@unisane/usage'],
  ['@/src/modules/usage/service/rollupHour', '@unisane/usage'],
  ['@/src/modules/usage/service', '@unisane/usage'],
  ['@/src/modules/usage', '@unisane/usage'],
  ['@/src/modules/webhooks/service', '@unisane/webhooks'],
  ['@/src/modules/webhooks', '@unisane/webhooks'],

  // SSO module (if exists)
  ['@/src/modules/sso/service', '@unisane/sso'],
  ['@/src/modules/sso', '@unisane/sso'],
];

function getAllFiles(dir, ext, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      getAllFiles(path, ext, files);
    } else if (path.endsWith(ext)) {
      files.push(path);
    }
  }
  return files;
}

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [from, to] of REPLACEMENTS) {
    // Match the exact import path (not partial matches)
    const regex = new RegExp(`(['"])${escapeRegex(from)}(['"])`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${to}$2`);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process all .ts and .tsx files
const tsFiles = getAllFiles(SAASKIT_SRC, '.ts');
const tsxFiles = getAllFiles(SAASKIT_SRC, '.tsx');
const allFiles = [...tsFiles, ...tsxFiles];

console.log(`Processing ${allFiles.length} files...\n`);

let fixedCount = 0;
for (const file of allFiles) {
  if (fixFile(file)) fixedCount++;
}

console.log(`\nDone! Fixed ${fixedCount} files.`);
