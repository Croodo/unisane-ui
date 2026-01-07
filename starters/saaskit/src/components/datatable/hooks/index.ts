// Data processing
export { useProcessedData } from "./useProcessedData";

// Table settings (density, page size, hidden columns)
export { useTableSettings } from "./useTableSettings";

// Column pinning
export { useColumnPinState } from "./useColumnPinState";

// Column resize (drag to resize columns)
export { useColumnResize } from "./useColumnResize";

// Pinned column styles (sticky positioning)
export { getPinnedStyles, getFixedColumnStyles } from "./usePinnedStyles";

// Row styles (selection, active, zebra)
export { getRowClassName, getCellBgClass, useRowStyles } from "./useRowStyles";

// Row detail/expansion
export { useRowDetail } from "./useRowDetail";

// Remote DataTable helper (simplifies cursor pagination setup)
export { useRemoteDataTable } from "./useRemoteDataTable";
export type {
  ListParamsLike,
  QueryLike,
  StatsQueryLike,
  UseRemoteDataTableOptions,
  RemoteDataTableProps,
} from "./useRemoteDataTable";

// Keyboard navigation (arrow keys, Enter, Space, etc.)
export { useKeyboardNavigation } from "./useKeyboardNavigation";
export type {
  FocusPosition,
  UseKeyboardNavigationOptions,
  UseKeyboardNavigationReturn,
} from "./useKeyboardNavigation";

// Virtualization (large datasets performance)
export { useVirtualizedRows } from "./useVirtualizedRows";
export type {
  UseVirtualizedRowsOptions,
  UseVirtualizedRowsReturn,
} from "./useVirtualizedRows";

// Inline editing (cell editing with validation)
export { useInlineEditing } from "./useInlineEditing";
export type {
  EditingCell,
  UseInlineEditingOptions,
  UseInlineEditingReturn,
} from "./useInlineEditing";
