/**
 * Bootstrap - Wire all modules together
 * Called once at app startup (instrumentation.ts or first request)
 */

import {
  connectDb,
  closeDb,
  ensureIndexes,
  db,
  redis,
  registerHealthCheck,
  createMongoHealthCheck,
  createRedisHealthCheck,
} from '@unisane/kernel';

// Type for bootstrap status
let bootstrapped = false;

/**
 * Initialize the platform
 * This function should be called once at app startup
 */
export async function bootstrap() {
  if (bootstrapped) return;

  console.log('[bootstrap] Starting platform initialization...');

  // 1. Database connection
  await connectDb();
  console.log('[bootstrap] ✓ Database connected');

  // 2. Ensure indexes exist (runs in background, won't block startup)
  await ensureIndexes();
  console.log('[bootstrap] ✓ Database indexes ensured');

  // 3. Register health checks
  registerHealthCheck('mongodb', createMongoHealthCheck(() => db()));
  registerHealthCheck('redis', createRedisHealthCheck(() => redis));
  console.log('[bootstrap] ✓ Health checks registered');

  // 4. Set up repositories (DI)
  // These functions inject the MongoDB implementations into each module
  await setupRepositories();
  console.log('[bootstrap] ✓ Repositories configured');

  // 5. Set up providers (billing, email, storage, AI)
  await setupProviders();
  console.log('[bootstrap] ✓ Providers configured');

  // 6. Register event handlers
  await registerEventHandlers();
  console.log('[bootstrap] ✓ Event handlers registered');

  bootstrapped = true;
  console.log('[bootstrap] ✓ Platform initialization complete');
}

/**
 * Set up all module repositories and cross-module dependencies
 */
async function setupRepositories() {
  // Configure identity providers (breaks identity -> tenants cycle)
  const { configureIdentityProviders } = await import('@unisane/identity');
  const { TenantsRepo } = await import('@unisane/tenants');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configureIdentityProviders({ tenantsRepo: TenantsRepo as any });
  console.log('[bootstrap]   - Identity providers configured');

  // Configure tenant bootstrap providers (breaks tenants -> identity cycle)
  const { membershipsRepository } = await import('@unisane/identity');
  const { configureTenantBootstrap } = await import('@unisane/tenants');
  configureTenantBootstrap({
    addOwnerRole: async (tenantId: string, userId: string) => {
      await membershipsRepository.addRole(tenantId, userId, 'owner');
    },
  });
  console.log('[bootstrap]   - Tenant bootstrap providers configured');

  // Configure tenant enrichment providers (admin dashboard data)
  const { configureTenantEnrichment } = await import('@unisane/tenants');
  const { getTenantMembershipCounts, getTenantApiKeyCounts } = await import('@unisane/identity');
  const { getTenantOverrideCounts } = await import('@unisane/flags');
  const { getTenantOpenInvoiceCounts, getTenantLatestSubscriptions } = await import('@unisane/billing');
  const { getTenantLastActivity } = await import('@unisane/audit');
  const { getTenantFailureCounts } = await import('@unisane/webhooks');
  const { getTenantCreditBalances } = await import('@unisane/credits');

  configureTenantEnrichment({
    getTenantMembershipCounts,
    getTenantApiKeyCounts,
    getTenantOverrideCounts,
    getTenantOpenInvoiceCounts,
    getTenantLatestSubscriptions,
    getTenantLastActivity,
    getTenantFailureCounts,
    getTenantCreditBalances,
  });
  console.log('[bootstrap]   - Tenant enrichment providers configured');

  // Configure gateway auth (for JWT/API key authentication)
  const { configureAuth } = await import('@unisane/gateway');
  const { usersRepository, apiKeysRepository, getEffectivePerms, applyGlobalOverlays } = await import('@unisane/identity');

  configureAuth({
    findApiKeyByHash: async (hash: string) => {
      const key = await apiKeysRepository.findActiveByHash(hash);
      if (!key) return null;
      return { id: key.id, tenantId: key.tenantId, scopes: key.scopes };
    },
    findUserById: async (userId: string) => {
      const user = await usersRepository.findById(userId);
      if (!user) return null;
      return { id: user.id, sessionsRevokedAt: user.sessionsRevokedAt ?? null };
    },
    getEffectivePerms,
    applyGlobalOverlays,
    connectDb: async () => { await connectDb(); },
  });
  console.log('[bootstrap]   - Gateway auth configured');
}

/**
 * Set up platform providers
 */
async function setupProviders() {
  // Initialize cache subscribers and validate environment
  const { initModules } = await import('./platform/init');
  initModules();
  console.log('[bootstrap]   - Module initializers run');

  // Provider registration is handled by:
  // - platform/init.ts for module initialization
  // - platform/billing/providers/index.ts for billing
  // - platform/email/providers/index.ts for email
  // Providers are accessed via getProvider() functions rather than registered globally
  console.log('[bootstrap]   - Providers available via platform modules');
}

/**
 * Register event handlers for all modules
 */
async function registerEventHandlers() {
  // Event handler registration is handled automatically by each module
  // when they are imported. No explicit registration needed.
  // This function is kept for potential future use.
  console.log('[bootstrap]   - Event handlers initialized via module imports');
}

/**
 * Check if bootstrap has completed
 */
export function isBootstrapped(): boolean {
  return bootstrapped;
}

/**
 * Shutdown the platform gracefully
 */
export async function shutdown() {
  if (!bootstrapped) return;

  console.log('[bootstrap] Shutting down...');

  // Close database connections, flush caches, etc.
  await closeDb();

  bootstrapped = false;
  console.log('[bootstrap] ✓ Shutdown complete');
}
