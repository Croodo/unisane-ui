/**
 * ApiKey Value Object
 *
 * Represents an API key with secure handling.
 * The plaintext token is only available at generation time.
 *
 * @example
 * ```typescript
 * import { ApiKey } from '@unisane/identity';
 *
 * // Generate a new API key
 * const { apiKey, plainToken } = ApiKey.generate();
 * console.log(plainToken); // Only shown once!
 *
 * // Store the hash in database
 * await saveApiKeyHash(apiKey.getHash());
 *
 * // Later, verify a token
 * const storedKey = ApiKey.fromHash(hashFromDb);
 * if (storedKey.matches(userProvidedToken)) {
 *   // Token is valid
 * }
 * ```
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * API key prefix for identification.
 */
const API_KEY_PREFIX = 'uk_';

/**
 * Length of the random token (in bytes).
 */
const TOKEN_BYTES = 24;

/**
 * ApiKey value object for secure API key handling.
 *
 * Key features:
 * - Plaintext token only available at generation
 * - SHA-256 hash stored in database
 * - Timing-safe comparison to prevent timing attacks
 * - Prefix for easy identification
 */
export class ApiKey {
  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(
    private readonly hash: string,
    private readonly prefix: string = API_KEY_PREFIX
  ) {
    if (!hash || hash.length !== 64) {
      throw new Error('Invalid API key hash');
    }
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Generate a new API key.
   * Returns both the ApiKey object (for storage) and the plain token (to show user once).
   */
  static generate(): { apiKey: ApiKey; plainToken: string } {
    const tokenBytes = randomBytes(TOKEN_BYTES);
    const token = API_KEY_PREFIX + tokenBytes.toString('base64url');
    const hash = createHash('sha256').update(token).digest('hex');

    return {
      apiKey: new ApiKey(hash),
      plainToken: token,
    };
  }

  /**
   * Create an ApiKey from a stored hash (for verification).
   */
  static fromHash(hash: string): ApiKey {
    return new ApiKey(hash);
  }

  /**
   * Hash a plaintext token.
   */
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // ─── ACCESSORS ──────────────────────────────────────────────────────────────

  /**
   * Get the hash for storage.
   */
  getHash(): string {
    return this.hash;
  }

  /**
   * Get the first few characters of the hash (for logging/display).
   */
  getShortHash(): string {
    return this.hash.slice(0, 8);
  }

  // ─── VERIFICATION ───────────────────────────────────────────────────────────

  /**
   * Check if a plaintext token matches this API key.
   * Uses timing-safe comparison to prevent timing attacks.
   */
  matches(plainToken: string): boolean {
    const tokenHash = createHash('sha256').update(plainToken).digest('hex');

    try {
      const hashBuffer = Buffer.from(this.hash, 'hex');
      const tokenBuffer = Buffer.from(tokenHash, 'hex');
      return timingSafeEqual(
        new Uint8Array(hashBuffer.buffer, hashBuffer.byteOffset, hashBuffer.byteLength),
        new Uint8Array(tokenBuffer.buffer, tokenBuffer.byteOffset, tokenBuffer.byteLength)
      );
    } catch {
      // Buffers of different length would throw
      return false;
    }
  }

  /**
   * Verify a token and return boolean (alias for matches).
   */
  verify(plainToken: string): boolean {
    return this.matches(plainToken);
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two ApiKey objects have the same hash.
   */
  equals(other: ApiKey): boolean {
    return this.hash === other.hash;
  }

  // ─── SERIALIZATION ──────────────────────────────────────────────────────────

  /**
   * String representation (never shows the actual hash for security).
   */
  toString(): string {
    return `ApiKey(${this.getShortHash()}...)`;
  }

  /**
   * Convert to JSON (hash only, never the token).
   */
  toJSON(): { hash: string } {
    return { hash: this.hash };
  }
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Check if a string looks like an API key.
 */
export function isApiKeyFormat(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX) && token.length > API_KEY_PREFIX.length;
}

/**
 * Mask an API key for display (shows prefix and last 4 chars).
 */
export function maskApiKey(token: string): string {
  if (!isApiKeyFormat(token)) {
    return '***';
  }
  const last4 = token.slice(-4);
  return `${API_KEY_PREFIX}...${last4}`;
}
