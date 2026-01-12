/**
 * Document Mapper Utilities
 *
 * Provides utilities for mapping MongoDB documents to view objects.
 * Standardizes common patterns like:
 * - _id to id string conversion
 * - Date to ISO string conversion
 * - Null/undefined coalescing
 */

import type { WithId } from 'mongodb';
import type { ObjectId } from 'mongodb';

/**
 * Convert MongoDB _id to string.
 * Handles both ObjectId and string types.
 */
export function idToString(id: ObjectId | string | undefined): string {
  return String(id ?? '');
}

/**
 * Convert a Date to ISO string, or return null/undefined.
 */
export function dateToIsoString(date: Date | null | undefined): string | null;
export function dateToIsoString(date: Date): string;
export function dateToIsoString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Coalesce null/undefined to a default value.
 */
export function coalesce<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Options for creating a document mapper.
 */
export interface MapperOptions<Doc, View> {
  /**
   * Fields to map directly (same name in doc and view).
   * Values are copied as-is.
   */
  directFields?: Array<keyof Doc & keyof View>;

  /**
   * Fields that need null coalescing.
   * Maps to null if undefined.
   */
  nullableFields?: Array<keyof Doc & keyof View>;

  /**
   * Date fields to convert to ISO strings.
   * The view type should have these as string | null.
   */
  dateFields?: Array<keyof Doc>;

  /**
   * Custom field mappers for complex transformations.
   */
  customMappers?: {
    [K in keyof View]?: (doc: WithId<Doc>) => View[K];
  };
}

/**
 * Create a document mapper function from options.
 * Automatically handles _id to id conversion.
 *
 * @example
 * ```typescript
 * const mapUserDoc = createDocumentMapper<UserDoc, UserView>({
 *   directFields: ['email', 'displayName'],
 *   nullableFields: ['phone', 'imageUrl'],
 *   dateFields: ['createdAt', 'updatedAt'],
 * });
 *
 * const view = mapUserDoc(doc);
 * ```
 */
export function createDocumentMapper<Doc extends { _id?: unknown }, View extends { id: string }>(
  options: MapperOptions<Doc, View>
): (doc: WithId<Doc>) => View {
  const { directFields = [], nullableFields = [], dateFields = [], customMappers = {} } = options;

  return (doc: WithId<Doc>): View => {
    const view: Record<string, unknown> = {
      id: idToString(doc._id as ObjectId | string),
    };

    // Access doc as a record for field lookups
    const docRecord = doc as unknown as Record<string, unknown>;

    // Copy direct fields
    for (const field of directFields) {
      view[field as string] = docRecord[field as string];
    }

    // Copy nullable fields with null coalescing
    for (const field of nullableFields) {
      view[field as string] = docRecord[field as string] ?? null;
    }

    // Convert date fields to ISO strings
    for (const field of dateFields) {
      const docValue = docRecord[field as string];
      if (docValue instanceof Date) {
        view[field as string] = docValue.toISOString();
      } else {
        view[field as string] = docValue ?? null;
      }
    }

    // Apply custom mappers
    for (const [key, mapper] of Object.entries(customMappers)) {
      if (mapper) {
        view[key] = (mapper as (doc: WithId<Doc>) => unknown)(doc);
      }
    }

    return view as View;
  };
}

/**
 * Create a batch mapper that maps multiple documents efficiently.
 *
 * @example
 * ```typescript
 * const mapUsers = createBatchMapper(mapUserDoc);
 * const views = mapUsers(docs);
 * ```
 */
export function createBatchMapper<Doc, View>(
  mapper: (doc: Doc) => View
): (docs: Doc[]) => View[] {
  return (docs: Doc[]) => docs.map(mapper);
}

/**
 * Create a Map from an array of views, keyed by id.
 */
export function viewsToMap<View extends { id: string }>(views: View[]): Map<string, View> {
  const map = new Map<string, View>();
  for (const view of views) {
    map.set(view.id, view);
  }
  return map;
}

/**
 * Standard timestamp fields present on most documents.
 */
export interface TimestampFields {
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Standard soft-delete field.
 */
export interface SoftDeleteField {
  deletedAt?: Date | null;
}

/**
 * Build standard document timestamps for creation.
 */
export function buildCreateTimestamps(): { createdAt: Date; updatedAt: Date; deletedAt: null } {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/**
 * Build updatedAt timestamp for updates.
 */
export function buildUpdateTimestamp(): { updatedAt: Date } {
  return { updatedAt: new Date() };
}

/**
 * Build soft delete timestamps.
 */
export function buildSoftDeleteTimestamps(): { deletedAt: Date; updatedAt: Date } {
  const now = new Date();
  return {
    deletedAt: now,
    updatedAt: now,
  };
}
