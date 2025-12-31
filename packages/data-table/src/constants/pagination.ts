// ─── PAGINATION CONSTANTS ────────────────────────────────────────────────────
// Default values for pagination configuration.

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Default page sizes for the page size selector
 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Pagination limits
 */
export const PAGINATION_LIMITS = {
  /** Minimum page size */
  MIN_PAGE_SIZE: 1,
  /** Maximum page size */
  MAX_PAGE_SIZE: 500,
  /** Default cursor pagination limit */
  DEFAULT_CURSOR_LIMIT: 50,
} as const;
