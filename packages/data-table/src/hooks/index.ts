// ─── HOOKS INDEX ─────────────────────────────────────────────────────────────
// Central export for all data-table hooks.
// Organized by domain: data, ui, features, utilities.

// ─── DATA HOOKS ──────────────────────────────────────────────────────────────
// Data processing, remote data, row grouping

export { useProcessedData } from "./data/use-processed-data";
export {
  useRemoteDataTable,
  type ListParamsLike,
  type QueryLike,
  type StatsQueryLike,
  type UseRemoteDataTableOptions,
  type UseRemoteDataTableReturn,
} from "./data/use-remote-data-table";
export {
  useRowGrouping,
  type UseRowGroupingOptions,
  type UseRowGroupingReturn,
} from "./data/use-row-grouping";

// ─── UI HOOKS ────────────────────────────────────────────────────────────────
// Cell selection, keyboard navigation, column drag, density

export { useCellSelection } from "./ui/use-cell-selection";
export {
  useKeyboardNavigation,
  type UseKeyboardNavigationOptions,
  type UseKeyboardNavigationReturn,
} from "./ui/use-keyboard-navigation";
export {
  useColumnDrag,
  type DragState,
  type UseColumnDragOptions,
  type UseColumnDragReturn,
} from "./ui/use-column-drag";
export {
  useDensityScale,
  getDensityScale,
  DENSITY_SCALE_MAP,
} from "./ui/use-density-scale";

// ─── FEATURE HOOKS ───────────────────────────────────────────────────────────
// Inline editing, virtualization

export { useInlineEditing } from "./features/use-inline-editing";
export {
  useVirtualizedRows,
  type UseVirtualizedRowsOptions,
  type UseVirtualizedRowsReturn,
  type VirtualRow,
} from "./features/use-virtualized-rows";

// ─── UTILITY HOOKS ───────────────────────────────────────────────────────────
// General-purpose utilities

export { useDebounce, useDebouncedCallback } from "./utilities/use-debounce";
