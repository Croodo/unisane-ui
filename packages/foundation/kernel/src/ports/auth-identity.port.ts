/**
 * Auth-Identity Port
 *
 * This port defines the contract between the Auth module and Identity module.
 * Auth depends on this interface, Identity implements it.
 * This eliminates direct coupling between auth and identity modules.
 */

/**
 * Minimal user representation returned by identity lookups.
 */
export interface AuthUserRef {
  id: string;
  emailNorm?: string;
  phoneNorm?: string;
  displayName?: string | null;
}

/**
 * Create user input for signup flows.
 */
export interface AuthCreateUserInput {
  email: string;
  displayName?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  locale?: string;
  timezone?: string;
}

/**
 * Update user input for profile updates.
 */
export interface AuthUpdateUserInput {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneVerified?: boolean;
  authUserId?: string;
}

/**
 * Port interface for auth module to interact with identity module.
 * This allows auth to work with user data without direct dependency on identity.
 */
export interface AuthIdentityPort {
  // User lookup functions
  findUserByEmail(emailNorm: string): Promise<AuthUserRef | null>;
  findUserByPhone(phoneNorm: string): Promise<AuthUserRef | null>;
  findUserByUsername(username: string): Promise<AuthUserRef | null>;

  // User creation and updates
  createUser(input: AuthCreateUserInput): Promise<{ id: string }>;
  updateUserById(userId: string, input: AuthUpdateUserInput): Promise<void>;
  ensureUserByEmail(
    emailNorm: string,
    opts?: { createIfMissing?: boolean }
  ): Promise<string>;

  // Utility
  getUserId(user: AuthUserRef): string;

  // Repository access for phone verification flows
  findUserByPhoneNorm(phoneNorm: string): Promise<AuthUserRef | null>;
  updateUserPhoneVerified(userId: string, verified: boolean): Promise<void>;

  // Membership access for phone verification
  findMembershipByUserAndTenant(
    userId: string,
    tenantId: string
  ): Promise<{ id: string } | null>;
}

// Provider storage
let _provider: AuthIdentityPort | null = null;

/**
 * Set the auth-identity provider implementation.
 * Call this at app bootstrap before any auth operations.
 */
export function setAuthIdentityProvider(provider: AuthIdentityPort): void {
  _provider = provider;
}

/**
 * Get the auth-identity provider.
 * Throws if not configured.
 */
export function getAuthIdentityProvider(): AuthIdentityPort {
  if (!_provider) {
    throw new Error(
      "AuthIdentityPort not configured. Call setAuthIdentityProvider() at bootstrap."
    );
  }
  return _provider;
}

/**
 * Check if provider is configured (useful for optional features).
 */
export function hasAuthIdentityProvider(): boolean {
  return _provider !== null;
}
