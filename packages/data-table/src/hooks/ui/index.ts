// ─── UI HOOKS ────────────────────────────────────────────────────────────────
// Hooks for UI interactions: cell selection, keyboard navigation, column drag, row drag.

export { useCellSelection } from "./use-cell-selection";
export { useKeyboardNavigation } from "./use-keyboard-navigation";
export { useColumnDrag } from "./use-column-drag";
export { useDensityScale } from "./use-density-scale";
export { useAnnouncer, type AnnouncementPriority, type UseAnnouncerReturn } from "./use-announcer";
export {
  useRowDrag,
  type RowDragState,
  type UseRowDragOptions,
  type UseRowDragReturn,
  type RowDragProps,
} from "./use-row-drag";
