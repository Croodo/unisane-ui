// ─── FEATURE HOOKS ───────────────────────────────────────────────────────────
// Hooks for advanced features: inline editing, virtualization, tree data, infinite scroll.

export { useInlineEditing } from "./use-inline-editing";
export { useVirtualizedRows } from "./use-virtualized-rows";
export { useVirtualizedGroupedRows } from "./use-virtualized-grouped-rows";
export { useTreeData } from "./use-tree-data";
export { useInfiniteScroll } from "./use-infinite-scroll";
export { useSelectionPersistence } from "./use-selection-persistence";
export { useClipboardPaste } from "./use-clipboard-paste";
export { useEditHistory } from "./use-edit-history";
export { useFilterPresets } from "./use-filter-presets";
export { useCompoundFilters } from "./use-compound-filters";
export { useColumnSpan } from "./use-column-span";
export { useStickyGroupHeaders } from "./use-sticky-group-headers";

// Re-export types
export type { VirtualRow } from "./use-virtualized-rows";
export type {
  VirtualizedGroupItem,
  VirtualGroupedRow,
  UseVirtualizedGroupedRowsOptions,
  UseVirtualizedGroupedRowsReturn,
} from "./use-virtualized-grouped-rows";
export type {
  UseTreeDataOptions,
  UseTreeDataReturn,
} from "./use-tree-data";
export type {
  UseInfiniteScrollOptions,
  UseInfiniteScrollReturn,
} from "./use-infinite-scroll";
export type {
  UseSelectionPersistenceOptions,
  UseSelectionPersistenceReturn,
} from "./use-selection-persistence";
export type {
  ParsedClipboardData,
  PasteCellUpdate,
  PasteValidationResult,
  PasteResult,
  UseClipboardPasteOptions,
  UseClipboardPasteReturn,
} from "./use-clipboard-paste";
export type {
  EditHistoryEntry,
  EditChange,
  UndoRedoResult,
  UseEditHistoryOptions,
  UseEditHistoryReturn,
} from "./use-edit-history";
export type {
  FilterPreset,
  FilterPresetInput,
  UseFilterPresetsOptions,
  UseFilterPresetsReturn,
} from "./use-filter-presets";
export type {
  FilterLogicOperator,
  FilterComparisonOperator,
  FilterCondition,
  FilterGroup,
  CompoundFilter,
  UseCompoundFiltersOptions,
  UseCompoundFiltersReturn,
} from "./use-compound-filters";
export type {
  ColumnSpan,
  CellSpanInfo,
  ColumnSpanFn,
  UseColumnSpanOptions,
  UseColumnSpanReturn,
} from "./use-column-span";
export type {
  StickyGroupHeader,
  GroupPosition,
  UseStickyGroupHeadersOptions,
  UseStickyGroupHeadersReturn,
} from "./use-sticky-group-headers";
