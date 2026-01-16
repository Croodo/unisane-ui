/**
 * Email Value Object
 *
 * Represents a validated and normalized email address.
 * Ensures consistent email handling across the application.
 *
 * @example
 * ```typescript
 * import { Email } from '@unisane/kernel';
 *
 * const email = Email.create('User@Example.COM');
 * console.log(email.toString());  // "user@example.com"
 * console.log(email.domain);      // "example.com"
 * console.log(email.localPart);   // "user"
 * ```
 */

import { z } from 'zod';
import { createHmac } from 'crypto';

/**
 * Email validation regex (RFC 5322 simplified).
 *
 * This pattern validates:
 * - Local part: letters, numbers, and allowed special characters (.!#$%&'*+/=?^_`{|}~-)
 * - Domain: valid hostname with at least one dot
 * - TLD: at least 2 characters
 *
 * It correctly rejects:
 * - Emails without proper domain (e.g., "a@b")
 * - Emails with invalid characters
 * - Emails with consecutive dots in local part
 * - Single-character TLDs
 *
 * For full RFC 5322 compliance in production, consider using a dedicated library.
 */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Maximum email length per RFC 5321
 */
const MAX_EMAIL_LENGTH = 254;

/**
 * Maximum local part length per RFC 5321
 */
const MAX_LOCAL_PART_LENGTH = 64;

/**
 * Email value object for handling email addresses.
 *
 * Key features:
 * - Immutable - cannot be modified after creation
 * - Automatically normalized (lowercase, trimmed)
 * - Provides domain and local part accessors
 * - Supports search token generation for encrypted storage
 */
export class Email {
  private readonly normalized: string;

  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!Email.isValidFormat(trimmed)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    this.normalized = trimmed;
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Create an Email from a string.
   * @throws Error if email format is invalid
   */
  static create(email: string): Email {
    return new Email(email);
  }

  /**
   * Try to create an Email, returns null if invalid.
   */
  static tryCreate(email: string): Email | null {
    try {
      return new Email(email);
    } catch {
      return null;
    }
  }

  /**
   * Create an Email from an already-normalized string (skip validation).
   * Use only when the email is known to be valid (e.g., from database).
   */
  static fromNormalized(email: string): Email {
    const instance = Object.create(Email.prototype) as Email;
    (instance as unknown as { normalized: string }).normalized = email;
    return instance;
  }

  // ─── VALIDATION ─────────────────────────────────────────────────────────────

  /**
   * Check if a string is a valid email format.
   * Validates against RFC 5322 pattern and length constraints.
   */
  private static isValidFormat(email: string): boolean {
    // Check overall length
    if (email.length > MAX_EMAIL_LENGTH) {
      return false;
    }

    // Check local part length
    const atIndex = email.indexOf('@');
    if (atIndex === -1) {
      return false;
    }
    const localPart = email.substring(0, atIndex);
    if (localPart.length > MAX_LOCAL_PART_LENGTH) {
      return false;
    }

    // Check pattern
    return EMAIL_PATTERN.test(email);
  }

  /**
   * Static validation check.
   */
  static isValid(email: string): boolean {
    return Email.isValidFormat(email.trim().toLowerCase());
  }

  // ─── ACCESSORS ──────────────────────────────────────────────────────────────

  /**
   * Get the normalized email string.
   */
  toString(): string {
    return this.normalized;
  }

  /**
   * Get the normalized email value.
   */
  get value(): string {
    return this.normalized;
  }

  /**
   * Get the domain part of the email.
   */
  get domain(): string {
    return this.normalized.split('@')[1] ?? '';
  }

  /**
   * Get the local part (before @) of the email.
   */
  get localPart(): string {
    return this.normalized.split('@')[0] ?? '';
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two Email values are equal.
   */
  equals(other: Email): boolean {
    return this.normalized === other.normalized;
  }

  /**
   * Check if this email equals a string (normalizes before comparison).
   */
  equalsString(email: string): boolean {
    return this.normalized === email.trim().toLowerCase();
  }

  // ─── SEARCH TOKEN ───────────────────────────────────────────────────────────

  /**
   * Generate a search token for encrypted email storage.
   * Uses HMAC-SHA256 for deterministic but non-reversible tokens.
   *
   * @param secretKey - The encryption/HMAC key
   * @returns Hex-encoded search token
   */
  toSearchToken(secretKey: string): string {
    return createHmac('sha256', secretKey)
      .update(this.normalized)
      .digest('hex');
  }

  // ─── DOMAIN HELPERS ─────────────────────────────────────────────────────────

  /**
   * Check if email is from a specific domain.
   */
  isFromDomain(domain: string): boolean {
    return this.domain === domain.toLowerCase();
  }

  /**
   * Check if email matches any of the given domains.
   */
  isFromDomains(domains: string[]): boolean {
    const normalizedDomains = domains.map((d) => d.toLowerCase());
    return normalizedDomains.includes(this.domain);
  }

  /**
   * Check if email appears to be a disposable/temporary email.
   * This is a basic check - use a proper service for comprehensive validation.
   */
  isDisposable(): boolean {
    const disposableDomains = new Set([
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      'mailinator.com',
      '10minutemail.com',
      'temp-mail.org',
      'fakeinbox.com',
      'trashmail.com',
    ]);
    return disposableDomains.has(this.domain);
  }

  // ─── SERIALIZATION ──────────────────────────────────────────────────────────

  /**
   * Convert to JSON (just the string value).
   */
  toJSON(): string {
    return this.normalized;
  }
}

// ─── ZOD INTEGRATION ────────────────────────────────────────────────────────

/**
 * Zod schema that validates and transforms to Email value object.
 */
export const ZEmail = z
  .string()
  .trim()
  .email('Invalid email format')
  .transform((val) => Email.create(val));

/**
 * Zod schema for email string (validates but doesn't transform).
 */
export const ZEmailString = z
  .string()
  .trim()
  .email('Invalid email format')
  .transform((val) => val.toLowerCase());

