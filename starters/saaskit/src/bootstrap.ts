/**
 * Bootstrap - Wire all modules together
 * Called once at app startup (instrumentation.ts or first request)
 */

import { connectDb, setClient } from '@unisane/kernel';
import { MongoClient } from 'mongodb';

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
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  setClient(client);
  await connectDb();
  console.log('[bootstrap] ✓ Database connected');

  // 2. Set up repositories (DI)
  // These functions inject the MongoDB implementations into each module
  await setupRepositories();
  console.log('[bootstrap] ✓ Repositories configured');

  // 3. Set up providers (billing, email, storage, AI)
  await setupProviders();
  console.log('[bootstrap] ✓ Providers configured');

  // 4. Register event handlers
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
  configureIdentityProviders({
    tenantsRepo: TenantsRepo,
  });
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
}

/**
 * Set up platform providers
 */
async function setupProviders() {
  // Import providers from platform directory
  // These are implementation-specific (Stripe, Resend, S3, OpenAI)

  // Billing provider (Stripe/LemonSqueezy)
  const billingProvider = process.env.BILLING_PROVIDER || 'stripe';
  if (billingProvider === 'stripe') {
    const { setBillingProvider } = await import('@unisane/kernel');
    const { createStripeProvider } = await import('./platform/billing/stripe');
    setBillingProvider(createStripeProvider());
  }

  // Email provider (Resend/SES)
  const emailProvider = process.env.EMAIL_PROVIDER || 'resend';
  if (emailProvider === 'resend') {
    const { setEmailProvider } = await import('./platform/email/resend');
    setEmailProvider();
  }

  // Storage provider (S3/R2)
  const storageProvider = process.env.STORAGE_PROVIDER || 's3';
  if (storageProvider === 's3') {
    const { setStorageProvider } = await import('./platform/storage/s3');
    setStorageProvider();
  }

  // AI provider (OpenAI)
  const aiProvider = process.env.AI_PROVIDER || 'openai';
  if (aiProvider === 'openai') {
    const { setAiProvider } = await import('./platform/ai/openai');
    setAiProvider();
  }
}

/**
 * Register event handlers for all modules
 */
async function registerEventHandlers() {
  // Each module may have event handlers that respond to events from other modules
  // These handlers enable loose coupling between modules

  // Identity handlers (e.g., user.deleted -> cleanup)
  try {
    const { registerIdentityHandlers } = await import('@unisane/identity');
    if (typeof registerIdentityHandlers === 'function') {
      registerIdentityHandlers();
    }
  } catch {}

  // Tenant handlers
  try {
    const { registerTenantHandlers } = await import('@unisane/tenants');
    if (typeof registerTenantHandlers === 'function') {
      registerTenantHandlers();
    }
  } catch {}

  // Auth handlers
  try {
    const { registerAuthHandlers } = await import('@unisane/auth');
    if (typeof registerAuthHandlers === 'function') {
      registerAuthHandlers();
    }
  } catch {}

  // Billing handlers (e.g., subscription.created -> enable features)
  try {
    const { registerBillingHandlers } = await import('@unisane/billing');
    if (typeof registerBillingHandlers === 'function') {
      registerBillingHandlers();
    }
  } catch {}

  // Audit handlers (e.g., log sensitive operations)
  try {
    const { registerAuditHandlers } = await import('@unisane/audit');
    if (typeof registerAuditHandlers === 'function') {
      registerAuditHandlers();
    }
  } catch {}

  // Credits handlers
  try {
    const { registerCreditsHandlers } = await import('@unisane/credits');
    if (typeof registerCreditsHandlers === 'function') {
      registerCreditsHandlers();
    }
  } catch {}

  // Usage handlers
  try {
    const { registerUsageHandlers } = await import('@unisane/usage');
    if (typeof registerUsageHandlers === 'function') {
      registerUsageHandlers();
    }
  } catch {}

  // Webhook handlers
  try {
    const { registerWebhookHandlers } = await import('@unisane/webhooks');
    if (typeof registerWebhookHandlers === 'function') {
      registerWebhookHandlers();
    }
  } catch {}

  // Notify handlers
  try {
    const { registerNotifyHandlers } = await import('@unisane/notify');
    if (typeof registerNotifyHandlers === 'function') {
      registerNotifyHandlers();
    }
  } catch {}
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
  const { getClient } = await import('@unisane/kernel');
  const client = getClient();
  if (client) {
    await client.close();
  }

  bootstrapped = false;
  console.log('[bootstrap] ✓ Shutdown complete');
}
