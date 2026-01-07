/**
 * Bootstrap Tenant
 *
 * Bootstrap the first tenant for a new user.
 * Only runs on an empty database.
 *
 * Note: This is a bootstrap operation without tenant context.
 */

import {
  logger,
  connectDb,
  withTransaction,
  toSlug,
  events,
  isDuplicateKeyError,
} from "@unisane/kernel";
import { TenantsRepo } from "../data/tenants.repository";
import { TENANT_EVENTS } from "../domain/constants";

/**
 * Bootstrap providers for tenant creation.
 * Injected at runtime to avoid circular dependencies with identity package.
 */
export interface TenantBootstrapProviders {
  addOwnerRole?: (tenantId: string, userId: string) => Promise<void>;
}

// Global bootstrap providers - set at bootstrap time
let bootstrapProviders: TenantBootstrapProviders = {};

/**
 * Configure bootstrap providers for tenant functions.
 * Called once at application bootstrap to inject dependencies.
 */
export function configureTenantBootstrap(providers: TenantBootstrapProviders): void {
  bootstrapProviders = providers;
}

/**
 * Bootstrap the first tenant for a new user.
 * Only runs on an empty database.
 *
 * Note: This is a bootstrap operation without tenant context.
 */
export async function bootstrapFirstTenantForUser(
  userId: string,
  userEmail: string
): Promise<void> {
  await connectDb();
  const count = await TenantsRepo.countAll();
  if (count > 0) return;

  const domainPart =
    userEmail.split("@")[1]?.split(".")[0] ||
    userEmail.split("@")[0] ||
    "workspace";
  const base = toSlug(domainPart);
  let slug = base;
  let n = 0;

  // Ensure unique slug in case of concurrent bootstrap attempts
  while (true) {
    const exists = await TenantsRepo.findBySlug(slug);
    if (!exists) break;
    n += 1;
    slug = toSlug(`${base}-${n}`);
  }
  const name = base.charAt(0).toUpperCase() + base.slice(1);

  const run = async () => {
    let t;
    try {
      t = await TenantsRepo.create({ slug, name });
    } catch (e) {
      // Handle race condition: another request created the same slug
      if (isDuplicateKeyError(e)) {
        let retrySlug = slug;
        let i = n;
        while (true) {
          i += 1;
          retrySlug = toSlug(`${base}-${i}`);
          const exists = await TenantsRepo.findBySlug(retrySlug);
          if (!exists) break;
        }
        t = await TenantsRepo.create({ slug: retrySlug, name });
        slug = retrySlug;
      } else {
        throw e;
      }
    }

    const tenantId = t.id;

    // Add owner role via injected provider
    if (bootstrapProviders.addOwnerRole) {
      await bootstrapProviders.addOwnerRole(tenantId, userId);
    } else {
      logger.warn("tenant.bootstrap.no_owner_provider", { tenantId, userId });
    }

    // Emit event for side effects
    await events.emit(TENANT_EVENTS.CREATED, {
      tenantId,
      slug,
      name,
      createdBy: userId,
    });

    logger.info("tenant.created", { tenantId, slug, name, createdBy: userId });
  };

  await withTransaction(run);
}
