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
  Slug,
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
  addOwnerRole?: (scopeId: string, userId: string) => Promise<void>;
}

// Use global object to share provider state across module instances in Next.js
const globalForTenantBootstrap = global as unknown as {
  __tenantBootstrapProviders?: TenantBootstrapProviders;
};

/**
 * Configure bootstrap providers for tenant functions.
 * Called once at application bootstrap to inject dependencies.
 */
export function configureTenantBootstrap(providers: TenantBootstrapProviders): void {
  globalForTenantBootstrap.__tenantBootstrapProviders = providers;
}

function getBootstrapProviders(): TenantBootstrapProviders {
  return globalForTenantBootstrap.__tenantBootstrapProviders ?? {};
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
  const base = Slug.fromName(domainPart).toString();
  let slug = base;
  let n = 0;

  // Ensure unique slug in case of concurrent bootstrap attempts
  while (true) {
    const exists = await TenantsRepo.findBySlug(slug);
    if (!exists) break;
    n += 1;
    slug = Slug.fromName(`${base}-${n}`).toString();
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
          retrySlug = Slug.fromName(`${base}-${i}`).toString();
          const exists = await TenantsRepo.findBySlug(retrySlug);
          if (!exists) break;
        }
        t = await TenantsRepo.create({ slug: retrySlug, name });
        slug = retrySlug;
      } else {
        throw e;
      }
    }

    const scopeId = t.id;

    // Add owner role via injected provider
    const providers = getBootstrapProviders();
    if (providers.addOwnerRole) {
      await providers.addOwnerRole(scopeId, userId);
    } else {
      logger.warn("tenant.bootstrap.no_owner_provider", { scopeId, userId });
    }

    // Emit event for side effects
    await events.emit(TENANT_EVENTS.CREATED, {
      scopeId,
      slug,
      name,
      ownerId: userId,
    });

    logger.info("tenant.created", { scopeId, slug, name, ownerId: userId });
  };

  await withTransaction(run);
}
