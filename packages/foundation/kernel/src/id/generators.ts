/**
 * ID Generator Implementations
 *
 * Provides concrete implementations of the IdGenerator interface for
 * different ID strategies.
 */

import { ObjectId } from 'mongodb';
import type { IdGenerator, IdMetadata, IdGeneratorOptions } from './types';

/**
 * ObjectId Generator (MongoDB-compatible)
 *
 * Generates 24-character hexadecimal IDs using MongoDB's ObjectId.
 * IDs are sortable by creation time and contain an embedded timestamp.
 *
 * Format: 24 hex characters (12 bytes)
 * - 4 bytes: timestamp (seconds since epoch)
 * - 5 bytes: random value (per process)
 * - 3 bytes: incrementing counter
 *
 * @example
 * ```typescript
 * const generator = new ObjectIdGenerator();
 * const id = generator.generate(); // '507f1f77bcf86cd799439011'
 * const createdAt = generator.getMetadata(id)?.createdAt;
 * ```
 */
export class ObjectIdGenerator implements IdGenerator {
  readonly type = 'objectid' as const;

  private readonly prefix: string;

  constructor(options?: IdGeneratorOptions) {
    this.prefix = options?.prefix ?? '';
  }

  generate(): string {
    const oid = new ObjectId();
    return this.prefix + oid.toHexString();
  }

  isValid(id: string): boolean {
    const raw = this.prefix ? id.slice(this.prefix.length) : id;

    // Must be 24 hex characters
    if (!/^[0-9a-fA-F]{24}$/.test(raw)) {
      return false;
    }

    // Verify it can be parsed as ObjectId
    try {
      const oid = new ObjectId(raw);
      return oid.toHexString() === raw.toLowerCase();
    } catch {
      return false;
    }
  }

  getMetadata(id: string): IdMetadata | undefined {
    if (!this.isValid(id)) {
      return undefined;
    }

    const raw = this.prefix ? id.slice(this.prefix.length) : id;
    const oid = new ObjectId(raw);

    return {
      type: 'objectid',
      createdAt: oid.getTimestamp(),
      native: oid,
    };
  }

  toNative(id: string): ObjectId {
    const raw = this.prefix ? id.slice(this.prefix.length) : id;
    return new ObjectId(raw);
  }

  toString(native: unknown): string {
    if (native instanceof ObjectId) {
      return this.prefix + native.toHexString();
    }
    if (typeof native === 'string') {
      return this.prefix + native;
    }
    throw new Error('Cannot convert to string: not an ObjectId');
  }

  equals(a: string | unknown, b: string | unknown): boolean {
    const aStr = typeof a === 'string' ? a : this.toString(a);
    const bStr = typeof b === 'string' ? b : this.toString(b);

    // Remove prefix for comparison
    const aRaw = this.prefix ? aStr.slice(this.prefix.length) : aStr;
    const bRaw = this.prefix ? bStr.slice(this.prefix.length) : bStr;

    return aRaw.toLowerCase() === bRaw.toLowerCase();
  }

  /**
   * Create an ObjectId from a timestamp.
   * Useful for range queries by creation time.
   *
   * @param date - The date to create an ObjectId for
   * @returns ObjectId string that represents this timestamp
   */
  fromTimestamp(date: Date): string {
    const oid = ObjectId.createFromTime(Math.floor(date.getTime() / 1000));
    return this.prefix + oid.toHexString();
  }
}

/**
 * UUID Generator (v4)
 *
 * Generates RFC 4122 compliant UUIDs (version 4, random).
 * Ideal for PostgreSQL and other databases that have native UUID support.
 *
 * Format: 36 characters (32 hex + 4 hyphens)
 * Example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
 *
 * @example
 * ```typescript
 * const generator = new UuidGenerator();
 * const id = generator.generate(); // 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
 * ```
 */
export class UuidGenerator implements IdGenerator {
  readonly type = 'uuid' as const;

  private readonly prefix: string;

  constructor(options?: IdGeneratorOptions) {
    this.prefix = options?.prefix ?? '';
  }

  generate(): string {
    // Use crypto.randomUUID() which is available in Node.js 16+
    const uuid = crypto.randomUUID();
    return this.prefix + uuid;
  }

  isValid(id: string): boolean {
    const raw = this.prefix ? id.slice(this.prefix.length) : id;

    // UUID v4 regex (with optional uppercase)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(raw);
  }

  getMetadata(id: string): IdMetadata | undefined {
    if (!this.isValid(id)) {
      return undefined;
    }

    return {
      type: 'uuid',
      // UUID v4 doesn't contain timestamp information
      createdAt: undefined,
      native: id,
    };
  }

  toNative(id: string): string {
    // UUID has no special native type in Node.js
    return id;
  }

  toString(native: unknown): string {
    if (typeof native !== 'string') {
      throw new Error('Cannot convert to string: not a UUID string');
    }
    return native;
  }

  equals(a: string | unknown, b: string | unknown): boolean {
    const aStr = typeof a === 'string' ? a : String(a);
    const bStr = typeof b === 'string' ? b : String(b);

    // Remove prefix and compare case-insensitively
    const aRaw = this.prefix ? aStr.slice(this.prefix.length) : aStr;
    const bRaw = this.prefix ? bStr.slice(this.prefix.length) : bStr;

    return aRaw.toLowerCase() === bRaw.toLowerCase();
  }
}

