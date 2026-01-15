/**
 * Identity MongoDB Adapter
 *
 * Implements the IdentityPort interface using the @unisane/identity MongoDB repository.
 * This adapter bridges the kernel's port interface with the identity module's implementation.
 *
 * @example
 * ```typescript
 * import { createIdentityAdapter } from '@unisane/identity-mongodb';
 * import { setIdentityProvider } from '@unisane/kernel';
 * import { usersRepository } from '@unisane/identity';
 *
 * const adapter = createIdentityAdapter({ usersRepository });
 * setIdentityProvider(adapter);
 * ```
 */

import type { IdentityPort, UserView } from '@unisane/kernel';

/**
 * Minimal user row interface expected from the users repository.
 * This matches the MinimalUserRow type from @unisane/identity.
 */
export interface MinimalUserRow {
  id: string;
  email?: string;
  displayName?: string | null;
}

/**
 * Users repository interface expected by this adapter.
 */
export interface UsersRepositoryLike {
  findByIds(ids: string[]): Promise<Map<string, MinimalUserRow>>;
}

/**
 * Configuration for creating the identity adapter.
 */
export interface IdentityAdapterConfig {
  /** The users repository instance from @unisane/identity */
  usersRepository: UsersRepositoryLike;
}

/**
 * Creates an IdentityPort adapter using the provided users repository.
 *
 * @param config - Configuration containing the users repository
 * @returns An IdentityPort implementation
 */
export function createIdentityAdapter(config: IdentityAdapterConfig): IdentityPort {
  const { usersRepository } = config;

  return {
    async findUsersByIds(ids: string[]): Promise<Map<string, UserView>> {
      if (ids.length === 0) {
        return new Map();
      }

      const usersMap = await usersRepository.findByIds(ids);

      // Transform MinimalUserRow to UserView
      const result = new Map<string, UserView>();
      for (const [id, user] of usersMap) {
        result.set(id, {
          id: user.id,
          email: user.email,
          displayName: user.displayName ?? null,
        });
      }

      return result;
    },
  };
}

// Re-export types for convenience
export type { IdentityPort, UserView } from '@unisane/kernel';
