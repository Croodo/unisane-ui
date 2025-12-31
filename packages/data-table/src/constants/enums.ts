// ─── ENUM CONSTANTS ──────────────────────────────────────────────────────────
// Type-safe enum-like constants for the DataTable package.
// Uses `as const` objects for better tree-shaking and type inference.

/**
 * Sort direction values
 */
export const SortDirection = {
  ASC: "asc",
  DESC: "desc",
  NONE: null,
} as const;

export type SortDirectionValue = (typeof SortDirection)[keyof typeof SortDirection];

/**
 * Pin position values
 */
export const PinPosition = {
  LEFT: "left",
  RIGHT: "right",
  NONE: null,
} as const;

export type PinPositionValue = (typeof PinPosition)[keyof typeof PinPosition];

/**
 * Table variant presets
 */
export const TableVariant = {
  /** Full featured with borders, column dividers (default for data editing) */
  GRID: "grid",
  /** Row borders only, cleaner look (default for read-only lists) */
  LIST: "list",
  /** No borders, compact (ideal for logs/audit trails) */
  MINIMAL: "minimal",
} as const;

export type TableVariantValue = (typeof TableVariant)[keyof typeof TableVariant];

/**
 * Row density presets
 */
export const DensityLevel = {
  /** Tight spacing for data-dense views */
  COMPACT: "compact",
  /** Slightly more compact than standard */
  DENSE: "dense",
  /** Default spacing */
  STANDARD: "standard",
  /** Extra spacing for touch-friendly interfaces */
  COMFORTABLE: "comfortable",
} as const;

export type DensityLevelValue = (typeof DensityLevel)[keyof typeof DensityLevel];

/**
 * Filter input types
 */
export const FilterType = {
  TEXT: "text",
  SELECT: "select",
  MULTI_SELECT: "multi-select",
  NUMBER_RANGE: "number-range",
  DATE_RANGE: "date-range",
} as const;

export type FilterTypeValue = (typeof FilterType)[keyof typeof FilterType];

/**
 * Selection mode for row selection
 */
export const SelectionMode = {
  SINGLE: "single",
  MULTIPLE: "multiple",
  NONE: "none",
} as const;

export type SelectionModeValue = (typeof SelectionMode)[keyof typeof SelectionMode];

/**
 * Column alignment
 */
export const ColumnAlign = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
} as const;

export type ColumnAlignValue = (typeof ColumnAlign)[keyof typeof ColumnAlign];

/**
 * Cell selection mode
 */
export const CellSelectionMode = {
  SINGLE: "single",
  RANGE: "range",
  MULTIPLE: "multiple",
} as const;

export type CellSelectionModeValue = (typeof CellSelectionMode)[keyof typeof CellSelectionMode];
