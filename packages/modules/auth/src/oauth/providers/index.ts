/**
 * OAuth provider adapters for token verification.
 *
 * Exports types, adapters, and helper functions for OAuth providers.
 */

export type {
  OAuthProviderName,
  ProviderProfile,
  ProviderAdapter,
} from './types';
export { isProviderEnabled } from './types';

export { googleAdapter } from './google';
export { githubAdapter } from './github';

/**
 * Get a provider adapter by name.
 * Uses dynamic imports for code splitting.
 *
 * @param name - Provider name (google, github, etc.)
 * @returns Provider adapter or null if not found
 */
export async function getProviderAdapter(
  name: string
): Promise<import('./types').ProviderAdapter | null> {
  switch (name) {
    case 'google':
      return (await import('./google')).googleAdapter;
    case 'github':
      return (await import('./github')).githubAdapter;
    default:
      return null;
  }
}
