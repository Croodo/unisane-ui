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
 *
 * Uses two query systems:
 * - Container queries (@xs, @sm, @md, @lg, @xl) for table internals (columns, cells, scrolling)
 * - Viewport queries (sm, md, lg, xl) for page-level UI (toolbar, pagination)
 */
export const RESPONSIVE = {
  /** Minimum container width to enable column pinning */
  MIN_WIDTH_FOR_PINNING: 640,

  /** Container query breakpoints (for table internals) */
  CONTAINER: {
    /** Extra small: < 480px - Mobile phone in portrait */
    XS: 480,
    /** Small: ≥ 480px - Large phone / small container */
    SM: 480,
    /** Medium: ≥ 768px - Tablet / enable sticky columns */
    MD: 768,
    /** Large: ≥ 1024px - Desktop */
    LG: 1024,
    /** Extra large: ≥ 1280px - Wide desktop */
    XL: 1280,
  },

  /** Viewport query breakpoints (for toolbar, pagination) */
  VIEWPORT: {
    /** Small: ≥ 640px - Large phone */
    SM: 640,
    /** Medium: ≥ 768px - Tablet */
    MD: 768,
    /** Large: ≥ 1024px - Desktop */
    LG: 1024,
    /** Extra large: ≥ 1280px - Wide desktop */
    XL: 1280,
  },

  /** Mobile threshold - below this, disable advanced features */
  MOBILE_THRESHOLD: 768,
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

/**
 * Touch target dimensions for accessibility (WCAG)
 */
export const TOUCH_TARGETS = {
  /** Minimum touch target size in pixels (WCAG requirement) */
  MIN_SIZE: 48,
  /** Current sizes that need fixing */
  CURRENT: {
    CHECKBOX: 48, // ✓ Meets requirement
    EXPANDER: 40, // ⚠️ Needs padding increase
    DRAG_HANDLE: 40, // ⚠️ Needs padding increase
    PAGINATION_BUTTON: 40, // ⚠️ Needs padding increase
    PAGE_SIZE_SELECT: 32, // ⚠️ Needs height increase
  },
} as const;

// ─── CELL IDENTIFICATION ─────────────────────────────────────────────────────

/**
 * Separator for data-cell-id attribute values.
 * Uses double pipe `||` which is unlikely to appear in row IDs or column keys.
 * This prevents issues with IDs containing common characters like `:` or `-`.
 */
export const CELL_ID_SEPARATOR = "||";

/**
 * Create a cell ID string for the data-cell-id attribute
 * @param rowId - The row's unique identifier
 * @param columnKey - The column's key
 * @returns A string suitable for use as data-cell-id attribute value
 */
export function createCellId(rowId: string, columnKey: string): string {
  return `${rowId}${CELL_ID_SEPARATOR}${columnKey}`;
}

/**
 * Parse a cell ID string back into row and column identifiers
 * @param cellId - The data-cell-id attribute value
 * @returns Object with rowId and columnKey, or null if invalid
 */
export function parseCellId(cellId: string): { rowId: string; columnKey: string } | null {
  const separatorIndex = cellId.indexOf(CELL_ID_SEPARATOR);
  if (separatorIndex === -1) {
    return null;
  }
  return {
    rowId: cellId.slice(0, separatorIndex),
    columnKey: cellId.slice(separatorIndex + CELL_ID_SEPARATOR.length),
  };
}

/**
 * Create a CSS selector to find a cell by its row and column
 * @param rowId - The row's unique identifier
 * @param columnKey - The column's key
 * @returns A CSS selector string
 */
export function getCellSelector(rowId: string, columnKey: string): string {
  return `[data-cell-id="${createCellId(rowId, columnKey)}"]`;
}
