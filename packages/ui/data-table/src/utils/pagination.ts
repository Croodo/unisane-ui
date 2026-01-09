/**
 * Pagination utility functions for DataTable
 */

/**
 * Calculate the total number of pages given item count and page size.
 *
 * @param itemCount - Total number of items
 * @param pageSize - Number of items per page
 * @returns Total number of pages (minimum 1)
 *
 * @example
 * ```ts
 * getTotalPages(100, 10) // => 10
 * getTotalPages(0, 10)   // => 1 (minimum 1 page)
 * getTotalPages(101, 10) // => 11
 * ```
 */
export function getTotalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / Math.max(pageSize, 1)));
}

/**
 * Clamp a page number to valid bounds.
 *
 * Ensures the page number is within [1, totalPages].
 * This prevents invalid page numbers when:
 * - Filtering reduces data below current page
 * - Page size changes
 * - Direct navigation to out-of-bounds page
 *
 * @param page - Current page number (1-indexed)
 * @param totalPages - Total number of pages
 * @returns Valid page number within bounds
 *
 * @example
 * ```ts
 * clampPage(5, 10) // => 5 (within bounds)
 * clampPage(15, 10) // => 10 (clamped to max)
 * clampPage(0, 10) // => 1 (clamped to min)
 * ```
 */
export function clampPage(page: number, totalPages: number): number {
  return Math.max(1, Math.min(page, Math.max(1, totalPages)));
}

/**
 * Calculate the start and end indices for a page.
 *
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Object with start (inclusive) and end (exclusive) indices
 *
 * @example
 * ```ts
 * getPageIndices(1, 10) // => { start: 0, end: 10 }
 * getPageIndices(2, 10) // => { start: 10, end: 20 }
 * ```
 */
export function getPageIndices(
  page: number,
  pageSize: number
): { start: number; end: number } {
  const start = (page - 1) * pageSize;
  return { start, end: start + pageSize };
}

/**
 * Calculate safe page and slice indices in one call.
 *
 * Combines getTotalPages, clampPage, and getPageIndices for common use case.
 *
 * @param itemCount - Total number of items
 * @param page - Requested page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Object with safePage, totalPages, start, and end
 *
 * @example
 * ```ts
 * const { safePage, start, end } = getPaginationState(100, 5, 10);
 * const pageData = data.slice(start, end);
 * ```
 */
export function getPaginationState(
  itemCount: number,
  page: number,
  pageSize: number
): { safePage: number; totalPages: number; start: number; end: number } {
  const totalPages = getTotalPages(itemCount, pageSize);
  const safePage = clampPage(page, totalPages);
  const { start, end } = getPageIndices(safePage, pageSize);
  return { safePage, totalPages, start, end };
}