/**
 * NanoID Generator
 *
 * Generates URL-safe, compact IDs using the nanoid algorithm.
 * Default length is 21 characters (comparable entropy to UUID).
 *
 * Format: Configurable length, default 21 characters
 * Alphabet: A-Za-z0-9_- (URL-safe by default)
 *
 * @example
 * ```typescript
 * const generator = new NanoidGenerator({ length: 21 });
 * const id = generator.generate(); // 'V1StGXR8_Z5jdHi6B-myT'
 * ```
 */
export class NanoidGenerator implements IdGenerator {
  readonly type = 'nanoid' as const;

  private readonly prefix: string;
  private readonly length: number;
  private readonly alphabet: string;

  constructor(options?: IdGeneratorOptions) {
    this.prefix = options?.prefix ?? '';
    this.length = options?.length ?? 21;
    this.alphabet = options?.alphabet ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  }

  generate(): string {
    // Simple nanoid-like implementation using crypto
    const bytes = new Uint8Array(this.length);
    crypto.getRandomValues(bytes);

    let id = '';
    for (let i = 0; i < this.length; i++) {
      const byte = bytes[i]!;
      id += this.alphabet[byte % this.alphabet.length];
    }

    return this.prefix + id;
  }

  isValid(id: string): boolean {
    const raw = this.prefix ? id.slice(this.prefix.length) : id;

    // Check length
    if (raw.length !== this.length) {
      return false;
    }

    // Check all characters are in alphabet
    for (const char of raw) {
      if (!this.alphabet.includes(char)) {
        return false;
      }
    }

    return true;
  }

  getMetadata(id: string): IdMetadata | undefined {
    if (!this.isValid(id)) {
      return undefined;
    }

    return {
      type: 'nanoid',
      // NanoID doesn't contain timestamp
      createdAt: undefined,
      native: id,
    };
  }

  toNative(id: string): string {
    return id;
  }

  toString(native: unknown): string {
    if (typeof native !== 'string') {
      throw new Error('Cannot convert to string: not a string');
    }
    return native;
  }

  equals(a: string | unknown, b: string | unknown): boolean {
    const aStr = typeof a === 'string' ? a : String(a);
    const bStr = typeof b === 'string' ? b : String(b);

    // Case-sensitive comparison for nanoid
    return aStr === bStr;
  }
}

/**
 * CUID2 Generator
 *
 * Generates collision-resistant unique IDs that are:
 * - Secure (uses crypto.getRandomValues)
 * - Collision-resistant
 * - Horizontally-scalable
 * - URL-safe
 *
 * This is a simplified implementation. For production, consider using
 * the official @paralleldrive/cuid2 package.
 *
 * Format: 24 characters by default
 * Starts with a letter (for CSS selector compatibility)
 */
export class CuidGenerator implements IdGenerator {
  readonly type = 'cuid' as const;

  private readonly prefix: string;
  private counter = 0;

  constructor(options?: IdGeneratorOptions) {
    this.prefix = options?.prefix ?? '';
  }

  generate(): string {
    const timestamp = Date.now().toString(36);
    const count = (this.counter++).toString(36).padStart(4, '0');

    // Random component
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes)
      .map(b => b.toString(36))
      .join('')
      .slice(0, 8);

    // Start with a letter for CSS selector compatibility
    const firstLetter = String.fromCharCode(97 + Math.floor(Math.random() * 26));

    return this.prefix + firstLetter + timestamp + count + random;
  }

  isValid(id: string): boolean {
    const raw = this.prefix ? id.slice(this.prefix.length) : id;

    // CUID starts with a letter and is alphanumeric
    if (!/^[a-z][a-z0-9]+$/i.test(raw)) {
      return false;
    }

    // Reasonable length (16-32 characters)
    return raw.length >= 16 && raw.length <= 32;
  }

  getMetadata(id: string): IdMetadata | undefined {
    if (!this.isValid(id)) {
      return undefined;
    }

    return {
      type: 'cuid',
      createdAt: undefined, // CUID encodes timestamp but extraction is complex
      native: id,
    };
  }

  toNative(id: string): string {
    return id;
  }

  toString(native: unknown): string {
    if (typeof native !== 'string') {
      throw new Error('Cannot convert to string: not a string');
    }
    return native;
  }

  equals(a: string | unknown, b: string | unknown): boolean {
    const aStr = typeof a === 'string' ? a : String(a);
    const bStr = typeof b === 'string' ? b : String(b);
    return aStr === bStr;
  }
}

/**
 * Create an ID generator based on type.
 *
 * Factory function to create the appropriate generator.
 *
 * @param type - The type of generator to create
 * @param options - Generator options
 * @returns An IdGenerator instance
 */
export function createIdGenerator(
  type: 'objectid' | 'uuid' | 'nanoid' | 'cuid',
  options?: IdGeneratorOptions
): IdGenerator {
  switch (type) {
    case 'objectid':
      return new ObjectIdGenerator(options);
    case 'uuid':
      return new UuidGenerator(options);
    case 'nanoid':
      return new NanoidGenerator(options);
    case 'cuid':
      return new CuidGenerator(options);
    default:
      throw new Error(`Unknown ID generator type: ${type}`);
  }
}
