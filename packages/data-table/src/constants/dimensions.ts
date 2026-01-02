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
  /** Width for drag handle column (row reordering) */
  DRAG_HANDLE: 40,
  /** Minimum width for resizable columns */
  MIN_RESIZABLE: 50,
  /** Default column width when not specified */
  DEFAULT: 150,
} as const;

/**
 * Responsive breakpoints (in pixels)
 */
export const RESPONSIVE = {
  /** Minimum container width to enable column pinning */
  MIN_WIDTH_FOR_PINNING: 640,
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
  /** Custom scrollbar height in pixels */
  SCROLLBAR_HEIGHT: 10,
  /** Minimum scrollbar thumb width in pixels */
  MIN_THUMB_WIDTH: 30,
} as const;

/**
 * Timing constants for UI interactions (in milliseconds)
 */
export const TIMING = {
  /** Delay for screen reader announcements to clear */
  ANNOUNCEMENT_CLEAR_MS: 1000,
  /** Focus delay after state change */
  FOCUS_DELAY_MS: 100,
  /** Print state reset delay */
  PRINT_STATE_RESET_MS: 100,
} as const;
