/**
 * ID Generator Registry
 *
 * Global registry for the current ID generator. Allows runtime switching
 * of ID generation strategy while maintaining a single entry point.
 *
 * @example
 * ```typescript
 * import { newEntityId, setIdGenerator, UuidGenerator } from '@unisane/kernel';
 *
 * // Default: ObjectIdGenerator (MongoDB compatible)
 * const mongoId = newEntityId(); // '507f1f77bcf86cd799439011'
 *
 * // Switch to UUID for PostgreSQL
 * setIdGenerator(new UuidGenerator());
 * const pgId = newEntityId(); // 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
 * ```
 */

import type { IdGenerator, IdMetadata, IdGeneratorType } from './types';
import { ObjectIdGenerator, UuidGenerator, NanoidGenerator, CuidGenerator, createIdGenerator } from './generators';

/**
 * The current ID generator instance.
 * Defaults to ObjectIdGenerator for MongoDB compatibility.
 */
let currentGenerator: IdGenerator = new ObjectIdGenerator();

/**
 * Get the current ID generator.
 *
 * @returns The current IdGenerator instance
 */
export function getIdGenerator(): IdGenerator {
  return currentGenerator;
}

/**
 * Set the global ID generator.
 *
 * Call this during application startup to configure the ID strategy.
 * This affects all subsequent calls to `newEntityId()`.
 *
 * @param generator - The IdGenerator to use
 *
 * @example
 * ```typescript
 * // In app initialization
 * import { setIdGenerator, UuidGenerator } from '@unisane/kernel';
 *
 * if (process.env.DB_TYPE === 'postgres') {
 *   setIdGenerator(new UuidGenerator());
 * }
 * ```
 */
export function setIdGenerator(generator: IdGenerator): void {
  currentGenerator = generator;
}

/**
 * Set ID generator by type.
 *
 * Convenience function to set generator by type string.
 *
 * @param type - The generator type
 *
 * @example
 * ```typescript
 * setIdGeneratorType('uuid'); // Use UUID generator
 * setIdGeneratorType('objectid'); // Use ObjectId generator
 * ```
 */
export function setIdGeneratorType(type: 'objectid' | 'uuid' | 'nanoid' | 'cuid'): void {
  currentGenerator = createIdGenerator(type);
}

/**
 * Reset to the default ID generator (ObjectIdGenerator).
 *
 * Primarily used for testing.
 */
export function resetIdGenerator(): void {
  currentGenerator = new ObjectIdGenerator();
}

/**
 * Generate a new unique entity ID.
 *
 * Uses the currently configured ID generator.
 * This is the primary function for generating database entity IDs.
 *
 * Note: For prefixed IDs (like 'req_', 'evt_'), use `generateId(prefix)` from utils/ids.
 * This function is for unprefixed entity IDs stored in databases.
 *
 * @returns A new unique ID string
 *
 * @example
 * ```typescript
 * import { newEntityId } from '@unisane/kernel';
 *
 * const userId = newEntityId();
 * const orderId = newEntityId();
 * ```
 */
export function newEntityId(): string {
  return currentGenerator.generate();
}

/**
 * Check if a string is a valid ID for the current generator.
 *
 * @param id - The string to validate
 * @returns true if valid
 *
 * @example
 * ```typescript
 * import { isValidId } from '@unisane/kernel';
 *
 * if (!isValidId(req.params.id)) {
 *   throw new BadRequestError('Invalid ID format');
 * }
 * ```
 */
export function isValidId(id: string): boolean {
  return currentGenerator.isValid(id);
}

/**
 * Get metadata from an ID (if available).
 *
 * @param id - The ID to extract metadata from
 * @returns Metadata or undefined
 *
 * @example
 * ```typescript
 * import { getIdMetadata } from '@unisane/kernel';
 *
 * const meta = getIdMetadata(userId);
 * if (meta?.createdAt) {
 *   console.log('User created:', meta.createdAt);
 * }
 * ```
 */
export function getIdMetadata(id: string): IdMetadata | undefined {
  return currentGenerator.getMetadata(id);
}

/**
 * Convert an ID to its native representation.
 *
 * For MongoDB (ObjectId), this returns an ObjectId instance.
 * For UUID/nanoid, this returns the string.
 *
 * @param id - The ID string
 * @returns Native representation
 *
 * @example
 * ```typescript
 * import { toNativeId } from '@unisane/kernel';
 *
 * // For MongoDB queries that need ObjectId
 * const nativeId = toNativeId(userId);
 * await collection.findOne({ _id: nativeId });
 * ```
 */
export function toNativeId(id: string): unknown {
  return currentGenerator.toNative(id);
}

/**
 * Convert a native ID to string.
 *
 * @param native - The native ID
 * @returns String representation
 */
export function nativeIdToString(native: unknown): string {
  return currentGenerator.toString(native);
}

/**
 * Compare two IDs for equality.
 *
 * Handles both string and native representations.
 *
 * @param a - First ID
 * @param b - Second ID
 * @returns true if equal
 *
 * @example
 * ```typescript
 * import { idsEqual } from '@unisane/kernel';
 *
 * if (idsEqual(doc._id, userId)) {
 *   // IDs match
 * }
 * ```
 */
export function idsEqual(a: string | unknown, b: string | unknown): boolean {
  return currentGenerator.equals(a, b);
}

/**
 * Get the current ID generator type.
 *
 * @returns The type of the current generator
 */
export function getIdGeneratorType(): IdGeneratorType {
  return currentGenerator.type;
}

/**
 * Auto-configure ID generator based on environment.
 *
 * Reads DB_TYPE or DATABASE_PROVIDER env var and configures appropriately:
 * - 'mongo' or 'mongodb' → ObjectIdGenerator
 * - 'postgres' or 'postgresql' → UuidGenerator
 * - 'mysql' → UuidGenerator
 * - default → ObjectIdGenerator
 *
 * Call this during application startup for automatic configuration.
 *
 * @example
 * ```typescript
 * // In app bootstrap
 * import { autoConfigureIdGenerator } from '@unisane/kernel';
 * autoConfigureIdGenerator();
 * ```
 */
export function autoConfigureIdGenerator(): void {
  const dbType = (
    process.env.DB_TYPE ||
    process.env.DATABASE_PROVIDER ||
    process.env.DB_PROVIDER ||
    'mongo'
  ).toLowerCase();

  switch (dbType) {
    case 'postgres':
    case 'postgresql':
    case 'pg':
      currentGenerator = new UuidGenerator();
      break;
    case 'mysql':
    case 'mariadb':
      currentGenerator = new UuidGenerator();
      break;
    case 'mongo':
    case 'mongodb':
    default:
      currentGenerator = new ObjectIdGenerator();
      break;
  }
}

// Export generator classes for direct instantiation
export {
  ObjectIdGenerator,
  UuidGenerator,
  NanoidGenerator,
  CuidGenerator,
  createIdGenerator,
};
