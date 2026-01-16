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
 * TENT-002 FIX: Maximum retry attempts for slug collision handling.
 */
const MAX_BOOTSTRAP_SLUG_RETRIES = 10;

/**
 * Bootstrap the first tenant for a new user.
 * Only runs on an empty database.
 *
 * Note: This is a bootstrap operation without tenant context.
 *
 * TENT-002 FIX: Uses atomic create with retry-on-duplicate pattern.
 * No longer uses check-then-act which can race.
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
  const name = base.charAt(0).toUpperCase() + base.slice(1);

  // TENT-002 FIX: Use retry loop that relies on unique index for correctness
  let slug = base;
  let suffix = 0;

  const run = async () => {
    let t = null;

    // TENT-002 FIX: Retry loop that catches duplicate key errors
    for (let attempt = 0; attempt < MAX_BOOTSTRAP_SLUG_RETRIES; attempt++) {
      try {
        t = await TenantsRepo.create({ slug, name });
        break; // Success
      } catch (e) {
        if (isDuplicateKeyError(e)) {
          // Collision, try next suffix
          suffix += 1;
          slug = Slug.fromName(`${base}-${suffix}`).toString();
          continue;
        }
        // Non-duplicate error, rethrow
        throw e;
      }
    }

    if (!t) {
      throw new Error(`Failed to bootstrap tenant: could not find unique slug after ${MAX_BOOTSTRAP_SLUG_RETRIES} attempts`);
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
