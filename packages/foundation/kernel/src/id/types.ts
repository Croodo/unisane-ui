/**
 * ID Generator Port Interface
 *
 * This is the core abstraction for ID generation, enabling database-agnostic
 * entity creation. Implementations can use ObjectId (MongoDB), UUID (PostgreSQL),
 * nanoid, or any other ID strategy.
 *
 * ## Design Decisions
 *
 * 1. **String-based IDs**: All generated IDs are strings for maximum portability.
 *    Internal representation may differ (ObjectId binary, UUID binary) but the
 *    public API always uses strings.
 *
 * 2. **Validation**: Each generator knows how to validate its own ID format.
 *    This enables type-safe ID handling without database-specific code.
 *
 * 3. **Deterministic generation**: The `fromString` method allows recreating
 *    an ID from its string representation, useful for lookups and comparisons.
 *
 * ## Usage
 *
 * ```typescript
 * // Get the current generator
 * const generator = getIdGenerator();
 *
 * // Generate a new ID
 * const id = generator.generate();
 *
 * // Validate an ID
 * if (generator.isValid(someId)) {
 *   // safe to use
 * }
 *
 * // Get ID metadata (creation time if available)
 * const meta = generator.getMetadata(id);
 * if (meta?.createdAt) {
 *   console.log('ID created at:', meta.createdAt);
 * }
 * ```
 */

/**
 * Supported ID generation strategies.
 */
export type IdGeneratorType = 'objectid' | 'uuid' | 'nanoid' | 'cuid' | 'ulid' | 'custom';

/**
 * Metadata that can be extracted from an ID (if supported by the generator).
 */
export interface IdMetadata {
  /** When the ID was created (extracted from ID for ObjectId, ULID) */
  createdAt?: Date;
  /** The ID type/strategy */
  type: IdGeneratorType;
  /** Raw/native representation (e.g., ObjectId instance) */
  native?: unknown;
}

/**
 * ID Generator Port Interface.
 *
 * All ID generation strategies must implement this interface.
 * This enables swapping ID generators at runtime without changing application code.
 */
export interface IdGenerator {
  /**
   * The type of ID this generator produces.
   */
  readonly type: IdGeneratorType;

  /**
   * Generate a new unique ID.
   *
   * @returns A new unique ID as a string
   *
   * @example
   * ```typescript
   * const id = generator.generate();
   * // ObjectId: '507f1f77bcf86cd799439011'
   * // UUID: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
   * // nanoid: 'V1StGXR8_Z5jdHi6B-myT'
   * ```
   */
  generate(): string;

  /**
   * Check if a string is a valid ID for this generator.
   *
   * @param id - The string to validate
   * @returns true if the string is a valid ID
   *
   * @example
   * ```typescript
   * generator.isValid('507f1f77bcf86cd799439011'); // true for ObjectId
   * generator.isValid('invalid'); // false
   * ```
   */
  isValid(id: string): boolean;

  /**
   * Get metadata from an ID (if extractable).
   *
   * Some ID formats encode information like creation timestamp.
   * This method extracts that information when available.
   *
   * @param id - The ID to extract metadata from
   * @returns Metadata if extractable, undefined otherwise
   *
   * @example
   * ```typescript
   * const meta = generator.getMetadata(objectId);
   * if (meta?.createdAt) {
   *   console.log('Created:', meta.createdAt);
   * }
   * ```
   */
  getMetadata(id: string): IdMetadata | undefined;

  /**
   * Convert an ID string to its native representation (if any).
   *
   * For ObjectId, this returns an ObjectId instance.
   * For UUID/nanoid, this returns the string itself.
   *
   * @param id - The ID string
   * @returns Native representation or the string if no native type
   *
   * @example
   * ```typescript
   * // For ObjectId generator
   * const native = generator.toNative('507f1f77bcf86cd799439011');
   * // Returns: ObjectId('507f1f77bcf86cd799439011')
   *
   * // For UUID generator
   * const native = generator.toNative('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
   * // Returns: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
   * ```
   */
  toNative(id: string): unknown;

  /**
   * Convert a native ID representation to string.
   *
   * @param native - The native ID (ObjectId, etc.)
   * @returns String representation
   */
  toString(native: unknown): string;

  /**
   * Compare two IDs for equality.
   *
   * Handles both string and native representations.
   *
   * @param a - First ID (string or native)
   * @param b - Second ID (string or native)
   * @returns true if IDs are equal
   */
  equals(a: string | unknown, b: string | unknown): boolean;
}

/**
 * Options for creating an ID generator.
 */
export interface IdGeneratorOptions {
  /**
   * Custom prefix to add to generated IDs.
   * Useful for making IDs type-safe (e.g., 'usr_', 'ord_').
   */
  prefix?: string;

  /**
   * Length for variable-length generators (nanoid).
   */
  length?: number;

  /**
   * Custom alphabet for nanoid.
   */
  alphabet?: string;
}
