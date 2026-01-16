/** Bootstrap - Wire all modules together at app startup */

import {
  connectDb,
  closeDb,
  ensureIndexes,
  db,
  redis,
  registerHealthCheck,
  createMongoHealthCheck,
  createRedisHealthCheck,
  signalBootstrapReady,
  logger,
  getEnv,
} from '@unisane/kernel';
import { configureRequestLogging } from '@unisane/gateway';
import { validateEnvOrThrow } from './platform/env';

let bootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

export async function bootstrap() {
  if (bootstrapped) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = doBootstrap();
  try {
    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

async function doBootstrap() {
  if (bootstrapped) return;
  let dbConnected = false;

  try {
    validateEnvOrThrow();
    logger.info('[bootstrap] Starting platform initialization');

    await connectDb();
    dbConnected = true;

    await ensureIndexes();
    registerHealthCheck('mongodb', createMongoHealthCheck(() => db()));
    registerHealthCheck('redis', createRedisHealthCheck(() => redis));

    await setupRepositories();
    await setupProviders();

    const { registerEventSchemas } = await import('./platform/events');
    await registerEventSchemas();

    await registerEventHandlers();

    const appEnv = getEnv().APP_ENV;
    const isDev = appEnv !== 'prod';
    configureRequestLogging({
      logBodies: isDev,
      logRequestStart: isDev,
      sampleRate: 1.0,
      alwaysLog: ['/api/rest/v1/auth/', '/api/rest/v1/billing/'],
      neverLogBodies: ['/api/rest/v1/auth/', '/api/webhooks/'],
      redactFields: ['password', 'token', 'secret', 'apiKey', 'api_key', 'creditCard', 'credit_card', 'ssn', 'cvv', 'otp'],
    });

    bootstrapped = true;
    signalBootstrapReady();
    logger.info('[bootstrap] Platform initialization complete');
  } catch (err) {
    logger.error('[bootstrap] Platform initialization failed', { err, dbConnected });

    try {
      const cleanupFns = (globalThis as { __eventHandlerCleanup?: Array<() => void> }).__eventHandlerCleanup;
      if (cleanupFns) {
        for (const cleanup of cleanupFns) {
          try { cleanup(); } catch { /* ignore */ }
        }
      }
      if (dbConnected) await closeDb();
    } catch { /* ignore cleanup errors */ }

    throw err;
  }
}

async function setupRepositories() {
  const { configureIdentityProviders, authIdentityAdapter } = await import('@unisane/identity');
  const { TenantsRepo } = await import('@unisane/tenants');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configureIdentityProviders({ tenantsRepo: TenantsRepo as any });

  const { setAuthIdentityProvider, setSettingsProvider } = await import('@unisane/kernel');
  setAuthIdentityProvider(authIdentityAdapter);

  const { settingsAdapter } = await import('@unisane/settings');
  setSettingsProvider(settingsAdapter);

  const { setFlagsProvider } = await import('@unisane/kernel');
  const { flagsAdapter } = await import('@unisane/flags');
  setFlagsProvider(flagsAdapter);

  const { setBillingServiceProvider, setIdentityProvider, setTenantsProvider } = await import('@unisane/kernel');
  const { billingServiceAdapter, setUsageWindowProvider } = await import('@unisane/billing');
  setBillingServiceProvider(billingServiceAdapter);

  const { getWindow } = await import('@unisane/usage');
  setUsageWindowProvider(getWindow);

  const { createIdentityAdapter } = await import('@unisane/identity-mongodb');
  const { usersRepository } = await import('@unisane/identity');
  const identityAdapter = createIdentityAdapter({ usersRepository });
  setIdentityProvider(identityAdapter);

  const { tenantsAdapter } = await import('@unisane/tenants');
  setTenantsProvider(tenantsAdapter);

  const { setCreditsProvider } = await import('@unisane/kernel');
  const { creditsAdapter } = await import('@unisane/credits');
  setCreditsProvider(creditsAdapter);

  const { setAuditProvider } = await import('@unisane/kernel');
  const { auditAdapter } = await import('@unisane/audit');
  setAuditProvider(auditAdapter);

  const { setUsageProvider } = await import('@unisane/kernel');
  const { usageAdapter } = await import('@unisane/usage');
  setUsageProvider(usageAdapter);

  const { setNotifyProvider } = await import('@unisane/kernel');
  const { notifyAdapter } = await import('@unisane/notify');
  setNotifyProvider(notifyAdapter);

  const { membershipsRepository } = await import('@unisane/identity');
  const { configureTenantBootstrap } = await import('@unisane/tenants');
  configureTenantBootstrap({
    addOwnerRole: async (tenantId: string, userId: string) => {
      await membershipsRepository.addRole(tenantId, userId, 'owner');
    },
  });

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
}

async function setupProviders() {
  const { initModules } = await import('./platform/init');
  initModules();

  await setupOutbox();
  await setupJobsProvider();
  await setupEmailProviders();
  await setupBillingProviders();
}

async function setupJobsProvider() {
  const { setJobsProvider } = await import('@unisane/kernel');
  const { createInngestJobsAdapter } = await import('@unisane/jobs-inngest');
  const { inngest } = await import('./platform/inngest/client');
  setJobsProvider(createInngestJobsAdapter(inngest));
}

async function setupOutbox() {
  const { setOutboxService, setOutboxAccessor, setOutboxProvider, col, db, COLLECTIONS } = await import('@unisane/kernel');
  const { createMongoOutboxAdapter } = await import('@unisane/outbox-mongodb');

  const outboxAdapter = createMongoOutboxAdapter({
    collection: () => db().collection(COLLECTIONS.OUTBOX),
  });
  setOutboxProvider(outboxAdapter);

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
      return items.length;
    },
  });

  setOutboxAccessor(() => ({
    insertOne: async (entry) => {
      await col(COLLECTIONS.EVENTS_OUTBOX).insertOne(entry as never);
    },
  }));
}

