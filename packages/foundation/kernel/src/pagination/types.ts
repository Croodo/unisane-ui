/**
 * Pagination Types
 *
 * This module provides cursor-based pagination primitives for efficient,
 * scalable pagination across large datasets.
 *
 * ## Why Cursor-Based Pagination?
 *
 * - **Performance**: No OFFSET/SKIP operations (O(1) vs O(n))
 * - **Consistency**: Stable results even when data changes
 * - **Scalability**: Works efficiently with millions of records
 *
 * ## Usage Pattern
 *
 * ```typescript
 * // In repository
 * import { seekPageMongoCollection, SeekPageResult } from '@unisane/kernel';
 *
 * async function listItems(limit: number, cursor?: string): Promise<SeekPageResult<Item>> {
 *   return seekPageMongoCollection({
 *     collection: col('items'),
 *     baseFilter: { tenantId, ...softDeleteFilter() },
 *     limit,
 *     cursor,
 *     sortVec: [{ key: 'createdAt', order: -1 }, { key: '_id', order: -1 }],
 *     map: mapDocToView,
 *   });
 * }
 *
 * // In API handler
 * const { items, nextCursor, prevCursor } = await listItems(20, req.cursor);
 * return { data: items, pagination: { nextCursor, prevCursor } };
 * ```
 *
 * ## Sort Vector Requirements
 *
 * Always include `_id` as the last sort field to ensure deterministic ordering
 * when other fields have duplicate values.
 */

/** Sort field specification for cursor pagination */
export type SortField = { key: string; order: 1 | -1 };

/**
 * Result from cursor-based pagination.
 *
 * @property items - The page of results
 * @property nextCursor - Cursor to fetch next page (undefined if no more pages)
 * @property prevCursor - Cursor to fetch previous page (undefined if at first page)
 */
export type SeekPageResult<T> = {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
};

/**
 * Options for seek-based pagination.
 */
export type SeekPageOptions<T> = {
  /** Maximum items to return */
  limit: number;
  /** Cursor from previous page (null/undefined for first page) */
  cursor?: string | null;
  /** Sort specification - always include _id as last field */
  sortVec: SortField[];
  /** Base filter conditions (e.g., tenantId, soft delete) */
  baseFilter?: Record<string, unknown>;
  /** MongoDB projection for field selection */
  projection?: Record<string, 0 | 1>;
};
