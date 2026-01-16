/**
 * OAuth provider types and interfaces for token verification.
 *
 * These adapters verify OAuth tokens (ID tokens or access tokens)
 * and return normalized user profile data.
 */

/**
 * Supported OAuth provider names
 */
export type OAuthProviderName = 'google' | 'github' | 'microsoft' | 'apple';

/**
 * Normalized user profile returned by OAuth providers
 */
export type ProviderProfile = {
  /** Provider identifier */
  provider: OAuthProviderName;
  /** Stable unique user ID from the provider */
  subject: string;
  /** User's email address */
  email: string;
  /** Whether the email has been verified by the provider */
  emailVerified?: boolean;
  /** User's display name */
  displayName?: string | null;
  /** URL to user's profile image */
  imageUrl?: string | null;
};

/**
 * Interface for OAuth provider token verification adapters
 */
export interface ProviderAdapter {
  /**
   * Verify an OAuth token and return the user profile
   * @param token - The OAuth token (ID token or access token, provider-dependent)
   * @returns Normalized user profile
   * @throws If token is invalid or verification fails
   */
  verifyToken(token: string): Promise<ProviderProfile>;
}

/**
 * Check if a provider is in the enabled list
 * @param name - Provider name to check
 * @param list - List of enabled provider names
 */
export function isProviderEnabled(name: string, list: string[]): boolean {
  return list.includes(String(name).toLowerCase());
}
