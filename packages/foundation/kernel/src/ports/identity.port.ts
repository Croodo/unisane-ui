/**
 * Identity Port
 *
 * This port defines the contract for modules that need user information
 * (e.g., audit module enriching logs with actor names/emails).
 * Identity module implements this port, consumers depend on the interface.
 */

/**
 * Minimal user view for enrichment (audit logs, etc.)
 */
export interface UserView {
  id: string;
  email?: string;
  displayName?: string | null;
}

/**
 * Port interface for identity operations.
 * Used by audit module to enrich logs with user info.
 */
export interface IdentityPort {
  /**
   * Batch fetch users by IDs for enrichment.
   * Returns a Map of userId -> UserView
   */
  findUsersByIds(ids: string[]): Promise<Map<string, UserView>>;
}

// Provider storage
let _provider: IdentityPort | null = null;

/**
 * Set the identity provider implementation.
 * Call this at app bootstrap.
 */
export function setIdentityProvider(provider: IdentityPort): void {
  _provider = provider;
}

/**
 * Get the identity provider.
 * Throws if not configured.
 */
export function getIdentityProvider(): IdentityPort {
  if (!_provider) {
    throw new Error(
      "IdentityPort not configured. Call setIdentityProvider() at bootstrap."
    );
  }
  return _provider;
}

/**
 * Check if provider is configured.
 */
export function hasIdentityProvider(): boolean {
  return _provider !== null;
}
