/**
 * Username Value Object
 *
 * Represents a validated and normalized username.
 * Ensures consistent username handling across the application.
 *
 * @example
 * ```typescript
 * import { Username } from '@unisane/kernel';
 *
 * const username = Username.create('@John_Doe123');
 * console.log(username.toString());   // "john_doe123"
 * console.log(username.withAtSign()); // "@john_doe123"
 *
 * // Works with or without @ prefix
 * const u1 = Username.create('jane');
 * const u2 = Username.create('@jane');
 * console.log(u1.equals(u2)); // true
 * ```
 */

import { z } from 'zod';

/**
 * Username validation pattern.
 * Allows lowercase letters, numbers, underscores, and dots.
 * Length: 3-30 characters.
 */
const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

/**
 * Minimum username length.
 */
const MIN_LENGTH = 3;

/**
 * Maximum username length.
 */
const MAX_LENGTH = 30;

/**
 * Reserved usernames that cannot be used.
 */
const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'api',
  'billing',
  'help',
  'info',
  'mail',
  'moderator',
  'noreply',
  'no-reply',
  'null',
  'postmaster',
  'root',
  'security',
  'support',
  'system',
  'undefined',
  'webmaster',
  'www',
]);

/**
 * Username value object for handling user identifiers.
 *
 * Key features:
 * - Immutable - cannot be modified after creation
 * - Automatically normalized (lowercase, trimmed, @ prefix removed)
 * - Validates format (alphanumeric, underscores, dots)
 * - Provides formatted output (with/without @)
 */
export class Username {
  private readonly value: string;

  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(username: string) {
    // Normalize: trim, lowercase, remove leading @ signs
    const normalized = username.trim().toLowerCase().replace(/^@+/, '');

    if (normalized.length < MIN_LENGTH) {
      throw new Error(`Username too short: minimum ${MIN_LENGTH} characters`);
    }
    if (normalized.length > MAX_LENGTH) {
      throw new Error(`Username too long: maximum ${MAX_LENGTH} characters`);
    }
    if (!USERNAME_PATTERN.test(normalized)) {
      throw new Error(
        `Invalid username format: ${username}. Must be 3-30 characters using only letters, numbers, underscores, and dots.`
      );
    }

    this.value = normalized;
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Create a Username from a string.
   * @throws Error if username format is invalid
   */
  static create(username: string): Username {
    return new Username(username);
  }

  /**
   * Try to create a Username, returns null if invalid.
   */
  static tryCreate(username: string): Username | null {
    try {
      return new Username(username);
    } catch {
      return null;
    }
  }

  /**
   * Create a Username from an already-normalized string (skip validation).
   * Use only when the username is known to be valid (e.g., from database).
   */
  static fromNormalized(username: string): Username {
    const instance = Object.create(Username.prototype) as Username;
    (instance as unknown as { value: string }).value = username;
    return instance;
  }

  // ─── VALIDATION ─────────────────────────────────────────────────────────────

  /**
   * Check if a string is a valid username format.
   */
  static isValid(username: string): boolean {
    const normalized = username.trim().toLowerCase().replace(/^@+/, '');
    return (
      normalized.length >= MIN_LENGTH &&
      normalized.length <= MAX_LENGTH &&
      USERNAME_PATTERN.test(normalized)
    );
  }

  /**
   * Check if a username is reserved.
   */
  static isReserved(username: string): boolean {
    const normalized = username.trim().toLowerCase().replace(/^@+/, '');
    return RESERVED_USERNAMES.has(normalized);
  }

  /**
   * Check if this username is reserved.
   */
  isReserved(): boolean {
    return RESERVED_USERNAMES.has(this.value);
  }

  // ─── ACCESSORS ──────────────────────────────────────────────────────────────

  /**
   * Get the normalized username string (without @).
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get the raw value.
   */
  get rawValue(): string {
    return this.value;
  }

  /**
   * Get the username length.
   */
  get length(): number {
    return this.value.length;
  }

  /**
   * Get the username with @ prefix (for display/mentions).
   */
  withAtSign(): string {
    return `@${this.value}`;
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two Username values are equal.
   */
  equals(other: Username): boolean {
    return this.value === other.value;
  }

  /**
   * Check if this username equals a string (normalizes before comparison).
   */
  equalsString(username: string): boolean {
    try {
      const other = Username.create(username);
      return this.equals(other);
    } catch {
      return false;
    }
  }

  // ─── SERIALIZATION ──────────────────────────────────────────────────────────

  /**
   * Convert to JSON (just the string value).
   */
  toJSON(): string {
    return this.value;
  }
}

// ─── ZOD INTEGRATION ────────────────────────────────────────────────────────

/**
 * Zod schema that validates and transforms to Username value object.
 */
export const ZUsername = z
  .string()
  .trim()
  .regex(
    /^@?[a-z0-9_.]{3,30}$/i,
    'Username must be 3-30 characters using only letters, numbers, underscores, and dots'
  )
  .transform((val) => Username.create(val));

/**
 * Zod schema for username string (validates but doesn't transform to object).
 */
export const ZUsernameString = z
  .string()
  .trim()
  .regex(
    /^@?[a-z0-9_.]{3,30}$/i,
    'Username must be 3-30 characters using only letters, numbers, underscores, and dots'
  )
  .transform((val) => val.trim().toLowerCase().replace(/^@+/, ''));

