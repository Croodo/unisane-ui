// ─── DIMENSION CONSTANTS ─────────────────────────────────────────────────────
// Fixed dimensions for columns, cells, and other table elements.

/**
 * Fixed widths for special columns (in pixels)
 */
export const COLUMN_WIDTHS = {
  /** Width for checkbox selection column */
  CHECKBOX: 48,
  /** Width for row expander column */
  EXPANDER: 40,
  /** Minimum width for resizable columns */
  MIN_RESIZABLE: 50,
  /** Default column width when not specified */
  DEFAULT: 150,
} as const;

/**
 * Header dimensions
 */
export const HEADER_DIMENSIONS = {
  /** Minimum header height */
  MIN_HEIGHT: 44,
  /** Standard header height */
  STANDARD_HEIGHT: 52,
} as const;

/**
 * Scroll and resize constants
 */
export const SCROLL_CONSTANTS = {
  /** Scroll debounce delay in milliseconds */
  DEBOUNCE_MS: 150,
  /** Minimum scroll threshold before triggering load more */
  THRESHOLD_PX: 200,
} as const;
