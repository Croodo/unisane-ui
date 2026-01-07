export type DensityState = "compact" | "standard" | "comfortable";

export const densityConfig: Record<DensityState, { py: string; px: string }> = {
  compact: { py: "py-1", px: "px-2" },
  standard: { py: "py-2", px: "px-3" },
  comfortable: { py: "py-3", px: "px-4" },
};

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500];

/**
 * Fixed column widths in pixels
 */
export const COLUMN_WIDTHS = {
  /** Checkbox selection column */
  checkbox: 48,
  /** Row expander column */
  expander: 40,
  /** Default column width if not specified */
  default: 150,
  /** Minimum column width during resize */
  min: 50,
} as const;

/**
 * Z-index scale for layering
 */
export const Z_INDEX = {
  /** Base table body */
  body: 0,
  /** Pinned columns in body */
  bodyPinned: 10,
  /** Header row */
  header: 20,
  /** Pinned columns in header */
  headerPinned: 30,
  /** Resize handle */
  resize: 40,
  /** Dropdown menus */
  dropdown: 50,
} as const;

export const CONFIG = {
  layout: {
    headerOffset: "top-12 md:top-14",
    zIndexHeader: "z-20",
    scrollbarHeight: 14,
  },
  timing: {
    searchDebounce: 450,
    staleTime: 60000,
  },
};
