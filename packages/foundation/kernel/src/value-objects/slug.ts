/**
 * Slug Value Object
 *
 * Represents a URL-safe identifier (slug) for tenants/workspaces.
 * Ensures consistent slug generation and validation.
 *
 * @example
 * ```typescript
 * import { Slug } from '@unisane/kernel';
 *
 * // Create from name
 * const slug = Slug.fromName('My Awesome Company!');
 * console.log(slug.toString()); // "my-awesome-company"
 *
 * // Handle collisions
 * const slug2 = slug.withSuffix(2);
 * console.log(slug2.toString()); // "my-awesome-company-2"
 * ```
 */

import { z } from 'zod';

/**
 * Slug validation pattern.
 * Allows lowercase letters, numbers, and hyphens.
 * Length: 2-80 characters.
 */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$/;

/**
 * Minimum slug length.
 */
const MIN_LENGTH = 2;

/**
 * Maximum slug length.
 */
const MAX_LENGTH = 80;

/**
 * Reserved slugs that cannot be used.
 */
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'billing',
  'cdn',
  'console',
  'dashboard',
  'docs',
  'help',
  'home',
  'login',
  'logout',
  'new',
  'null',
  'oauth',
  'platform',
  'pricing',
  'privacy',
  'root',
  'settings',
  'signup',
  'signin',
  'status',
  'support',
  'system',
  'terms',
  'undefined',
  'user',
  'users',
  'www',
]);

/**
 * Slug value object for URL-safe identifiers.
 *
 * Key features:
 * - Immutable - cannot be modified after creation
 * - Automatically generated from names
 * - Supports collision handling with suffixes
 * - Validates against reserved slugs
 */
export class Slug {
  private readonly value: string;

  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(slug: string) {
    if (slug.length < MIN_LENGTH) {
      throw new Error(`Slug too short: minimum ${MIN_LENGTH} characters`);
    }
    if (slug.length > MAX_LENGTH) {
      throw new Error(`Slug too long: maximum ${MAX_LENGTH} characters`);
    }
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(
        `Invalid slug format: ${slug}. Must be lowercase letters, numbers, and hyphens only.`
      );
    }
    this.value = slug;
  }

  // ─── FACTORY METHODS ────────────────────────────────────────────────────────

  /**
   * Create a Slug from an existing valid slug string.
   * @throws Error if slug format is invalid
   */
  static create(slug: string): Slug {
    return new Slug(slug.toLowerCase());
  }

  /**
   * Create a Slug from a name (e.g., company name).
   * Automatically converts to URL-safe format.
   */
  static fromName(name: string): Slug {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
      .replace(/--+/g, '-'); // Replace multiple hyphens with single

    // Ensure minimum length
    const finalSlug = slug || 'workspace';

    // Truncate if too long
    const truncated =
      finalSlug.length > MAX_LENGTH
        ? finalSlug.slice(0, MAX_LENGTH).replace(/-$/, '')
        : finalSlug;

    return new Slug(truncated);
  }

  /**
   * Create a Slug from an email domain.
   */
  static fromEmail(email: string): Slug {
    const domain = email.split('@')[1] ?? '';
    const baseName = domain.split('.')[0] ?? 'workspace';
    return Slug.fromName(baseName);
  }

  /**
   * Try to create a Slug, returns null if invalid.
   */
  static tryCreate(slug: string): Slug | null {
    try {
      return new Slug(slug.toLowerCase());
    } catch {
      return null;
    }
  }

  // ─── VALIDATION ─────────────────────────────────────────────────────────────

  /**
   * Check if a string is a valid slug format.
   */
  static isValid(slug: string): boolean {
    const lower = slug.toLowerCase();
    return (
      lower.length >= MIN_LENGTH &&
      lower.length <= MAX_LENGTH &&
      SLUG_PATTERN.test(lower)
    );
  }

  /**
   * Check if a slug is reserved.
   */
  static isReserved(slug: string): boolean {
    return RESERVED_SLUGS.has(slug.toLowerCase());
  }

  /**
   * Check if this slug is reserved.
   */
  isReserved(): boolean {
    return RESERVED_SLUGS.has(this.value);
  }

  // ─── COLLISION HANDLING ─────────────────────────────────────────────────────

  /**
   * Create a new Slug with a numeric suffix for collision handling.
   *
   * @example
   * ```typescript
   * const slug = Slug.fromName('acme');
   * const slug2 = slug.withSuffix(2); // "acme-2"
   * const slug3 = slug.withSuffix(3); // "acme-3"
   * ```
   */
  withSuffix(n: number): Slug {
    const suffix = `-${n}`;
    const maxBase = MAX_LENGTH - suffix.length;
    const base = this.value.slice(0, maxBase).replace(/-$/, '');
    return new Slug(`${base}${suffix}`);
  }

  /**
   * Generate a unique slug using a check function.
   *
   * @example
   * ```typescript
   * const slug = await Slug.fromName('acme').ensureUnique(
   *   async (s) => !(await db.slugExists(s.toString()))
   * );
   * ```
   */
  async ensureUnique(
    isAvailable: (slug: Slug) => Promise<boolean>,
    maxAttempts: number = 100
  ): Promise<Slug> {
    // First try without suffix
    if (!this.isReserved() && (await isAvailable(this))) {
      return this;
    }

    // Try with suffixes
    for (let i = 2; i <= maxAttempts; i++) {
      const candidate = this.withSuffix(i);
      if (!candidate.isReserved() && (await isAvailable(candidate))) {
        return candidate;
      }
    }

    throw new Error(`Could not find unique slug after ${maxAttempts} attempts`);
  }

  // ─── ACCESSORS ──────────────────────────────────────────────────────────────

  /**
   * Get the slug string.
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
   * Get the slug length.
   */
  get length(): number {
    return this.value.length;
  }

  // ─── COMPARISON ─────────────────────────────────────────────────────────────

  /**
   * Check if two Slug values are equal.
   */
  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  /**
   * Check if this slug equals a string.
   */
  equalsString(slug: string): boolean {
    return this.value === slug.toLowerCase();
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
 * Zod schema that validates and transforms to Slug value object.
 */
export const ZSlug = z
  .string()
  .trim()
  .min(MIN_LENGTH, `Slug must be at least ${MIN_LENGTH} characters`)
  .max(MAX_LENGTH, `Slug must be at most ${MAX_LENGTH} characters`)
  .regex(SLUG_PATTERN, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .transform((val) => Slug.create(val));

/**
 * Zod schema for slug string (validates but doesn't transform).
 */
export const ZSlugString = z
  .string()
  .trim()
  .min(MIN_LENGTH)
  .max(MAX_LENGTH)
  .regex(SLUG_PATTERN)
  .transform((val) => val.toLowerCase());

