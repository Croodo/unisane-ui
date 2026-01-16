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
// ID-001 FIX: Import types from @unisane/identity instead of defining locally
import type { MinimalUserRow } from '@unisane/identity';

/**
 * ID-001 FIX: Use a minimal interface that matches what findByIds returns.
 * This allows flexibility while ensuring type safety.
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
/**
 * ID-002 FIX: Maximum number of IDs allowed per batch lookup.
 */
const MAX_IDS_PER_BATCH = 1000;

/**
 * ID-002 FIX: Maximum allowed ID length.
 */
const MAX_ID_LENGTH = 128;

export function createIdentityAdapter(config: IdentityAdapterConfig): IdentityPort {
  const { usersRepository } = config;

  return {
    async findUsersByIds(ids: string[]): Promise<Map<string, UserView>> {
      // ID-002 FIX: Validate input array
      if (!Array.isArray(ids)) {
        throw new Error('findUsersByIds: ids must be an array');
      }

      if (ids.length === 0) {
        return new Map();
      }

      // ID-002 FIX: Limit batch size to prevent DoS
      if (ids.length > MAX_IDS_PER_BATCH) {
        throw new Error(`findUsersByIds: too many IDs (${ids.length}), max is ${MAX_IDS_PER_BATCH}`);
      }

      // ID-002 FIX: Validate each ID is a string with reasonable length
      for (const id of ids) {
        if (typeof id !== 'string') {
          throw new Error('findUsersByIds: all IDs must be strings');
        }
        if (id.length === 0 || id.length > MAX_ID_LENGTH) {
          throw new Error(`findUsersByIds: invalid ID length (must be 1-${MAX_ID_LENGTH} chars)`);
        }
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
// ID-001 FIX: Re-export MinimalUserRow from identity module
export type { MinimalUserRow } from '@unisane/identity';