async function setupEmailProviders() {
  const { getEnv, setEmailProvider, setTemplateRenderer } = await import('@unisane/kernel');
  const env = getEnv();
  const { MAIL_PROVIDER, RESEND_API_KEY, MAIL_FROM, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SES_CONFIG_SET } = env;

  const { renderEmail: renderTemplate, TEMPLATE_NAMES } = await import('./platform/email/templates');

  setTemplateRenderer(async (templateName, data) => {
    const validTemplates = Object.values(TEMPLATE_NAMES);
    if (!validTemplates.includes(templateName as typeof validTemplates[number])) {
      logger.warn('[email] Unknown template', { templateName });
    }
    if (data !== null && typeof data !== 'object') {
      throw new Error(`Invalid email template data: expected object, got ${typeof data}`);
    }
    return renderTemplate({
      template: templateName,
      props: data as Record<string, unknown>,
      tenantId: (data as Record<string, unknown>)?.tenantId as string | null ?? null,
    });
  });

  // Only set up email provider if explicitly configured
  if (MAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
    const { createResendEmailAdapter } = await import('@unisane/email-resend');
    setEmailProvider(createResendEmailAdapter({
      apiKey: RESEND_API_KEY,
      defaultFrom: MAIL_FROM ?? 'noreply@example.com',
    }));
  } else if (MAIL_PROVIDER === 'ses' && MAIL_FROM && AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    const { createSESEmailAdapter } = await import('@unisane/email-ses');
    setEmailProvider(createSESEmailAdapter({
      region: AWS_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      defaultFrom: MAIL_FROM,
      ...(SES_CONFIG_SET ? { configurationSetName: SES_CONFIG_SET } : {}),
    }));
  }
  // No email provider configured - emails will fail at runtime if attempted
}

async function setupBillingProviders() {
  const { getEnv, registerBillingProvider, mapPlanIdForProvider } = await import('@unisane/kernel');
  const { ScopeIntegrationsService } = await import('@unisane/billing');
  const { readTenant } = await import('@unisane/tenants');
  const { mapTopupPriceIdForProvider } = await import('./config/billing');

  const env = getEnv();
  const { STRIPE_SECRET_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, BILLING_PORTAL_RETURN_URL } = env;

  if (STRIPE_SECRET_KEY && BILLING_PORTAL_RETURN_URL) {
    const { createStripeBillingAdapter } = await import('@unisane/billing-stripe');
    registerBillingProvider('stripe', createStripeBillingAdapter({
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
    }));
  }

  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    const { createRazorpayBillingAdapter } = await import('@unisane/billing-razorpay');
    registerBillingProvider('razorpay', createRazorpayBillingAdapter({
      keyId: RAZORPAY_KEY_ID,
      keySecret: RAZORPAY_KEY_SECRET,
      mapPlanId: (planId: string) => mapPlanIdForProvider(planId, 'razorpay'),
    }));
  }
}

async function registerEventHandlers() {
  const cleanupFns: Array<() => void> = [];

  async function registerHandler(importer: () => Promise<Record<string, unknown>>, fnName: string) {
    const module = await importer();
    const registerFn = module[fnName];
    if (typeof registerFn !== 'function') {
      throw new Error(`Expected ${fnName} to be a function`);
    }
    const cleanup = (registerFn as () => () => void)();
    if (typeof cleanup === 'function') cleanupFns.push(cleanup);
  }

  await registerHandler(() => import('@unisane/billing'), 'registerBillingEventHandlers');
  await registerHandler(() => import('@unisane/credits'), 'registerCreditEventHandlers');
  await registerHandler(() => import('@unisane/settings'), 'registerSettingsEventHandlers');
  await registerHandler(() => import('@unisane/tenants'), 'registerTenantEventHandlers');
  await registerHandler(() => import('@unisane/notify'), 'registerNotifyEventHandlers');

  (globalThis as { __eventHandlerCleanup?: Array<() => void> }).__eventHandlerCleanup = cleanupFns;
}

export function isBootstrapped(): boolean {
  return bootstrapped;
}

export async function shutdown() {
  if (!bootstrapped) return;

  logger.info('[bootstrap] Shutting down...');

  const cleanupFns = (globalThis as { __eventHandlerCleanup?: Array<() => void> }).__eventHandlerCleanup;
  if (cleanupFns) {
    for (const cleanup of cleanupFns) cleanup();
  }

  await closeDb();
  bootstrapped = false;
  logger.info('[bootstrap] Shutdown complete');
}
