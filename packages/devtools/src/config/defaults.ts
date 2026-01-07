import type { DevtoolsConfig } from './schema.js';

/**
 * Default configuration values for devtools
 */
export const DEFAULT_CONFIG: DevtoolsConfig = {
  contracts: {
    dir: './src/contracts',
    router: './src/contracts/app.router.ts',
    glob: '**/*.contract.ts',
  },
  routes: {
    output: './src/app/api',
    runtime: 'nodejs',
  },
  sdk: {
    output: './src/sdk',
    targets: ['browser', 'server', 'hooks', 'vue', 'zod', 'types'],
    namespace: true,
  },
  database: {
    seedDataPath: './scripts/seed.data.json',
  },
  packages: {
    gateway: '@unisane/gateway',
    kernel: '@unisane/kernel',
    audit: '@unisane/audit',
    billing: '@unisane/billing',
    credits: '@unisane/credits',
    flags: '@unisane/flags',
    identity: '@unisane/identity',
    notify: '@unisane/notify',
    settings: '@unisane/settings',
    storage: '@unisane/storage',
    tenants: '@unisane/tenants',
    webhooks: '@unisane/webhooks',
    usage: '@unisane/usage',
    media: '@unisane/media',
    pdf: '@unisane/pdf',
    ai: '@unisane/ai',
    analytics: '@unisane/analytics',
    sso: '@unisane/sso',
    'import-export': '@unisane/import-export',
    auth: '@unisane/auth',
  },
};
