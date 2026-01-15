/**
 * PhoneE164 Value Object
 *
 * Represents a phone number in E.164 format (+[country code][number]).
 * Ensures consistent phone number handling across the application.
 *
 * @example
 * ```typescript
 * import { PhoneE164 } from '@unisane/kernel';
 *
 * const phone = PhoneE164.create('+1 (555) 123-4567');
 * console.log(phone.toString());    // "+15551234567"
 * console.log(phone.countryCode);   // "1"
 *
 * // Also handles 00 prefix (international format)
 * const intl = PhoneE164.create('0044 7911 123456');
 * console.log(intl.toString());     // "+447911123456"
 * ```
 */

import { z } from 'zod';

/**
 * E.164 format validation pattern.
 * Format: + followed by 1-3 digit country code and 7-14 digits.
 */
const E164_PATTERN = /^\+[1-9][0-9]{7,14}$/;

/**
 * PhoneE164 value object for handling phone numbers in E.164 format.
 *
 * Key features:
 * - Immutable - cannot be modified after creation
 * - Automatically normalized (strips spaces, dashes, parentheses)
 * - Converts 00 prefix to + for international numbers
 * - Provides country code extraction
 */
export class PhoneE164 {
  private readonly value: string;

  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(phone: string) {
    const normalized = PhoneE164.normalize(phone);
    if (!E164_PATTERN.test(normalized)) {
      throw new Error(`Invalid E.164 phone number: ${phone}`);
    }
    this.value = normalized;
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Create a PhoneE164 from a string.
   * @throws Error if phone format is invalid
   */
  static create(phone: string): PhoneE164 {
    return new PhoneE164(phone);
  }

  /**
   * Try to create a PhoneE164, returns null if invalid.
   */
  static tryCreate(phone: string): PhoneE164 | null {
    try {
      return new PhoneE164(phone);
    } catch {
      return null;
    }
  }

  /**
   * Create a PhoneE164 from an already-normalized string (skip validation).
   * Use only when the phone is known to be valid (e.g., from database).
   */
  static fromNormalized(phone: string): PhoneE164 {
    const instance = Object.create(PhoneE164.prototype) as PhoneE164;
    (instance as unknown as { value: string }).value = phone;
    return instance;
  }

  // ─── NORMALIZATION ──────────────────────────────────────────────────────────

  /**
   * Normalize a phone number to E.164 format.
   */
  private static normalize(phone: string): string {
    // Remove all non-digit characters except leading +
    let raw = phone.trim();

    // Handle 00 prefix (international dialing format)
    if (raw.startsWith('00')) {
      raw = '+' + raw.slice(2);
    }

    // Remove spaces, dashes, parentheses, dots
    raw = raw.replace(/[\s\-().]/g, '');

    return raw;
  }

  // ─── VALIDATION ─────────────────────────────────────────────────────────────

  /**
   * Check if a string is a valid E.164 phone number.
   */
  static isValid(phone: string): boolean {
    try {
      PhoneE164.create(phone);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the E.164 pattern for external use.
   */
  static get pattern(): RegExp {
    return E164_PATTERN;
  }

  // ─── ACCESSORS ──────────────────────────────────────────────────────────────

  /**
   * Get the E.164 formatted phone number.
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get the raw E.164 value.
   */
  get rawValue(): string {
    return this.value;
  }

  /**
   * Get the country code (without +).
   * Note: This is a simplified extraction. For accurate country code
   * detection, use a library like libphonenumber.
   */
  get countryCode(): string {
    // Common country codes by length:
    // 1 digit: US/Canada (+1), Russia (+7)
    // 2 digits: Most European countries, India (+91)
    // 3 digits: Some countries
    const withoutPlus = this.value.slice(1);

    // Try to match known patterns
    // +1 is always US/Canada
    if (withoutPlus.startsWith('1')) {
      return '1';
    }
    // +7 is Russia/Kazakhstan
    if (withoutPlus.startsWith('7')) {
      return '7';
    }
    // Most 2-digit codes are in ranges 2x-6x, 8x, 9x
    const twoDigit = withoutPlus.slice(0, 2);
    const firstDigit = parseInt(twoDigit[0] ?? '0', 10);
    if (firstDigit >= 2 && firstDigit <= 9 && firstDigit !== 7) {
      return twoDigit;
    }

    // Fallback: return first 2 digits
    return twoDigit;
  }

  /**
   * Get the national number (without country code).
   * Note: This is approximate - use libphonenumber for accuracy.
   */
  get nationalNumber(): string {
    const cc = this.countryCode;
    return this.value.slice(1 + cc.length);
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two PhoneE164 values are equal.
   */
  equals(other: PhoneE164): boolean {
    return this.value === other.value;
  }

  /**
   * Check if this phone equals a string (normalizes before comparison).
   */
  equalsString(phone: string): boolean {
    try {
      const other = PhoneE164.create(phone);
      return this.equals(other);
    } catch {
      return false;
    }
  }

  // ─── FORMATTING ─────────────────────────────────────────────────────────────

  /**
   * Format for display (basic formatting).
   * For locale-specific formatting, use libphonenumber.
   */
  format(): string {
    // Basic US/Canada formatting
    if (this.countryCode === '1' && this.nationalNumber.length === 10) {
      const nn = this.nationalNumber;
      return `+1 (${nn.slice(0, 3)}) ${nn.slice(3, 6)}-${nn.slice(6)}`;
    }
    // Default: just the E.164 format
    return this.value;
  }

  /**
   * Get a masked version for display (hide middle digits).
   */
  masked(): string {
    const len = this.value.length;
    if (len <= 6) return this.value;
    const visible = 4;
    const start = this.value.slice(0, visible);
    const end = this.value.slice(-2);
    const middle = '*'.repeat(len - visible - 2);
    return `${start}${middle}${end}`;
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
 * Zod schema that validates and transforms to PhoneE164 value object.
 */
export const ZPhoneE164 = z
  .string()
  .trim()
  .transform((val) => PhoneE164.create(val));

/**
 * Zod schema for phone string (validates but doesn't transform to object).
 */
export const ZPhoneE164String = z
  .string()
  .trim()
  .refine(
    (val) => PhoneE164.isValid(val),
    { message: 'Invalid E.164 phone number format' }
  )
  .transform((val) => PhoneE164.create(val).toString());

