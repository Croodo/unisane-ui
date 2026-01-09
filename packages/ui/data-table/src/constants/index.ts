// ─── CONSTANTS MODULE ────────────────────────────────────────────────────────
// Central export point for all constants in the data-table package.

// ─── ENUMS ───────────────────────────────────────────────────────────────────
export {
  SortDirection,
  type SortDirectionValue,
  PinPosition,
  type PinPositionValue,
  TableVariant,
  type TableVariantValue,
  DensityLevel,
  type DensityLevelValue,
  FilterType,
  type FilterTypeValue,
  SelectionMode,
  type SelectionModeValue,
  ColumnAlign,
  type ColumnAlignValue,
  CellSelectionMode,
  type CellSelectionModeValue,
} from "./enums";

// Alias for components using Density type
export type { DensityLevelValue as Density } from "./enums";

// ─── DENSITY ─────────────────────────────────────────────────────────────────
export {
  DENSITY_STYLES,
  DENSITY_CONFIG,
  ROW_HEIGHT_BASE,
  DEFAULT_DENSITY,
} from "./density";

// ─── DIMENSIONS ──────────────────────────────────────────────────────────────
export {
  COLUMN_WIDTHS,
  HEADER_DIMENSIONS,
  SCROLL_CONSTANTS,
  RESPONSIVE,
  TIMING,
  // Cell identification utilities
  CELL_ID_SEPARATOR,
  createCellId,
  parseCellId,
  getCellSelector,
} from "./dimensions";

// ─── PAGINATION ──────────────────────────────────────────────────────────────
export {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  PAGINATION_LIMITS,
} from "./pagination";

// ─── VIRTUALIZATION ──────────────────────────────────────────────────────────
export {
  DEFAULT_VIRTUALIZE_THRESHOLD,
  DEFAULT_OVERSCAN,
  VIRTUALIZATION_CONFIG,
} from "./virtualization";

// ─── KEYBOARD ────────────────────────────────────────────────────────────────
export {
  DEFAULT_KEYBOARD_PAGE_SIZE,
  KeyboardKeys,
  KEYBOARD_SHORTCUTS,
} from "./keyboard";
