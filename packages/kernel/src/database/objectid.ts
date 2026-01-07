import { ObjectId } from "mongodb";

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
