/**
 * ID Generation Module
 *
 * Provides database-agnostic ID generation through the IdGenerator port.
 * This enables switching between different ID strategies (ObjectId, UUID, etc.)
 * without changing application code.
 *
 * @example
 * ```typescript
 * import { newEntityId, isValidId, setIdGenerator } from '@unisane/kernel';
 *
 * // Use default generator (ObjectId for MongoDB compatibility)
 * const id = newEntityId();
 *
 * // Validate an ID
 * if (isValidId(someId)) {
 *   // proceed with valid ID
 * }
 *
 * // Switch to UUID generator for PostgreSQL
 * import { UuidGenerator } from '@unisane/kernel';
 * setIdGenerator(new UuidGenerator());
 * ```
 */

// Types
export type {
  IdGenerator,
  IdGeneratorType,
  IdMetadata,
  IdGeneratorOptions,
} from './types';

// Generator implementations
export {
  ObjectIdGenerator,
  UuidGenerator,
  NanoidGenerator,
  CuidGenerator,
  createIdGenerator,
} from './generators';

// Registry functions
export {
  getIdGenerator,
  setIdGenerator,
  setIdGeneratorType,
  resetIdGenerator,
  newEntityId,
  isValidId,
  getIdMetadata,
  toNativeId,
  nativeIdToString,
  idsEqual,
  getIdGeneratorType,
  autoConfigureIdGenerator,
} from './registry';
