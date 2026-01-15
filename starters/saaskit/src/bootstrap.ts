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

  // 6. Register event schemas (must be done before handlers)
  const { registerEventSchemas } = await import('./platform/events');
  await registerEventSchemas();
  console.log('[bootstrap] ✓ Event schemas registered');

  // 7. Register event handlers
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
  const { configureIdentityProviders, authIdentityAdapter } = await import('@unisane/identity');
  const { TenantsRepo } = await import('@unisane/tenants');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configureIdentityProviders({ tenantsRepo: TenantsRepo as any });
  console.log('[bootstrap]   - Identity providers configured');

  // Configure auth-identity port (breaks auth -> identity cycle)
  const { setAuthIdentityProvider, setSettingsProvider } = await import('@unisane/kernel');
  setAuthIdentityProvider(authIdentityAdapter);
  console.log('[bootstrap]   - Auth-identity port configured');

  // Configure settings port (breaks module -> settings cycle)
  const { settingsAdapter } = await import('@unisane/settings');
  setSettingsProvider(settingsAdapter);
  console.log('[bootstrap]   - Settings port configured');

  // Configure flags port (breaks module -> flags cycle)
  const { setFlagsProvider } = await import('@unisane/kernel');
  const { flagsAdapter } = await import('@unisane/flags');
  setFlagsProvider(flagsAdapter);
  console.log('[bootstrap]   - Flags port configured');

  // Configure billing service port (breaks module -> billing cycle)
  const { setBillingServiceProvider, setIdentityProvider, setTenantsProvider } = await import('@unisane/kernel');
  const { billingServiceAdapter, setUsageWindowProvider } = await import('@unisane/billing');
  setBillingServiceProvider(billingServiceAdapter);
  console.log('[bootstrap]   - Billing service port configured');

  // Configure usage window provider for entitlements (breaks billing -> usage cycle)
  const { getWindow } = await import('@unisane/usage');
  setUsageWindowProvider(getWindow);
  console.log('[bootstrap]   - Usage window provider configured');

  // Configure identity port using adapter (breaks audit -> identity cycle)
  const { createIdentityAdapter } = await import('@unisane/identity-mongodb');
  const { usersRepository } = await import('@unisane/identity');
  const identityAdapter = createIdentityAdapter({ usersRepository });
  setIdentityProvider(identityAdapter);
  console.log('[bootstrap]   - Identity port configured (via @unisane/identity-mongodb)');

  // Configure tenants port using module adapter (breaks billing -> tenants cycle)
  const { tenantsAdapter } = await import('@unisane/tenants');
  setTenantsProvider(tenantsAdapter);
  console.log('[bootstrap]   - Tenants port configured');

  // Configure credits port (breaks ai -> credits cycle)
  const { setCreditsProvider } = await import('@unisane/kernel');
  const { creditsAdapter } = await import('@unisane/credits');
  setCreditsProvider(creditsAdapter);
  console.log('[bootstrap]   - Credits port configured');

  // Configure audit port (breaks module -> audit cycle)
  const { setAuditProvider } = await import('@unisane/kernel');
  const { auditAdapter } = await import('@unisane/audit');
  setAuditProvider(auditAdapter);
  console.log('[bootstrap]   - Audit port configured');

  // Configure usage port (breaks billing -> usage cycle)
  const { setUsageProvider } = await import('@unisane/kernel');
  const { usageAdapter } = await import('@unisane/usage');
  setUsageProvider(usageAdapter);
  console.log('[bootstrap]   - Usage port configured');

  // Configure notify port (breaks auth/billing -> notify cycle)
  const { setNotifyProvider } = await import('@unisane/kernel');
  const { notifyAdapter } = await import('@unisane/notify');
  setNotifyProvider(notifyAdapter);
  console.log('[bootstrap]   - Notify port configured');

  // Configure tenant bootstrap providers (breaks tenants -> identity cycle)
  const { membershipsRepository } = await import('@unisane/identity');
  const { configureTenantBootstrap } = await import('@unisane/tenants');
  configureTenantBootstrap({
    addOwnerRole: async (tenantId: string, userId: string) => {
      await membershipsRepository.addRole(tenantId, userId, 'owner');
    },
  });
  console.log('[bootstrap]   - Tenant bootstrap providers configured');

  // Configure scope enrichment providers (admin dashboard data)
  const { configureScopeEnrichment } = await import('@unisane/tenants');
  const { getScopeMembershipCounts, getScopeApiKeyCounts } = await import('@unisane/identity');
  const { getScopeOverrideCounts } = await import('@unisane/flags');
  const { getScopeOpenInvoiceCounts, getScopeLatestSubscriptions } = await import('@unisane/billing');
  const { getScopeLastActivity } = await import('@unisane/audit');
  const { getScopeFailureCounts } = await import('@unisane/webhooks');
  const { getScopeCreditBalances } = await import('@unisane/credits');

  configureScopeEnrichment({
    getScopeMembershipCounts,
    getScopeApiKeyCounts,
    getScopeOverrideCounts,
    getScopeOpenInvoiceCounts,
    getScopeLatestSubscriptions,
    getScopeLastActivity,
    getScopeFailureCounts,
    getScopeCreditBalances,
  });
  console.log('[bootstrap]   - Scope enrichment providers configured');

  // Configure gateway auth (for JWT/API key authentication)
  const { configureAuth } = await import('@unisane/gateway');
  const { usersRepository: usersRepo, apiKeysRepository, getEffectivePerms, applyGlobalOverlays } = await import('@unisane/identity');

  configureAuth({
    findApiKeyByHash: async (hash: string) => {
      const key = await apiKeysRepository.findActiveByHash(hash);
      if (!key) return null;
      return { id: key.id, scopeId: key.scopeId, scopes: key.scopes };
    },
    findUserById: async (userId: string) => {
      const user = await usersRepo.findById(userId);
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

  // Wire outbox services
  await setupOutbox();
  console.log('[bootstrap]   - Outbox services wired');

  // Wire jobs provider (Inngest)
  await setupJobsProvider();
  console.log('[bootstrap]   - Jobs provider wired');

  // Register email providers using adapter packages
  await setupEmailProviders();
  console.log('[bootstrap]   - Email providers registered');

  // Register billing providers using adapter packages
  await setupBillingProviders();
  console.log('[bootstrap]   - Billing providers registered');
}

/**
 * Set up the jobs provider for background job scheduling.
 * Uses Inngest via the @unisane/jobs-inngest adapter.
 */
async function setupJobsProvider() {
  const { setJobsProvider } = await import('@unisane/kernel');
  const { createInngestJobsAdapter } = await import('@unisane/jobs-inngest');
  const { inngest } = await import('./platform/inngest/client');

  setJobsProvider(createInngestJobsAdapter(inngest));
  console.log('[bootstrap]   - Inngest jobs adapter wired');
}

/**
 * Set up outbox services for reliable message delivery
 *
 * There are three outbox systems:
 * 1. OutboxPort (setOutboxProvider): Main outbox adapter using @unisane/outbox-mongodb
 * 2. Platform Outbox (setOutboxService): Legacy interface for external delivery
 * 3. Domain Events Outbox (setOutboxAccessor): For reliable domain event emission
 */
async function setupOutbox() {
  const { setOutboxService, setOutboxAccessor, setOutboxProvider, col, db } = await import('@unisane/kernel');
  const { createMongoOutboxAdapter } = await import('@unisane/outbox-mongodb');

  // 1. Wire OutboxPort using the MongoDB adapter
  const outboxAdapter = createMongoOutboxAdapter({
    collection: () => db().collection('outbox'),
  });
  setOutboxProvider(outboxAdapter);
  console.log('[bootstrap]   - Outbox MongoDB adapter wired');

  // 2. Wire Platform Outbox (emails, webhooks) - uses the same adapter
  // This provides backward compatibility with existing code using OutboxService
  setOutboxService({
    enqueue: async (message) => {
      const result = await outboxAdapter.enqueue({
        tenantId: message.scopeId,
        kind: message.kind as 'email' | 'webhook',
        payload: message.payload,
      });
      return { id: result.id };
    },
    process: async (batchSize = 50) => {
      const items = await outboxAdapter.claimBatch(new Date(), batchSize);
      // Note: actual delivery is handled by jobs, this just returns claimed count
      return items.length;
    },
  });
  console.log('[bootstrap]   - Platform outbox service wired');

  // 3. Wire Domain Events Outbox (for events.emitReliable())
  // This provides at-least-once delivery for domain events
  // Wrap the MongoDB collection to match the expected interface
  setOutboxAccessor(() => ({
    insertOne: async (entry) => {
      await col('events_outbox').insertOne(entry as never);
    },
  }));
  console.log('[bootstrap]   - Domain events outbox accessor wired');
}

/**
 * Set up email providers using adapter packages
 */
/**
 * Set up email providers using adapter packages
 */
/**
 * Set up email providers using adapter packages
 */
async function setupEmailProviders() {
  const { getEnv, setEmailProvider, setTemplateRenderer } = await import('@unisane/kernel');
  const env = getEnv();
  const { MAIL_PROVIDER, RESEND_API_KEY, MAIL_FROM, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SES_CONFIG_SET } = env;

  // Wire the template renderer (app-specific templates)
  const { renderEmail: renderTemplate } = await import('./platform/email/templates');
  setTemplateRenderer(async (templateName, data) => {
    const result = await renderTemplate({
      template: templateName,
      props: data as Record<string, unknown>,
      tenantId: (data as Record<string, unknown>).tenantId as string | null ?? null,
    });
    return result;
  });
  console.log('[bootstrap]   - Email template renderer registered');

  // Register configured provider
  // Priority: Explicit MAIL_PROVIDER -> Resend -> SES
  
  if (MAIL_PROVIDER === 'resend' || (!MAIL_PROVIDER && RESEND_API_KEY)) {
    if (RESEND_API_KEY) {
      const { createResendEmailAdapter } = await import('@unisane/email-resend');
      const resendAdapter = createResendEmailAdapter({
        apiKey: RESEND_API_KEY,
        defaultFrom: MAIL_FROM ?? 'noreply@example.com',
      });
      setEmailProvider(resendAdapter);
      console.log('[bootstrap]   - Resend email adapter registered (active)');
    }
  } else if (MAIL_PROVIDER === 'ses' || (!MAIL_PROVIDER && AWS_REGION)) {
    if (AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
      const { createSESEmailAdapter } = await import('@unisane/email-ses');
      const sesAdapter = createSESEmailAdapter({
        region: AWS_REGION,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        defaultFrom: MAIL_FROM ?? 'noreply@example.com',
        ...(SES_CONFIG_SET ? { configurationSetName: SES_CONFIG_SET } : {}),
      });
      setEmailProvider(sesAdapter);
      console.log('[bootstrap]   - SES email adapter registered (active)');
    }
  }
}

/**
 * Set up billing providers using adapter packages
 */
/**
 * Set up billing providers using adapter packages
 */
async function setupBillingProviders() {
  const { getEnv, registerBillingProvider, mapPlanIdForProvider } = await import('@unisane/kernel');
  const { ScopeIntegrationsService } = await import('@unisane/billing');
  const { readTenant } = await import('@unisane/tenants');
  const { mapTopupPriceIdForProvider } = await import('./platform/billing/topupMap');

  const env = getEnv();
  const { BILLING_PROVIDER, STRIPE_SECRET_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, BILLING_PORTAL_RETURN_URL } = env;

  // Register Stripe adapter if configured
  if (STRIPE_SECRET_KEY && BILLING_PORTAL_RETURN_URL) {
    const { createStripeBillingAdapter } = await import('@unisane/billing-stripe');
    const stripeAdapter = createStripeBillingAdapter({
      secretKey: STRIPE_SECRET_KEY,
      portalReturnUrl: BILLING_PORTAL_RETURN_URL,
      findCustomerId: (scopeId: string) => ScopeIntegrationsService.findCustomerId(scopeId, 'stripe'),
      saveCustomerId: (scopeId: string, customerId: string) => ScopeIntegrationsService.upsertCustomerMapping(scopeId, 'stripe', customerId),
      getScopeName: async (scopeId: string) => {
        const tenant = await readTenant(scopeId);
        return tenant?.name ?? null;
      },
      mapPlanId: (planId: string) => mapPlanIdForProvider(planId, 'stripe'),
      mapTopupPriceId: (amount: number, currency: string) => mapTopupPriceIdForProvider('stripe', amount, currency) ?? undefined,
    });
    registerBillingProvider('stripe', stripeAdapter);
    console.log('[bootstrap]   - Stripe billing adapter registered');
  }

  // Register Razorpay adapter if configured
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    const { createRazorpayBillingAdapter } = await import('@unisane/billing-razorpay');
    const razorpayAdapter = createRazorpayBillingAdapter({
      keyId: RAZORPAY_KEY_ID,
      keySecret: RAZORPAY_KEY_SECRET,
      mapPlanId: (planId: string) => mapPlanIdForProvider(planId, 'razorpay'),
    });
    registerBillingProvider('razorpay', razorpayAdapter);
    console.log('[bootstrap]   - Razorpay billing adapter registered');
  }

  // Log which provider is active
  const activeProvider = BILLING_PROVIDER ?? 'none';
  console.log(`[bootstrap]   - Active billing provider: ${activeProvider}`);
}

/**
 * Register event handlers for all modules
 * This wires up the event-driven architecture so modules respond to events
 * from other modules without direct imports.
 */
async function registerEventHandlers() {
  const cleanupFns: Array<() => void> = [];

  // Register billing event handlers (records payments, invoices, subscriptions)
  const { registerBillingEventHandlers } = await import('@unisane/billing');
  cleanupFns.push(registerBillingEventHandlers());
  console.log('[bootstrap]   - Billing event handlers registered');

  // Register credit event handlers (grants credits from webhooks)
  const { registerCreditEventHandlers } = await import('@unisane/credits');
  cleanupFns.push(registerCreditEventHandlers());
  console.log('[bootstrap]   - Credit event handlers registered');

  // Register settings event handlers (updates seat capacity)
  const { registerSettingsEventHandlers } = await import('@unisane/settings');
  cleanupFns.push(registerSettingsEventHandlers());
  console.log('[bootstrap]   - Settings event handlers registered');

  // Register tenant event handlers (updates plan from subscription changes)
  const { registerTenantEventHandlers } = await import('@unisane/tenants');
  cleanupFns.push(registerTenantEventHandlers());
  console.log('[bootstrap]   - Tenant event handlers registered');

  // Register notify event handlers (handles email suppressions)
  const { registerNotifyEventHandlers } = await import('@unisane/notify');
  cleanupFns.push(registerNotifyEventHandlers());
  console.log('[bootstrap]   - Notify event handlers registered');

  console.log(`[bootstrap]   - All event handlers registered (${cleanupFns.length} modules)`);

  // Store cleanup functions for graceful shutdown
  (globalThis as { __eventHandlerCleanup?: Array<() => void> }).__eventHandlerCleanup = cleanupFns;
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

  // Unregister event handlers
  const cleanupFns = (globalThis as { __eventHandlerCleanup?: Array<() => void> }).__eventHandlerCleanup;
  if (cleanupFns) {
    for (const cleanup of cleanupFns) {
      cleanup();
    }
    console.log('[bootstrap]   - Event handlers unregistered');
  }

  // Close database connections, flush caches, etc.
  await closeDb();

  bootstrapped = false;
  console.log('[bootstrap] ✓ Shutdown complete');
}
