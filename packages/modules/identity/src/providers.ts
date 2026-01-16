/**
 * Identity Package Providers
 *
 * Dependency injection configuration to break circular dependencies.
 * The TenantsRepo is injected at application bootstrap time.
 */

import { InternalError } from '@unisane/kernel';

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
 *
 * IDEN-003 FIX: Now validates providers at configuration time rather than
 * waiting for runtime errors.
 *
 * @throws Error if required providers are missing
 */
export function configureIdentityProviders(p: IdentityProviders): void {
  // IDEN-003 FIX: Validate required providers upfront
  if (!p.tenantsRepo) {
    throw new Error(
      'configureIdentityProviders: tenantsRepo is required. ' +
      'Pass the tenantsRepository from @unisane/tenants.'
    );
  }

  // Validate that tenantsRepo has required methods
  const repo = p.tenantsRepo;
  const requiredMethods = ['findById', 'findBySlug', 'findMany', 'create'] as const;
  for (const method of requiredMethods) {
    if (typeof repo[method] !== 'function') {
      throw new Error(
        `configureIdentityProviders: tenantsRepo.${method} is not a function. ` +
        'Ensure you pass a valid TenantsRepoLike implementation.'
      );
    }
  }

  globalForIdentity.__identityProviders = p;
}

/**
 * IDEN-003 FIX: Check if identity providers are configured.
 * Use this in bootstrap validation to ensure proper setup.
 */
export function isIdentityConfigured(): boolean {
  return !!globalForIdentity.__identityProviders?.tenantsRepo;
}

/**
 * IDEN-003 FIX: Validate that all identity providers are configured.
 * Call this during application bootstrap to catch configuration errors early.
 *
 * @throws Error if providers are not configured
 */
export function validateIdentityConfiguration(): void {
  if (!isIdentityConfigured()) {
    throw new Error(
      'Identity providers not configured. ' +
      'Call configureIdentityProviders({ tenantsRepo }) at application bootstrap before using identity services.'
    );
  }
}

/**
 * Get the TenantsRepo implementation.
 * Throws if not configured.
 */
export function getTenantsRepo(): TenantsRepoLike {
  if (!globalForIdentity.__identityProviders?.tenantsRepo) {
    throw new InternalError('TenantsRepo not configured. Call configureIdentityProviders() at bootstrap.');
  }
  return globalForIdentity.__identityProviders.tenantsRepo;
}
