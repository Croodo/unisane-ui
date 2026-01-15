/**
 * Password Value Object
 *
 * Encapsulates password hashing and verification logic.
 * Never stores or exposes plaintext passwords.
 */

import { z } from 'zod';

/** Minimum password length */
const MIN_LENGTH = 8;

/** Password hasher function type */
type PasswordHasher = (plaintext: string) => Promise<string>;

/** Password verifier function type */
type PasswordVerifier = (plaintext: string, hash: string) => Promise<boolean>;

export class Password {
  private readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  /**
   * Create a Password from plaintext by hashing it
   * @throws Error if password doesn't meet requirements
   */
  static async fromPlaintext(plaintext: string, hasher: PasswordHasher): Promise<Password> {
    Password.validatePlaintext(plaintext);
    const hash = await hasher(plaintext);
    return new Password(hash);
  }

  /**
   * Create a Password from an existing hash (e.g., from database)
   */
  static fromHash(hash: string): Password {
    if (!hash || hash.length < 10) {
      throw new Error('Invalid password hash');
    }
    return new Password(hash);
  }

  /**
   * Validate plaintext password meets requirements
   * @throws Error if invalid
   */
  static validatePlaintext(plaintext: string): void {
    if (!plaintext || plaintext.length < MIN_LENGTH) {
      throw new Error(`Password must be at least ${MIN_LENGTH} characters`);
    }
  }

  /**
   * Check if plaintext meets requirements without throwing
   */
  static isValidPlaintext(plaintext: string): boolean {
    return !!plaintext && plaintext.length >= MIN_LENGTH;
  }

  /**
   * Get the hash for storage
   */
  getHash(): string {
    return this.hash;
  }

  /**
   * Verify if a plaintext password matches this hash
   */
  async matches(plaintext: string, verifier: PasswordVerifier): Promise<boolean> {
    if (!plaintext) return false;
    return verifier(plaintext, this.hash);
  }

  /**
   * Prevent accidental exposure of hash
   */
  toString(): string {
    return 'Password([REDACTED])';
  }

  /**
   * Prevent JSON serialization of hash
   */
  toJSON(): string {
    return '[REDACTED]';
  }
}

/**
 * Zod schema for plaintext password validation (input)
 * Use this in request schemas
 */
export const ZPasswordPlaintext = z
  .string()
  .min(MIN_LENGTH, `Password must be at least ${MIN_LENGTH} characters`);

/**
 * Minimum password length constant
 */
export const PASSWORD_MIN_LENGTH = MIN_LENGTH;
