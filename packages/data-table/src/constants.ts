/**
 * Shared constants for the DataTable package
 * Centralized to avoid duplication and ensure consistency
 */

// ─── DENSITY STYLES ─────────────────────────────────────────────────────────

/**
 * Padding classes for different density levels.
 * Uses standard Tailwind spacing which scales automatically with global theme density
 * via CSS custom properties (--scale-space).
 *
 * When data-density="compact" is set on <html>, spacing tokens scale to 87.5%
 * When data-density="comfortable" is set on <html>, spacing tokens scale to 110%
 *
 * The component-level density prop provides additional fine-tuning on top of global density.
 */
export const DENSITY_STYLES = {
  compact: "py-1.5 px-3",      // Uses --spacing-1_5 and --spacing-3 (scale with global density)
  dense: "py-2 px-3",          // Uses --spacing-2 and --spacing-3
  standard: "py-3 px-4",       // Uses --spacing-3 and --spacing-4
  comfortable: "py-4 px-4",    // Uses --spacing-4 and --spacing-4
} as const;

export type Density = keyof typeof DENSITY_STYLES;

// ─── DENSITY CONFIG ─────────────────────────────────────────────────────────

/**
 * Configuration for each density level including base row heights.
 * These values represent the base height at standard density (--scale-space: 1).
 *
 * In components, these should be multiplied by the density scale factor
 * or used as CSS calc() with var(--scale-space) for dynamic scaling.
 *
 * Example: rowHeight * scaleSpace where scaleSpace comes from CSS or context
 */
export const DENSITY_CONFIG = {
  compact: { rowHeight: 36, label: "Compact" },
  dense: { rowHeight: 44, label: "Dense" },
  standard: { rowHeight: 52, label: "Standard" },
  comfortable: { rowHeight: 64, label: "Comfortable" },
} as const;

/**
 * CSS variable-based row height for use in inline styles.
 * This allows row heights to scale with global theme density.
 *
 * Usage: style={{ height: `calc(${ROW_HEIGHT_BASE[density]} * var(--scale-space, 1))` }}
 */
export const ROW_HEIGHT_BASE = {
  compact: "36px",
  dense: "44px",
  standard: "52px",
  comfortable: "64px",
} as const;

// ─── COLUMN WIDTHS ──────────────────────────────────────────────────────────

/**
 * Fixed widths for special columns
 */
export const COLUMN_WIDTHS = {
  checkbox: 48,
  expander: 40,
} as const;

// ─── PAGINATION ─────────────────────────────────────────────────────────────

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Default page sizes for the page size selector
 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// ─── KEYBOARD NAVIGATION ────────────────────────────────────────────────────

/**
 * Default number of rows to skip for PageUp/PageDown
 */
export const DEFAULT_KEYBOARD_PAGE_SIZE = 10;

// ─── VIRTUALIZATION ─────────────────────────────────────────────────────────

/**
 * Default row count threshold before virtualization kicks in
 */
export const DEFAULT_VIRTUALIZE_THRESHOLD = 50;

/**
 * Default overscan count for virtualization
 */
export const DEFAULT_OVERSCAN = 5;
