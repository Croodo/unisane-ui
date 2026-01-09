// ─── KEYBOARD CONSTANTS ──────────────────────────────────────────────────────
// Keyboard navigation configuration.

/**
 * Default number of rows to skip for PageUp/PageDown
 */
export const DEFAULT_KEYBOARD_PAGE_SIZE = 10;

/**
 * Keyboard navigation key bindings
 */
export const KeyboardKeys = {
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
  TAB: "Tab",
  F2: "F2",
} as const;

/**
 * Keyboard shortcuts configuration
 */
export const KEYBOARD_SHORTCUTS = {
  /** Start editing cell */
  EDIT: [KeyboardKeys.ENTER, KeyboardKeys.F2],
  /** Cancel operation */
  CANCEL: [KeyboardKeys.ESCAPE],
  /** Select/toggle */
  SELECT: [KeyboardKeys.SPACE],
  /** Navigate rows */
  NAVIGATE: [KeyboardKeys.ARROW_UP, KeyboardKeys.ARROW_DOWN],
} as const;
