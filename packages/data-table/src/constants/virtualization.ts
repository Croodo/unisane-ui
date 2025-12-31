// ─── VIRTUALIZATION CONSTANTS ────────────────────────────────────────────────
// Configuration for row virtualization performance.

/**
 * Default row count threshold before virtualization kicks in
 */
export const DEFAULT_VIRTUALIZE_THRESHOLD = 50;

/**
 * Default overscan count for virtualization
 * Number of rows to render outside the visible area
 */
export const DEFAULT_OVERSCAN = 5;

/**
 * Virtualization configuration
 */
export const VIRTUALIZATION_CONFIG = {
  /** Minimum rows before enabling virtualization */
  THRESHOLD: 50,
  /** Default overscan for smoother scrolling */
  OVERSCAN: 5,
  /** Maximum overscan to prevent performance issues */
  MAX_OVERSCAN: 20,
  /** Estimated row height for initial calculation */
  ESTIMATED_ROW_HEIGHT: 48,
} as const;
