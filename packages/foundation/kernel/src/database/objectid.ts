import { ObjectId } from "mongodb";

// Re-export ObjectId class for modules to use without direct mongodb dependency
// This single export works for both value and type usage
export { ObjectId };

/**
 * Create a new ObjectId.
 * Use this instead of `new ObjectId()` to avoid direct mongodb imports.
 *
 * @returns A new ObjectId instance
 *
 * @example
 * ```typescript
 * import { newObjectId } from '@unisane/kernel';
 *
 * const doc = {
 *   _id: newObjectId(),
 *   name: 'Example',
 * };
 * ```
 */
export function newObjectId(): ObjectId {
  return new ObjectId();
}

/**
 * Create an ObjectId from a string or return null if invalid.
 *
 * @param id - The string to convert
 * @returns ObjectId if valid, null otherwise
 */
export function toObjectId(id: string): ObjectId | null {
  if (ObjectId.isValid(id) && new ObjectId(id).toString() === id) {
    return new ObjectId(id);
  }
  return null;
}

/**
 * Check if a string is a valid ObjectId.
 *
 * @param id - The string to check
 * @returns true if valid ObjectId string
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

/**
 * Safely convert a string to ObjectId if it's a valid ObjectId string.
 * Returns the original value if it's already an ObjectId or not a valid ObjectId string.
 *
 * @param id - The ID to convert (string or ObjectId)
 * @returns ObjectId if valid, otherwise the original value
 */
export function maybeObjectId(id: string | ObjectId): ObjectId | string {
  if (id instanceof ObjectId) {
    return id;
  }
  if (typeof id === "string" && ObjectId.isValid(id) && new ObjectId(id).toString() === id) {
    return new ObjectId(id);
  }
  return id;
}
