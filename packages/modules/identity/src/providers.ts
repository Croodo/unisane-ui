/**
 * Identity Package Providers
 *
 * Dependency injection configuration to break circular dependencies.
 * The TenantsRepo is injected at application bootstrap time.
 */

/**
 * Minimal interface for tenant repository operations needed by identity.
 * This avoids importing the full @unisane/tenants package.
 */
export interface TenantsRepoLike {
  findById(id: string): Promise<{ id: string; slug?: string; name?: string; planId?: string | null } | null>;
  findBySlug(slug: string): Promise<{ id: string; slug: string; name?: string; planId?: string | null } | null>;
  findMany(ids: string[]): Promise<Array<{ id: string; slug?: string; name?: string; planId?: string | null }>>;
  create(data: { slug: string; name: string }): Promise<{ id: string; slug: string; name: string; planId?: string | null }>;
}

/**
 * Providers that can be injected into identity package.
 */
export interface IdentityProviders {
  tenantsRepo?: TenantsRepoLike;
}

// Use global object to share provider state across module instances in Next.js
const globalForIdentity = global as unknown as {
  __identityProviders?: IdentityProviders;
};

/**
 * Configure identity providers.
 * Called once at application bootstrap to inject dependencies.
 */
export function configureIdentityProviders(p: IdentityProviders): void {
  globalForIdentity.__identityProviders = p;
}

/**
 * Get the TenantsRepo implementation.
 * Throws if not configured.
 */
export function getTenantsRepo(): TenantsRepoLike {
  if (!globalForIdentity.__identityProviders?.tenantsRepo) {
    throw new Error('TenantsRepo not configured. Call configureIdentityProviders() at bootstrap.');
  }
  return globalForIdentity.__identityProviders.tenantsRepo;
}
