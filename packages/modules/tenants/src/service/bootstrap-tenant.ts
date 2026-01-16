/**
 * Bootstrap Tenant
 *
 * Bootstrap the first tenant for a new user.
 * Only runs on an empty database.
 *
 * Note: This is a bootstrap operation without tenant context.
 *
 * ## Event-Driven Architecture
 *
 * Owner membership creation is handled via events:
 * 1. This service emits `tenant.created` with ownerId
 * 2. Identity module's event handler creates the owner membership
 * 3. The handler has idempotency - safe if called multiple times
 *
 * This decouples tenants from identity module (no direct calls).
 */

import {
  logger,
  connectDb,
  withTransaction,
  Slug,
  emitTypedReliable,
  isDuplicateKeyError,
} from "@unisane/kernel";
import { TenantsRepo } from "../data/tenants.repository";

/**
 * @deprecated No longer needed - owner role is now created via events.
 * Kept for backwards compatibility. Will be removed in a future version.
 */
export interface TenantBootstrapProviders {
  addOwnerRole?: (scopeId: string, userId: string) => Promise<void>;
}

/**
 * @deprecated No longer needed - owner role is now created via events.
 * The identity module listens for `tenant.created` and creates the owner membership.
 * This function is a no-op kept for backwards compatibility.
 */
export function configureTenantBootstrap(_providers: TenantBootstrapProviders): void {
  logger.debug('configureTenantBootstrap is deprecated - owner role is created via tenant.created event');
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

    // Emit tenant.created event - identity module will create owner membership
    // The event handler has idempotency built-in (checks if membership exists)
    await emitTypedReliable('tenant.created', {
      scopeId,
      slug,
      name,
      ownerId: userId,
    });

    logger.info("tenant.created", { scopeId, slug, name, ownerId: userId });
  };

  await withTransaction(run);
}
